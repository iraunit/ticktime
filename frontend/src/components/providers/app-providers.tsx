"use client";

import React, { useEffect, useMemo, useState, createContext, useContext, useCallback } from "react";
import { QueryProvider } from "@/components/providers/query-provider";
import { ErrorProvider } from "@/contexts/error-context";
import { LoadingProvider } from "@/contexts/loading-context";
import { authApi } from "@/lib/api-client";

export type CurrentUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  account_type: 'influencer' | 'brand' | 'user';
  influencer_profile?: {
    username?: string;
    industry?: string;
    phone_number?: string;
    bio?: string;
    is_verified?: boolean;
    total_followers?: number;
    average_engagement_rate?: number;
    profile_image?: string;
  } | null;
  brand_profile?: {
    brand_id: number;
    brand_name: string;
    role: string;
    can_create_campaigns: boolean;
    can_manage_users: boolean;
    can_approve_content: boolean;
    can_view_analytics: boolean;
  } | null;
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

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [hasFetched, setHasFetched] = useState<boolean>(false);

  const fetchUser = useCallback(async () => {
    if (hasFetched) return; // Prevent multiple calls
    
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
    if (!hasFetched) {
      // Prime CSRF cookie for session-authenticated requests (noop if already set)
      authApi.csrf().catch(() => {});
      // Fetch current user once on app mount
      fetchUser();
    }
  }, [fetchUser, hasFetched]);

  // In development, proactively unregister any existing service workers and clear caches
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => registration.unregister());
        }).catch(() => {});
      }
      if (typeof window !== "undefined" && "caches" in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => caches.delete(key));
        }).catch(() => {});
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
        </UserContext.Provider>
      </LoadingProvider>
    </ErrorProvider>
  );
} 