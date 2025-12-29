"use client";

import {useEffect, useMemo} from "react";
import Link from "next/link";
import {MainLayout} from "@/components/layout/main-layout";
import {Card, CardContent} from "@/components/ui/card";
import {Building2, Camera, HiHandRaised} from "@/lib/icons";
import {useAuth} from "@/hooks/use-auth";
import {GlobalLoader} from "@/components/ui/global-loader";
import {useAuthRedirect} from "@/lib/redirect-utils";
import {useUserContext} from "@/components/providers/app-providers";

export default function SignupPage() {
    const {isAuthLoading, isAuthenticatedState} = useAuth();
    const {user, isLoading: isUserLoading} = useUserContext();
    const {redirectToDashboard} = useAuthRedirect();
    
    // Check for session cookie synchronously during render (no useEffect delay)
    const hasSessionCookie = useMemo(() => {
        if (typeof window === 'undefined') return false;
        return document.cookie.split(';').some(c => c.trim().startsWith('sessionid='));
    }, []);

    // Redirect authenticated users to appropriate dashboard based on user type
    useEffect(() => {
        if (!isAuthLoading && !isUserLoading && isAuthenticatedState && user) {
            redirectToDashboard(user);
        }
    }, [isAuthLoading, isUserLoading, isAuthenticatedState, user, redirectToDashboard]);

    // If we have a session cookie and are still loading user data, show loader
    if (hasSessionCookie && (isAuthLoading || isUserLoading)) {
        return (
            <MainLayout>
                <div
                    className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
                    <GlobalLoader/>
                </div>
            </MainLayout>
        );
    }

    // Don't render the signup form if user is already authenticated (will redirect)
    if (isAuthenticatedState && user && !isAuthLoading && !isUserLoading) {
        return (
            <MainLayout>
                <div
                    className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
                    <GlobalLoader/>
                </div>
            </MainLayout>
        );
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
                                <div
                                    className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-indigo-500/5 rounded-xl -m-2"></div>

                                <div className="relative text-center p-4">
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-2 flex items-center justify-center gap-2">
                                        Join TickTime
                                        <div
                                            className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                                            <HiHandRaised className="w-4 h-4 text-white"/>
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
                                <Link href="/accounts/signup/brand">
                                    <Card
                                        className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200 hover:scale-[1.02] cursor-pointer group">
                                        <CardContent className="p-6">
                                            <div className="flex items-center space-x-4">
                                                <div
                                                    className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                                                    <Building2 className="w-6 h-6 text-white"/>
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">I'm a
                                                        Brand</h3>
                                                    <p className="text-sm text-gray-600">Connect with influencers to
                                                        promote your products</p>
                                                </div>
                                                <div
                                                    className="text-blue-600 group-hover:translate-x-1 transition-transform">→
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>

                                {/* Influencer Account */}
                                <Link href="/accounts/signup/influencer">
                                    <Card
                                        className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200 hover:scale-[1.02] cursor-pointer group">
                                        <CardContent className="p-6">
                                            <div className="flex items-center space-x-4">
                                                <div
                                                    className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                                                    <Camera className="w-6 h-6 text-white"/>
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">I'm a
                                                        Creator</h3>
                                                    <p className="text-sm text-gray-600">Monetize your content through
                                                        brand partnerships</p>
                                                </div>
                                                <div
                                                    className="text-purple-600 group-hover:translate-x-1 transition-transform">→
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </div>

                            {/* Sign In Link */}
                            <div className="text-center mt-8 p-4">
                                <p className="text-sm text-gray-600">
                                    Already have an account?{" "}
                                    <Link href="/accounts/login"
                                          className="font-medium text-blue-600 hover:text-blue-700">
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