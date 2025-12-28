import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Utility function to get the current domain type
 */
export function getCurrentDomainType(): 'ticktime.media' | 'ticktimemedia.com' | 'development' {
    if (typeof window === 'undefined') return 'development';

    const hostname = window.location.hostname;
    if (hostname.includes('ticktime.media')) {
        return 'ticktime.media';
    } else if (hostname.includes('ticktimemedia.com')) {
        return 'ticktimemedia.com';
    }
    return 'development';
}

/**
 * Utility function to get the appropriate API URL for the current domain
 */
export function getApiUrl(): string {
    const domainType = getCurrentDomainType();

    switch (domainType) {
        case 'ticktime.media':
            return 'https://api.ticktime.media';
        case 'ticktimemedia.com':
            return 'https://api.ticktimemedia.com';
        default:
            return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    }
}

/**
 * Normalize remote URLs coming from backend/scrapers.
 * Example: "scraper-blob.ticktime.media/media/..." -> "https://scraper-blob.ticktime.media/media/..."
 */
export function normalizeRemoteUrl(url: string | null | undefined): string | undefined {
    if (!url) return undefined;
    const trimmed = url.trim();
    if (!trimmed) return undefined;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('//')) return `https:${trimmed}`;
    if (trimmed.includes('.') && (trimmed.includes('/') || trimmed.length > 10)) {
        return `https://${trimmed}`;
    }
    return trimmed;
}

/**
 * Utility function to get the full URL for media files
 * @param mediaUrl - The media URL from the backend (can be relative or absolute)
 * @returns The full URL for the media file
 */
export function getMediaUrl(mediaUrl: string | null | undefined): string | undefined {
    if (!mediaUrl) return undefined;

    // If it's already a full URL, return as is
    if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
        return mediaUrl;
    }

    // Get the appropriate API URL for the current domain
    const apiBaseUrl = getApiUrl();
    return `${apiBaseUrl}${mediaUrl}`;
}

/**
 * Utility function to format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Utility function to format date in a readable format
 */
export function formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Utility function to format date and time
 */
export function formatDateTime(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Utility function to truncate text
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}

/**
 * Utility function to generate initials from name
 */
export function getInitials(firstName: string, lastName: string): string {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
}

/**
 * Utility function to debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Utility function to throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Utility function to check if CSRF token is properly set
 */
export function isCSRFTokenSet(): boolean {
    if (typeof window === 'undefined') return false;

    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];

    return !!token && token.length > 0;
}
