"use client";

import { useState, useEffect } from 'react';
import { useForm, UseFormReturn, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, AlertCircle } from '@/lib/icons';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { InlineLoader } from '@/components/ui/global-loader';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { debounce } from '@/lib/validation';

// Enhanced input with validation states
interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  validationState?: 'idle' | 'validating' | 'valid' | 'invalid';
  error?: string;
  success?: string;
}

export function EnhancedInput({ 
  validationState = 'idle', 
  error, 
  success, 
  className, 
  ...props 
}: EnhancedInputProps) {
  const getValidationIcon = () => {
    switch (validationState) {
      case 'validating':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full bg-gray-400 animate-pulse"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1.4s'
                }}
              />
            ))}
          </div>
        );
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'invalid':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getBorderColor = () => {
    switch (validationState) {
      case 'valid':
        return 'border-green-300 focus:border-green-500 focus:ring-green-500';
      case 'invalid':
        return 'border-red-300 focus:border-red-500 focus:ring-red-500';
      default:
        return '';
    }
  };

  return (
    <div className="relative">
      <Input
        className={cn(getBorderColor(), className)}
        {...props}
      />
      {getValidationIcon() && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {getValidationIcon()}
        </div>
      )}
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
      {success && validationState === 'valid' && (
        <p className="text-sm text-green-600 mt-1">{success}</p>
      )}
    </div>
  );
}

// Enhanced textarea with validation
interface EnhancedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  validationState?: 'idle' | 'validating' | 'valid' | 'invalid';
  error?: string;
  showCharCount?: boolean;
  maxLength?: number;
}

export function EnhancedTextarea({ 
  validationState = 'idle', 
  error, 
  showCharCount = false,
  maxLength,
  className, 
  value,
  ...props 
}: EnhancedTextareaProps) {
  const charCount = typeof value === 'string' ? value.length : 0;
  const isNearLimit = maxLength && charCount > maxLength * 0.8;
  const isOverLimit = maxLength && charCount > maxLength;

  const getBorderColor = () => {
    switch (validationState) {
      case 'valid':
        return 'border-green-300 focus:border-green-500 focus:ring-green-500';
      case 'invalid':
        return 'border-red-300 focus:border-red-500 focus:ring-red-500';
      default:
        return '';
    }
  };

  return (
    <div className="relative">
      <Textarea
        className={cn(getBorderColor(), className)}
        value={value}
        maxLength={maxLength}
        {...props}
      />
      {showCharCount && maxLength && (
        <div className={cn(
          "absolute bottom-2 right-2 text-xs",
          isOverLimit ? "text-red-500" : isNearLimit ? "text-yellow-500" : "text-gray-400"
        )}>
          {charCount}/{maxLength}
        </div>
      )}
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}

// Real-time validation hook
export function useRealtimeValidation<T extends FieldValues>(
  form: UseFormReturn<T>,
  fieldName: Path<T>,
  validator: (value: any) => Promise<boolean> | boolean,
  debounceMs: number = 500
) {
  const [validationState, setValidationState] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');

  const debouncedValidate = debounce(async (value: any) => {
    if (!value) {
      setValidationState('idle');
      return;
    }

    setValidationState('validating');
    
    try {
      const isValid = await validator(value);
      setValidationState(isValid ? 'valid' : 'invalid');
    } catch {
      setValidationState('invalid');
    }
  }, debounceMs);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === fieldName) {
        debouncedValidate(value[fieldName]);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, fieldName, debouncedValidate]);

  return validationState;
}

// Form with auto-save functionality
interface AutoSaveFormProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSave: (data: T) => Promise<void>;
  saveInterval?: number;
  children: React.ReactNode;
  className?: string;
}

export function AutoSaveForm<T extends FieldValues>({ 
  form, 
  onSave, 
  saveInterval = 30000, // 30 seconds
  children,
  className 
}: AutoSaveFormProps<T>) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const saveData = async (data: T) => {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      await onSave(data);
      setLastSaved(new Date());
    } catch (error) {
      setSaveError('Failed to save changes');
      console.error('Auto-save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const debouncedSave = debounce(saveData, 2000);

  useEffect(() => {
    const subscription = form.watch((data) => {
      if (form.formState.isDirty && form.formState.isValid) {
        debouncedSave(data as T);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, debouncedSave]);

  // Periodic save
  useEffect(() => {
    const interval = setInterval(() => {
      if (form.formState.isDirty && form.formState.isValid) {
        const data = form.getValues();
        saveData(data);
      }
    }, saveInterval);

    return () => clearInterval(interval);
  }, [form, saveInterval]);

  return (
    <div className={className}>
      {children}
      
      {/* Save status indicator */}
      <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
        <div className="flex items-center space-x-2">
          {isSaving && (
            <>
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1 h-1 rounded-full bg-gray-400 animate-pulse"
                    style={{
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: '1.4s'
                    }}
                  />
                ))}
              </div>
              <span>Saving...</span>
            </>
          )}
          {lastSaved && !isSaving && (
            <>
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Saved at {lastSaved.toLocaleTimeString()}</span>
            </>
          )}
          {saveError && (
            <>
              <AlertCircle className="w-3 h-3 text-red-500" />
              <span className="text-red-500">{saveError}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Form field with async validation
interface AsyncValidatedFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  validator: (value: string) => Promise<boolean>;
  validationMessage?: string;
  form: UseFormReturn<any>;
  type?: string;
  required?: boolean;
}

export function AsyncValidatedField({
  name,
  label,
  placeholder,
  description,
  validator,
  validationMessage = 'This value is not available',
  form,
  type = 'text',
  required = false
}: AsyncValidatedFieldProps) {
  const validationState = useRealtimeValidation(form, name as any, validator);

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <EnhancedInput
              {...field}
              type={type}
              placeholder={placeholder}
              validationState={validationState}
              error={validationState === 'invalid' ? validationMessage : undefined}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Multi-step form component
interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: string[];
}

interface MultiStepFormProps<T extends FieldValues> {
  steps: FormStep[];
  form: UseFormReturn<T>;
  onSubmit: (data: T) => Promise<void>;
  children: (currentStep: FormStep, stepIndex: number) => React.ReactNode;
  className?: string;
}

export function MultiStepForm<T extends FieldValues>({
  steps,
  form,
  onSubmit,
  children,
  className
}: MultiStepFormProps<T>) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const validateCurrentStep = async () => {
    const fieldsToValidate = currentStep.fields as Path<T>[];
    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const nextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && !isLastStep) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const prevStep = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleSubmit = async (data: T) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={className}>
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center",
                index < steps.length - 1 ? "flex-1" : ""
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  index <= currentStepIndex
                    ? "bg-primary text-primary-foreground"
                    : "bg-gray-200 text-gray-600"
                )}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4",
                    index < currentStepIndex ? "bg-primary" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold">{currentStep.title}</h2>
          {currentStep.description && (
            <p className="text-sm text-gray-600 mt-1">{currentStep.description}</p>
          )}
        </div>
      </div>

      {/* Form content */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {children(currentStep, currentStepIndex)}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={isFirstStep}
            >
              Previous
            </Button>

            {isLastStep ? (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <InlineLoader />
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            ) : (
              <Button type="button" onClick={nextStep}>
                Next
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}