"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import { ApiError, logError } from '@/lib/api';

interface ErrorContextType {
  errors: Record<string, ApiError>;
  addError: (key: string, error: ApiError) => void;
  removeError: (key: string) => void;
  clearAllErrors: () => void;
  hasError: (key: string) => boolean;
  getError: (key: string) => ApiError | undefined;
  showToast: (error: ApiError, options?: { persist?: boolean }) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  const [errors, setErrors] = useState<Record<string, ApiError>>({});

  const addError = useCallback((key: string, error: ApiError) => {
    setErrors(prev => ({ ...prev, [key]: error }));
    logError(error, `Error added to context with key: ${key}`);
  }, []);

  const removeError = useCallback((key: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const hasError = useCallback((key: string) => {
    return key in errors;
  }, [errors]);

  const getError = useCallback((key: string) => {
    return errors[key];
  }, [errors]);

  const showToast = useCallback((error: ApiError, options?: { persist?: boolean }) => {
    const { persist = false } = options || {};
    
    // Determine toast type based on error code
    const isNetworkError = error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT_ERROR';
    const isServerError = error.code?.startsWith('HTTP_5');
    
    if (isNetworkError || isServerError) {
      toast.error(error.message, {
        duration: persist ? Infinity : 5000,
        action: {
          label: 'Retry',
          onClick: () => window.location.reload(),
        },
      });
    } else {
      toast.error(error.message, {
        duration: persist ? Infinity : 4000,
      });
    }
  }, []);

  const value: ErrorContextType = {
    errors,
    addError,
    removeError,
    clearAllErrors,
    hasError,
    getError,
    showToast,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useErrorContext() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return context;
}

// Hook for handling API errors with automatic toast notifications
export function useApiErrorHandler() {
  // Try to use context if available; fall back to direct toast if not
  const context = useContext(ErrorContext);

  const handleError = useCallback((error: unknown, key?: string, showToastNotification = true) => {
    const apiError: ApiError = error && typeof error === 'object' && 'message' in error
      ? error as ApiError
      : {
          status: 'error',
          message: 'An unexpected error occurred',
          code: 'UNKNOWN_ERROR',
        };

    if (key && context) {
      context.addError(key, apiError);
    }

    if (showToastNotification) {
      if (context) {
        context.showToast(apiError);
      } else {
        toast.error(apiError.message);
      }
    }

    return apiError;
  }, [context]);

  return { handleError };
}