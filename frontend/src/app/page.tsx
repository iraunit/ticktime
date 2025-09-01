"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MainLayout } from "@/components/layout/main-layout";
import { useUserContext } from "@/components/providers/app-providers";
import { useEffect } from "react";
import { GlobalLoader } from "@/components/ui/global-loader";

export default function Home() {
  const { user, isLoading, refresh } = useUserContext();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      window.location.href = '/dashboard';
    }
  }, [isLoading, user]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <MainLayout>
        <GlobalLoader />
      </MainLayout>
    );
  }

  // Don't render landing page if user is authenticated (will redirect)
  if (user) {
    return null;
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-red-50 via-white to-orange-50 pt-16 pb-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="mb-8">
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                  ✨ Join thousands of creators
                </span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Connect with brands,
                <br />
                <span className="text-red-600">grow your influence</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                The easiest way for content creators to find brand partnerships, manage collaborations, and track their success. Completely free to use.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                  <Link href="/accounts/signup">
                    Get Started Free →
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300" asChild>
                  <Link href="/accounts/login">
                    Sign In
                  </Link>
                </Button>
              </div>
              
              {/* Social Proof */}
              <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    <div className="w-6 h-6 bg-red-400 rounded-full border-2 border-white"></div>
                    <div className="w-6 h-6 bg-orange-400 rounded-full border-2 border-white"></div>
                    <div className="w-6 h-6 bg-yellow-400 rounded-full border-2 border-white"></div>
                  </div>
                  <span>1,200+ active creators</span>
                </div>
                <div>⭐ 4.8/5 creator satisfaction</div>
                <div>🏆 Featured on ProductHunt</div>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Preview */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Everything you need in one place
                </h2>
                <p className="text-xl text-gray-600">
                  Manage your brand partnerships with a clean, intuitive dashboard
                </p>
              </div>
              
              {/* Dashboard Mock */}
              <div className="bg-white rounded-lg shadow-xl p-6 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Creator Dashboard</h3>
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Active
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">$1,240</div>
                    <div className="text-sm text-gray-600">This month</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">8</div>
                    <div className="text-sm text-gray-600">Active deals</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">94%</div>
                    <div className="text-sm text-gray-600">Completion rate</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold">
                      N
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Nike Campaign</div>
                      <div className="text-sm text-gray-600">Due in 3 days</div>
                    </div>
                    <div className="text-green-600 font-semibold">$450</div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                      A
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Adobe Partnership</div>
                      <div className="text-sm text-gray-600">In review</div>
                    </div>
                    <div className="text-green-600 font-semibold">$800</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-gray-900 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-12">
                Trusted by creators worldwide
              </h2>
              
              <div className="grid md:grid-cols-4 gap-8">
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-red-400 mb-2">
                    1,200+
                  </div>
                  <div className="text-gray-400">Active Creators</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-orange-400 mb-2">
                    850+
                  </div>
                  <div className="text-gray-400">Completed Deals</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">
                    $2.1M+
                  </div>
                  <div className="text-gray-400">Creator Earnings</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">
                    120+
                  </div>
                  <div className="text-gray-400">Partner Brands</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Why creators choose TickTime
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Simple tools that help you focus on what you do best - creating amazing content
                </p>
              </div>
              
              <div className="grid lg:grid-cols-3 gap-8">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                      <span className="text-2xl">🎯</span>
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Find Perfect Matches
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Get matched with brands that align with your content and audience. No more endless searching.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Smart brand matching
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Audience insights
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Personalized recommendations
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <span className="text-2xl">📊</span>
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Track Your Success
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Monitor your earnings, campaign performance, and growth with clear analytics.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Earnings dashboard
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Performance metrics
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Growth insights
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                      <span className="text-2xl">🚀</span>
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Completely Free
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      No hidden fees, no subscriptions. We only succeed when you do.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Free forever
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        No setup costs
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Keep 100% of earnings
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="mb-6">
                <span className="text-yellow-400 text-2xl">⭐⭐⭐⭐⭐</span>
              </div>
              
              <blockquote className="text-xl md:text-2xl font-medium text-gray-900 mb-8 leading-relaxed">
                "TickTime made it so much easier to manage my brand partnerships. I went from struggling to find collaborations to having a steady stream of opportunities."
              </blockquote>
              
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  MJ
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Maya Johnson</p>
                  <p className="text-gray-600">Lifestyle Creator, 45K followers</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-red-600 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to grow your influence?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Join our community of creators who are turning their passion into profit
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100 text-lg px-8 py-4 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                  <Link href="/accounts/signup">
                    Start Creating Today →
                  </Link>
                </Button>
                <Button size="lg" variant="ghost" className="border-2 border-white text-white hover:bg-white hover:text-red-600 text-lg px-8 py-4 font-semibold rounded-lg transition-all duration-300" asChild>
                  <Link href="/accounts/login">Already have an account?</Link>
                </Button>
              </div>
              
              <div className="flex flex-wrap justify-center gap-6 text-sm opacity-90">
                <div className="flex items-center gap-2">
                  <span className="text-green-300">✓</span>
                  100% Free to use
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-300">✓</span>
                  No contracts or commitments
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-300">✓</span>
                  Start earning immediately
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
