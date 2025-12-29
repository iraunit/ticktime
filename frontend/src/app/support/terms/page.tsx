import type {Metadata} from "next";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {MainLayout} from "@/components/layout/main-layout";
import {Button} from "@/components/ui/button";
import {HiArrowLeft, HiDocumentText, HiExclamationTriangle} from "react-icons/hi2";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Terms of Service - TickTime",
    description: "Read the terms and conditions governing your use of TickTime platform.",
    openGraph: {
        title: "Terms of Service - TickTime",
        description: "Read the terms and conditions governing your use of TickTime platform.",
    },
};

export default function TermsOfServicePage() {
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
                                    Terms of Service
                                    <div className="absolute -top-2 -right-8 w-8 h-8 bg-yellow-300 rounded-full opacity-60 transform rotate-12"></div>
                                </span>
                            </h1>
                            <p className="text-xl text-gray-700 font-medium">
                                The terms and conditions governing your use of TickTime.
                            </p>
                        </div>

                        {/* Last Updated */}
                        <Card className="border-0 shadow-lg rounded-2xl border-2 border-orange-100 mb-8">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3">
                                    <HiExclamationTriangle className="w-6 h-6 text-orange-600" />
                                    <div>
                                        <p className="font-semibold text-gray-900">Last Updated: December 2024</p>
                                        <p className="text-sm text-gray-600">These terms are effective as of the date above.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Terms Content */}
                        <div className="space-y-8">
                            <Card className="border-0 shadow-lg rounded-2xl border-2 border-gray-100">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <HiDocumentText className="w-6 h-6 text-orange-600" />
                                        1. Acceptance of Terms
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 leading-relaxed">
                                        By accessing or using TickTime, you agree to be bound by these Terms of Service and all applicable laws and regulations. 
                                        If you do not agree with any of these terms, you are prohibited from using or accessing this platform.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg rounded-2xl border-2 border-gray-100">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <HiDocumentText className="w-6 h-6 text-orange-600" />
                                        2. Description of Service
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        TickTime is a platform that connects brands with influencers for marketing collaborations. Our services include:
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                                        <li>Influencer discovery and search tools</li>
                                        <li>Campaign creation and management</li>
                                        <li>Deal tracking and payment processing</li>
                                        <li>Communication and messaging tools</li>
                                        <li>Analytics and reporting features</li>
                                        <li>Profile management and verification</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg rounded-2xl border-2 border-gray-100">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <HiDocumentText className="w-6 h-6 text-orange-600" />
                                        3. User Accounts
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Creation</h3>
                                            <p className="text-gray-700 leading-relaxed">
                                                To use our services, you must create an account and provide accurate, complete information. 
                                                You are responsible for maintaining the confidentiality of your account credentials.
                                            </p>
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Types</h3>
                                            <p className="text-gray-700 leading-relaxed">
                                                We offer two types of accounts:
                                            </p>
                                            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                                                <li><strong>Brand Accounts:</strong> For companies and agencies looking to work with influencers</li>
                                                <li><strong>Influencer Accounts:</strong> For content creators seeking brand collaborations</li>
                                            </ul>
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Responsibilities</h3>
                                            <ul className="list-disc list-inside space-y-1 text-gray-700">
                                                <li>Keep your account information up to date</li>
                                                <li>Notify us immediately of any unauthorized use</li>
                                                <li>You are responsible for all activities under your account</li>
                                                <li>One person or entity may not maintain multiple accounts</li>
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg rounded-2xl border-2 border-gray-100">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <HiDocumentText className="w-6 h-6 text-orange-600" />
                                        4. User Conduct
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Prohibited Activities</h3>
                                            <p className="text-gray-700 leading-relaxed mb-2">You agree not to:</p>
                                            <ul className="list-disc list-inside space-y-1 text-gray-700">
                                                <li>Violate any applicable laws or regulations</li>
                                                <li>Infringe on intellectual property rights</li>
                                                <li>Post false, misleading, or fraudulent content</li>
                                                <li>Harass, abuse, or harm other users</li>
                                                <li>Attempt to gain unauthorized access to our systems</li>
                                                <li>Use automated systems to access the platform</li>
                                                <li>Spam or send unsolicited communications</li>
                                                <li>Engage in any form of discrimination or hate speech</li>
                                            </ul>
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Guidelines</h3>
                                            <p className="text-gray-700 leading-relaxed">
                                                All content shared on our platform must be appropriate, legal, and respectful. 
                                                We reserve the right to remove content that violates these guidelines.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg rounded-2xl border-2 border-gray-100">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <HiDocumentText className="w-6 h-6 text-orange-600" />
                                        5. Payments and Billing
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Processing</h3>
                                            <p className="text-gray-700 leading-relaxed">
                                                We facilitate payments between brands and influencers but are not responsible for the actual 
                                                payment processing. All payments are subject to our payment terms and applicable fees.
                                            </p>
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Fees and Charges</h3>
                                            <ul className="list-disc list-inside space-y-1 text-gray-700">
                                                <li>Platform usage is currently free for all users</li>
                                                <li>Payment processing fees may apply to transactions</li>
                                                <li>We reserve the right to introduce fees with 30 days notice</li>
                                                <li>All fees are clearly disclosed before transactions</li>
                                            </ul>
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Refunds and Cancellations</h3>
                                            <p className="text-gray-700 leading-relaxed">
                                                Refund policies vary by campaign type and are outlined in individual campaign terms. 
                                                Generally, refunds are not available for completed campaigns unless there is a breach of terms.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg rounded-2xl border-2 border-gray-100">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <HiDocumentText className="w-6 h-6 text-orange-600" />
                                        6. Intellectual Property
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Platform Content</h3>
                                            <p className="text-gray-700 leading-relaxed">
                                                The TickTime platform, including its design, functionality, and content, is protected by 
                                                intellectual property laws. You may not copy, modify, or distribute our platform without permission.
                                            </p>
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">User Content</h3>
                                            <p className="text-gray-700 leading-relaxed">
                                                You retain ownership of content you create and share on our platform. By using our services, 
                                                you grant us a license to use, display, and distribute your content as necessary to provide our services.
                                            </p>
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Copyright Policy</h3>
                                            <p className="text-gray-700 leading-relaxed">
                                                We respect intellectual property rights and will respond to valid copyright infringement claims. 
                                                If you believe your content has been used without permission, please contact us immediately.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg rounded-2xl border-2 border-gray-100">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <HiDocumentText className="w-6 h-6 text-orange-600" />
                                        7. Limitation of Liability
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        To the maximum extent permitted by law, TickTime shall not be liable for any indirect, incidental, 
                                        special, consequential, or punitive damages, including but not limited to:
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                                        <li>Loss of profits, data, or business opportunities</li>
                                        <li>Damages resulting from user interactions</li>
                                        <li>Service interruptions or technical issues</li>
                                        <li>Third-party actions or content</li>
                                        <li>Any other damages arising from use of our platform</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg rounded-2xl border-2 border-gray-100">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <HiDocumentText className="w-6 h-6 text-orange-600" />
                                        8. Termination
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Termination by You</h3>
                                            <p className="text-gray-700 leading-relaxed">
                                                You may terminate your account at any time by contacting our support team. 
                                                Upon termination, your access to the platform will be revoked.
                                            </p>
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Termination by Us</h3>
                                            <p className="text-gray-700 leading-relaxed">
                                                We may suspend or terminate your account if you violate these terms or engage in 
                                                prohibited activities. We will provide notice when possible.
                                            </p>
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Effect of Termination</h3>
                                            <p className="text-gray-700 leading-relaxed">
                                                Upon termination, your right to use the platform ceases immediately. 
                                                We may retain certain information as required by law or for legitimate business purposes.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg rounded-2xl border-2 border-gray-100">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <HiDocumentText className="w-6 h-6 text-orange-600" />
                                        9. Governing Law
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 leading-relaxed">
                                        These Terms of Service are governed by the laws of India. Any disputes arising from these terms 
                                        or your use of our platform will be subject to the exclusive jurisdiction of the courts in Bangalore, India.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg rounded-2xl border-2 border-gray-100">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <HiDocumentText className="w-6 h-6 text-orange-600" />
                                        10. Contact Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        If you have any questions about these Terms of Service, please contact us:
                                    </p>
                                    <div className="space-y-2 text-gray-700">
                                        <p><span className="font-semibold">Email:</span> legal@ticktime.in</p>
                                        <p><span className="font-semibold">Phone:</span> +91 98765 43210</p>
                                        <p><span className="font-semibold">Address:</span> Ground Floor, Milkat No. 203, Word N, Juno Kadiyali Road, B/h Cahamunda V, Navo Milkat No, Rajula, Amreli, Gujarat, India - 365560</p>
                                        <p><span className="font-semibold">Legal Entity:</span> TickTime Media (Proprietorship)</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* CTA */}
                        <div className="mt-12 text-center bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl p-8 text-white">
                            <h2 className="text-3xl font-bold mb-4">Questions about Terms?</h2>
                            <p className="text-xl mb-6 opacity-95">
                                Our legal team is available to clarify any questions about these terms.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button size="lg" variant="secondary" className="bg-white text-orange-600 hover:bg-gray-100">
                                    Contact Legal Team
                                </Button>
                                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-orange-600 bg-transparent">
                                    Download Terms
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
