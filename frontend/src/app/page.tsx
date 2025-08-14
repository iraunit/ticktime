"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MainLayout } from "@/components/layout/main-layout";
import { CheckCircle, Users, TrendingUp, Shield, Star, ArrowRight } from "@/lib/icons";
import { useUserContext } from "@/components/providers/app-providers";
import { useEffect } from "react";

export default function Home() {
  const { user, isLoading, refresh } = useUserContext();

  // Ensure user context is properly loaded on home page
  useEffect(() => {
    if (!isLoading && !user) {
      refresh();
    }
  }, [isLoading, user, refresh]);

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
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
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
        <div className="container mx-auto px-4 pt-20 pb-12">
          <div className="text-center max-w-4xl mx-auto mb-12">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-gray-200 text-xs text-gray-600 mb-4 bg-gray-50">
              Built for modern influencer marketing ops
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
              Plan. Execute. <span className="text-red-600">Scale.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
              TickTime is your end‑to‑end workspace for collaborations—from discovery and deal flow to content approvals and performance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-lg px-8 py-3" asChild>
                <Link href="/signup">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-3" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
            <p className="text-sm text-gray-500">No setup fees • Cancel anytime • SOC2-inspired controls</p>
          </div>

          {/* Trusted by strip with Lineicons logos */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-8 items-center justify-items-center mb-16">
            {[
              { icon: 'lni-apple', label: 'Apple' },
              { icon: 'lni-aws', label: 'AWS' },
              { icon: 'lni-slack', label: 'Slack' },
              { icon: 'lni-dropbox', label: 'Dropbox' },
              { icon: 'lni-figma', label: 'Figma' },
              { icon: 'lni-spotify', label: 'Spotify' },
            ].map(({ icon, label }) => (
              <div key={icon} className="flex flex-col items-center gap-2 text-gray-500">
                <i className={`lni ${icon} text-3xl md:text-4xl`} aria-hidden="true" />
                <span className="text-xs md:text-sm">{label}</span>
              </div>
            ))}
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="lni lni-briefcase text-red-600 text-3xl" aria-hidden="true" />
                </div>
                <CardTitle className="text-red-600 text-xl">Smart Deal Management</CardTitle>
                <CardDescription className="text-gray-600">
                  Streamline your brand collaborations
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">
                  View, evaluate, and manage brand collaboration opportunities with our intuitive dashboard.
                </p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li className="flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Real-time deal notifications
                  </li>
                  <li className="flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Automated contract management
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="lni lni-cloud-upload text-red-600 text-3xl" aria-hidden="true" />
                </div>
                <CardTitle className="text-red-600 text-xl">Secure Content Hub</CardTitle>
                <CardDescription className="text-gray-600">
                  Upload and track content seamlessly
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">
                  Submit content, track approval status, and handle revisions with our secure platform.
                </p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li className="flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Drag & drop file uploads
                  </li>
                  <li className="flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Version control & feedback
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="lni lni-stats-up text-red-600 text-3xl" aria-hidden="true" />
                </div>
                <CardTitle className="text-red-600 text-xl">Growth Analytics</CardTitle>
                <CardDescription className="text-gray-600">
                  Track performance and maximize earnings
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">
                  Monitor collaboration history, earnings, and performance metrics to grow your influence.
                </p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li className="flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Detailed earnings reports
                  </li>
                  <li className="flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Performance insights
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Social Proof */}
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Trusted by Creators Worldwide</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-red-600 mb-2">10K+</div>
                <p className="text-gray-600">Active Influencers</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-red-600 mb-2">500+</div>
                <p className="text-gray-600">Partner Brands</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-red-600 mb-2">$2M+</div>
                <p className="text-gray-600">Creator Earnings</p>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-4xl mx-auto mb-20">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-xl text-gray-700 mb-6 italic">
                "TickTime transformed how I manage my brand partnerships. The platform is intuitive, 
                secure, and has helped me increase my earnings by 300% in just 6 months!"
              </blockquote>
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  SK
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Sarah Kim</p>
                  <p className="text-gray-600 text-sm">Fashion & Lifestyle Influencer</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl p-12 text-white">
            <h2 className="text-4xl font-bold mb-4">Ready to Elevate Your Influence?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join the platform that puts creators first. Start managing your brand partnerships like a pro.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100 text-lg px-8 py-3" asChild>
                <Link href="/signup">
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-red-600 text-lg px-8 py-3" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
