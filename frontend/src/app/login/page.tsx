"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { LoginForm } from "@/components/auth/login-form";
import { Loader2 } from "@/lib/icons";
import { ClientOnly } from "@/components/providers/client-only";
import { useUserContext } from "@/components/providers/app-providers";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading } = useUserContext();

  // Redirect authenticated users immediately
  useEffect(() => {
    if (!isLoading && user) {
      const url = new URL(window.location.href);
      const next = url.searchParams.get('next');
      const safeNext = next && next.startsWith('/') ? next : '/dashboard';
      router.replace(safeNext);
    }
  }, [user, isLoading, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <MainLayout showFooter={false}>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      </MainLayout>
    );
  }

  // Don't render anything if user is already authenticated (will redirect)
  if (user) {
    return null;
  }

  return (
    <MainLayout showFooter={false}>
      <ClientOnly fallback={
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      }>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-red-600" />}>
            <LoginForm />
          </Suspense>
        </div>
      </ClientOnly>
    </MainLayout>
  );
}