"use client";

import {useState} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {MainLayout} from "@/components/layout/main-layout";
import {Button} from "@/components/ui/button";
import {HiArrowLeft, HiArrowTopRightOnSquare, HiChevronDown, HiChevronUp, HiDocumentText} from "react-icons/hi2";
import Link from "next/link";

interface DocSection {
    title: string;
    description: string;
    articles: DocArticle[];
}

interface DocArticle {
    title: string;
    description: string;
    content: string;
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    estimatedTime: string;
}

const docSections: DocSection[] = [
    {
        title: "Getting Started",
        description: "Learn the basics of using TickTime",
        articles: [
            {
                title: "Creating Your First Account",
                description: "Step-by-step guide to setting up your TickTime account",
                content: "This comprehensive guide will walk you through creating your TickTime account, whether you're a brand or an influencer. Learn about profile setup, verification, and initial configuration.",
                difficulty: "Beginner",
                estimatedTime: "5 min read"
            },
            {
                title: "Profile Setup for Influencers",
                description: "Complete your influencer profile to attract the right brands",
                content: "Learn how to create a compelling influencer profile that showcases your content, audience, and engagement metrics. This guide covers social media integration, bio writing, and portfolio setup.",
                difficulty: "Beginner",
                estimatedTime: "10 min read"
            },
            {
                title: "Brand Account Setup",
                description: "Set up your brand profile for successful campaigns",
                content: "Discover how to create an effective brand profile that attracts quality influencers. Learn about company information, campaign preferences, and brand verification.",
                difficulty: "Beginner",
                estimatedTime: "8 min read"
            }
        ]
    },
    {
        title: "For Influencers",
        description: "Everything influencers need to know",
        articles: [
            {
                title: "Finding and Applying to Campaigns",
                description: "How to discover and apply to campaigns that match your content",
                content: "Master the art of finding relevant campaigns using our search and filtering tools. Learn about application strategies, proposal writing, and increasing your acceptance rate.",
                difficulty: "Intermediate",
                estimatedTime: "12 min read"
            },
            {
                title: "Managing Your Deals",
                description: "Track and manage your collaborations effectively",
                content: "Learn how to manage your deals from application to completion. This includes tracking deadlines, communicating with brands, and ensuring successful campaign delivery.",
                difficulty: "Intermediate",
                estimatedTime: "15 min read"
            },
            {
                title: "Understanding Analytics",
                description: "Make sense of your performance data and earnings",
                content: "Deep dive into your analytics dashboard to understand your performance metrics, earnings trends, and growth opportunities. Learn how to use data to improve your content strategy.",
                difficulty: "Advanced",
                estimatedTime: "20 min read"
            },
            {
                title: "Payment and Payouts",
                description: "Everything about getting paid on TickTime",
                content: "Complete guide to payment methods, payout schedules, tax considerations, and troubleshooting payment issues. Learn about UPI, bank transfers, and digital wallet options.",
                difficulty: "Intermediate",
                estimatedTime: "10 min read"
            }
        ]
    },
    {
        title: "For Brands",
        description: "Campaign management and influencer discovery",
        articles: [
            {
                title: "Creating Your First Campaign",
                description: "Step-by-step guide to launching a successful campaign",
                content: "Learn how to create compelling campaigns that attract the right influencers. This guide covers campaign planning, budget setting, requirements definition, and launch strategies.",
                difficulty: "Beginner",
                estimatedTime: "15 min read"
            },
            {
                title: "Finding the Right Influencers",
                description: "Use advanced search to discover perfect brand matches",
                content: "Master our influencer discovery tools to find creators who align with your brand values and target audience. Learn about filtering, evaluation criteria, and outreach strategies.",
                difficulty: "Intermediate",
                estimatedTime: "18 min read"
            },
            {
                title: "Campaign Management Best Practices",
                description: "Manage your campaigns for maximum success",
                content: "Discover proven strategies for managing influencer campaigns from start to finish. Learn about communication, content approval, performance tracking, and relationship building.",
                difficulty: "Advanced",
                estimatedTime: "25 min read"
            },
            {
                title: "Measuring Campaign ROI",
                description: "Track and analyze your campaign performance",
                content: "Learn how to measure the success of your influencer campaigns using our analytics tools. Understand key metrics, ROI calculation, and optimization strategies.",
                difficulty: "Advanced",
                estimatedTime: "20 min read"
            }
        ]
    },
    {
        title: "Platform Features",
        description: "Master all TickTime features",
        articles: [
            {
                title: "Messaging System",
                description: "Communicate effectively with brands and influencers",
                content: "Learn how to use our built-in messaging system for seamless communication. This includes best practices, file sharing, and maintaining professional relationships.",
                difficulty: "Beginner",
                estimatedTime: "8 min read"
            },
            {
                title: "Advanced Search and Filters",
                description: "Find exactly what you're looking for with powerful search tools",
                content: "Master our advanced search capabilities to find the perfect matches. Learn about all available filters, search strategies, and optimization techniques.",
                difficulty: "Intermediate",
                estimatedTime: "12 min read"
            },
            {
                title: "Bookmarking and Favorites",
                description: "Save and organize your favorite creators and campaigns",
                content: "Learn how to use bookmarking features to organize your favorite influencers and campaigns. Discover tips for building and managing your lists effectively.",
                difficulty: "Beginner",
                estimatedTime: "6 min read"
            },
            {
                title: "Mobile App Guide",
                description: "Make the most of our mobile application",
                content: "Complete guide to using the TickTime mobile app. Learn about key features, navigation, offline capabilities, and mobile-specific tips and tricks.",
                difficulty: "Beginner",
                estimatedTime: "10 min read"
            }
        ]
    },
    {
        title: "Troubleshooting",
        description: "Solve common issues and problems",
        articles: [
            {
                title: "Login and Account Issues",
                description: "Resolve common login and account problems",
                content: "Troubleshoot login issues, password problems, account verification, and other common account-related problems. Find solutions to get you back on track quickly.",
                difficulty: "Beginner",
                estimatedTime: "8 min read"
            },
            {
                title: "Payment and Billing Problems",
                description: "Fix payment issues and billing concerns",
                content: "Resolve payment processing issues, billing disputes, refund requests, and other financial problems. Learn about common causes and solutions.",
                difficulty: "Intermediate",
                estimatedTime: "10 min read"
            },
            {
                title: "Technical Issues",
                description: "Solve browser, app, and connectivity problems",
                content: "Troubleshoot technical issues including browser compatibility, app crashes, slow loading, and connectivity problems. Get your platform running smoothly.",
                difficulty: "Intermediate",
                estimatedTime: "12 min read"
            }
        ]
    }
];

