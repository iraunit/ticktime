"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { LoginForm } from "@/components/auth/login-form";
import { Loader2 } from "@/lib/icons";
import { ClientOnly } from "@/components/providers/client-only";
import { useUserContext } from "@/components/providers/app-providers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading } = useUserContext();

  const goNext = () => {
    const url = new URL(window.location.href);
    const next = url.searchParams.get('next');
    const safeNext = next && next.startsWith('/') ? next : '/dashboard';
    router.replace(safeNext);
  };

  return (
    <MainLayout showFooter={false}>
      <ClientOnly fallback={
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      }>
        {isLoading ? (
          <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          </div>
        ) : user ? (
          <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md mx-auto">
              <CardHeader>
                <CardTitle>You're already signed in</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" onClick={goNext}>Continue</Button>
              </CardContent>
            </Card>
          </div>
        ) : (
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