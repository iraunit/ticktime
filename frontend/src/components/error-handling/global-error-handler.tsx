"use client";

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { logError } from '@/lib/api';

export function GlobalErrorHandler() {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  // Handle network status changes
  useEffect(() => {
    if (!isOnline) {
      toast.error('You are offline', {
        description: 'Please check your internet connection',
        duration: Infinity,
        id: 'offline-toast',
      });
    } else {
      toast.dismiss('offline-toast');
      toast.success('Connection restored', {
        duration: 3000,
      });
    }
  }, [isOnline]);

  // Handle slow connection
  useEffect(() => {
    if (isSlowConnection && isOnline) {
      toast.warning('Slow connection detected', {
        description: 'Some features may be slower than usual',
        duration: 5000,
        id: 'slow-connection-toast',
      });
    } else {
      toast.dismiss('slow-connection-toast');
    }
  }, [isSlowConnection, isOnline]);

  // Handle unhandled promise rejections
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logError(event.reason, 'Unhandled Promise Rejection');
      toast.error('Something went wrong. Please try again.', { id: 'unhandled-rejection' });
    };

    const handleError = (event: ErrorEvent) => {
      logError(event.error, 'Global Error Handler');
      if (event.error?.name !== 'ChunkLoadError') {
        toast.error('An unexpected error occurred. Please refresh the page.', { id: 'global-error' });
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Handle chunk load errors (common in SPAs)
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const handleChunkError = () => {
      toast.error('Application update available', {
        description: 'Please refresh the page to get the latest version',
        duration: Infinity,
        action: {
          label: 'Refresh',
          onClick: () => window.location.reload(),
        },
      });
    };

    // Listen for chunk load errors
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      if (error?.name === 'ChunkLoadError' || (typeof message === 'string' && message.includes('Loading chunk'))) {
        handleChunkError();
        return true;
      }
      
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }
      return false;
    };

    return () => {
      window.onerror = originalOnError;
    };
  }, []);

  return null; // This component doesn't render anything
}