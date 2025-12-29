"use client";

import {useEffect} from "react";
import {useUserContext} from "@/components/providers/app-providers";
import {useAuthRedirect} from "@/lib/redirect-utils";
import {GlobalLoader} from "@/components/ui/global-loader";

export function HomeAuthHandler({children}: { children: React.ReactNode }) {
    const {user, isLoading} = useUserContext();
    const {redirectToDashboard} = useAuthRedirect();

    // Redirect authenticated users to appropriate dashboard based on user type
    useEffect(() => {
        if (!isLoading && user) {
            redirectToDashboard(user);
        }
    }, [isLoading, user, redirectToDashboard]);

    // Show loading while checking authentication
    if (isLoading) {
        return <GlobalLoader/>;
    }

    // Don't render landing page if user is authenticated (will redirect)
    if (user) {
        return null;
    }

    return <>{children}</>;
}

