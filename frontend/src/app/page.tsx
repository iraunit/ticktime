import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MainLayout } from "@/components/layout/main-layout";
import { CheckCircle, Users, TrendingUp, Shield, Star, ArrowRight } from "@/lib/icons";

export default function Home() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Connect. Create. <span className="text-red-600">Collaborate.</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Join thousands of influencers who trust TickTime to manage their brand partnerships, 
              streamline content creation, and maximize their earning potential.
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
            <p className="text-sm text-gray-500">
              ✨ Free to join • No setup fees • Start earning today
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-red-600" />
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
                  <Shield className="h-8 w-8 text-red-600" />
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
                  <TrendingUp className="h-8 w-8 text-red-600" />
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
          <div className="text-center mb-16">
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
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto mb-16">
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
