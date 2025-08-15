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
          <div className="flex justify-center space-x-3">
            {[
              { color: 'from-red-500 to-pink-500', delay: 0 },
              { color: 'from-orange-500 to-red-500', delay: 0.15 },
              { color: 'from-pink-500 to-purple-500', delay: 0.3 }
            ].map((ball, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full bg-gradient-to-r shadow-lg ${ball.color}`}
                style={{
                  animation: `bigBounce 1.2s ease-in-out ${ball.delay}s infinite`,
                }}
              />
            ))}
          </div>
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
          <div className="flex justify-center space-x-3">
            {[
              { color: 'from-red-500 to-pink-500', delay: 0 },
              { color: 'from-orange-500 to-red-500', delay: 0.15 },
              { color: 'from-pink-500 to-purple-500', delay: 0.3 }
            ].map((ball, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full bg-gradient-to-r shadow-lg ${ball.color}`}
                style={{
                  animation: `bigBounce 1.2s ease-in-out ${ball.delay}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      }>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <Suspense fallback={
            <div className="flex justify-center space-x-3">
              {[
                { color: 'from-red-500 to-pink-500', delay: 0 },
                { color: 'from-orange-500 to-red-500', delay: 0.15 },
                { color: 'from-pink-500 to-purple-500', delay: 0.3 }
              ].map((ball, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full bg-gradient-to-r shadow-lg ${ball.color}`}
                  style={{
                    animation: `bigBounce 1.2s ease-in-out ${ball.delay}s infinite`,
                  }}
                />
              ))}
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>
      </ClientOnly>
    </MainLayout>
  );
}