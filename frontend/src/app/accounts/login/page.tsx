"use client";

import {Suspense, useEffect, useRef} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {MainLayout} from "@/components/layout/main-layout";
import {LoginForm} from "@/components/auth/login-form";
import {GlobalLoader} from "@/components/ui/global-loader";
import {useAuth} from "@/hooks/use-auth";
import {useUserContext} from "@/components/providers/app-providers";
import {getDashboardRoute} from "@/lib/redirect-utils";

function LoginPageContent() {
    const searchParams = useSearchParams();
    const {oneTapLogin, isAuthenticatedState} = useAuth();
    const {user, isLoading} = useUserContext();
    const router = useRouter();
    const token = searchParams.get('token');
    const next = searchParams.get('next');
    const hasProcessedToken = useRef(false);

    // If already authenticated, redirect away from login
    useEffect(() => {
        if (!isLoading && user) {
            if (next && next.startsWith('/')) {
                router.replace(next);
            } else {
                router.replace(getDashboardRoute(user));
            }
        }
    }, [isLoading, router, user, next]);

    useEffect(() => {
        // Only process token once, and only if we have a token and are not authenticated
        if (
            token &&
            !hasProcessedToken.current &&
            !isAuthenticatedState &&
            !oneTapLogin.isPending &&
            !oneTapLogin.isSuccess &&
            !oneTapLogin.isError
        ) {
            hasProcessedToken.current = true;

            // Remove token from URL immediately to prevent re-processing
            if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                url.searchParams.delete('token');
                window.history.replaceState({}, '', url.toString());
            }

            // Call the mutation
            oneTapLogin.mutate(token);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, isAuthenticatedState]);

    // Show loader while processing one-tap login
    if (hasProcessedToken.current && (oneTapLogin.isPending || (oneTapLogin.isSuccess && !isAuthenticatedState))) {
        return (
            <div
                className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <GlobalLoader/>
                    <p className="mt-4 text-gray-600">Logging you in...</p>
                </div>
            </div>
        );
    }

    return <LoginForm/>;
}

export default function LoginPage() {
    return (
        <MainLayout>
            <Suspense fallback={
                <div
                    className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
                    <GlobalLoader/>
                </div>
            }>
                <LoginPageContent/>
            </Suspense>
        </MainLayout>
    );
}