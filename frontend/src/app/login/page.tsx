"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { LoginForm } from "@/components/auth/login-form";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthLoading, isAuthenticatedState } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isAuthLoading && isAuthenticatedState) {
      router.push('/dashboard');
    }
  }, [isAuthLoading, isAuthenticatedState, router]);

  // Show loading while checking authentication
  if (isAuthLoading) {
    return (
      <MainLayout showFooter={false}>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          </div>
        </div>
      </MainLayout>
    );
  }

  // Don't render the login form if user is already authenticated
  if (isAuthenticatedState) {
    return null;
  }

  return (
    <MainLayout showFooter={false}>
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </MainLayout>
  );
}