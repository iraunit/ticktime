"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Building2, Camera, HiHandRaised } from "@/lib/icons";
import { useAuth } from "@/hooks/use-auth";
import { Loader } from "@/components/ui/loader";

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
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
        </div>
      </MainLayout>
    );
  }

  // Don't render the signup form if user is already authenticated
  if (isAuthenticatedState) {
    return null;
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center">
            <div className="w-full max-w-md">
              
              {/* Header */}
              <div className="relative mb-8">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-indigo-500/5 rounded-xl -m-2"></div>
                
                <div className="relative text-center p-4">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-2 flex items-center justify-center gap-2">
                    Join TickTime
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                      <HiHandRaised className="w-4 h-4 text-white" />
                    </div>
                  </h1>
                  <p className="text-gray-600">
                    Choose your account type to get started
                  </p>
                </div>
              </div>

              {/* Account Type Cards */}
              <div className="space-y-4">
                {/* Brand Account */}
                <Link href="/signup/brand">
                  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200 hover:scale-[1.02] cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">I'm a Brand</h3>
                          <p className="text-sm text-gray-600">Connect with influencers to promote your products</p>
                        </div>
                        <div className="text-blue-600 group-hover:translate-x-1 transition-transform">→</div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                {/* Influencer Account */}
                <Link href="/signup/influencer">
                  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200 hover:scale-[1.02] cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">I'm a Creator</h3>
                          <p className="text-sm text-gray-600">Monetize your content through brand partnerships</p>
                        </div>
                        <div className="text-purple-600 group-hover:translate-x-1 transition-transform">→</div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Sign In Link */}
              <div className="text-center mt-8 p-4">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}