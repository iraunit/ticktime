"use client";

import {useState} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {MainLayout} from "@/components/layout/main-layout";
import {Button} from "@/components/ui/button";
import {HiArrowLeft, HiChevronDown, HiChevronUp, HiQuestionMarkCircle} from "react-icons/hi2";
import Link from "next/link";
import {SupportQueryDialog} from "@/components/support/support-query-dialog";

interface FAQItem {
    question: string;
    answer: string;
    category: string;
}

const faqData: FAQItem[] = [
    // About TickTime - First Question
    {
        question: "What is TickTime?",
        answer: "TickTime is an all-in-one influencer marketing dashboard that helps brands discover influencers, manage barter campaigns, track deliverables, and analyze performance — all in one place.",
        category: "About TickTime"
    },

    // Business Priority Questions
    {
        question: "How will TickTime help in finishing my campaign?",
        answer: "TickTime automates your entire influencer campaign from start to finish. Once you add your campaign details and select creators, the platform handles: Sending collaboration invites, Tracking acceptance & rejections, Managing conversations, Monitoring product dispatch, Following up with influencers for deliverables, Collecting reels/posts automatically, Showing real-time progress in your dashboard. You get a complete workflow where every step is recorded, tracked, and automated — removing 90% of manual work and ensuring your campaign finishes smoothly and on time.",
        category: "Features & Capabilities"
    },
    {
        question: "Will the brand get an account manager for assistance?",
        answer: "Yes. Every brand receives a dedicated account manager who will help with: Onboarding & dashboard walkthrough, Campaign setup guidance, Influencer selection support, Monitoring deliverables, Solving issues faced by creators or the brand, Ensuring timely completion of campaigns. Your account manager works as your extended team member, making sure your campaign runs successfully without confusion or delays.",
        category: "For Brands"
    },
    {
        question: "Is TickTime free to use?",
        answer: "Yes. We offer a free trial for brands to explore all features before upgrading to a paid plan.",
        category: "Pricing & Plans"
    },
    {
        question: "What happens after the free trial ends?",
        answer: "Your campaign data stays safe. You can upgrade anytime to continue managing influencers and tracking deliverables.",
        category: "Pricing & Plans"
    },
    {
        question: "Can I run 1,000–5,000 influencer campaigns?",
        answer: "Yes. TickTime is built for volume. Whether it's 100 creators or 10,000, the system can handle it.",
        category: "For Brands"
    },
    {
        question: "Who should use TickTime?",
        answer: "D2C brands, Agencies, Startups, Marketplace sellers, Founders, Product-led businesses. Basically anyone who uses influencer marketing at scale.",
        category: "For Brands"
    },
    {
        question: "What industries use TickTime?",
        answer: "Brands from beauty, fashion, F&B, D2C, personal care, fitness, gadgets, and lifestyle use TickTime daily.",
        category: "For Brands"
    },
    {
        question: "Is TickTime better than manual agencies?",
        answer: "Yes. You get: No delays, Real-time tracking, Zero miscommunication, Full transparency, Direct influencer access, Data-driven decisions.",
        category: "About TickTime"
    },
    {
        question: "Do you provide campaign execution support?",
        answer: "Yes. We offer additional support like: Manual follow-ups, Tracking creatives, Ensuring deliveries, Resolving influencer queries.",
        category: "For Brands"
    },
    {
        question: "Can TickTime help with creation, content, and script writing for better engagement?",
        answer: "Yes. TickTime provides full support for brands that want high-performing creator content. Along with campaign automation, we offer: A dedicated Account Manager- expert for Influencer marketing, scripts and industry standards, Creative strategy support, Ready-to-use content ideas tailored to your product, Script writing for reels, videos, and product showcases, Brand-aligned messaging so creators communicate exactly what you need, Engagement-optimized formats that have a higher chance of going viral. Our creative team studies your product, audience, and objectives, then prepares scripts and idea boards that creators can easily follow. This ensures more consistent content quality and stronger campaign results.",
        category: "For Brands"
    },
    {
        question: "How does TickTime help brands?",
        answer: "TickTime eliminates manual WhatsApp follow-ups, spreadsheets, and agency delays. You get: Verified influencer data, Automated tracking, Centralized chat, Campaign progress updates, Performance analytics.",
        category: "About TickTime"
    },

    // Features & Capabilities
    {
        question: "How do brands discover influencers?",
        answer: "You can search influencers by niche, city, follower range, pricing model, or product category — with full profile links and data.",
        category: "Features & Capabilities"
    },
    {
        question: "Does TickTime support barter collaborations?",
        answer: "Absolutely. TickTime is optimized for high-volume barter campaigns, where brands send products and influencers deliver reels, stories, or posts.",
        category: "Features & Capabilities"
    },
    {
        question: "Does TickTime track deliverables?",
        answer: "Yes. Our dashboard lets you track: Deliverables submitted, Pending content, Influencers who haven't delivered, Uploaded reels/links/screenshots.",
        category: "Features & Capabilities"
    },
    {
        question: "How does follow-up automation work?",
        answer: "You can trigger reminders or messages to influencers who have not delivered content after receiving products.",
        category: "Features & Capabilities"
    },
    {
        question: "Does TickTime provide influencer contact details?",
        answer: "Yes — influencer profiles include: Instagram link, Phone number (when available), Email (when available), City, category & past collaboration history.",
        category: "Features & Capabilities"
    },
    {
        question: "Can multiple team members use the dashboard?",
        answer: "Yes, you can add team members for collaboration.",
        category: "Features & Capabilities"
    },
    {
        question: "Does TickTime support paid collaborations also?",
        answer: "Yes. Even though we are optimized for barter at scale, you can manage paid campaigns the same way.",
        category: "Features & Capabilities"
    },
    {
        question: "How secure is my data?",
        answer: "All your brand, influencer, and campaign data is encrypted and stored securely.",
        category: "Features & Capabilities"
    },
    {
        question: "Can I export campaign reports?",
        answer: "Yes. You can download influencer lists, deliverable reports, engagement reports, and more.",
        category: "Features & Capabilities"
    },

    // Getting Started
    {
        question: "Can influencers register on TickTime?",
        answer: "Yes. Influencers can register through our portal to receive barter and paid campaign opportunities from brands.",
        category: "Getting Started"
    },
    {
        question: "How long does onboarding take?",
        answer: "Less than 10 minutes. You can import your influencer list or use our discovery tool immediately.",
        category: "Getting Started"
    }
];

const categories = ["All", "About TickTime", "Pricing & Plans", "Features & Capabilities", "Getting Started", "For Brands"];

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
