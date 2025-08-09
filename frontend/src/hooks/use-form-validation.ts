"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { useForm, UseFormReturn, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { debounce } from '@/lib/validation';
import { useLoadingContext } from '@/contexts/loading-context';
import type { ApiError } from '@/lib/api';

interface ValidationOptions<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  mode?: 'onChange' | 'onBlur' | 'onSubmit';
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
  defaultValues?: Partial<T>;
  onSubmit?: (data: T) => Promise<void>;
  onError?: (errors: Record<string, string[]>) => void;
  enableRealTimeValidation?: boolean;
  debounceMs?: number;
}

export function useFormValidation<T extends FieldValues>({
  schema,
  mode = 'onChange',
  reValidateMode = 'onChange',
  defaultValues,
  onSubmit,
  onError,
  enableRealTimeValidation = true,
  debounceMs = 300,
}: ValidationOptions<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldValidationStates, setFieldValidationStates] = useState<
    Record<string, 'idle' | 'validating' | 'valid' | 'invalid'>
  >({});
  
  const { setLoading } = useLoadingContext();
  const validationTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  const form = useForm<T>({
    resolver: zodResolver(schema as any) as any,
    mode,
    reValidateMode,
    defaultValues: defaultValues as any,
  });

  // Real-time field validation
  const validateField = useCallback(async (
    fieldName: string, 
    value: any,
    validator?: (value: any) => Promise<boolean>
  ) => {
    if (!enableRealTimeValidation) return;

    // Clear existing timeout
    if (validationTimeouts.current[fieldName]) {
      clearTimeout(validationTimeouts.current[fieldName]);
    }

    // Set validating state immediately for user feedback
    setFieldValidationStates(prev => ({
      ...prev,
      [fieldName]: 'validating'
    }));

    // Debounced validation
    validationTimeouts.current[fieldName] = setTimeout(async () => {
      try {
        // Schema validation
        try {
          const result = schema.safeParse({ [fieldName]: value });
          if (!result.success) {
            setFieldValidationStates(prev => ({
              ...prev,
              [fieldName]: 'invalid'
            }));
            return;
          }
        } catch {
          // Skip schema validation if it fails
        }

        // Custom async validation
        if (validator) {
          const isValid = await validator(value);
          setFieldValidationStates(prev => ({
            ...prev,
            [fieldName]: isValid ? 'valid' : 'invalid'
          }));
        } else {
          setFieldValidationStates(prev => ({
            ...prev,
            [fieldName]: 'valid'
          }));
        }
      } catch (error) {
        setFieldValidationStates(prev => ({
          ...prev,
          [fieldName]: 'invalid'
        }));
      }
    }, debounceMs);
  }, [schema, enableRealTimeValidation, debounceMs]);

  // Enhanced submit handler with error handling
  const handleSubmit = useCallback(async (data: T) => {
    if (!onSubmit) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setLoading('form-submit', true, 'Submitting form...');

    try {
      await onSubmit(data);
      // Clear all field validation states on successful submit
      setFieldValidationStates({});
    } catch (error) {
      const apiError: ApiError = error && typeof error === 'object' && 'message' in error
        ? error as ApiError
        : {
            status: 'error',
            message: 'An unexpected error occurred',
            code: 'UNKNOWN_ERROR',
          };

      setSubmitError(apiError.message);
      
      // Handle field-specific errors
      if (apiError.details?.field_errors) {
        const fieldErrors = apiError.details.field_errors;
        Object.entries(fieldErrors).forEach(([field, errors]) => {
          form.setError(field as Path<T>, {
            type: 'server',
            message: errors[0],
          });
        });
        
        if (onError) {
          onError(fieldErrors);
        }
      }
    } finally {
      setIsSubmitting(false);
      setLoading('form-submit', false);
    }
  }, [onSubmit, setLoading, form, onError]);

  // Watch for field changes and trigger validation
  useEffect(() => {
    if (!enableRealTimeValidation) return;

    const subscription = form.watch((value, { name, type }) => {
      if (name && type === 'change') {
        validateField(name, value[name]);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, validateField, enableRealTimeValidation]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(validationTimeouts.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  return {
    form,
    isSubmitting,
    submitError,
    fieldValidationStates,
    handleSubmit: form.handleSubmit(handleSubmit as any),
    validateField,
    clearSubmitError: () => setSubmitError(null),
    reset: () => {
      form.reset();
      setFieldValidationStates({});
      setSubmitError(null);
    },
  };
}

// Hook for async field validation
export function useAsyncFieldValidation<T extends FieldValues>(
  form: UseFormReturn<T>,
  fieldName: Path<T>,
  validator: (value: any) => Promise<boolean>,
  errorMessage: string,
  debounceMs: number = 500
) {
  const [validationState, setValidationState] = useState<
    'idle' | 'validating' | 'valid' | 'invalid'
  >('idle');
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const debouncedValidate = useCallback(async (value: any) => {
    if (!value) {
      setValidationState('idle');
      setError(null);
      return;
    }

    setValidationState('validating');
    setError(null);

    try {
      const isValid = await validator(value);
      if (isValid) {
        setValidationState('valid');
        setError(null);
      } else {
        setValidationState('invalid');
        setError(errorMessage);
        form.setError(fieldName, {
          type: 'async',
          message: errorMessage,
        });
      }
    } catch {
      setValidationState('invalid');
      setError('Validation failed');
      form.setError(fieldName, {
        type: 'async',
        message: 'Validation failed',
      });
    }
  }, [validator, errorMessage, form, fieldName]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === fieldName) {
        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Set new timeout
        timeoutRef.current = setTimeout(() => {
          debouncedValidate(value[fieldName]);
        }, debounceMs);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [form, fieldName, debouncedValidate, debounceMs]);

  return {
    validationState,
    error,
    isValidating: validationState === 'validating',
    isValid: validationState === 'valid',
    isInvalid: validationState === 'invalid',
  };
}

// Hook for form auto-save functionality
export function useFormAutoSave<T extends FieldValues>(
  form: UseFormReturn<T>,
  onSave: (data: T) => Promise<void>,
  options: {
    interval?: number;
    debounceMs?: number;
    enabled?: boolean;
  } = {}
) {
  const { interval = 30000, debounceMs = 2000, enabled = true } = options;
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { setLoading } = useLoadingContext();

  const saveData = useCallback(async (data: T) => {
    if (!enabled) return;

    setIsSaving(true);
    setSaveError(null);
    setLoading('auto-save', true, 'Auto-saving...');

    try {
      await onSave(data);
      setLastSaved(new Date());
    } catch (error) {
      setSaveError('Failed to auto-save');
      console.error('Auto-save error:', error);
    } finally {
      setIsSaving(false);
      setLoading('auto-save', false);
    }
  }, [enabled, onSave, setLoading]);

  const debouncedSave = useCallback(
    debounce((data: T) => saveData(data), debounceMs),
    [saveData, debounceMs]
  );

  // Watch for changes and trigger debounced save
  useEffect(() => {
    if (!enabled) return;

    const subscription = form.watch((data) => {
      if (form.formState.isDirty && form.formState.isValid) {
        debouncedSave(data as T);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, debouncedSave, enabled]);

  // Periodic save
  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(() => {
      if (form.formState.isDirty && form.formState.isValid) {
        const data = form.getValues();
        saveData(data);
      }
    }, interval);

    return () => clearInterval(intervalId);
  }, [form, saveData, interval, enabled]);

  return {
    lastSaved,
    isSaving,
    saveError,
    forceSave: () => {
      const data = form.getValues();
      return saveData(data);
    },
  };
}