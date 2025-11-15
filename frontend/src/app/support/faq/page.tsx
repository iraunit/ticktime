"use client";

import {useState} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {MainLayout} from "@/components/layout/main-layout";
import {Button} from "@/components/ui/button";
import {HiArrowLeft, HiChevronDown, HiChevronUp, HiQuestionMarkCircle} from "react-icons/hi2";
import Link from "next/link";
import {SupportQueryDialog} from "@/components/support/support-query-dialog";
import {SUPPORT_CONTACT} from "@/constants/support";

interface FAQItem {
    question: string;
    answer: string;
    category: string;
}

const faqData: FAQItem[] = [
    // Getting Started
    {
        question: "How do I create an account on TickTime?",
        answer: "Creating an account is simple! Click on 'Get Started Free' on our homepage, choose whether you're a brand or influencer, fill in your basic information, and verify your email address. The entire process takes less than 5 minutes.",
        category: "Getting Started"
    },
    {
        question: "Is TickTime free to use?",
        answer: "Yes! TickTime is completely free for both brands and influencers. We don't charge any subscription fees, setup costs, or hidden charges. You only pay for the campaigns you create or participate in.",
        category: "Getting Started"
    },
    {
        question: "What information do I need to provide during signup?",
        answer: "For influencers: Basic profile info, social media handles, follower counts, and content categories. For brands: Company details, industry, and campaign preferences. We keep all information secure and private.",
        category: "Getting Started"
    },

    // For Influencers
    {
        question: "How do I find campaigns that match my content?",
        answer: "Our smart matching algorithm automatically shows you relevant campaigns based on your content categories, follower count, engagement rate, and location. You can also browse all available campaigns and use filters to find exactly what you're looking for.",
        category: "For Influencers"
    },
    {
        question: "How do I get paid for campaigns?",
        answer: "Once you complete a campaign and the brand approves your content, payment is processed automatically. We support UPI, bank transfers, and digital wallets. Payments are typically processed within 3-5 business days.",
        category: "For Influencers"
    },
    {
        question: "What types of campaigns are available?",
        answer: "We offer three types of campaigns: Cash campaigns (direct payment), Barter campaigns (free products in exchange for content), and Hybrid campaigns (combination of cash and products). You can choose which types you want to participate in.",
        category: "For Influencers"
    },
    {
        question: "How do I track my earnings and performance?",
        answer: "Your dashboard shows detailed analytics including total earnings, campaign performance, engagement rates, and growth trends. You can view monthly, quarterly, and yearly reports to track your progress.",
        category: "For Influencers"
    },

    // For Brands
    {
        question: "How do I create a campaign?",
        answer: "Go to your brand dashboard, click 'Create Campaign', fill in campaign details (title, description, budget, target audience), set requirements, and publish. Our system will then match you with suitable influencers.",
        category: "For Brands"
    },
    {
        question: "How do I find the right influencers for my brand?",
        answer: "Use our advanced search filters to find influencers by platform, follower count, engagement rate, location, content categories, and more. You can also browse our curated lists of top-performing creators.",
        category: "For Brands"
    },
    {
        question: "What's the difference between cash, barter, and hybrid campaigns?",
        answer: "Cash campaigns pay influencers directly in money. Barter campaigns provide free products in exchange for content. Hybrid campaigns combine both cash payment and free products. Choose based on your budget and campaign goals.",
        category: "For Brands"
    },
    {
        question: "How do I track campaign performance?",
        answer: "Our analytics dashboard provides detailed insights into campaign reach, engagement, conversions, and ROI. You can track individual influencer performance and overall campaign success in real-time.",
        category: "For Brands"
    },

    // Technical Support
    {
        question: "I'm having trouble logging in. What should I do?",
        answer: `First, make sure you're using the correct email and password. If you've forgotten your password, use the 'Forgot Password' link. If you're still having issues, contact our support team at ${SUPPORT_CONTACT.email}`,
        category: "Technical Support"
    },
    {
        question: "Is there a mobile app available?",
        answer: "Yes! Our mobile app is available for both iOS and Android. You can download it from the App Store or Google Play Store. The app provides full functionality for managing campaigns and collaborations on the go.",
        category: "Technical Support"
    },
    {
        question: "What browsers are supported?",
        answer: "TickTime works on all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your preferred browser for the best experience.",
        category: "Technical Support"
    },

    // Account & Billing
    {
        question: "How do I update my payment information?",
        answer: "Go to your account settings, click on 'Payment Methods', and add or update your payment details. We support UPI, credit/debit cards, and net banking for secure transactions.",
        category: "Account & Billing"
    },
    {
        question: "Can I change my account type from influencer to brand?",
        answer: "Yes, you can switch between account types, but you'll need to complete the verification process for the new account type. Contact support for assistance with account type changes.",
        category: "Account & Billing"
    },
    {
        question: "How do I delete my account?",
        answer: "To delete your account, go to account settings and click 'Delete Account'. Please note that this action is irreversible and will remove all your data, campaigns, and collaborations.",
        category: "Account & Billing"
    }
];

