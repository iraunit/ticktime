import type {Metadata} from "next";
import Link from "next/link";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {MainLayout} from "@/components/layout/main-layout";
import {Button} from "@/components/ui/button";
import {HiChatBubbleLeftRight, HiDocumentText, HiEnvelope, HiPhone, HiQuestionMarkCircle} from "react-icons/hi2";
import {SUPPORT_CONTACT, SUPPORT_LINKS} from "@/constants/support";

export const metadata: Metadata = {
    title: "Support - TickTime",
    description: "Get help and support for your TickTime journey. Find FAQs, documentation, and contact our support team.",
    openGraph: {
        title: "Support - TickTime",
        description: "Get help and support for your TickTime journey.",
    },
};

export default function SupportPage() {
    return (
        <MainLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="text-center mb-12">
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 relative">
                                <span className="relative">
                                    How can we help you?
                                    <div
                                        className="absolute -top-2 -right-8 w-8 h-8 bg-yellow-300 rounded-full opacity-60 transform rotate-12"></div>
                                </span>
                            </h1>
                            <p className="text-xl text-gray-700 font-medium">
                                Get support for your TickTime journey. We're here to help you succeed.
                            </p>
                        </div>

                        {/* Quick Help Cards */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                            <Card
                                className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-3xl border-4 border-orange-100 relative overflow-hidden">
                                <div
                                    className="absolute top-4 right-4 w-6 h-6 bg-yellow-300 rounded-full opacity-40 transform rotate-45"></div>
                                <CardHeader className="pb-4">
                                    <div
                                        className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-4 transform rotate-3 hover:rotate-0 transition-transform duration-300 relative">
                                        <HiQuestionMarkCircle className="w-8 h-8 text-blue-600"/>
                                        <div
                                            className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full opacity-80"></div>
                                    </div>
                                    <CardTitle className="text-xl font-bold text-gray-900">FAQ</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 mb-4 font-medium">
                                        Find answers to frequently asked questions about using TickTime.
                                    </p>
                                    <Button asChild className="w-full">
                                        <Link href={SUPPORT_LINKS.faq}>View FAQ</Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card
                                className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-3xl border-4 border-blue-100 relative overflow-hidden">
                                <div
                                    className="absolute top-4 right-4 w-6 h-6 bg-orange-300 rounded-full opacity-40 transform -rotate-45"></div>
                                <CardHeader className="pb-4">
                                    <div
                                        className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mb-4 transform -rotate-2 hover:rotate-0 transition-transform duration-300 relative">
                                        <HiDocumentText className="w-8 h-8 text-green-600"/>
                                        <div
                                            className="absolute -top-1 -right-1 w-4 h-4 bg-pink-400 rounded-full opacity-80"></div>
                                    </div>
                                    <CardTitle className="text-xl font-bold text-gray-900">Documentation</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 mb-4 font-medium">
                                        Comprehensive guides and tutorials for all platform features.
                                    </p>
                                    <Button asChild className="w-full">
                                        <Link href={SUPPORT_LINKS.docs}>View Docs</Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card
                                className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-3xl border-4 border-green-100 relative overflow-hidden">
                                <div
                                    className="absolute top-4 right-4 w-6 h-6 bg-pink-300 rounded-full opacity-40 transform rotate-45"></div>
                                <CardHeader className="pb-4">
                                    <div
                                        className="w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl flex items-center justify-center mb-4 transform rotate-1 hover:rotate-0 transition-transform duration-300 relative">
                                        <HiChatBubbleLeftRight className="w-8 h-8 text-red-600"/>
                                        <div
                                            className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full opacity-80"></div>
                                    </div>
                                    <CardTitle className="text-xl font-bold text-gray-900">Live Chat</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 mb-4 font-medium">
                                        Chat with our support team for immediate assistance.
                                    </p>
                                    <Button asChild className="w-full">
                                        <Link href={SUPPORT_LINKS.chat}>Start Chat</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Contact Information */}
                        <div className="grid md:grid-cols-2 gap-8 mb-12">
                            <Card
                                className="border-0 shadow-xl rounded-3xl border-4 border-orange-100 relative overflow-hidden">
                                <div
                                    className="absolute top-4 right-4 w-6 h-6 bg-yellow-300 rounded-full opacity-40 transform rotate-45"></div>
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <HiPhone className="w-8 h-8 text-orange-600"/>
                                        Phone Support
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 mb-4 font-medium">
                                        Call us for immediate assistance with your account or technical issues.
                                    </p>
                                    <div className="space-y-2">
                                        <p className="text-lg font-bold text-gray-900">{SUPPORT_CONTACT.phoneDisplay}</p>
                                        <p className="text-sm text-gray-600">{SUPPORT_CONTACT.phoneHoursWeekday}</p>
                                        <p className="text-sm text-gray-600">{SUPPORT_CONTACT.phoneHoursWeekend}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card
                                className="border-0 shadow-xl rounded-3xl border-4 border-blue-100 relative overflow-hidden">
                                <div
                                    className="absolute top-4 right-4 w-6 h-6 bg-orange-300 rounded-full opacity-40 transform -rotate-45"></div>
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <HiEnvelope className="w-8 h-8 text-blue-600"/>
                                        Email Support
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 mb-4 font-medium">
                                        Send us an email and we'll get back to you within 24 hours.
                                    </p>
                                    <div className="space-y-2">
                                        <p className="text-lg font-bold text-gray-900">{SUPPORT_CONTACT.email}</p>
                                        <p className="text-sm text-gray-600">{SUPPORT_CONTACT.emailResponseTime}</p>
                                        <p className="text-sm text-gray-600">{SUPPORT_CONTACT.emailAvailability}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Popular Topics */}
                        <div className="mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Popular Help Topics</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <Card
                                    className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl border-2 border-gray-100">
                                    <CardContent className="p-6">
                                        <h3 className="text-lg font-bold text-gray-900 mb-3">Getting Started</h3>
                                        <ul className="space-y-2 text-gray-700">
                                            <li className="flex items-center">
                                                <span className="text-green-500 mr-2">•</span>
                                                How to create your profile
                                            </li>
                                            <li className="flex items-center">
                                                <span className="text-green-500 mr-2">•</span>
                                                Setting up social media accounts
                                            </li>
                                            <li className="flex items-center">
                                                <span className="text-green-500 mr-2">•</span>
                                                Verifying your account
                                            </li>
                                        </ul>
                                    </CardContent>
                                </Card>

                                <Card
                                    className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl border-2 border-gray-100">
                                    <CardContent className="p-6">
                                        <h3 className="text-lg font-bold text-gray-900 mb-3">Campaign Management</h3>
                                        <ul className="space-y-2 text-gray-700">
                                            <li className="flex items-center">
                                                <span className="text-green-500 mr-2">•</span>
                                                Creating your first campaign
                                            </li>
                                            <li className="flex items-center">
                                                <span className="text-green-500 mr-2">•</span>
                                                Finding the right influencers
                                            </li>
                                            <li className="flex items-center">
                                                <span className="text-green-500 mr-2">•</span>
                                                Managing deals and payments
                                            </li>
                                        </ul>
                                    </CardContent>
                                </Card>

                                <Card
                                    className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl border-2 border-gray-100">
                                    <CardContent className="p-6">
                                        <h3 className="text-lg font-bold text-gray-900 mb-3">Account & Billing</h3>
                                        <ul className="space-y-2 text-gray-700">
                                            <li className="flex items-center">
                                                <span className="text-green-500 mr-2">•</span>
                                                Updating payment methods
                                            </li>
                                            <li className="flex items-center">
                                                <span className="text-green-500 mr-2">•</span>
                                                Understanding pricing
                                            </li>
                                            <li className="flex items-center">
                                                <span className="text-green-500 mr-2">•</span>
                                                Account security settings
                                            </li>
                                        </ul>
                                    </CardContent>
                                </Card>

                                <Card
                                    className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl border-2 border-gray-100">
                                    <CardContent className="p-6">
                                        <h3 className="text-lg font-bold text-gray-900 mb-3">Technical Support</h3>
                                        <ul className="space-y-2 text-gray-700">
                                            <li className="flex items-center">
                                                <span className="text-green-500 mr-2">•</span>
                                                Troubleshooting login issues
                                            </li>
                                            <li className="flex items-center">
                                                <span className="text-green-500 mr-2">•</span>
                                                Mobile app problems
                                            </li>
                                            <li className="flex items-center">
                                                <span className="text-green-500 mr-2">•</span>
                                                Browser compatibility
                                            </li>
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* CTA */}
                        <div
                            className="text-center bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl p-8 text-white">
                            <h2 className="text-3xl font-bold mb-4">Still need help?</h2>
                            <p className="text-xl mb-6 opacity-95">
                                Our support team is ready to assist you with any questions or issues.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button size="lg" variant="secondary"
                                        className="bg-white text-orange-600 hover:bg-gray-100" asChild>
                                    <Link href={SUPPORT_LINKS.chat}>Contact Support</Link>
                                </Button>
                                <Button size="lg" variant="outline"
                                        className="border-2 border-white text-white hover:bg-white hover:text-orange-600 bg-transparent">
                                    Schedule a Call
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
