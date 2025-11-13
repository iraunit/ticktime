"use client";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {MainLayout} from "@/components/layout/main-layout";
import {Button} from "@/components/ui/button";
import {HiArrowLeft, HiChatBubbleLeftRight, HiPhone, HiEnvelope, HiClock} from "react-icons/hi2";
import Link from "next/link";

export default function ChatPage() {

    return (
        <MainLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="mb-8">
                            <Button variant="ghost" asChild className="mb-6">
                                <Link href="/support" className="flex items-center gap-2">
                                    <HiArrowLeft className="w-4 h-4" />
                                    Back to Support
                                </Link>
                            </Button>
                            
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 relative">
                                <span className="relative">
                                    Contact Us
                                    <div className="absolute -top-2 -right-8 w-8 h-8 bg-yellow-300 rounded-full opacity-60 transform rotate-12"></div>
                                </span>
                            </h1>
                            <p className="text-xl text-gray-700 font-medium">
                                Get in touch with our support team for assistance.
                            </p>
                        </div>

                        {/* Contact Methods */}
                        <div className="grid md:grid-cols-2 gap-8 mb-12">
                            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-3xl border-4 border-orange-100 relative overflow-hidden">
                                <div className="absolute top-4 right-4 w-6 h-6 bg-yellow-300 rounded-full opacity-40 transform rotate-45"></div>
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <HiPhone className="w-8 h-8 text-orange-600" />
                                        Phone Support
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 mb-4 font-medium">
                                        Call us for immediate assistance with your account or technical issues.
                                    </p>
                                    <div className="space-y-2">
                                        <p className="text-lg font-bold text-gray-900">+91 98765 43210</p>
                                        <p className="text-sm text-gray-600">Mon-Fri: 9 AM - 6 PM IST</p>
                                        <p className="text-sm text-gray-600">Sat: 10 AM - 4 PM IST</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-3xl border-4 border-blue-100 relative overflow-hidden">
                                <div className="absolute top-4 right-4 w-6 h-6 bg-orange-300 rounded-full opacity-40 transform -rotate-45"></div>
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <HiEnvelope className="w-8 h-8 text-blue-600" />
                                        Email Support
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 mb-4 font-medium">
                                        Send us an email and we'll get back to you within 24 hours.
                                    </p>
                                    <div className="space-y-2">
                                        <p className="text-lg font-bold text-gray-900">support@ticktime.in</p>
                                        <p className="text-sm text-gray-600">Response time: Within 24 hours</p>
                                        <p className="text-sm text-gray-600">Available 24/7</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Contact Form */}
                        <Card className="border-0 shadow-xl rounded-3xl border-4 border-green-100 relative overflow-hidden mb-12">
                            <div className="absolute top-4 right-4 w-6 h-6 bg-pink-300 rounded-full opacity-40 transform rotate-45"></div>
                            <CardHeader>
                                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                    <HiChatBubbleLeftRight className="w-8 h-8 text-green-600" />
                                    Send us a Message
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                placeholder="Your full name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                            <input
                                                type="email"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                placeholder="your.email@example.com"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            placeholder="What can we help you with?"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                                        <textarea
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            placeholder="Please describe your issue or question in detail..."
                                        ></textarea>
                                    </div>
                                    <Button 
                                        type="submit" 
                                        className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-3 rounded-lg"
                                    >
                                        Send Message
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Response Time Info */}
                        <Card className="border-0 shadow-lg rounded-2xl border-2 border-gray-100 mb-8">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3">
                                    <HiClock className="w-6 h-6 text-orange-600" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Response Times</h3>
                                        <p className="text-gray-700">
                                            We typically respond to emails within 24 hours and phone calls are answered during business hours. 
                                            For urgent issues, please call us directly.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Alternative Contact */}
                        <div className="text-center bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl p-8 text-white">
                            <h2 className="text-3xl font-bold mb-4">Need Immediate Help?</h2>
                            <p className="text-xl mb-6 opacity-95">
                                For urgent issues, call us directly or check our FAQ for quick answers.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button size="lg" variant="secondary" className="bg-white text-orange-600 hover:bg-gray-100">
                                    Call +91 98765 43210
                                </Button>
                                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-orange-600 bg-transparent" asChild>
                                    <Link href="/support/faq">View FAQ</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
