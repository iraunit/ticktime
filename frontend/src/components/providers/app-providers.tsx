"use client";

import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from "react";
import {QueryProvider} from "@/components/providers/query-provider";
import {ErrorProvider} from "@/contexts/error-context";
import {LoadingProvider} from "@/contexts/loading-context";
import {authApi} from "@/lib/api-client";
import {Toaster} from 'sonner';

export type CurrentUser = {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    date_joined: string;
    last_login: string;
    is_active: boolean;
    has_influencer_profile: boolean;
    has_brand_profile: boolean;
    account_type: 'influencer' | 'brand' | 'user';
    brand_profile?: {
        brand_id: number;
        brand_name: string;
        role: string;
        can_create_campaigns: boolean;
        can_manage_users: boolean;
        can_approve_content: boolean;
        can_view_analytics: boolean;
    } | null;
    influencer_profile?: {
        username: string;
        full_name: string;
        bio: string;
        is_verified: boolean;
    } | null;
    profile_image: string;
    phone_number: string;
    country_code: string;
    phone_verified: boolean;
    email_verified: boolean;
    gender: string | null;
    country: string;
    state: string;
    city: string;
    zipcode: string;
    address_line1: string;
    address_line2: string;
} | null;

interface UserContextValue {
    user: CurrentUser;
    isLoading: boolean;
    refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function useUserContext(): UserContextValue {
    const ctx = useContext(UserContext);
    if (!ctx) {
        throw new Error("useUserContext must be used within AppProviders");
    }
    return ctx;
}

export function AppProviders({children}: { children: React.ReactNode }) {
    const [user, setUser] = useState<CurrentUser>(null);
    // Start with false to allow immediate rendering - fetch in background
    const [loadingUser, setLoadingUser] = useState<boolean>(false);
    const [hasFetched, setHasFetched] = useState<boolean>(false);

    const fetchUser = useCallback(async () => {
        if (hasFetched) return; // Prevent multiple calls

        // Only show loading if we have a session cookie (likely authenticated)
        const hasSession = typeof document !== 'undefined' && 
            document.cookie.split(';').some(c => c.trim().startsWith('sessionid='));
        
        if (hasSession) {
            setLoadingUser(true);
        }
        
        try {
            const res = await authApi.checkAuth();
            setUser(res.data?.user ?? null);
        } catch {
            setUser(null);
        } finally {
            setLoadingUser(false);
            setHasFetched(true);
        }
    }, [hasFetched]);

    const refreshUser = useCallback(async () => {
        setHasFetched(false);
        setLoadingUser(true);
        try {
            const res = await authApi.checkAuth();
            setUser(res.data?.user ?? null);
        } catch {
            setUser(null);
        } finally {
            setLoadingUser(false);
            setHasFetched(true);
        }
    }, []);

    useEffect(() => {
        if (!hasFetched && typeof window !== 'undefined') {
            // Only run on client side to prevent hydration mismatches
            // Prime CSRF cookie for session-authenticated requests (noop if already set)
            authApi.csrf().catch(() => {
            });
            
            // Check if user has session cookie first - if not, skip API call entirely
            const hasSession = document.cookie.split(';').some(c => c.trim().startsWith('sessionid='));
            
            if (!hasSession) {
                // No session cookie, user is definitely not authenticated
                setUser(null);
                setLoadingUser(false);
                setHasFetched(true);
                return;
            }
            
            // Fetch current user in background without blocking render
            // Use requestIdleCallback for better performance, fallback to setTimeout
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                    fetchUser();
                }, { timeout: 1000 });
            } else {
                // Use setTimeout with small delay to not block initial render
                setTimeout(() => {
                    fetchUser();
                }, 100);
            }
        }
    }, [fetchUser, hasFetched]);

    // In development, proactively unregister any existing service workers to prevent chunk loading issues
    useEffect(() => {
        if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
            // Only run on client side to prevent hydration mismatches
            if ("serviceWorker" in navigator) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                    registrations.forEach((registration) => registration.unregister());
                }).catch(() => {
                });
            }
            if ("caches" in window) {
                caches.keys().then((keys) => {
                    keys.forEach((key) => caches.delete(key));
                }).catch(() => {
                });
            }
        }
    }, []);

    const userValue = useMemo<UserContextValue>(() => ({
        user,
        isLoading: loadingUser,
        refresh: refreshUser,
    }), [user, loadingUser, refreshUser]);

    return (
        <ErrorProvider>
            <LoadingProvider>
                <UserContext.Provider value={userValue}>
                    <QueryProvider>{children}</QueryProvider>
                    <Toaster
                        position="top-right"
                        expand={true}
                        richColors={true}
                        closeButton={true}
                        duration={4000}
                        theme="light"
                        className="!bg-gradient-to-br !from-white !to-gray-50 !border !border-gray-200 !rounded-xl !shadow-lg"
                        toastOptions={{
                            style: {
                                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                border: '1px solid #f1f5f9',
                                color: '#1e293b',
                                borderRadius: '12px',
                                fontSize: '14px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                backdropFilter: 'blur(10px)',
                            },
                        }}
                    />
                </UserContext.Provider>
            </LoadingProvider>
        </ErrorProvider>
    );
} 