export default function DocsPage() {
    const [expandedSections, setExpandedSections] = useState<number[]>([]);
    const [expandedArticles, setExpandedArticles] = useState<{ [key: string]: boolean }>({});

    const toggleSection = (index: number) => {
        setExpandedSections(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const toggleArticle = (sectionIndex: number, articleIndex: number) => {
        const key = `${sectionIndex}-${articleIndex}`;
        setExpandedArticles(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "Beginner":
                return "bg-green-100 text-green-800";
            case "Intermediate":
                return "bg-yellow-100 text-yellow-800";
            case "Advanced":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <MainLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
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
                                    Documentation
                                    <div
                                        className="absolute -top-2 -right-8 w-8 h-8 bg-yellow-300 rounded-full opacity-60 transform rotate-12"></div>
                                </span>
                            </h1>
                            <p className="text-xl text-gray-700 font-medium">
                                Comprehensive guides and tutorials for all TickTime features.
                            </p>
                        </div>

                        {/* Documentation Sections */}
                        <div className="space-y-6">
                            {docSections.map((section, sectionIndex) => (
                                <Card key={sectionIndex}
                                      className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl border-2 border-gray-100">
                                    <CardHeader
                                        className="cursor-pointer"
                                        onClick={() => toggleSection(sectionIndex)}
                                    >
                                        <CardTitle
                                            className="text-2xl font-bold text-gray-900 flex items-center justify-between">
                                            <span className="flex items-center gap-3">
                                                <HiDocumentText className="w-6 h-6 text-orange-600"/>
                                                {section.title}
                                            </span>
                                            {expandedSections.includes(sectionIndex) ? (
                                                <HiChevronUp className="w-6 h-6 text-gray-500"/>
                                            ) : (
                                                <HiChevronDown className="w-6 h-6 text-gray-500"/>
                                            )}
                                        </CardTitle>
                                        <p className="text-gray-600 font-medium">{section.description}</p>
                                    </CardHeader>

                                    {expandedSections.includes(sectionIndex) && (
                                        <CardContent className="pt-0">
                                            <div className="space-y-4">
                                                {section.articles.map((article, articleIndex) => (
                                                    <Card key={articleIndex}
                                                          className="border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl border border-gray-200">
                                                        <CardHeader
                                                            className="cursor-pointer"
                                                            onClick={() => toggleArticle(sectionIndex, articleIndex)}
                                                        >
                                                            <CardTitle
                                                                className="text-lg font-bold text-gray-900 flex items-center justify-between">
                                                                <span>{article.title}</span>
                                                                {expandedArticles[`${sectionIndex}-${articleIndex}`] ? (
                                                                    <HiChevronUp className="w-5 h-5 text-gray-500"/>
                                                                ) : (
                                                                    <HiChevronDown className="w-5 h-5 text-gray-500"/>
                                                                )}
                                                            </CardTitle>
                                                            <p className="text-gray-600">{article.description}</p>
                                                            <div className="flex items-center gap-4 mt-2">
                                                                <span
                                                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(article.difficulty)}`}>
                                                                    {article.difficulty}
                                                                </span>
                                                                <span
                                                                    className="text-sm text-gray-500">{article.estimatedTime}</span>
                                                            </div>
                                                        </CardHeader>

                                                        {expandedArticles[`${sectionIndex}-${articleIndex}`] && (
                                                            <CardContent className="pt-0">
                                                                <p className="text-gray-700 leading-relaxed mb-4">{article.content}</p>
                                                                <Button variant="outline"
                                                                        className="border-orange-300 text-orange-700 hover:bg-orange-50">
                                                                    <HiArrowTopRightOnSquare className="w-4 h-4 mr-2"/>
                                                                    Read Full Article
                                                                </Button>
                                                            </CardContent>
                                                        )}
                                                    </Card>
                                                ))}
                                            </div>
                                        </CardContent>
                                    )}
                                </Card>
                            ))}
                        </div>

                        {/* Additional Resources */}
                        <div className="mt-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Additional Resources</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Card
                                    className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl border-2 border-orange-100">
                                    <CardContent className="p-6 text-center">
                                        <HiDocumentText className="w-12 h-12 text-orange-600 mx-auto mb-4"/>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">Video Tutorials</h3>
                                        <p className="text-gray-600 mb-4">Watch step-by-step video guides for all major
                                            features</p>
                                        <Button variant="outline"
                                                className="border-orange-300 text-orange-700 hover:bg-orange-50">
                                            Watch Videos
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card
                                    className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl border-2 border-blue-100">
                                    <CardContent className="p-6 text-center">
                                        <HiDocumentText className="w-12 h-12 text-blue-600 mx-auto mb-4"/>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">API Documentation</h3>
                                        <p className="text-gray-600 mb-4">Technical documentation for developers and
                                            integrations</p>
                                        <Button variant="outline"
                                                className="border-blue-300 text-blue-700 hover:bg-blue-50">
                                            View API Docs
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card
                                    className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl border-2 border-green-100">
                                    <CardContent className="p-6 text-center">
                                        <HiDocumentText className="w-12 h-12 text-green-600 mx-auto mb-4"/>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">Best Practices</h3>
                                        <p className="text-gray-600 mb-4">Learn proven strategies for success on
                                            TickTime</p>
                                        <Button variant="outline"
                                                className="border-green-300 text-green-700 hover:bg-green-50">
                                            Read Guide
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Help CTA */}
                        <div
                            className="mt-12 text-center bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl p-8 text-white">
                            <h2 className="text-3xl font-bold mb-4">Need More Help?</h2>
                            <p className="text-xl mb-6 opacity-95">
                                Can't find what you're looking for? Our support team is ready to assist you.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button size="lg" variant="secondary"
                                        className="bg-white text-orange-600 hover:bg-gray-100">
                                    Contact Support
                                </Button>
                                <Button size="lg" variant="outline"
                                        className="border-2 border-white text-white hover:bg-white hover:text-orange-600 bg-transparent">
                                    Live Chat
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
