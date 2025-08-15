"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MainLayout } from "@/components/layout/main-layout";
import { CheckCircle, Users, TrendingUp, Shield, Star, ArrowRight, Play, Zap, Award, BarChart3, MessageSquare, Camera, DollarSign, Clock, Globe } from "@/lib/icons";
import { useUserContext } from "@/components/providers/app-providers";
import { useEffect } from "react";

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
      <div className="min-h-screen bg-white overflow-hidden">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-indigo-50 via-white to-cyan-50 pt-20 pb-20">
          <div className="absolute inset-0 opacity-40">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='36' cy='6' r='6'/%3E%3Ccircle cx='48' cy='30' r='6'/%3E%3Ccircle cx='6' cy='36' r='6'/%3E%3Ccircle cx='24' cy='54' r='6'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Left Column - Content */}
                <div className="space-y-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-sm font-medium">
                    <Zap className="h-4 w-4" />
                    Start your influencer campaign today
                  </div>
                  
                  <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                    <span className="text-gray-900">Turn your influence into</span>
                    <br />
                    <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
                      profitable partnerships
                    </span>
                  </h1>
                  
                  <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                    Connect with premium brands, manage campaigns seamlessly, and track your earnings—all in one powerful platform designed for serious creators.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                      <Link href="/signup">
                        Get Started Free
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300" asChild>
                      <Link href="#demo">
                        <Play className="mr-2 h-5 w-5" />
                        Watch Demo
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-8 pt-4">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 border-2 border-white"></div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-red-500 border-2 border-white"></div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 border-2 border-white"></div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                          +7K
                        </div>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">Creators already earning</span>
                    </div>
                  </div>
                </div>
                
                {/* Right Column - Visual */}
                <div className="relative">
                  <div className="relative bg-white rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Campaign Dashboard</h3>
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Active
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">$2,847</div>
                          <div className="text-sm text-gray-600">This month</div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">12</div>
                          <div className="text-sm text-gray-600">Active deals</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">98%</div>
                          <div className="text-sm text-gray-600">Completion</div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-lg flex items-center justify-center">
                            <Camera className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">Nike Air Campaign</div>
                            <div className="text-sm text-gray-600">Due tomorrow</div>
                          </div>
                          <div className="text-green-600 font-semibold">$850</div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">Samsung Collab</div>
                            <div className="text-sm text-gray-600">In review</div>
                          </div>
                          <div className="text-green-600 font-semibold">$1,200</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating elements */}
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg animate-bounce">
                    $2M+
                  </div>
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white shadow-lg">
                    <TrendingUp className="h-8 w-8" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-gray-900 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Manage influencer campaigns at scale with <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">speed & seamlessness</span>
                </h2>
              </div>
              
              <div className="grid md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                    7 Million+
                  </div>
                  <div className="text-gray-400">Creators</div>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                    50,000+
                  </div>
                  <div className="text-gray-400">Campaigns</div>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                    2 Billion+
                  </div>
                  <div className="text-gray-400">Reach</div>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2">
                    500+
                  </div>
                  <div className="text-gray-400">Brands</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                  7 Million+ Creators
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Discover & access relevant creators spanning the largest creator categories.
                </p>
              </div>
              
              {/* Creator Avatars Grid */}
              <div className="mb-16">
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  {[
                    { bg: 'from-pink-400 to-purple-500', initial: 'SM' },
                    { bg: 'from-blue-400 to-cyan-500', initial: 'JD' },
                    { bg: 'from-green-400 to-emerald-500', initial: 'AL' },
                    { bg: 'from-yellow-400 to-orange-500', initial: 'MK' },
                    { bg: 'from-red-400 to-pink-500', initial: 'LS' },
                    { bg: 'from-indigo-400 to-purple-500', initial: 'RB' },
                    { bg: 'from-cyan-400 to-blue-500', initial: 'NP' },
                    { bg: 'from-emerald-400 to-green-500', initial: 'TW' },
                    { bg: 'from-orange-400 to-red-500', initial: 'KJ' },
                    { bg: 'from-purple-400 to-pink-500', initial: 'HM' },
                    { bg: 'from-blue-400 to-indigo-500', initial: 'DF' },
                    { bg: 'from-green-400 to-cyan-500', initial: 'GH' },
                  ].map((creator, index) => (
                    <div
                      key={index}
                      className={`w-16 h-16 rounded-full bg-gradient-to-r ${creator.bg} flex items-center justify-center text-white font-bold text-lg shadow-lg hover:scale-110 transition-transform duration-300 cursor-pointer`}
                    >
                      {creator.initial}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Feature Cards */}
              <div className="grid lg:grid-cols-3 gap-8">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Discover & access relevant creators
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Find the perfect creators for your brand across all major platforms and niches.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        Advanced filtering
                      </li>
                      <li className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        Real-time analytics
                      </li>
                      <li className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        Audience insights
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Get premium data for better insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Access detailed analytics and performance metrics to optimize your campaigns.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        ROI tracking
                      </li>
                      <li className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        Performance benchmarks
                      </li>
                      <li className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        Custom reports
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Competitive pricing & pricing insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Get the best rates and understand market pricing with our transparent system.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        Market rate insights
                      </li>
                      <li className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        Transparent pricing
                      </li>
                      <li className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        Budget optimization
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex justify-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
                ))}
              </div>
              
              <blockquote className="text-2xl md:text-3xl font-medium text-gray-900 mb-8 leading-relaxed">
                "TickTime transformed how I manage my brand partnerships. The platform is intuitive, 
                secure, and has helped me increase my earnings by 300% in just 6 months!"
              </blockquote>
              
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                  SK
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-lg">Sarah Kim</p>
                  <p className="text-gray-600">Fashion & Lifestyle Influencer</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Start a Campaign Now
              </h2>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                Join thousands of creators and brands already using TickTime to build successful partnerships.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-4 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                  <Link href="/signup">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-purple-600 text-lg px-8 py-4 font-semibold rounded-xl transition-all duration-300" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
              
              <div className="flex flex-wrap justify-center gap-8 text-sm opacity-75">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Free to get started
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  No setup fees
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Cancel anytime
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
