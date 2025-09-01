"use client";

import { useAuth } from "@/hooks/use-auth";
import { useUserContext } from "@/components/providers/app-providers";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GlobalLoader } from "@/components/ui/global-loader";

interface RequireInfluencerAuthProps {
  children: React.ReactNode;
}

export function RequireInfluencerAuth({ children }: RequireInfluencerAuthProps) {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const { user, isLoading: isUserLoading } = useUserContext();
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !isUserLoading && !hasChecked) {
      setHasChecked(true);
      
      // If not authenticated, redirect to login
      if (!isAuthenticated() || !user) {
        router.replace('/accounts/login');
        return;
      }
      
      // If user is not an influencer, redirect to their appropriate dashboard
      if (user.account_type !== 'influencer' || !user.influencer_profile) {
        if (user.account_type === 'brand') {
          router.replace('/brand');
        } else {
          router.replace('/login?error=Influencer access required');
        }
        return;
      }
    }
  }, [isAuthenticated, isAuthLoading, isUserLoading, user, router, hasChecked]);

  // Show loading while checking authentication or if we've determined a redirect is needed
  if (isAuthLoading || isUserLoading || !hasChecked) {
    return <GlobalLoader />;
  }

  // Only render children if user is authenticated and is an influencer
  if (!isAuthenticated() || !user || user.account_type !== 'influencer' || !user.influencer_profile) {
    return <GlobalLoader />;
  }

  return <>{children}</>;
} 