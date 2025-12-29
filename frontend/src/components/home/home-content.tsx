import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

export function HomeContent() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section
                className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 pt-16 pb-20 overflow-hidden">
                {/* Hand-drawn background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div
                        className="absolute top-20 left-10 w-32 h-32 bg-yellow-200 rounded-full opacity-20 transform rotate-12"></div>
                    <div
                        className="absolute top-40 right-20 w-24 h-24 bg-pink-200 rounded-full opacity-30 transform -rotate-12"></div>
                    <div
                        className="absolute bottom-20 left-1/4 w-16 h-16 bg-orange-200 rounded-full opacity-25 transform rotate-45"></div>
                    <div
                        className="absolute top-60 right-1/3 w-20 h-20 bg-red-200 rounded-full opacity-20 transform -rotate-45"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="mb-8">
                            {/* Hand-drawn style logo area */}
                            <div className="inline-block relative">
                                <div
                                    className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mx-auto mb-4 flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-300">
                                    <span className="text-3xl font-bold text-white">T</span>
                                </div>
                                <div
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full opacity-80"></div>
                                <div
                                    className="absolute -bottom-1 -left-1 w-4 h-4 bg-pink-400 rounded-full opacity-70"></div>
                            </div>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                            <span className="relative">
                                Connect with brands,
                                <div
                                    className="absolute -top-2 -right-4 w-8 h-8 bg-yellow-300 rounded-full opacity-60 transform rotate-12"></div>
                            </span>
                            <br/>
                            <span className="text-red-600 relative">
                                grow your influence
                                <div
                                    className="absolute -bottom-1 left-0 w-full h-2 bg-gradient-to-r from-yellow-300 to-orange-300 opacity-40 transform -skew-y-1"></div>
                            </span>
                        </h1>

                        <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed font-medium">
                            India's leading platform for content creators to find brand partnerships, manage
                            collaborations,
                            and track their success. <span className="text-orange-600 font-semibold">Completely free to use.</span>
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                            <Button size="lg"
                                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8 py-4 text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden"
                                    asChild>
                                <Link href="/accounts/signup" className="relative z-10">
                                    <span className="relative">
                                        Get Started Free
                                        <span className="absolute -top-1 -right-1 text-sm">✨</span>
                                    </span>
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline"
                                    className="border-2 border-orange-300 text-orange-700 hover:bg-orange-50 px-8 py-4 text-lg font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 relative"
                                    asChild>
                                <Link href="/accounts/login" className="relative">
                                    <span className="relative">
                                        Sign In
                                        <div
                                            className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full opacity-80"></div>
                                    </span>
                                </Link>
                            </Button>
                        </div>

                        {/* Social Proof */}
                        <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-700">
                            <div
                                className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-orange-200">
                                <div className="flex -space-x-1">
                                    <div
                                        className="w-6 h-6 bg-gradient-to-br from-red-400 to-pink-500 rounded-full border-2 border-white transform rotate-12"></div>
                                    <div
                                        className="w-6 h-6 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full border-2 border-white transform -rotate-6"></div>
                                    <div
                                        className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full border-2 border-white transform rotate-6"></div>
                                </div>
                                <span className="font-semibold">50,000+ active creators</span>
                            </div>
                            <div
                                className="bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-orange-200">
                                <span className="text-yellow-500">⭐</span> <span className="font-semibold">4.8/5 creator satisfaction</span>
                            </div>
                            <div
                                className="bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-orange-200">
                                <span className="text-orange-500">🏆</span> <span className="font-semibold">Trusted by Creators Nationwide</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dashboard Preview */}
            <section className="py-16 bg-gradient-to-br from-gray-50 to-orange-50 relative overflow-hidden">
                {/* Organic background shapes */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div
                        className="absolute top-10 right-10 w-40 h-40 bg-yellow-200 rounded-full opacity-10 transform rotate-45"></div>
                    <div
                        className="absolute bottom-10 left-10 w-32 h-32 bg-orange-200 rounded-full opacity-15 transform -rotate-12"></div>
                    <div
                        className="absolute top-1/2 left-1/4 w-24 h-24 bg-pink-200 rounded-full opacity-20 transform rotate-90"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 relative">
                                <span className="relative">
                                    Everything you need in one place
                                    <div
                                        className="absolute -top-2 -right-6 w-6 h-6 bg-yellow-300 rounded-full opacity-60 transform rotate-12"></div>
                                </span>
                            </h2>
                            <p className="text-xl text-gray-700 font-medium">
                                Manage your brand partnerships with a <span
                                className="text-orange-600 font-semibold">clean, intuitive dashboard</span>
                            </p>
                        </div>

                        {/* Dashboard Mock */}
                        <div
                            className="bg-white rounded-3xl shadow-2xl p-8 transform rotate-1 hover:rotate-0 transition-transform duration-500 border-4 border-orange-100 relative overflow-hidden">
                            {/* Hand-drawn style decorations */}
                            <div
                                className="absolute top-4 right-4 w-8 h-8 bg-yellow-200 rounded-full opacity-40 transform rotate-45"></div>
                            <div
                                className="absolute bottom-4 left-4 w-6 h-6 bg-pink-200 rounded-full opacity-50 transform -rotate-12"></div>

                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900 relative">
                                    <span className="relative">
                                        Creator Dashboard
                                        <div
                                            className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-orange-300 to-yellow-300 opacity-60 transform -skew-y-1"></div>
                                    </span>
                                </h3>
                                <div
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full text-sm font-semibold border-2 border-green-200">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    Active
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6 mb-6">
                                <div
                                    className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 text-center border-2 border-red-100 transform hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                                    <div
                                        className="absolute top-2 right-2 w-4 h-4 bg-yellow-300 rounded-full opacity-60 transform rotate-45"></div>
                                    <div className="text-3xl font-bold text-red-600 mb-1">₹1,35,000</div>
                                    <div className="text-sm text-gray-700 font-semibold">This month</div>
                                </div>
                                <div
                                    className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 text-center border-2 border-blue-100 transform hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                                    <div
                                        className="absolute top-2 right-2 w-4 h-4 bg-orange-300 rounded-full opacity-60 transform -rotate-12"></div>
                                    <div className="text-3xl font-bold text-blue-600 mb-1">12</div>
                                    <div className="text-sm text-gray-700 font-semibold">Active deals</div>
                                </div>
                                <div
                                    className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 text-center border-2 border-green-100 transform hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                                    <div
                                        className="absolute top-2 right-2 w-4 h-4 bg-pink-300 rounded-full opacity-60 transform rotate-12"></div>
                                    <div className="text-3xl font-bold text-green-600 mb-1">96%</div>
                                    <div className="text-sm text-gray-700 font-semibold">Completion rate</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div
                                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-pink-50 rounded-2xl border-2 border-pink-100 transform hover:scale-105 transition-transform duration-300 relative">
                                    <div
                                        className="absolute top-2 right-2 w-3 h-3 bg-purple-300 rounded-full opacity-60 transform rotate-12"></div>
                                    <div
                                        className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg transform rotate-2 hover:rotate-0 transition-transform duration-300">
                                        B
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900 text-lg">Beauty & Skincare
                                        </div>
                                        <div className="text-sm text-gray-700 font-medium">Active</div>
                                    </div>
                                    <div className="text-green-600 font-bold text-lg">₹65,000</div>
                                </div>

                                <div
                                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-orange-50 rounded-2xl border-2 border-orange-100 transform hover:scale-105 transition-transform duration-300 relative">
                                    <div
                                        className="absolute top-2 right-2 w-3 h-3 bg-yellow-300 rounded-full opacity-60 transform rotate-12"></div>
                                    <div
                                        className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg transform rotate-2 hover:rotate-0 transition-transform duration-300">
                                        M
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900 text-lg">Fashion Campaign
                                        </div>
                                        <div className="text-sm text-gray-700 font-medium">Due in 3 days</div>
                                    </div>
                                    <div className="text-green-600 font-bold text-lg">₹45,000</div>
                                </div>

                                <div
                                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border-2 border-blue-100 transform hover:scale-105 transition-transform duration-300 relative">
                                    <div
                                        className="absolute top-2 right-2 w-3 h-3 bg-orange-300 rounded-full opacity-60 transform -rotate-12"></div>
                                    <div
                                        className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg transform -rotate-1 hover:rotate-0 transition-transform duration-300">
                                        Z
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900 text-lg">Food Review</div>
                                        <div className="text-sm text-gray-700 font-medium">In review</div>
                                    </div>
                                    <div className="text-green-600 font-bold text-lg">₹25,000</div>
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
                            Trusted by Indian creators nationwide
                        </h2>

                        <div className="grid md:grid-cols-4 gap-8">
                            <div>
                                <div className="text-3xl md:text-4xl font-bold text-red-400 mb-2">
                                    50,000+
                                </div>
                                <div className="text-gray-400">Active Creators</div>
                            </div>
                            <div>
                                <div className="text-3xl md:text-4xl font-bold text-orange-400 mb-2">
                                    25,800+
                                </div>
                                <div className="text-gray-400">Completed Deals</div>
                            </div>
                            <div>
                                <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">
                                    ₹1.2Cr+
                                </div>
                                <div className="text-gray-400">Creator Earnings</div>
                            </div>
                            <div>
                                <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">
                                    97+
                                </div>
                                <div className="text-gray-400">Indian Brands</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-gradient-to-br from-white to-orange-50 relative overflow-hidden">
                {/* Organic background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div
                        className="absolute top-20 left-20 w-32 h-32 bg-yellow-200 rounded-full opacity-10 transform rotate-45"></div>
                    <div
                        className="absolute bottom-20 right-20 w-40 h-40 bg-pink-200 rounded-full opacity-15 transform -rotate-12"></div>
                    <div
                        className="absolute top-1/2 left-1/3 w-24 h-24 bg-orange-200 rounded-full opacity-20 transform rotate-90"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 relative">
                                <span className="relative">
                                    Why Indian creators choose TickTime
                                    <div
                                        className="absolute -top-2 -right-8 w-8 h-8 bg-yellow-300 rounded-full opacity-60 transform rotate-12"></div>
                                </span>
                            </h2>
                            <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
                                Complete platform for influencer marketing with <span
                                className="text-orange-600 font-semibold">campaign management, analytics, and messaging</span>
                            </p>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-8">
                            <Card
                                className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-3xl border-4 border-orange-100 relative overflow-hidden">
                                <div
                                    className="absolute top-4 right-4 w-6 h-6 bg-yellow-300 rounded-full opacity-40 transform rotate-45"></div>
                                <CardHeader className="pb-4">
                                    <div
                                        className="w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl flex items-center justify-center mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-300 relative">
                                        <div
                                            className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                                            <div className="w-4 h-4 bg-white rounded-full"></div>
                                        </div>
                                        <div
                                            className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full opacity-80"></div>
                                    </div>
                                    <CardTitle className="text-xl font-bold text-gray-900 relative">
                                        <span className="relative">
                                            Advanced Influencer Search
                                            <div
                                                className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-red-300 to-pink-300 opacity-60 transform -skew-y-1"></div>
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 mb-6 font-medium">
                                        Powerful search and filtering tools to find the perfect influencers based on
                                        platform, engagement, location, and more.
                                    </p>
                                    <ul className="space-y-3 text-sm text-gray-700">
                                        <li className="flex items-center font-medium">
                                            <span className="text-green-500 mr-3 text-lg">✓</span>
                                            Multi-platform search (Instagram, YouTube, TikTok)
                                        </li>
                                        <li className="flex items-center font-medium">
                                            <span className="text-green-500 mr-3 text-lg">✓</span>
                                            Advanced filtering by engagement & location
                                        </li>
                                        <li className="flex items-center font-medium">
                                            <span className="text-green-500 mr-3 text-lg">✓</span>
                                            Bookmark and save favorite creators
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card
                                className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-3xl border-4 border-blue-100 relative overflow-hidden">
                                <div
                                    className="absolute top-4 right-4 w-6 h-6 bg-orange-300 rounded-full opacity-40 transform -rotate-45"></div>
                                <CardHeader className="pb-4">
                                    <div
                                        className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-6 transform -rotate-2 hover:rotate-0 transition-transform duration-300 relative">
                                        <div
                                            className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                            <div className="w-4 h-4 bg-white rounded-sm"></div>
                                        </div>
                                        <div
                                            className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full opacity-80"></div>
                                    </div>
                                    <CardTitle className="text-xl font-bold text-gray-900 relative">
                                        <span className="relative">
                                            Campaign Management
                                            <div
                                                className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-blue-300 to-indigo-300 opacity-60 transform -skew-y-1"></div>
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 mb-6 font-medium">
                                        Create and manage campaigns with cash, barter, or hybrid deals. Track
                                        applications and collaborations in real-time.
                                    </p>
                                    <ul className="space-y-3 text-sm text-gray-700">
                                        <li className="flex items-center font-medium">
                                            <span className="text-green-500 mr-3 text-lg">✓</span>
                                            Create cash, barter & hybrid campaigns
                                        </li>
                                        <li className="flex items-center font-medium">
                                            <span className="text-green-500 mr-3 text-lg">✓</span>
                                            Real-time deal tracking & management
                                        </li>
                                        <li className="flex items-center font-medium">
                                            <span className="text-green-500 mr-3 text-lg">✓</span>
                                            Built-in messaging system
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card
                                className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-3xl border-4 border-green-100 relative overflow-hidden">
                                <div
                                    className="absolute top-4 right-4 w-6 h-6 bg-pink-300 rounded-full opacity-40 transform rotate-45"></div>
                                <CardHeader className="pb-4">
                                    <div
                                        className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mb-6 transform rotate-1 hover:rotate-0 transition-transform duration-300 relative">
                                        <div
                                            className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                            <div className="w-4 h-4 bg-white rounded-sm transform rotate-45"></div>
                                        </div>
                                        <div
                                            className="absolute -top-1 -right-1 w-4 h-4 bg-pink-400 rounded-full opacity-80"></div>
                                    </div>
                                    <CardTitle className="text-xl font-bold text-gray-900 relative">
                                        <span className="relative">
                                            Analytics & Insights
                                            <div
                                                className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-green-300 to-emerald-300 opacity-60 transform -skew-y-1"></div>
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 mb-6 font-medium">
                                        Comprehensive analytics dashboard to track earnings, performance metrics,
                                        and collaboration history.
                                    </p>
                                    <ul className="space-y-3 text-sm text-gray-700">
                                        <li className="flex items-center font-medium">
                                            <span className="text-green-500 mr-3 text-lg">✓</span>
                                            Detailed earnings dashboard
                                        </li>
                                        <li className="flex items-center font-medium">
                                            <span className="text-green-500 mr-3 text-lg">✓</span>
                                            Performance metrics & trends
                                        </li>
                                        <li className="flex items-center font-medium">
                                            <span className="text-green-500 mr-3 text-lg">✓</span>
                                            Collaboration history tracking
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonial */}
            <section className="py-16 bg-gradient-to-br from-orange-50 to-pink-50 relative overflow-hidden">
                {/* Organic background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div
                        className="absolute top-10 left-10 w-24 h-24 bg-yellow-200 rounded-full opacity-20 transform rotate-45"></div>
                    <div
                        className="absolute bottom-10 right-10 w-32 h-32 bg-pink-200 rounded-full opacity-15 transform -rotate-12"></div>
                    <div
                        className="absolute top-1/2 left-1/2 w-20 h-20 bg-orange-200 rounded-full opacity-25 transform rotate-90"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="mb-8">
                            <div className="flex justify-center items-center gap-2">
                                <span className="text-yellow-400 text-3xl transform rotate-12">⭐</span>
                                <span className="text-yellow-400 text-3xl transform -rotate-6">⭐</span>
                                <span className="text-yellow-400 text-3xl transform rotate-6">⭐</span>
                                <span className="text-yellow-400 text-3xl transform -rotate-12">⭐</span>
                                <span className="text-yellow-400 text-3xl transform rotate-3">⭐</span>
                            </div>
                        </div>

                        <blockquote
                            className="text-xl md:text-2xl font-medium text-gray-900 mb-8 leading-relaxed relative">
                            <div className="absolute -top-4 -left-4 text-6xl text-orange-200 opacity-60">"</div>
                            <span className="relative z-10">
                                TickTime has revolutionized how I connect with Indian brands. The platform made it incredibly easy to find relevant campaigns and manage my collaborations. I've seen a <span
                                className="text-orange-600 font-semibold">300% increase in my monthly earnings</span> since joining.
                            </span>
                            <div
                                className="absolute -bottom-4 -right-4 text-6xl text-orange-200 opacity-60 transform rotate-180">"
                            </div>
                        </blockquote>

                        <div
                            className="flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-3xl p-6 border-2 border-orange-200 transform hover:scale-105 transition-transform duration-300">
                            <div
                                className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl mr-6 transform rotate-3 hover:rotate-0 transition-transform duration-300 relative">
                                PS
                                <div
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full opacity-80"></div>
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-gray-900 text-lg">Priya Sharma</p>
                                <p className="text-gray-700 font-medium">Fashion & Lifestyle Creator, 1.2L
                                    followers</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section
                className="py-20 bg-gradient-to-br from-red-600 via-orange-600 to-pink-600 text-white relative overflow-hidden">
                {/* Organic background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div
                        className="absolute top-10 left-10 w-40 h-40 bg-yellow-200 rounded-full opacity-10 transform rotate-45"></div>
                    <div
                        className="absolute bottom-10 right-10 w-32 h-32 bg-pink-200 rounded-full opacity-15 transform -rotate-12"></div>
                    <div
                        className="absolute top-1/2 left-1/4 w-24 h-24 bg-orange-200 rounded-full opacity-20 transform rotate-90"></div>
                    <div
                        className="absolute top-1/3 right-1/3 w-20 h-20 bg-yellow-200 rounded-full opacity-15 transform -rotate-45"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 relative">
                            <span className="relative">
                                Ready to grow your influence in India?
                                <div
                                    className="absolute -top-2 -right-8 w-8 h-8 bg-yellow-300 rounded-full opacity-60 transform rotate-12"></div>
                            </span>
                        </h2>
                        <p className="text-xl mb-8 opacity-95 font-medium">
                            Join 2,500+ Indian creators who are turning their <span
                            className="text-yellow-200 font-semibold">passion into profit</span>
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                            <Button size="lg"
                                    className="bg-white text-red-600 hover:bg-gray-100 text-lg px-8 py-4 font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden"
                                    asChild>
                                <Link href="/accounts/signup" className="relative z-10">
                                    <span className="relative">
                                        Start Creating Today
                                        <span className="absolute -top-1 -right-1 text-sm">✨</span>
                                    </span>
                                </Link>
                            </Button>
                            <Button size="lg" variant="ghost"
                                    className="border-2 border-white text-white hover:bg-white hover:text-red-600 text-lg px-8 py-4 font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 relative"
                                    asChild>
                                <Link href="/accounts/login" className="relative">
                                    <span className="relative">
                                        Already have an account?
                                        <div
                                            className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full opacity-80"></div>
                                    </span>
                                </Link>
                            </Button>
                        </div>

                        <div className="flex flex-wrap justify-center gap-6 text-sm opacity-95">
                            <div
                                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                                <span className="text-green-300 text-lg">✓</span>
                                <span className="font-semibold">100% Free to use</span>
                            </div>
                            <div
                                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                                <span className="text-green-300 text-lg">✓</span>
                                <span className="font-semibold">No contracts or commitments</span>
                            </div>
                            <div
                                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                                <span className="text-green-300 text-lg">✓</span>
                                <span className="font-semibold">Start earning immediately</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

