"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { LoginForm } from "@/components/auth/login-form";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ClientOnly } from "@/components/providers/client-only";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthLoading, isAuthenticatedState } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && isAuthenticatedState) {
      router.replace('/dashboard');
    }
  }, [isAuthLoading, isAuthenticatedState, router]);

  return (
    <MainLayout showFooter={false}>
      <ClientOnly fallback={
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      }>
        {isAuthLoading ? (
          <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          </div>
        ) : isAuthenticatedState ? null : (
          <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-red-600" />}>
              <LoginForm />
            </Suspense>
          </div>
        )}
      </ClientOnly>
    </MainLayout>
  );
}