"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
      router.replace('/brand');
      return;
    }

    // Immediate redirect for influencer users on brand pages
    if (user.account_type === 'influencer' && user.influencer_profile && isBrandRoute) {
      router.replace('/dashboard');
      return;
    }

    // Handle root path redirect
    if (pathname === '/' || pathname === '') {
      if (user.account_type === 'brand' && user.brand_profile) {
        router.replace('/brand');
      } else if (user.account_type === 'influencer' && user.influencer_profile) {
        router.replace('/dashboard');
      }
    }
  }, [user, pathname, router]);

  return null;
} 