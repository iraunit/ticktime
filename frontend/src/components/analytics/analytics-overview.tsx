"use client";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {useAnalytics} from "@/hooks/use-analytics";
import {HiArrowTrendingDown, HiArrowTrendingUp, HiBanknotes, HiCalendarDays, HiChartBar} from "react-icons/hi2";
import {Skeleton} from "@/components/ui/skeleton";
import {CollaborationHistory} from "@/types";

export function AnalyticsOverview() {
    const {earnings, collaborationHistory} = useAnalytics();

    if (earnings.isLoading || collaborationHistory.isLoading) {
        return (
            <div className="space-y-3">
                {/* Loading Header */}
                <div className="bg-white rounded-lg border shadow-sm p-3">
                    <Skeleton className="h-5 w-40 mb-2"/>
                    <Skeleton className="h-4 w-72"/>
                </div>

                {/* Loading Stats Grid */}
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({length: 6}).map((_, i) => (
                        <Card key={i} className="rounded-lg border shadow-sm">
                            <CardHeader className="p-3 pb-2">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-3 w-20"/>
                                    <Skeleton className="h-6 w-6 rounded-lg"/>
                                </div>
                            </CardHeader>
                            <CardContent className="p-3 pt-0">
                                <Skeleton className="h-6 w-12 mb-2"/>
                                <Skeleton className="h-2 w-24 mb-1"/>
                                <Skeleton className="h-1.5 w-full"/>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }


    const earningsData = earnings.data;
    const historyData = Array.isArray(collaborationHistory.data)
        ? collaborationHistory.data
        : (collaborationHistory.data?.collaborations || []);

    // Calculate additional metrics
    const totalCollaborations = historyData.length || 0;
    const totalEarnings = (earningsData as any)?.total_earnings || 0;
    const avgEarningsPerCollaboration = totalCollaborations > 0 ? totalEarnings / totalCollaborations : 0;
    const topBrand = (earningsData as any)?.top_brands?.[0];
    const monthlyEarnings = (earningsData as any)?.monthly_earnings || [];
    const currentMonthEarnings = monthlyEarnings.length > 0 ? monthlyEarnings[monthlyEarnings.length - 1]?.amount || 0 : 0;

    // Calculate success rate (completed vs total collaborations)
    const completedCollaborations = historyData.filter((collab: any) => collab.status === 'completed').length;
    const successRate = totalCollaborations > 0 ? (completedCollaborations / totalCollaborations) * 100 : 0;

    // Define colorful stat cards with gradients and responsive design
    const statCards = [
        {
            title: "Total Collaborations",
            value: totalCollaborations,
            description: "All time partnerships",
            icon: HiCalendarDays,
            iconBg: "bg-gradient-to-r from-blue-500 to-indigo-500",
            cardBg: "bg-gradient-to-br from-blue-50 to-indigo-50",
            textColor: "text-blue-800",
            border: "border-blue-200"
        },
        {
            title: "Total Earnings",
            value: `₹${totalEarnings.toLocaleString()}`,
            description: "Revenue generated",
            icon: HiBanknotes,
            iconBg: "bg-gradient-to-r from-green-500 to-emerald-500",
            cardBg: "bg-gradient-to-br from-green-50 to-emerald-50",
            textColor: "text-green-800",
            border: "border-green-200",
            trend: (earningsData as any)?.growth_metrics?.earnings_growth ? {
                value: (earningsData as any).growth_metrics.earnings_growth,
                isPositive: (earningsData as any).growth_metrics.earnings_growth > 0
            } : undefined
        },
        {
            title: "Avg per Collaboration",
            value: `₹${avgEarningsPerCollaboration.toLocaleString()}`,
            description: "Average earnings per deal",
            icon: HiChartBar,
            iconBg: "bg-gradient-to-r from-purple-500 to-pink-500",
            cardBg: "bg-gradient-to-br from-purple-50 to-pink-50",
            textColor: "text-purple-800",
            border: "border-purple-200"
        },
        {
            title: "This Month",
            value: `₹${currentMonthEarnings.toLocaleString()}`,
            description: "Current month earnings",
            icon: HiArrowTrendingUp,
            iconBg: "bg-gradient-to-r from-orange-500 to-red-500",
            cardBg: "bg-gradient-to-br from-orange-50 to-red-50",
            textColor: "text-orange-800",
            border: "border-orange-200"
        },
        {
            title: "Success Rate",
            value: `${successRate.toFixed(1)}%`,
            description: "Completed collaborations",
            icon: HiChartBar,
            iconBg: "bg-gradient-to-r from-indigo-500 to-purple-500",
            cardBg: "bg-gradient-to-br from-indigo-50 to-purple-50",
            textColor: "text-indigo-800",
            border: "border-indigo-200"
        }
    ];

    return (
        <div className="space-y-3">
            {/* Compact Section Header */}
            <div className="bg-white rounded-lg border shadow-sm p-3">
                <div className="flex items-center gap-3 mb-2">
                    <div
                        className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                        <HiChartBar className="w-4 h-4 text-white"/>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 leading-tight">Performance Overview</h2>
                        <p className="text-sm text-gray-600 leading-relaxed">Your collaboration analytics at a
                            glance</p>
                    </div>
                </div>
            </div>

            {/* Compact Stats Grid */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={index}
                              className={`rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 ${stat.cardBg} ${stat.border}`}>
                            <CardHeader className="p-3 pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xs font-medium text-gray-600 leading-tight">
                                        {stat.title}
                                    </CardTitle>
                                    <div
                                        className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-sm ${stat.iconBg}`}>
                                        <Icon className="w-3 h-3 text-white"/>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-3 pt-0">
                                <div className={`text-lg font-bold mb-1 ${stat.textColor}`}>
                                    {stat.value}
                                </div>

                                <p className="text-xs text-gray-500 mb-2 leading-tight">
                                    {stat.description}
                                </p>

                                {stat.trend && (
                                    <div className="flex items-center pt-2 border-t border-white/50">
                                        <div className={`flex items-center text-xs font-medium ${
                                            stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {stat.trend.isPositive ? (
                                                <HiArrowTrendingUp className="w-3 h-3 mr-1"/>
                                            ) : (
                                                <HiArrowTrendingDown className="w-3 h-3 mr-1"/>
                                            )}
                                            <span>{Math.abs(stat.trend.value)}%</span>
                                        </div>
                                        <span className="text-xs text-gray-500 ml-2">vs last month</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Recent Activity Section */}
            <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
                {/* Recent Collaborations */}
                <Card className="rounded-lg border shadow-sm">
                    <CardHeader className="p-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                                <HiCalendarDays className="w-3 h-3 text-white"/>
                            </div>
                            <CardTitle className="text-sm font-semibold text-gray-900">Recent Collaborations</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-3">
                        <div className="space-y-2">
                            {historyData.length > 0 ? historyData.slice(0, 5).map((collab: CollaborationHistory, index: number) => (
                                <div key={index}
                                     className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                                            {collab.brand?.name?.charAt(0) || 'B'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{collab.brand?.name || 'Brand'}</p>
                                            <p className="text-xs text-gray-500">{collab.campaign_title || 'Campaign'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-green-600">₹{collab.total_value?.toLocaleString() || 0}</p>
                                        <p className="text-xs text-gray-500">{collab.status || 'Completed'}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-6">
                                    <HiCalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-2"/>
                                    <p className="text-sm text-gray-500">No collaborations yet</p>
                                    <p className="text-xs text-gray-400">Start collaborating with brands to see your
                                        history here</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Performance Chart */}
                <Card className="rounded-lg border shadow-sm">
                    <CardHeader className="p-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
                                <HiChartBar className="w-3 h-3 text-white"/>
                            </div>
                            <CardTitle className="text-sm font-semibold text-gray-900">Performance Trend</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-3">
                        <div className="h-32">
                            {monthlyEarnings.length > 0 ? (
                                <div className="h-full flex items-end justify-between gap-1">
                                    {monthlyEarnings.slice(-6).map((month: any, index: number) => {
                                        const maxAmount = Math.max(...monthlyEarnings.map((m: any) => m.amount));
                                        const hasEarnings = month.amount > 0;

                                        // Calculate height - ensure minimum visible height
                                        let height;
                                        if (hasEarnings) {
                                            height = maxAmount > 0 ? (month.amount / maxAmount) * 100 : 0;
                                            height = Math.max(height, 20); // Minimum 20% for earnings
                                        } else {
                                            height = 8; // Small bar for zero earnings
                                        }

                                        return (
                                            <div key={index} className="flex-1 flex flex-col items-center h-full">
                                                <div className="flex-1 flex items-end w-full">
                                                    <div
                                                        className={`w-full rounded-t-sm transition-all duration-300 ${
                                                            hasEarnings
                                                                ? 'bg-gradient-to-t from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500'
                                                                : 'bg-gradient-to-t from-gray-300 to-gray-400'
                                                        }`}
                                                        style={{height: `${height}%`}}
                                                    />
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1 text-center">
                                                    {new Date(month.month + '-01').toLocaleDateString('en-US', {month: 'short'})}
                                                </div>
                                                {hasEarnings && (
                                                    <div className="text-xs text-green-600 font-medium mt-1">
                                                        ₹{month.amount.toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center bg-gray-50 rounded-md">
                                    <div className="text-center">
                                        <div className="w-8 h-8 bg-gray-300 rounded-full mx-auto mb-2"></div>
                                        <p className="text-xs text-gray-500">No data available</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}