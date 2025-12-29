"use client";

import { Suspense, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { BrandSignupForm } from "@/components/auth/brand-signup-form";
import { GlobalLoader } from "@/components/ui/global-loader";
import { useAuth } from "@/hooks/use-auth";
import { useAuthRedirect } from "@/lib/redirect-utils";
import { useUserContext } from "@/components/providers/app-providers";

function BrandSignupContent() {
  const { isAuthLoading, isAuthenticatedState } = useAuth();
  const { user, isLoading: isUserLoading } = useUserContext();
  const { redirectToDashboard } = useAuthRedirect();
  
  // Check for session cookie synchronously during render (no useEffect delay)
  const hasSessionCookie = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return document.cookie.split(';').some(c => c.trim().startsWith('sessionid='));
  }, []);

  // Redirect authenticated users to appropriate dashboard
  useEffect(() => {
    if (!isAuthLoading && !isUserLoading && isAuthenticatedState && user) {
      redirectToDashboard(user);
    }
  }, [isAuthLoading, isUserLoading, isAuthenticatedState, user, redirectToDashboard]);

  // If we have a session cookie and are still loading user data, show loader
  if (hasSessionCookie && (isAuthLoading || isUserLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <GlobalLoader />
      </div>
    );
  }

  // Don't render the signup form if user is already authenticated (will redirect)
  if (isAuthenticatedState && user && !isAuthLoading && !isUserLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <GlobalLoader />
      </div>
    );
  }

  return <BrandSignupForm />;
}

export default function BrandSignupPage() {
  return (
    <MainLayout>
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
          <GlobalLoader />
        </div>
      }>
        <BrandSignupContent />
      </Suspense>
    </MainLayout>
  );
} 