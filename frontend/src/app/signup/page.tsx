"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function SignupPage() {
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

  // Don't render the signup form if user is already authenticated
  if (isAuthenticatedState) {
    return null;
  }

  return (
    <MainLayout showFooter={false}>
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription>Choose your account type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Link href="/signup/influencer">
                <Button className="w-full">I'm an Influencer</Button>
              </Link>
              <Link href="/signup/brand">
                <Button variant="outline" className="w-full">I'm a Brand</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}