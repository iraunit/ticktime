"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getDashboardRoute } from "@/lib/redirect-utils";

interface QuickRedirectProps {
  user: any;
  pathname: string;
}

export function QuickRedirect({ user, pathname }: QuickRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

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

    // Immediate redirect for brand users on influencer pages
    if (user.account_type === 'brand' && user.brand_profile && isInfluencerRoute) {
      const dashboardRoute = getDashboardRoute(user);
      router.replace(dashboardRoute);
      return;
    }

    // Immediate redirect for influencer users on brand pages
    if (user.account_type === 'influencer' && user.influencer_profile && isBrandRoute) {
      const dashboardRoute = getDashboardRoute(user);
      router.replace(dashboardRoute);
      return;
    }

    // Handle root path redirect
    if (pathname === '/' || pathname === '') {
      const dashboardRoute = getDashboardRoute(user);
      router.replace(dashboardRoute);
    }
  }, [user, pathname, router]);

  return null;
} 