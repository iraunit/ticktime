"use client";

import {AlertTriangle, Clock, RefreshCw, WifiOff} from '@/lib/icons';
import {Button} from '@/components/ui/button';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {ApiError, getNetworkStatus} from '@/lib/api';

interface ErrorDisplayProps {
    error: ApiError | Error | unknown;
    onRetry?: () => void;
    className?: string;
    variant?: 'inline' | 'card' | 'page';
    showRetry?: boolean;
}

export function ErrorDisplay({
                                 error,
                                 onRetry,
                                 className,
                                 variant = 'inline',
                                 showRetry = true
                             }: ErrorDisplayProps) {
    const errorInfo = getErrorInfo(error);
    const {isOnline} = getNetworkStatus();

    if (variant === 'page') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div
                            className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            {errorInfo.icon}
                        </div>
                        <CardTitle className="text-xl">{errorInfo.title}</CardTitle>
                        <CardDescription>{errorInfo.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!isOnline && (
                            <Alert>
                                <WifiOff className="h-4 w-4"/>
                                <AlertTitle>Connection Issue</AlertTitle>
                                <AlertDescription>
                                    You appear to be offline. Please check your internet connection.
                                </AlertDescription>
                            </Alert>
                        )}

                        {showRetry && onRetry && (
                            <Button onClick={onRetry} className="w-full">
                                <RefreshCw className="w-4 h-4 mr-2"/>
                                Try Again
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (variant === 'card') {
        return (
            <Card className={className}>
                <CardContent className="p-6">
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            {errorInfo.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900">{errorInfo.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{errorInfo.description}</p>
                            {showRetry && onRetry && (
                                <Button
                                    onClick={onRetry}
                                    variant="outline"
                                    size="sm"
                                    className="mt-3"
                                >
                                    <RefreshCw className="w-3 h-3 mr-1"/>
                                    Retry
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Inline variant
    return (
        <Alert variant="destructive" className={className}>
            {errorInfo.icon}
            <AlertTitle>{errorInfo.title}</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
                <span>{errorInfo.description}</span>
                {showRetry && onRetry && (
                    <Button
                        onClick={onRetry}
                        variant="outline"
                        size="sm"
                        className="ml-2 h-6 px-2 text-xs"
                    >
                        <RefreshCw className="w-3 h-3 mr-1"/>
                        Retry
                    </Button>
                )}
            </AlertDescription>
        </Alert>
    );
}

// Network status indicator
export function NetworkStatusIndicator() {
    const {isOnline, isSlowConnection} = getNetworkStatus();

    if (isOnline && !isSlowConnection) {
        return null;
    }

    return (
        <Alert className="mb-4">
            {isOnline ? <Clock className="h-4 w-4"/> : <WifiOff className="h-4 w-4"/>}
            <AlertTitle>
                {isOnline ? 'Slow Connection' : 'No Connection'}
            </AlertTitle>
            <AlertDescription>
                {isOnline
                    ? 'Your connection appears to be slow. Some features may be affected.'
                    : 'You appear to be offline. Please check your internet connection.'
                }
            </AlertDescription>
        </Alert>
    );
}

// Helper function to extract error information
function getErrorInfo(error: unknown) {
    // Handle API errors
    if (error && typeof error === 'object' && 'code' in error) {
        const apiError = error as ApiError;

        switch (apiError.code) {
            case 'NETWORK_ERROR':
                return {
                    title: 'Connection Error',
                    description: 'Unable to connect to the server. Please check your internet connection.',
                    icon: <WifiOff className="w-5 h-5 text-red-600"/>,
                };

            case 'TIMEOUT_ERROR':
                return {
                    title: 'Request Timeout',
                    description: 'The request took too long to complete. Please try again.',
                    icon: <Clock className="w-5 h-5 text-red-600"/>,
                };

            case 'HTTP_401':
                return {
                    title: 'Authentication Required',
                    description: 'Please log in to continue.',
                    icon: <AlertTriangle className="w-5 h-5 text-red-600"/>,
                };

            case 'HTTP_403':
                return {
                    title: 'Access Denied',
                    description: 'You do not have permission to perform this action.',
                    icon: <AlertTriangle className="w-5 h-5 text-red-600"/>,
                };

            case 'HTTP_404':
                return {
                    title: 'Not Found',
                    description: 'The requested resource could not be found.',
                    icon: <AlertTriangle className="w-5 h-5 text-red-600"/>,
                };

            case 'HTTP_429':
                return {
                    title: 'Too Many Requests',
                    description: 'Please wait a moment before trying again.',
                    icon: <Clock className="w-5 h-5 text-red-600"/>,
                };

            case 'HTTP_500':
            case 'HTTP_502':
            case 'HTTP_503':
                return {
                    title: 'Server Error',
                    description: 'Something went wrong on our end. Please try again later.',
                    icon: <AlertTriangle className="w-5 h-5 text-red-600"/>,
                };

            default:
                return {
                    title: 'Error',
                    description: apiError.message || 'An unexpected error occurred.',
                    icon: <AlertTriangle className="w-5 h-5 text-red-600"/>,
                };
        }
    }

    // Handle regular errors
    if (error instanceof Error) {
        return {
            title: 'Error',
            description: error.message || 'An unexpected error occurred.',
            icon: <AlertTriangle className="w-5 h-5 text-red-600"/>,
        };
    }

    // Handle simple string errors
    if (typeof error === 'string') {
        return {
            title: 'Error',
            description: error,
            icon: <AlertTriangle className="w-5 h-5 text-red-600"/>,
        };
    }

    // Handle unknown errors
    return {
        title: 'Unknown Error',
        description: 'An unexpected error occurred. Please try again.',
        icon: <AlertTriangle className="w-5 h-5 text-red-600"/>,
    };
}