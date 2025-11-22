/**
 * Cache utility for scraper API responses
 * Caches responses for 6 hours to reduce backend load
 */

const CACHE_PREFIX = 'scraper_api_cache_';
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

interface CachedData {
    data: any;
    timestamp: number;
}

/**
 * Generate a cache key from username and platform
 */
function getCacheKey(username: string, platform: string): string {
    return `${CACHE_PREFIX}${platform}_${username.toLowerCase()}`;
}

/**
 * Get cached data if it exists and is not expired
 */
export function getCachedScraperData(username: string, platform: string): any | null {
    if (typeof window === 'undefined') {
        return null; // Server-side rendering
    }

    try {
        const cacheKey = getCacheKey(username, platform);
        const cachedStr = localStorage.getItem(cacheKey);

        if (!cachedStr) {
            return null;
        }

        const cached: CachedData = JSON.parse(cachedStr);
        const now = Date.now();
        const age = now - cached.timestamp;

        // Check if cache is expired
        if (age > CACHE_DURATION_MS) {
            // Remove expired cache
            localStorage.removeItem(cacheKey);
            return null;
        }

        return cached.data;
    } catch (error) {
        // If there's an error parsing, remove the corrupted cache
        const cacheKey = getCacheKey(username, platform);
        localStorage.removeItem(cacheKey);
        return null;
    }
}

/**
 * Store data in cache with current timestamp
 */
export function setCachedScraperData(username: string, platform: string, data: any): void {
    if (typeof window === 'undefined') {
        return; // Server-side rendering
    }

    try {
        const cacheKey = getCacheKey(username, platform);
        const cached: CachedData = {
            data,
            timestamp: Date.now(),
        };
        localStorage.setItem(cacheKey, JSON.stringify(cached));
    } catch (error) {
        // Handle quota exceeded or other storage errors silently
        console.warn('Failed to cache scraper data:', error);
    }
}

/**
 * Clear all scraper API cache entries
 */
export function clearScraperCache(): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    } catch (error) {
        console.warn('Failed to clear scraper cache:', error);
    }
}

/**
 * Clear expired cache entries (cleanup utility)
 */
export function clearExpiredScraperCache(): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        const keys = Object.keys(localStorage);
        const now = Date.now();

        keys.forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                try {
                    const cachedStr = localStorage.getItem(key);
                    if (cachedStr) {
                        const cached: CachedData = JSON.parse(cachedStr);
                        const age = now - cached.timestamp;
                        if (age > CACHE_DURATION_MS) {
                            localStorage.removeItem(key);
                        }
                    }
                } catch (error) {
                    // Remove corrupted entries
                    localStorage.removeItem(key);
                }
            }
        });
    } catch (error) {
        console.warn('Failed to clear expired scraper cache:', error);
    }
}

/**
 * Fetch from scraper API with caching
 * Returns cached data if available and not expired, otherwise fetches and caches
 */
export async function fetchScraperApiWithCache(
    username: string,
    platform: string,
    apiUrl: string
): Promise<any | null> {
    // Check cache first
    const cachedData = getCachedScraperData(username, platform);
    if (cachedData !== null) {
        return cachedData;
    }

    // If not in cache or expired, fetch from API
    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        // Cache the response if it's valid
        if (data && (data.ok || data.data)) {
            setCachedScraperData(username, platform, data);
        }

        return data;
    } catch (error) {
        // Return null on error
        return null;
    }
}

// Initialize automatic cache cleanup on module load (client-side only)
if (typeof window !== 'undefined') {
    // Clean up expired cache entries every hour
    setInterval(() => {
        clearExpiredScraperCache();
    }, 60 * 60 * 1000); // 1 hour

    // Also clean up on page load
    clearExpiredScraperCache();
}