const categories = ["All", "Getting Started", "For Influencers", "For Brands", "Technical Support", "Account & Billing"];

export default function FAQPage() {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [expandedItems, setExpandedItems] = useState<number[]>([]);

    const filteredFAQs = selectedCategory === "All"
        ? faqData
        : faqData.filter(item => item.category === selectedCategory);

    const toggleExpanded = (index: number) => {
        setExpandedItems(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    return (
        <MainLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="mb-8">
                            <Button variant="ghost" asChild className="mb-6">
                                <Link href="/support" className="flex items-center gap-2">
                                    <HiArrowLeft className="w-4 h-4"/>
                                    Back to Support
                                </Link>
                            </Button>

                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 relative">
                                <span className="relative">
                                    Frequently Asked Questions
                                    <div
                                        className="absolute -top-2 -right-8 w-8 h-8 bg-yellow-300 rounded-full opacity-60 transform rotate-12"></div>
                                </span>
                            </h1>
                            <p className="text-xl text-gray-700 font-medium">
                                Find quick answers to common questions about using TickTime.
                            </p>
                        </div>

                        {/* Category Filter */}
                        <div className="mb-8">
                            <div className="flex flex-wrap gap-3">
                                {categories.map((category) => (
                                    <Button
                                        key={category}
                                        variant={selectedCategory === category ? "default" : "outline"}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`rounded-full ${
                                            selectedCategory === category
                                                ? "bg-orange-600 hover:bg-orange-700"
                                                : "border-orange-300 text-orange-700 hover:bg-orange-50"
                                        }`}
                                    >
                                        {category}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* FAQ Items */}
                        <div className="space-y-4">
                            {filteredFAQs.map((faq, index) => (
                                <Card key={index}
                                      className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl border-2 border-gray-100">
                                    <CardHeader
                                        className="cursor-pointer"
                                        onClick={() => toggleExpanded(index)}
                                    >
                                        <CardTitle
                                            className="text-lg font-bold text-gray-900 flex items-center justify-between">
                                            <span className="flex items-center gap-3">
                                                <HiQuestionMarkCircle className="w-5 h-5 text-orange-600"/>
                                                {faq.question}
                                            </span>
                                            {expandedItems.includes(index) ? (
                                                <HiChevronUp className="w-5 h-5 text-gray-500"/>
                                            ) : (
                                                <HiChevronDown className="w-5 h-5 text-gray-500"/>
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    {expandedItems.includes(index) && (
                                        <CardContent className="pt-0">
                                            <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                                        </CardContent>
                                    )}
                                </Card>
                            ))}
                        </div>

                        {/* Still Need Help */}
                        <div
                            className="mt-12 text-center bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl p-8 text-white">
                            <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
                            <p className="text-xl mb-6 opacity-95">
                                Can't find what you're looking for? Our support team is here to help.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button
                                    asChild
                                    size="lg"
                                    variant="secondary"
                                    className="bg-white text-orange-600 hover:bg-gray-100"
                                >
                                    <Link href="/support/chat">
                                        Contact Support
                                    </Link>
                                </Button>
                                <SupportQueryDialog
                                    source="support_faq"
                                    title="Chat with Support"
                                    description="Tell us more about your question and we'll respond shortly."
                                    trigger={
                                        <Button
                                            type="button"
                                            size="lg"
                                            variant="outline"
                                            className="border-2 border-white text-white hover:bg-white hover:text-orange-600 bg-transparent"
                                        >
                                            Live Chat
                                        </Button>
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
