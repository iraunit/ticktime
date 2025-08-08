"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

interface LoadingContextType {
  loadingStates: Record<string, LoadingState>;
  setLoading: (key: string, loading: boolean, message?: string, progress?: number) => void;
  isLoading: (key: string) => boolean;
  getLoadingState: (key: string) => LoadingState | undefined;
  isAnyLoading: () => boolean;
  clearLoading: (key: string) => void;
  clearAllLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [loadingStates, setLoadingStates] = useState<Record<string, LoadingState>>({});

  const setLoading = useCallback((
    key: string, 
    loading: boolean, 
    message?: string, 
    progress?: number
  ) => {
    setLoadingStates(prev => {
      if (!loading) {
        const newStates = { ...prev };
        delete newStates[key];
        return newStates;
      }
      
      return {
        ...prev,
        [key]: {
          isLoading: loading,
          message,
          progress,
        },
      };
    });
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key]?.isLoading || false;
  }, [loadingStates]);

  const getLoadingState = useCallback((key: string) => {
    return loadingStates[key];
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(state => state.isLoading);
  }, [loadingStates]);

  const clearLoading = useCallback((key: string) => {
    setLoadingStates(prev => {
      const newStates = { ...prev };
      delete newStates[key];
      return newStates;
    });
  }, []);

  const clearAllLoading = useCallback(() => {
    setLoadingStates({});
  }, []);

  const value: LoadingContextType = {
    loadingStates,
    setLoading,
    isLoading,
    getLoadingState,
    isAnyLoading,
    clearLoading,
    clearAllLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoadingContext() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoadingContext must be used within a LoadingProvider');
  }
  return context;
}

// Hook for managing loading states with automatic cleanup
export function useLoadingState(key: string) {
  const { setLoading, isLoading, getLoadingState, clearLoading } = useLoadingContext();

  const startLoading = useCallback((message?: string, progress?: number) => {
    setLoading(key, true, message, progress);
  }, [key, setLoading]);

  const stopLoading = useCallback(() => {
    setLoading(key, false);
  }, [key, setLoading]);

  const updateProgress = useCallback((progress: number, message?: string) => {
    setLoading(key, true, message, progress);
  }, [key, setLoading]);

  return {
    isLoading: isLoading(key),
    loadingState: getLoadingState(key),
    startLoading,
    stopLoading,
    updateProgress,
    clearLoading: () => clearLoading(key),
  };
}