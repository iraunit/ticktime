"use client";

import {useRouter} from 'next/navigation';
import {CurrentUser} from '@/components/providers/app-providers';

/**
 * Gets the appropriate dashboard route based on user type
 */
export function getDashboardRoute(user: CurrentUser): string {
    if (!user) {
        return '/accounts/login';
    }

    switch (user.account_type) {
        case 'brand':
            return '/brand/dashboard';
        case 'influencer':
            return '/influencer/dashboard';
        case 'user':
            // Fallback for generic users - redirect to influencer dashboard
            return '/influencer/dashboard';
        default:
            // Default fallback
            return '/influencer/dashboard';
    }
}

/**
 * Hook for redirecting authenticated users to appropriate dashboard
 */
export function useAuthRedirect() {
    const router = useRouter();

    const redirectToDashboard = (user: CurrentUser) => {
        if (!user) return;

        const route = getDashboardRoute(user);
        router.push(route);
    };

    const redirectWithReplace = (user: CurrentUser) => {
        if (!user) return;

        const route = getDashboardRoute(user);
        router.replace(route);
    };

    return {
        redirectToDashboard,
        redirectWithReplace,
        getDashboardRoute,
    };
}

/**
 * Utility function to redirect based on user type using window.location
 * Use this when Next.js router is not available or for immediate redirects
 */
export function redirectToUserDashboard(user: CurrentUser) {
    if (!user) {
        window.location.href = '/accounts/login';
        return;
    }

    window.location.href = getDashboardRoute(user);
}
