"use client";

import {useEffect} from "react";
import {Card} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {StatsCard} from "@/components/dashboard/stats-card";
import {
    HiArrowPath,
    HiBriefcase,
    HiChartBar,
    HiCheckCircle,
    HiClock,
    HiExclamationTriangle,
    HiEye,
    HiHandRaised,
    HiMegaphone,
    HiUsers
} from "react-icons/hi2";
import {useBrandDashboard} from "@/hooks/use-brand-dashboard";
import {useUserContext} from "@/components/providers/app-providers";
import {toast} from "@/lib/toast";

import {useRouter} from "next/navigation";

export default function BrandDashboard() {
    const {user} = useUserContext();
    const {stats, recentDeals} = useBrandDashboard();
    const router = useRouter();

    // Remove auto-refresh to prevent infinite loops on API errors

    const handleRefresh = () => {
        stats.refetch();
        recentDeals.refetch();
        toast.success("Dashboard refreshed");
    };

    // Quick action handlers
    const handleCreateCampaign = () => {
        router.push('/brand/campaigns/create');
    };

    const handleSearchInfluencers = () => {
        router.push('/brand/influencers');
    };

    const handleReviewContent = () => {
        router.push('/brand/reviews');
    };

    const handleViewAnalytics = () => {
        router.push('/brand/analytics');
    };

    // Show error toasts when API calls fail
    useEffect(() => {
        if (stats.error) {
            toast.error(stats.error.message || 'Failed to load dashboard statistics');
        }
        if (recentDeals.error) {
            toast.error(recentDeals.error.message || 'Failed to load recent deals');
        }
    }, [stats.error, recentDeals.error]);

    // Error handling - show loading state instead of full error page
    // const hasError = stats.error || recentDeals.error;

    const userName = user?.first_name || user?.brand_profile?.brand_name || 'Brand';
    const currentHour = new Date().getHours();
    const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

    // Format brand-specific stats
    const brandStats = stats.data || {};
    const statsData = [
        {
            title: "Total Campaigns",
            value: brandStats.total_campaigns || 0,
            icon: HiMegaphone,
            description: "All campaigns created",
        },
        {
            title: "Active Campaigns",
            value: brandStats.active_campaigns || 0,
            icon: HiClock,
            description: "Currently running campaigns",
        },
        {
            title: "Total Deals",
            value: brandStats.total_deals || 0,
            icon: HiBriefcase,
            description: "All collaborations",
        },
        {
            title: "Active Deals",
            value: brandStats.active_deals || 0,
            icon: HiUsers,
            description: "Ongoing collaborations",
        },
        {
            title: "Completed Deals",
            value: brandStats.completed_deals || 0,
            icon: HiCheckCircle,
            description: "Successfully finished",
        },
        {
            title: "Pending Reviews",
            value: brandStats.pending_content || 0,
            icon: HiExclamationTriangle,
            description: "Content awaiting review",
        },
    ];

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-4 max-w-7xl">
                {/* Compact Header */}
                <div className="relative mb-6">
                    {/* Background decoration */}
                    <div
                        className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 rounded-xl -m-2"></div>

                    <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-1 flex items-center gap-2">
                                {greeting}, {userName}!
                                <div
                                    className="w-6 h-6 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                                    <HiHandRaised className="w-3 h-3 text-white"/>
                                </div>
                            </h1>
                            <p className="text-sm text-gray-600 max-w-2xl">
                                Manage your campaigns and track influencer collaborations with our comprehensive brand
                                dashboard.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs text-gray-500">Last updated</p>
                                <p className="text-xs font-medium text-gray-700">
                                    {new Date().toLocaleTimeString()}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={stats.isLoading}
                                className="border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 rounded-lg px-4 py-2"
                            >
                                <HiArrowPath className="h-4 w-4 mr-1"/>
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Compact Stats Grid */}
                <div className="mb-6">
                    <div className="flex items-center mb-3">
                        <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full mr-3"></div>
                        <h2 className="text-lg font-bold text-gray-900">Campaign Overview</h2>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        {statsData.map((stat, index) => (
                            <StatsCard
                                key={index}
                                title={stat.title}
                                value={stat.value}
                                description={stat.description}
                                icon={stat.icon}
                            />
                        ))}
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-4">
                    {/* Left Column - Quick Actions */}
                    <div className="lg:col-span-2 order-2 lg:order-1">
                        <div className="flex items-center mb-3">
                            <div
                                className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-green-500 rounded-full mr-3"></div>
                            <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
                        </div>
                        <Card
                            className="p-6 bg-gradient-to-br from-white via-white to-gray-50 border border-gray-200 shadow-md">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Button
                                    onClick={handleCreateCampaign}
                                    className="w-full justify-start bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md"
                                >
                                    <HiMegaphone className="w-4 h-4 mr-2"/>
                                    Create Campaign
                                </Button>
                                <Button
                                    onClick={handleSearchInfluencers}
                                    variant="outline"
                                    className="w-full justify-start border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                                >
                                    <HiUsers className="w-4 h-4 mr-2"/>
                                    Search Influencers
                                </Button>
                                <Button
                                    onClick={handleReviewContent}
                                    variant="outline"
                                    className="w-full justify-start border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                                >
                                    <HiEye className="w-4 h-4 mr-2"/>
                                    Review Content ({brandStats.pending_content || 0})
                                </Button>
                                <Button
                                    onClick={handleViewAnalytics}
                                    variant="outline"
                                    className="w-full justify-start border-green-200 hover:bg-green-50 hover:border-green-300"
                                >
                                    <HiChartBar className="w-4 h-4 mr-2"/>
                                    View Analytics
                                </Button>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column - Recent Activity & Profile */}
                    <div className="lg:col-span-2 space-y-4 order-1 lg:order-2">
                        <div>
                            <div className="flex items-center mb-3">
                                <div
                                    className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full mr-3"></div>
                                <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
                            </div>
                            <Card
                                className="p-6 bg-gradient-to-br from-white via-white to-purple-50/30 border border-purple-100 shadow-md">
                                {recentDeals.isLoading ? (
                                    <div className="space-y-3">
                                        {Array.from({length: 3}).map((_, i) => (
                                            <div key={i}
                                                 className="h-16 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-pulse rounded-lg relative overflow-hidden">
                                                <div
                                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12 animate-shimmer"></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : recentDeals.data && recentDeals.data.length > 0 ? (
                                    <div className="space-y-3">
                                        {recentDeals.data.slice(0, 3).map((deal: any, index: number) => (
                                            <div key={index}
                                                 className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                                                <div className="flex items-center space-x-3">
                                                    {deal.influencer?.profile_image ? (
                                                        <div className="w-10 h-10 rounded-lg overflow-hidden">
                                                            <img
                                                                src={deal.influencer.profile_image}
                                                                alt={deal.influencer.username || 'Influencer'}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                                                            <span className="text-sm font-bold text-blue-600">
                                                                {deal.influencer?.username?.charAt(0) || '?'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{deal.campaign?.title || 'New Deal'}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {deal.influencer?.username || 'Influencer'} • {deal.status}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant={deal.status === 'active' ? 'default' : 'secondary'}
                                                       className="text-xs">
                                                    {deal.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div
                                            className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <HiBriefcase className="w-6 h-6 text-gray-400"/>
                                        </div>
                                        <p className="text-sm text-gray-500">No recent activity</p>
                                        <p className="text-xs text-gray-400 mt-1">Start by creating your first
                                            campaign</p>
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* Brand Profile Summary */}
                        <div>
                            <div className="flex items-center mb-3">
                                <div
                                    className="w-1 h-6 bg-gradient-to-b from-orange-500 to-red-500 rounded-full mr-3"></div>
                                <h2 className="text-lg font-bold text-gray-900">Profile Status</h2>
                            </div>
                            <Card
                                className="p-6 bg-gradient-to-br from-white via-white to-orange-50/30 border border-orange-100 shadow-md">
                                <div className="flex items-center space-x-4">
                                    <div
                                        className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-md">
                                        <span className="text-white font-bold text-lg">{userName.charAt(0)}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">{userName}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="default" className="text-xs">
                                                {user?.brand_profile?.role || 'Brand User'}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                Brand Account
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 