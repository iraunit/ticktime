"use client";

import { useAuth } from "@/hooks/use-auth";
import { useUserContext } from "@/components/providers/app-providers";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

interface GlobalRouteGuardProps {
  children: React.ReactNode;
}

export function GlobalRouteGuard({ children }: GlobalRouteGuardProps) {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const { user, isLoading: isUserLoading } = useUserContext();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Reset redirect flag when pathname changes
    hasRedirected.current = false;
  }, [pathname]);

  useEffect(() => {
    // Only proceed if we have user data and are not already redirecting
    if (!isAuthLoading && !isUserLoading && isAuthenticated() && user && !hasRedirected.current) {
      const isBrandRoute = pathname.startsWith('/brand');
      const isInfluencerRoute = pathname.startsWith('/dashboard') || 
                                pathname.startsWith('/deals') || 
                                pathname.startsWith('/messages') || 
                                pathname.startsWith('/analytics') || 
                                pathname.startsWith('/profile');

      // Skip redirect for auth pages
      const isAuthPage = pathname.startsWith('/accounts/login') || 
                        pathname.startsWith('/accounts/signup') || 
                        pathname.startsWith('/accounts/forgot-password') || 
                        pathname.startsWith('/accounts/reset-password') ||
                        pathname.startsWith('/accounts/verify-email');

      if (isAuthPage) {
        return;
      }

      // Redirect brand users away from influencer pages
      if (user.account_type === 'brand' && user.brand_profile && isInfluencerRoute) {
        hasRedirected.current = true;
        router.push('/brand');
        return;
      }

      // Redirect influencer users away from brand pages
      if (user.account_type === 'influencer' && user.influencer_profile && isBrandRoute) {
        hasRedirected.current = true;
        router.push('/dashboard');
        return;
      }

      // Handle root path redirect
      if (pathname === '/' || pathname === '') {
        if (user.account_type === 'brand' && user.brand_profile) {
          hasRedirected.current = true;
          router.push('/brand');
        } else if (user.account_type === 'influencer' && user.influencer_profile) {
          hasRedirected.current = true;
          router.push('/dashboard');
        }
        return;
      }
    }
  }, [isAuthLoading, isUserLoading, isAuthenticated, user, pathname, router]);

  return <>{children}</>;
} 