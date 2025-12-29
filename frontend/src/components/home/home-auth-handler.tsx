"use client";

import {useEffect, useMemo} from "react";
import {useUserContext} from "@/components/providers/app-providers";
import {useAuthRedirect} from "@/lib/redirect-utils";
import {GlobalLoader} from "@/components/ui/global-loader";

export function HomeAuthHandler({children}: { children: React.ReactNode }) {
    const {user, isLoading} = useUserContext();
    const {redirectToDashboard} = useAuthRedirect();
    
    // Check for session cookie synchronously during render (no useEffect delay)
    const hasSessionCookie = useMemo(() => {
        if (typeof window === 'undefined') return false;
        return document.cookie.split(';').some(c => c.trim().startsWith('sessionid='));
    }, []);

    // Redirect authenticated users to appropriate dashboard
    useEffect(() => {
        if (!isLoading && user) {
            redirectToDashboard(user);
        }
    }, [isLoading, user, redirectToDashboard]);

    // If we have a session cookie and are still loading user data, show loader
    if (hasSessionCookie && isLoading) {
        return <GlobalLoader/>;
    }

    // If user is authenticated (not loading and user exists), show loader while redirecting
    if (user && !isLoading) {
        return <GlobalLoader/>;
    }

    // Show landing page immediately for unauthenticated users
    // No session cookie = definitely not authenticated, render immediately
    // Session cookie but no user = auth check failed or not authenticated, render anyway
    return <>{children}</>;
}

