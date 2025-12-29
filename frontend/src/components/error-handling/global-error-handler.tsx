"use client";

import {useEffect, useRef} from 'react';
import {toast} from 'sonner';
import {useNetworkStatus} from '@/hooks/use-network-status';
import {logError} from '@/lib/api';

export function GlobalErrorHandler() {
    const {isOnline, isSlowConnection} = useNetworkStatus();
    const wasOfflineRef = useRef(false);

    // Handle network status changes
    useEffect(() => {
        if (!isOnline) {
            wasOfflineRef.current = true;
            toast.error('You are offline', {
                description: 'Please check your internet connection',
                duration: Infinity,
                id: 'offline-toast',
            });
        } else {
            toast.dismiss('offline-toast');
            if (wasOfflineRef.current) {
                toast.success('Connection restored', {duration: 3000});
                wasOfflineRef.current = false;
            }
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

    // Handle unhandled promise rejections (excluding chunk errors - handled separately)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const error = event.reason;
            // Skip chunk load errors - they're handled in the chunk error handler
            if (error?.name === 'ChunkLoadError' || 
                (typeof error === 'string' && error.includes('Loading chunk')) ||
                (error?.message && error.message.includes('Loading chunk'))) {
                return;
            }
            logError(error, 'Unhandled Promise Rejection');
            toast.error('Something went wrong. Please try again.', {id: 'unhandled-rejection'});
        };

        const handleError = (event: ErrorEvent) => {
            // Skip chunk load errors - they're handled in the chunk error handler
            if (event.error?.name === 'ChunkLoadError' || 
                (typeof event.message === 'string' && event.message.includes('Loading chunk'))) {
                return;
            }
            logError(event.error, 'Global Error Handler');
            toast.error('An unexpected error occurred. Please refresh the page.', {id: 'global-error'});
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
        if (typeof window === 'undefined') return;

        const handleChunkError = async (error: unknown) => {
            console.error('ChunkLoadError detected:', error);
            
            // Unregister all service workers (especially important in development)
            if ('serviceWorker' in navigator) {
                try {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(registrations.map(reg => reg.unregister()));
                    console.log('Service workers unregistered');
                } catch (e) {
                    console.warn('Failed to unregister service workers:', e);
                }
            }
            
            // Clear all caches (not just Next.js ones, as service worker might have cached them)
            if ('caches' in window) {
                try {
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
                    console.log('All caches cleared');
                } catch (e) {
                    console.warn('Failed to clear caches:', e);
                }
            }
            
            // Force reload with cache bypass
            window.location.href = window.location.href;
        };

        // Handle chunk errors from unhandled promise rejections
        const handleChunkRejection = (event: PromiseRejectionEvent) => {
            const error = event.reason;
            if (error && typeof error === 'object' && 'name' in error && error.name === 'ChunkLoadError') {
                event.preventDefault();
                handleChunkError(error);
            } else if (typeof error === 'string' && error.includes('Loading chunk')) {
                event.preventDefault();
                handleChunkError(new Error(error));
            } else if (error && typeof error === 'object' && 'message' in error && 
                       typeof error.message === 'string' && error.message.includes('Loading chunk')) {
                event.preventDefault();
                handleChunkError(error);
            }
        };

        // Handle chunk errors from error events
        const handleChunkErrorEvent = (event: ErrorEvent) => {
            const error = event.error;
            if (error?.name === 'ChunkLoadError' || 
                (typeof event.message === 'string' && event.message.includes('Loading chunk'))) {
                event.preventDefault();
                handleChunkError(error || new Error(event.message));
            }
        };

        const originalOnError = window.onerror;
        window.onerror = (message, source, lineno, colno, error) => {
            if (error?.name === 'ChunkLoadError' || (typeof message === 'string' && message.includes('Loading chunk'))) {
                handleChunkError(error || new Error(String(message)));
                return true;
            }
            if (originalOnError) {
                return originalOnError(message, source, lineno, colno, error);
            }
            return false;
        };

        window.addEventListener('unhandledrejection', handleChunkRejection);
        window.addEventListener('error', handleChunkErrorEvent);

        return () => {
            window.onerror = originalOnError;
            window.removeEventListener('unhandledrejection', handleChunkRejection);
            window.removeEventListener('error', handleChunkErrorEvent);
        };
    }, []);

    return null;
}