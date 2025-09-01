"use client";

import { useAuth } from "@/hooks/use-auth";
import { useUserContext } from "@/components/providers/app-providers";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GlobalLoader } from "@/components/ui/global-loader";

interface RequireBrandAuthProps {
  children: React.ReactNode;
}

export function RequireBrandAuth({ children }: RequireBrandAuthProps) {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const { user, isLoading: isUserLoading } = useUserContext();
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !isUserLoading && !hasChecked) {
      setHasChecked(true);
      
      // If not authenticated, redirect to login
      if (!isAuthenticated() || !user) {
        router.replace('/login');
        return;
      }
      
      // If user is not a brand user, redirect to their appropriate dashboard
      if (user.account_type !== 'brand' || !user.brand_profile) {
        if (user.account_type === 'influencer') {
          router.replace('/influencer/dashboard');
        } else {
          router.replace('/login?error=Brand access required');
        }
        return;
      }
    }
  }, [isAuthenticated, isAuthLoading, isUserLoading, user, router, hasChecked]);

  // Show loading while checking authentication or if we've determined a redirect is needed
  if (isAuthLoading || isUserLoading || !hasChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlobalLoader />
      </div>
    );
  }

  // Only render children if user is authenticated and is a brand user
  if (!isAuthenticated() || !user || user.account_type !== 'brand' || !user.brand_profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlobalLoader />
      </div>
    );
  }

  return <>{children}</>;
} 