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
    timeout: 8000,
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

        // Handle CSRF errors
        const isCSRFError = error.response.status === 403 || isCsrfMissing(error.response?.data);
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

        // Handle API errors
        const responseData = error.response?.data;
        const errorMessage = responseData?.error || responseData?.message || getDefaultErrorMessage(error.response?.status);

        toast.error(errorMessage);
        return Promise.reject({message: errorMessage});
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
        console.error('API Error:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            context,
            timestamp: new Date().toISOString(),
        });
    }
}

export default api;