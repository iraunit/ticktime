"use client";

import { useState, useCallback } from 'react';
import { ApiError, handleApiError, getFieldErrors } from '@/lib/api';

export interface ErrorState {
  error: string | null;
  fieldErrors: Record<string, string[]>;
  isError: boolean;
}

export function useErrorHandling() {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    fieldErrors: {},
    isError: false,
  });

  const setError = useCallback((error: unknown) => {
    const message = handleApiError(error);
    const fieldErrors = getFieldErrors(error);
    
    setErrorState({
      error: message,
      fieldErrors,
      isError: true,
    });
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      fieldErrors: {},
      isError: false,
    });
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrorState(prev => ({
      ...prev,
      fieldErrors: {
        ...prev.fieldErrors,
        [fieldName]: [],
      },
    }));
  }, []);

  return {
    ...errorState,
    setError,
    clearError,
    clearFieldError,
  };
}

// Hook for handling async operations with error states
export function useAsyncOperation<T = any>() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const { error, fieldErrors, isError, setError, clearError } = useErrorHandling();

  const execute = useCallback(async (operation: () => Promise<T>) => {
    setIsLoading(true);
    clearError();
    
    try {
      const result = await operation();
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [clearError, setError]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setData(null);
    clearError();
  }, [clearError]);

  return {
    isLoading,
    data,
    error,
    fieldErrors,
    isError,
    execute,
    reset,
    clearError,
  };
}

// Hook for retry logic
export function useRetry(maxRetries: number = 3, delay: number = 1000) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = useCallback(async (operation: () => Promise<any>) => {
    if (retryCount >= maxRetries) {
      throw new Error('Maximum retry attempts reached');
    }

    setIsRetrying(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, retryCount)));
      const result = await operation();
      setRetryCount(0);
      return result;
    } catch (error) {
      setRetryCount(prev => prev + 1);
      throw error;
    } finally {
      setIsRetrying(false);
    }
  }, [retryCount, maxRetries, delay]);

  const resetRetry = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    retry,
    retryCount,
    isRetrying,
    canRetry: retryCount < maxRetries,
    resetRetry,
  };
}