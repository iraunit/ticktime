import axios, {AxiosError, AxiosResponse, InternalAxiosRequestConfig} from 'axios';
import {toast} from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
    _retryCount?: number;
}

export interface ApiError {
    status: string;
    message: string;
    code?: string;
    details?: {
        field_errors?: Record<string, string[]>;
        [key: string]: unknown;
    };
}

function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[2]) : null;
}

export const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
    xsrfCookieName: 'csrftoken',
    xsrfHeaderName: 'X-CSRFToken',
    timeout: 60000,
});

api.interceptors.request.use(
    async (config: ExtendedAxiosRequestConfig) => {
        // Add CSRF token for unsafe methods
        const method = (config.method || 'get').toLowerCase();
        if (['post', 'put', 'patch', 'delete'].includes(method)) {
            let token = getCookie('csrftoken');
            if (!token) {
                try {
                    await api.get('/auth/csrf/');
                    token = getCookie('csrftoken');
                } catch {
                    // Ignore CSRF fetch errors
                }
            }
            if (token) {
                config.headers = config.headers || {};
                (config.headers as any)['X-CSRFToken'] = token;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response: AxiosResponse) => {
        const data = response.data;

        // Handle consistent API response format
        if (data && typeof data === 'object' && 'success' in data) {
            if (data.success === false) {
                // Show toast error and reject
                toast.error(data.error || 'An error occurred');
                return Promise.reject({
                    response: {
                        data: {success: false, error: data.error || 'An error occurred'},
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers,
                        config: response.config
                    }
                });
            }

            // Return only the result data for successful responses
            response.data = data.result || data;
        }

        return response;
    },
    async (error: AxiosError | any) => {
        const originalRequest = error.config as ExtendedAxiosRequestConfig;

        // Handle network errors with retry
        if (!error.response) {
            if (shouldRetryRequest(originalRequest, error)) {
                return retryRequest(originalRequest);
            }
            toast.error('Network error. Please check your connection and try again.');
            return Promise.reject({message: 'Network error. Please check your connection and try again.'});
        }

        // Skip CSRF retry for auth endpoints - 403 here means not authenticated, not CSRF issue
        const isAuthEndpoint = originalRequest?.url && originalRequest.url.startsWith('/auth/');
        
        // Handle CSRF errors (but not for auth endpoints where 403 means unauthenticated)
        const isCSRFError = (error.response.status === 403 || isCsrfMissing(error.response?.data)) && !isAuthEndpoint;
        if (isCSRFError && originalRequest && !originalRequest._retry) {
            try {
                await api.get('/auth/csrf/');
                const token = getCookie('csrftoken');
                if (token) {
                    originalRequest._retry = true;
                    originalRequest.headers = originalRequest.headers || {};
                    (originalRequest.headers as any)['X-CSRFToken'] = token;
                    return api(originalRequest);
                }
            } catch (csrfError) {
                console.warn('Failed to retrieve CSRF token:', csrfError);
            }
        }

        // Skip toast for authentication-related errors (401/403) on auth endpoints
        // to avoid annoying logged-out users with error messages
        const isAuthError = error.response.status === 401 || error.response.status === 403;

        if (isAuthError && isAuthEndpoint) {
            const responseData = error.response?.data;
            const errorMessage = responseData?.error || responseData?.message || getDefaultErrorMessage(error.response?.status);
            return Promise.reject({message: errorMessage});
        }

        // Handle API errors
        const responseData = error.response?.data;

        // Check for field-specific errors first (most specific and helpful)
        let errorMessage = getDefaultErrorMessage(error.response?.status);

        if (responseData?.errors && typeof responseData.errors === 'object') {
            // Extract field-specific errors
            const fieldErrorMessages: string[] = [];
            for (const [field, messages] of Object.entries(responseData.errors)) {
                if (Array.isArray(messages) && messages.length > 0) {
                    // Capitalize field name and add error messages
                    const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    messages.forEach((msg: string) => {
                        fieldErrorMessages.push(`${fieldName}: ${msg}`);
                    });
                }
            }

            if (fieldErrorMessages.length > 0) {
                // Use the first error message (most relevant)
                errorMessage = fieldErrorMessages[0];
            } else {
                // Fallback to generic message or error field
                errorMessage = responseData?.error || responseData?.message || errorMessage;
            }
        } else {
            // No field errors, use generic message
            errorMessage = responseData?.error || responseData?.message || errorMessage;
        }

        toast.error(errorMessage);
        // Preserve original error structure for component-level error handling
        return Promise.reject({
            message: errorMessage,
            response: error.response,
            originalError: error
        });
    }
);

function isCsrfMissing(data: any): boolean {
    if (!data) return false;
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    return /csrf token missing|csrf failed/i.test(text);
}

function getDefaultErrorMessage(status?: number): string {
    switch (status) {
        case 400:
            return 'Bad request. Please check your input and try again.';
        case 401:
            return 'Unauthorized. Please log in and try again.';
        case 403:
            return 'Forbidden. Please try again after logging in.';
        case 404:
            return 'Resource not found.';
        case 409:
            return 'Conflict.';
        case 422:
            return 'Validation error. Please check your input.';
        case 429:
            return 'Too many requests. Please wait and try again.';
        case 500:
            return 'Internal server error. Please try again later.';
        default:
            return 'An unexpected error occurred. Please try again.';
    }
}

function shouldRetryRequest(config: ExtendedAxiosRequestConfig | undefined, error: AxiosError): boolean {
    if (!config) return false;
    const retryCount = config._retryCount || 0;
    if (retryCount >= 2) return false; // Max 2 retries
    if (config.method && ['post', 'put', 'patch'].includes(config.method.toLowerCase())) return false;
    return true;
}

async function retryRequest(config: ExtendedAxiosRequestConfig): Promise<AxiosResponse> {
    const retryCount = (config._retryCount || 0) + 1;
    const delay = 800 * Math.pow(2, retryCount - 1); // Exponential backoff
    await new Promise(resolve => setTimeout(resolve, delay));
    config._retryCount = retryCount;
    return api(config);
}

export function handleApiError(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error) {
        return (error as { message: string }).message;
    }
    return 'An unexpected error occurred. Please try again.';
}

export function getFieldErrors(error: unknown): Record<string, string[]> {
    if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        const responseData = axiosError.response?.data;
        if (responseData && responseData.details && responseData.details.field_errors) {
            return responseData.details.field_errors;
        }
    }
    return {};
}

