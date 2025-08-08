"use client";

import { useEffect, useState } from 'react';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLoadingContext } from '@/contexts/loading-context';
import { useNetworkStatus } from '@/hooks/use-network-status';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
  canCancel?: boolean;
  onCancel?: () => void;
  className?: string;
}

export function LoadingOverlay({
  isVisible,
  message = 'Loading...',
  progress,
  canCancel = false,
  onCancel,
  className,
}: LoadingOverlayProps) {
  const { isOnline } = useNetworkStatus();
  const [dots, setDots] = useState('');

  // Animate loading dots
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm',
      className
    )}>
      <Card className="w-full max-w-sm mx-4">
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            {/* Loading spinner */}
            <div className="relative">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              {!isOnline && (
                <div className="absolute -top-1 -right-1">
                  <WifiOff className="w-4 h-4 text-red-500" />
                </div>
              )}
            </div>

            {/* Loading message */}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                {message}{dots}
              </p>
              {!isOnline && (
                <p className="text-xs text-red-600 mt-1">
                  Connection issues detected
                </p>
              )}
            </div>

            {/* Progress bar */}
            {typeof progress === 'number' && (
              <div className="w-full space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-xs text-center text-gray-500">
                  {progress}% complete
                </p>
              </div>
            )}

            {/* Cancel button */}
            {canCancel && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="mt-4"
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Global loading overlay that responds to loading context
export function GlobalLoadingOverlay() {
  const { loadingStates, isAnyLoading } = useLoadingContext();
  
  // Get the most important loading state to display
  const primaryLoadingState = Object.entries(loadingStates).find(([key, state]) => {
    return ['form-submit', 'file-upload', 'auth', 'critical'].some(priority => 
      key.includes(priority)
    );
  })?.[1] || Object.values(loadingStates)[0];

  return (
    <LoadingOverlay
      isVisible={isAnyLoading()}
      message={primaryLoadingState?.message}
      progress={primaryLoadingState?.progress}
    />
  );
}

// Hook for managing loading overlays
export function useLoadingOverlay() {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState<string>('Loading...');
  const [progress, setProgress] = useState<number | undefined>();
  const [canCancel, setCanCancel] = useState(false);
  const [onCancel, setOnCancel] = useState<(() => void) | undefined>();

  const show = (options?: {
    message?: string;
    progress?: number;
    canCancel?: boolean;
    onCancel?: () => void;
  }) => {
    setMessage(options?.message || 'Loading...');
    setProgress(options?.progress);
    setCanCancel(options?.canCancel || false);
    setOnCancel(() => options?.onCancel);
    setIsVisible(true);
  };

  const hide = () => {
    setIsVisible(false);
    setProgress(undefined);
    setCanCancel(false);
    setOnCancel(undefined);
  };

  const updateProgress = (newProgress: number, newMessage?: string) => {
    setProgress(newProgress);
    if (newMessage) setMessage(newMessage);
  };

  return {
    isVisible,
    message,
    progress,
    canCancel,
    onCancel,
    show,
    hide,
    updateProgress,
    LoadingOverlay: () => (
      <LoadingOverlay
        isVisible={isVisible}
        message={message}
        progress={progress}
        canCancel={canCancel}
        onCancel={onCancel}
      />
    ),
  };
}