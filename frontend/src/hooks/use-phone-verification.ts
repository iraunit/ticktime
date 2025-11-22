import {useCallback, useEffect, useState} from 'react';
import {communicationApi} from '@/lib/api';
import {toast} from 'sonner';

interface UsePhoneVerificationReturn {
    sending: boolean;
    canResend: boolean;
    secondsUntilResend: number;
    sendVerificationPhone: () => Promise<void>;
}

const RATE_LIMIT_SECONDS = 3600; // 1 hour
const STORAGE_KEY = 'phone_verification_last_sent';

export function usePhoneVerification(): UsePhoneVerificationReturn {
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

    const sendVerificationPhone = useCallback(async () => {
        if (!canResend || sending) {
            return;
        }

        setSending(true);

        try {
            const response = await communicationApi.sendPhoneVerification();

            // After interceptor, response.data contains the result object
            toast.success(response.data?.message || 'Verification WhatsApp sent! Please check your WhatsApp.');

            // Store timestamp for rate limiting
            localStorage.setItem(STORAGE_KEY, Date.now().toString());
            setCanResend(false);
            setSecondsUntilResend(RATE_LIMIT_SECONDS);
        } catch (error: any) {
            console.error('Error sending verification WhatsApp:', error);

            // Handle rate limit error
            if (error.response?.status === 429) {
                const retryAfter = error.response?.data?.retry_after || RATE_LIMIT_SECONDS;
                toast.error(error.response?.data?.error || 'Too many requests. Please try again later.');
                localStorage.setItem(STORAGE_KEY, Date.now().toString());
                setSecondsUntilResend(retryAfter);
            } else {
                toast.error(error.response?.data?.error || 'Failed to send verification WhatsApp');
            }
        } finally {
            setSending(false);
        }
    }, [canResend, sending]);

    return {
        sending,
        canResend,
        secondsUntilResend,
        sendVerificationPhone,
    };
}