export function getNetworkStatus() {
    if (typeof window === 'undefined') {
        return {isOnline: true, isSlowConnection: false};
    }
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return {
        isOnline: navigator.onLine,
        isSlowConnection: connection ? connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g' : false
    };
}

export function logError(error: unknown, context?: string) {
    if (process.env.NODE_ENV === 'development') {
        let errorMessage = 'Unknown error';
        let errorStack: string | undefined;
        
        if (error instanceof Error) {
            errorMessage = error.message;
            errorStack = error.stack;
        } else if (error && typeof error === 'object' && 'message' in error) {
            // Handle ApiError objects
            errorMessage = String((error as ApiError).message);
        }
        
        console.error('API Error:', {
            message: errorMessage,
            stack: errorStack,
            context,
            timestamp: new Date().toISOString(),
        });
    }
}

// Communication API methods
export const communicationApi = {
    /**
     * Send verification email to current user
     */
    sendVerificationEmail: async () => {
        return api.post('/communications/send-verification/');
    },

    /**
     * Verify email using token from magic link
     */
    verifyEmail: async (token: string) => {
        return api.get(`/communications/verify-email/${token}/`);
    },

    /**
     * Send campaign notifications to influencers via email
     */
    sendCampaignNotification: async (data: {
        deal_ids: number[];
        notification_type: 'invitation' | 'status_update' | 'accepted' | 'shipped' | 'completed';
        custom_message?: string;
    }) => {
        return api.post('/communications/send-campaign-notification/', data);
    },

    /**
     * Send campaign notifications to influencers via WhatsApp
     */
    sendWhatsAppNotification: async (data: {
        deal_ids: number[];
        notification_type: 'invitation' | 'status_update' | 'accepted' | 'shipped' | 'completed';
        custom_message?: string;
    }) => {
        return api.post('/communications/send-whatsapp-notification/', data);
    },

    /**
     * Send phone verification via WhatsApp
     */
    sendPhoneVerification: async () => {
        return api.post('/communications/send-phone-verification/');
    },

    /**
     * Verify phone using token from WhatsApp link
     */
    verifyPhone: async (token: string) => {
        return api.get(`/communications/verify-phone/${token}/`);
    },

    /**
     * Check account status (email verification, lock status)
     */
    checkAccountStatus: async () => {
        return api.get('/communications/account-status/');
    },

    /**
     * Submit a support query to TickTime support desk
     */
    sendSupportMessage: async (data: {
        name: string;
        email: string;
        phone_number: string;
        subject: string;
        message: string;
        source?: string;
    }) => {
        return api.post('/communications/support-query/', data);
    },
};

export default api;