import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { CacheManager } from './cache-manager';
import { PerformanceMonitor } from './performance-monitor';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Extend the request config to include retry flag and cache config
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
  cache?: {
    enabled?: boolean;
    ttl?: number;
    key?: string;
  };
}

// API Error types
export interface ApiError {
  status: string;
  message: string;
  code?: string;
  details?: {
    field_errors?: Record<string, string[]>;
    [key: string]: unknown;
  };
}

// Network status types
export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token and handle caching
api.interceptors.request.use(
  async (config: ExtendedAxiosRequestConfig) => {
    // Add performance monitoring
    config.metadata = { startTime: performance.now() };
    
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Check cache for GET requests
    if (config.method === 'get' && config.cache?.enabled) {
      const cacheKey = config.cache.key || `${config.method}:${config.url}:${JSON.stringify(config.params)}`;
      const cachedData = CacheManager.get(cacheKey);
      
      if (cachedData) {
        // Return cached response
        return Promise.reject({
          __cached: true,
          data: cachedData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        });
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh, caching, and errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    const config = response.config as ExtendedAxiosRequestConfig;
    
    // Performance monitoring
    if (config.metadata?.startTime) {
      const duration = performance.now() - config.metadata.startTime;
      PerformanceMonitor.recordMetric(`api_${config.url}`, {
        loadTime: 0,
        renderTime: 0,
        apiResponseTime: duration,
      });
      
      // Log slow requests
      if (duration > 2000) {
        console.warn(`Slow API request: ${config.method?.toUpperCase()} ${config.url} took ${duration}ms`);
      }
    }

    // Cache successful GET responses
    if (config.method === 'get' && config.cache?.enabled && response.status === 200) {
      const cacheKey = config.cache.key || `${config.method}:${config.url}:${JSON.stringify(config.params)}`;
      const ttl = config.cache.ttl || 5 * 60 * 1000; // 5 minutes default
      CacheManager.set(cacheKey, response.data, ttl);
    }

    return response;
  },
  async (error: AxiosError | any) => {
    // Handle cached responses
    if (error.__cached) {
      return Promise.resolve({
        data: error.data,
        status: error.status,
        statusText: error.statusText,
        headers: error.headers,
        config: error.config
      });
    }
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    // Handle network errors with retry logic
    if (!error.response) {
      if (shouldRetryRequest(originalRequest, error)) {
        return retryRequest(originalRequest);
      }
      
      const networkError: ApiError = {
        status: 'error',
        message: getNetworkErrorMessage(),
        code: 'NETWORK_ERROR'
      };
      return Promise.reject(networkError);
    }

    // Handle timeout errors with retry logic
    if (error.code === 'ECONNABORTED') {
      if (shouldRetryRequest(originalRequest, error)) {
        return retryRequest(originalRequest);
      }
      
      const timeoutError: ApiError = {
        status: 'error',
        message: 'Request timeout. Please try again.',
        code: 'TIMEOUT_ERROR'
      };
      return Promise.reject(timeoutError);
    }

    // Handle retryable HTTP errors
    if (error.response?.status && RETRY_CONFIG.retryableStatusCodes.includes(error.response.status)) {
      if (shouldRetryRequest(originalRequest, error)) {
        return retryRequest(originalRequest);
      }
    }

    // Handle 401 unauthorized - token refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (typeof window !== 'undefined') {
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            const response = await axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, {
              refresh: refreshToken,
            });

            const { access } = response.data;
            localStorage.setItem('access_token', access);

            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${access}`;
            return api(originalRequest);
          }
        } catch {
          // Refresh failed, clear tokens and redirect to login
          clearAuthTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      }
    }

    // Transform error response to standardized format
    const responseData = error.response?.data as Record<string, unknown>;
    const apiError: ApiError = {
      status: 'error',
      message: (responseData?.message as string) || getDefaultErrorMessage(error.response?.status),
      code: (responseData?.code as string) || `HTTP_${error.response?.status}`,
      details: responseData?.details as ApiError['details']
    };

    return Promise.reject(apiError);
  }
);

// Helper function to get default error messages
function getDefaultErrorMessage(status?: number): string {
  switch (status) {
    case 400:
      return 'Bad request. Please check your input and try again.';
    case 401:
      return 'Unauthorized. Please log in and try again.';
    case 403:
      return 'Forbidden. You do not have permission to perform this action.';
    case 404:
      return 'Resource not found.';
    case 409:
      return 'Conflict. The resource already exists or there is a conflict.';
    case 422:
      return 'Validation error. Please check your input.';
    case 429:
      return 'Too many requests. Please wait and try again.';
    case 500:
      return 'Internal server error. Please try again later.';
    case 502:
      return 'Bad gateway. Please try again later.';
    case 503:
      return 'Service unavailable. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

// Helper function to handle API errors in components
export function handleApiError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message;
  }
  return 'An unexpected error occurred. Please try again.';
}

// Helper function to extract field errors for forms
export function getFieldErrors(error: unknown): Record<string, string[]> {
  if (error && typeof error === 'object' && 'details' in error) {
    const errorObj = error as { details?: { field_errors?: Record<string, string[]> } };
    if (errorObj.details?.field_errors) {
      return errorObj.details.field_errors;
    }
  }
  return {};
}

// Retry logic helpers
function shouldRetryRequest(config: ExtendedAxiosRequestConfig | undefined, error: AxiosError): boolean {
  if (!config) return false;
  
  const retryCount = config._retryCount || 0;
  if (retryCount >= RETRY_CONFIG.maxRetries) return false;
  
  // Don't retry POST/PUT/PATCH requests to avoid duplicate operations
  if (config.method && ['post', 'put', 'patch'].includes(config.method.toLowerCase())) {
    return false;
  }
  
  return true;
}

async function retryRequest(config: ExtendedAxiosRequestConfig): Promise<AxiosResponse> {
  const retryCount = (config._retryCount || 0) + 1;
  const delay = RETRY_CONFIG.retryDelay * Math.pow(2, retryCount - 1); // Exponential backoff
  
  await new Promise(resolve => setTimeout(resolve, delay));
  
  config._retryCount = retryCount;
  return api(config);
}

// Network status helpers
export function getNetworkStatus(): NetworkStatus {
  if (typeof window === 'undefined') {
    return { isOnline: true, isSlowConnection: false };
  }
  
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  return {
    isOnline: navigator.onLine,
    isSlowConnection: connection ? connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g' : false,
  };
}

function getNetworkErrorMessage(): string {
  const { isOnline } = getNetworkStatus();
  
  if (!isOnline) {
    return 'You appear to be offline. Please check your internet connection and try again.';
  }
  
  return 'Network error. Please check your connection and try again.';
}

// Auth token management
function clearAuthTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }
}

// File upload progress tracking
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export function createUploadConfig(
  onProgress?: (progress: UploadProgress) => void,
  signal?: AbortSignal
) {
  return {
    headers: { 'Content-Type': 'multipart/form-data' },
    signal,
    onUploadProgress: (progressEvent: any) => {
      if (onProgress && progressEvent.total) {
        const progress: UploadProgress = {
          loaded: progressEvent.loaded,
          total: progressEvent.total,
          percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
        };
        onProgress(progress);
      }
    },
  };
}

// Enhanced error logging and reporting
export function logError(error: unknown, context?: string) {
  const errorInfo = {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', errorInfo);
  }

  // In production, you would send this to an error reporting service
  // Example: Sentry.captureException(error, { extra: errorInfo });
}

// Global error handler for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason, 'Unhandled Promise Rejection');
  });
}

export default api;
// Enhanced API functions with caching support
export const cachedApi = {
  get: (url: string, config?: ExtendedAxiosRequestConfig & { cache?: { ttl?: number; key?: string } }) => {
    return api.get(url, {
      ...config,
      cache: {
        enabled: true,
        ttl: 5 * 60 * 1000, // 5 minutes default
        ...config?.cache
      }
    });
  },

  // Dashboard data with longer cache
  getDashboardStats: (userId: string) => {
    return cachedApi.get('/dashboard/stats/', {
      cache: { ttl: 2 * 60 * 1000, key: `dashboard_stats_${userId}` } // 2 minutes
    });
  },

  // Profile data with medium cache
  getProfile: () => {
    return cachedApi.get('/profile/', {
      cache: { ttl: 10 * 60 * 1000, key: 'user_profile' } // 10 minutes
    });
  },

  // Deals with short cache
  getDeals: (params?: any) => {
    return cachedApi.get('/deals/', {
      params,
      cache: { ttl: 3 * 60 * 1000, key: `deals_${JSON.stringify(params)}` } // 3 minutes
    });
  },

  // Social accounts with longer cache
  getSocialAccounts: () => {
    return cachedApi.get('/profile/social-accounts/', {
      cache: { ttl: 15 * 60 * 1000, key: 'social_accounts' } // 15 minutes
    });
  }
};

// Cache invalidation helpers
export const cacheUtils = {
  invalidateUserData: () => {
    CacheManager.delete('user_profile');
    CacheManager.delete('social_accounts');
    // Clear dashboard stats for current user
    const keys = Array.from((CacheManager as any).cache.keys());
    keys.forEach(key => {
      if (key.startsWith('dashboard_stats_')) {
        CacheManager.delete(key);
      }
    });
  },

  invalidateDeals: () => {
    const keys = Array.from((CacheManager as any).cache.keys());
    keys.forEach(key => {
      if (key.startsWith('deals_')) {
        CacheManager.delete(key);
      }
    });
  },

  clearAllCache: () => {
    CacheManager.clear();
  }
};

// Performance optimization helpers
export const performanceUtils = {
  // Batch multiple API calls
  batchRequests: async <T>(requests: (() => Promise<T>)[]): Promise<T[]> => {
    const startTime = performance.now();
    
    try {
      const results = await Promise.all(requests.map(req => req()));
      
      const duration = performance.now() - startTime;
      PerformanceMonitor.recordMetric('batch_requests', {
        loadTime: 0,
        renderTime: 0,
        apiResponseTime: duration,
      });
      
      return results;
    } catch (error) {
      logError(error, 'Batch requests failed');
      throw error;
    }
  },

  // Debounced API calls
  debounce: <T extends (...args: any[]) => Promise<any>>(
    func: T,
    delay: number
  ): T => {
    let timeoutId: NodeJS.Timeout;
    
    return ((...args: any[]) => {
      clearTimeout(timeoutId);
      return new Promise((resolve, reject) => {
        timeoutId = setTimeout(async () => {
          try {
            const result = await func(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, delay);
      });
    }) as T;
  },

  // Throttled API calls
  throttle: <T extends (...args: any[]) => Promise<any>>(
    func: T,
    limit: number
  ): T => {
    let inThrottle: boolean;
    
    return ((...args: any[]) => {
      if (!inThrottle) {
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
        return func(...args);
      }
      return Promise.reject(new Error('Request throttled'));
    }) as T;
  }
};

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Delay initialization to avoid hydration issues
  setTimeout(() => {
    PerformanceMonitor.init();
  }, 100);
}