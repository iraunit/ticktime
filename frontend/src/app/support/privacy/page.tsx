import type {Metadata} from "next";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {MainLayout} from "@/components/layout/main-layout";
import {Button} from "@/components/ui/button";
import {HiArrowLeft, HiCheckCircle, HiDocumentText} from "react-icons/hi2";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Privacy Policy - TickTime",
    description: "Read our privacy policy to understand how TickTime collects, uses, and protects your personal information.",
    openGraph: {
        title: "Privacy Policy - TickTime",
        description: "Read our privacy policy to understand how TickTime collects, uses, and protects your personal information.",
    },
};

export default function PrivacyPolicyPage() {
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
                                    Privacy Policy
                                    <div className="absolute -top-2 -right-8 w-8 h-8 bg-yellow-300 rounded-full opacity-60 transform rotate-12"></div>
                                </span>
                            </h1>
                            <p className="text-xl text-gray-700 font-medium">
                                How we collect, use, and protect your personal information.
                            </p>
                        </div>

                        {/* Last Updated */}
                        <Card className="border-0 shadow-lg rounded-2xl border-2 border-orange-100 mb-8">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3">
                                    <HiCheckCircle className="w-6 h-6 text-orange-600" />
                                    <div>
                                        <p className="font-semibold text-gray-900">Last Updated: December 2024</p>
                                        <p className="text-sm text-gray-600">This privacy policy is effective as of the date above.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Privacy Policy Content */}
                        <div className="space-y-8">
                            <Card className="border-0 shadow-lg rounded-2xl border-2 border-gray-100">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <HiDocumentText className="w-6 h-6 text-orange-600" />
                                        1. Information We Collect
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Personal Information</h3>
                                        <p className="text-gray-700 leading-relaxed">
                                            We collect information you provide directly to us, such as when you create an account, 
                                            update your profile, or communicate with us. This may include:
                                        </p>
                                        <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                                            <li>Name, email address, and phone number</li>
                                            <li>Profile information and social media handles</li>
                                            <li>Payment and billing information</li>
                                            <li>Content you create or share on our platform</li>
                                            <li>Communications with us and other users</li>
                                        </ul>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Usage Information</h3>
                                        <p className="text-gray-700 leading-relaxed">
                                            We automatically collect certain information about your use of our services, including:
                                        </p>
                                        <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                                            <li>Device information and IP address</li>
                                            <li>Browser type and version</li>
                                            <li>Pages visited and time spent on our platform</li>
                                            <li>Clickstream data and interactions</li>
                                            <li>Cookies and similar tracking technologies</li>
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg rounded-2xl border-2 border-gray-100">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <HiDocumentText className="w-6 h-6 text-orange-600" />
                                        2. How We Use Your Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        We use the information we collect to provide, maintain, and improve our services:
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                                        <li>To create and manage your account</li>
                                        <li>To facilitate connections between brands and influencers</li>
                                        <li>To process payments and transactions</li>
                                        <li>To communicate with you about our services</li>
                                        <li>To provide customer support</li>
                                        <li>To analyze usage patterns and improve our platform</li>
                                        <li>To prevent fraud and ensure platform security</li>
                                        <li>To comply with legal obligations</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg rounded-2xl border-2 border-gray-100">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <HiDocumentText className="w-6 h-6 text-orange-600" />
                                        3. Information Sharing
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                                        <li>With your explicit consent</li>
                                        <li>To facilitate connections between brands and influencers on our platform</li>
                                        <li>With service providers who assist us in operating our platform</li>
                                        <li>When required by law or to protect our rights</li>
                                        <li>In connection with a business transfer or acquisition</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg rounded-2xl border-2 border-gray-100">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <HiDocumentText className="w-6 h-6 text-orange-600" />
                                        4. Data Security
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        We implement appropriate security measures to protect your personal information:
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                                        <li>Encryption of data in transit and at rest</li>
                                        <li>Regular security audits and assessments</li>
                                        <li>Access controls and authentication measures</li>
                                        <li>Secure data centers and infrastructure</li>
                                        <li>Employee training on data protection</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg rounded-2xl border-2 border-gray-100">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <HiDocumentText className="w-6 h-6 text-orange-600" />
                                        5. Your Rights
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        You have certain rights regarding your personal information:
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                                        <li>Access and review your personal information</li>
                                        <li>Correct inaccurate or incomplete information</li>
                                        <li>Delete your account and associated data</li>
                                        <li>Opt-out of certain communications</li>
                                        <li>Data portability and export</li>
                                        <li>Withdraw consent where applicable</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg rounded-2xl border-2 border-gray-100">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <HiDocumentText className="w-6 h-6 text-orange-600" />
                                        6. Cookies and Tracking
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        We use cookies and similar technologies to enhance your experience:
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                                        <li>Essential cookies for platform functionality</li>
                                        <li>Analytics cookies to understand usage patterns</li>
                                        <li>Marketing cookies for personalized content</li>
                                        <li>You can control cookie preferences in your browser settings</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg rounded-2xl border-2 border-gray-100">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <HiDocumentText className="w-6 h-6 text-orange-600" />
                                        7. Contact Us
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        If you have any questions about this Privacy Policy or our data practices, please contact us:
                                    </p>
                                    <div className="space-y-2 text-gray-700">
                                        <p><span className="font-semibold">Email:</span> privacy@ticktime.in</p>
                                        <p><span className="font-semibold">Phone:</span> +91 98765 43210</p>
                                        <p><span className="font-semibold">Address:</span> Ground Floor, Milkat No. 203, Word N, Juno Kadiyali Road, B/h Cahamunda V, Navo Milkat No, Rajula, Amreli, Gujarat, India - 365560</p>
                                        <p><span className="font-semibold">Legal Entity:</span> TickTime Media (Proprietorship)</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* CTA */}
                        <div className="mt-12 text-center bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl p-8 text-white">
                            <h2 className="text-3xl font-bold mb-4">Questions about Privacy?</h2>
                            <p className="text-xl mb-6 opacity-95">
                                Our privacy team is here to help with any questions or concerns.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button size="lg" variant="secondary" className="bg-white text-orange-600 hover:bg-gray-100">
                                    Contact Privacy Team
                                </Button>
                                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-orange-600 bg-transparent">
                                    Download Data
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
