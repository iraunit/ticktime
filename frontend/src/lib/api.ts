import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { CacheManager } from './cache-manager';
import { PerformanceMonitor } from './performance-monitor';

const ENV_API = process.env.NEXT_PUBLIC_API_URL;
const API_BASE_URL = ENV_API || (typeof window !== 'undefined' && window.location.hostname.endsWith('ticktime.media') || window.location.hostname.endsWith('ticktimemedia.com')
  ? 'https://api.ticktime.media'
  : 'http://localhost:8000');

// Extend the request config to include retry flag and cache config
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
  cache?: {
    enabled?: boolean;
    ttl?: number;
    key?: string;
  };
  metadata?: {
    startTime?: number;
  };
}

// Utility to read cookies in browser
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
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
  maxRetries: 2,
  retryDelay: 800,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

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

// Request interceptor to handle caching, CSRF, and performance metadata
api.interceptors.request.use(
  async (config: ExtendedAxiosRequestConfig) => {
    // Add performance monitoring
    config.metadata = { startTime: performance.now() };

    // Ensure CSRF token for unsafe methods only
    const method = (config.method || 'get').toLowerCase();
    const isUnsafe = ['post', 'put', 'patch', 'delete'].includes(method);
    if (isUnsafe) {
      let token = getCookie('csrftoken');
      if (!token) {
        try {
          await api.get('/auth/csrf/');
          token = getCookie('csrftoken');
        } catch {}
      }
      if (token) {
        config.headers = config.headers || {};
        (config.headers as any)['X-CSRFToken'] = token;
      }
    }

    // Check cache for GET requests
    if (config.method === 'get' && config.cache?.enabled) {
      const cacheKey = config.cache.key || `${config.method}:${config.url}:${JSON.stringify(config.params)}`;
      const cachedData = CacheManager.get(cacheKey);
      if (cachedData) {
        return Promise.reject({ __cached: true, data: cachedData, status: 200, statusText: 'OK', headers: {}, config });
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle caching and errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    const config = response.config as ExtendedAxiosRequestConfig;

    // Performance monitoring
    if (config.metadata?.startTime) {
      const duration = performance.now() - config.metadata.startTime;
      PerformanceMonitor.recordMetric(`api_${config.url}`, { loadTime: 0, renderTime: 0, apiResponseTime: duration });
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
    if (error.__cached) {
      return Promise.resolve({ data: error.data, status: error.status, statusText: error.statusText, headers: error.headers, config: error.config });
    }
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    // Handle network errors with limited retries
    if (!error.response) {
      if (shouldRetryRequest(originalRequest, error)) {
        return retryRequest(originalRequest);
      }
      const networkError: ApiError = { status: 'error', message: getNetworkErrorMessage(), code: 'NETWORK_ERROR' };
      return Promise.reject(networkError);
    }

    // If we failed with 403 CSRF on unsafe method, try once to get token then replay
    if (error.response.status === 403 && originalRequest && !originalRequest._retry) {
      try {
        await api.get('/auth/csrf/');
        const token = getCookie('csrftoken');
        if (token) {
          originalRequest._retry = true;
          originalRequest.headers = originalRequest.headers || {};
          (originalRequest.headers as any)['X-CSRFToken'] = token;
          return api(originalRequest);
        }
      } catch {}
    }

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

function isCsrfMissing(data: any): boolean {
  if (!data) return false;
  const text = typeof data === 'string' ? data : JSON.stringify(data);
  return /csrf token missing|csrf failed/i.test(text);
}

function getDefaultErrorMessage(status?: number): string {
  switch (status) {
    case 400: return 'Bad request. Please check your input and try again.';
    case 401: return 'Unauthorized. Please log in and try again.';
    case 403: return 'Forbidden. Please try again after logging in.';
    case 404: return 'Resource not found.';
    case 409: return 'Conflict.';
    case 422: return 'Validation error. Please check your input.';
    case 429: return 'Too many requests. Please wait and try again.';
    case 500: return 'Internal server error. Please try again later.';
    default: return 'An unexpected error occurred. Please try again.';
  }
}

export function handleApiError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message;
  }
  return 'An unexpected error occurred. Please try again.';
}

export function getFieldErrors(error: unknown): Record<string, string[]> {
  if (error && typeof error === 'object' && 'details' in error) {
    const errorObj = error as { details?: { field_errors?: Record<string, string[]> } };
    if (errorObj.details?.field_errors) return errorObj.details.field_errors;
  }
  return {};
}

function shouldRetryRequest(config: ExtendedAxiosRequestConfig | undefined, error: AxiosError): boolean {
  if (!config) return false;
  const retryCount = config._retryCount || 0;
  if (retryCount >= RETRY_CONFIG.maxRetries) return false;
  if (config.method && ['post', 'put', 'patch'].includes(config.method.toLowerCase())) return false;
  return true;
}

async function retryRequest(config: ExtendedAxiosRequestConfig): Promise<AxiosResponse> {
  const retryCount = (config._retryCount || 0) + 1;
  const delay = RETRY_CONFIG.retryDelay * Math.pow(2, retryCount - 1);
  await new Promise(resolve => setTimeout(resolve, delay));
  config._retryCount = retryCount;
  return api(config);
}

export function getNetworkStatus(): NetworkStatus {
  if (typeof window === 'undefined') { return { isOnline: true, isSlowConnection: false }; }
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  return { isOnline: navigator.onLine, isSlowConnection: connection ? connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g' : false };
}

function getNetworkErrorMessage(): string {
  const { isOnline } = getNetworkStatus();
  if (!isOnline) return 'You appear to be offline. Please check your internet connection and try again.';
  return 'Network error. Please check your connection and try again.';
}

export function logError(error: unknown, context?: string) {
  const errorInfo = {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  };
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', errorInfo);
  }
}

// Global error handler for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason, 'Unhandled Promise Rejection');
  });
}

export default api;

export const cachedApi = {
  get: (url: string, config?: Partial<ExtendedAxiosRequestConfig> & { cache?: { ttl?: number; key?: string } }) => {
    return api.get(url, { ...(config as any), cache: { enabled: true, ttl: 5 * 60 * 1000, ...config?.cache } } as any)
      .catch((err) => {
        if ((err as any)?.code === 'HTTP_404' && typeof url === 'string' && url.includes('/influencers/profile')) {
          return { data: null } as any;
        }
        throw err;
      });
  },
};

export const cacheUtils = {
  invalidateUserData: () => {
    CacheManager.delete('user_profile');
    CacheManager.delete('social_accounts');
    const keys = Array.from((CacheManager as any).cache.keys()) as string[];
    keys.forEach(key => { if (key.startsWith('dashboard_stats_')) CacheManager.delete(key); });
  },
  invalidateDeals: () => {
    const keys = Array.from((CacheManager as any).cache.keys()) as string[];
    keys.forEach(key => { if (key.startsWith('deals_')) CacheManager.delete(key); });
  },
  clearAllCache: () => { CacheManager.clear(); }
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