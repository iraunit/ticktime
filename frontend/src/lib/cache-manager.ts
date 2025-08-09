import { useState, useEffect, useCallback } from 'react';

/**
 * Frontend caching utilities for improved performance
 */

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheManager {
  private static cache = new Map<string, CacheItem<any>>();
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Set an item in the cache
   */
  static set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get an item from the cache
   */
  static get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Check if an item exists and is valid in the cache
   */
  static has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove an item from the cache
   */
  static delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache items
   */
  static clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired items from the cache
   */
  static clearExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  static getStats(): {
    size: number;
    expired: number;
    hitRate: number;
  } {
    const now = Date.now();
    let expired = 0;
    
    for (const item of this.cache.values()) {
      if (now - item.timestamp > item.ttl) {
        expired++;
      }
    }

    return {
      size: this.cache.size,
      expired,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
    };
  }

  private static hitCount = 0;
  private static missCount = 0;

  /**
   * Get with hit/miss tracking
   */
  static getWithStats<T>(key: string): T | null {
    const result = this.get<T>(key);
    if (result !== null) {
      this.hitCount++;
    } else {
      this.missCount++;
    }
    return result;
  }
}

/**
 * Local Storage cache with expiration
 */
export class LocalStorageCache {
  private static readonly PREFIX = 'influencer_cache_';

  /**
   * Set an item in localStorage with expiration
   */
  static set<T>(key: string, data: T, ttl: number = 24 * 60 * 60 * 1000): void {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(this.PREFIX + key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to set localStorage cache:', error);
    }
  }

  /**
   * Get an item from localStorage
   */
  static get<T>(key: string): T | null {
    try {
      const itemStr = localStorage.getItem(this.PREFIX + key);
      if (!itemStr) {
        return null;
      }

      const item: CacheItem<T> = JSON.parse(itemStr);
      
      // Check if item has expired
      if (Date.now() - item.timestamp > item.ttl) {
        localStorage.removeItem(this.PREFIX + key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Failed to get localStorage cache:', error);
      return null;
    }
  }

  /**
   * Remove an item from localStorage
   */
  static delete(key: string): void {
    localStorage.removeItem(this.PREFIX + key);
  }

  /**
   * Clear all cache items from localStorage
   */
  static clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Clear expired items from localStorage
   */
  static clearExpired(): void {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    
    keys.forEach(key => {
      if (key.startsWith(this.PREFIX)) {
        try {
          const itemStr = localStorage.getItem(key);
          if (itemStr) {
            const item: CacheItem<any> = JSON.parse(itemStr);
            if (now - item.timestamp > item.ttl) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Remove corrupted items
          localStorage.removeItem(key);
        }
      }
    });
  }
}

/**
 * React hook for cached API calls
 */
export function useCachedApi<T>(
  key: string,
  apiCall: () => Promise<T>,
  ttl: number = 5 * 60 * 1000,
  useLocalStorage: boolean = false
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cache = useLocalStorage ? LocalStorageCache : CacheManager;

  const fetchData = useCallback(async () => {
    // Check cache first
    const cachedData = cache.get<T>(key);
    if (cachedData) {
      setData(cachedData);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      cache.set(key, result, ttl);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, apiCall, ttl, cache]);

  const refetch = useCallback(async () => {
    cache.delete(key);
    await fetchData();
  }, [key, fetchData, cache]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

/**
 * Service Worker cache management
 */
export class ServiceWorkerCache {
  private static readonly CACHE_NAME = 'influencer-platform-v1';

  /**
   * Initialize service worker caching
   */
  static async init(): Promise<void> {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
      } catch (error) {
        console.warn('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Cache static assets
   */
  static async cacheAssets(urls: string[]): Promise<void> {
    if ('caches' in window) {
      try {
        const cache = await caches.open(this.CACHE_NAME);
        await cache.addAll(urls);
      } catch (error) {
        console.warn('Failed to cache assets:', error);
      }
    }
  }

  /**
   * Clear old caches
   */
  static async clearOldCaches(): Promise<void> {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(name => name !== this.CACHE_NAME)
            .map(name => caches.delete(name))
        );
      } catch (error) {
        console.warn('Failed to clear old caches:', error);
      }
    }
  }
}

// Initialize cache cleanup on page load
if (typeof window !== 'undefined') {
  // Clean up expired cache items every 5 minutes
  setInterval(() => {
    CacheManager.clearExpired();
    LocalStorageCache.clearExpired();
  }, 5 * 60 * 1000);

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    CacheManager.clearExpired();
  });

  // Initialize service worker after hydration
  setTimeout(() => {
    ServiceWorkerCache.init().catch(console.warn);
  }, 100);
}