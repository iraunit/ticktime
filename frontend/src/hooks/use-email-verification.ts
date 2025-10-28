import {useCallback, useEffect, useState} from 'react';
import {communicationApi} from '@/lib/api';
import {toast} from 'sonner';

interface UseEmailVerificationReturn {
    sending: boolean;
    canResend: boolean;
    secondsUntilResend: number;
    sendVerificationEmail: () => Promise<void>;
}

const RATE_LIMIT_SECONDS = 3600; // 1 hour
const STORAGE_KEY = 'email_verification_last_sent';

export function useEmailVerification(): UseEmailVerificationReturn {
    const [sending, setSending] = useState(false);
    const [canResend, setCanResend] = useState(true);
    const [secondsUntilResend, setSecondsUntilResend] = useState(0);

    // Check rate limit on mount
    useEffect(() => {
        checkRateLimit();

        // Update timer every second
        const interval = setInterval(() => {
            checkRateLimit();
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const checkRateLimit = useCallback(() => {
        const lastSentStr = localStorage.getItem(STORAGE_KEY);
        if (!lastSentStr) {
            setCanResend(true);
            setSecondsUntilResend(0);
            return;
        }

        const lastSent = parseInt(lastSentStr, 10);
        const now = Date.now();
        const elapsed = Math.floor((now - lastSent) / 1000);
        const remaining = RATE_LIMIT_SECONDS - elapsed;

        if (remaining <= 0) {
            setCanResend(true);
            setSecondsUntilResend(0);
            localStorage.removeItem(STORAGE_KEY);
        } else {
            setCanResend(false);
            setSecondsUntilResend(remaining);
        }
    }, []);

    const sendVerificationEmail = useCallback(async () => {
        if (!canResend || sending) {
            return;
        }

        setSending(true);

    try {
      const response = await communicationApi.sendVerificationEmail();
      
      // After interceptor, response.data contains the result object
      toast.success(response.data?.message || 'Verification email sent! Please check your inbox.');
      
      // Store timestamp for rate limiting
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
      setCanResend(false);
      setSecondsUntilResend(RATE_LIMIT_SECONDS);
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      
      // Handle rate limit error
      if (error.response?.status === 429) {
        const retryAfter = error.response?.data?.retry_after || RATE_LIMIT_SECONDS;
        toast.error('Too many requests. Please try again later.');
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
        setSecondsUntilResend(retryAfter);
      } else {
        toast.error(error.response?.data?.error || 'Failed to send verification email');
      }
    } finally {
      setSending(false);
    }
    }, [canResend, sending]);

    return {
        sending,
        canResend,
        secondsUntilResend,
        sendVerificationEmail,
    };
}

/**
 * Format seconds into human-readable time string
 */
export function formatTimeRemaining(seconds: number): string {
    if (seconds <= 0) return '0s';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

