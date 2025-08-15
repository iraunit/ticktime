"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalytics } from "@/hooks/use-analytics";
import { 
  HiArrowTrendingUp, 
  HiArrowTrendingDown,
  HiUsers, 
  HiBanknotes, 
  HiTrophy,
  HiCalendarDays,
  HiStar,
  HiChartBar
} from "react-icons/hi2";
import { Skeleton } from "@/components/ui/skeleton";
import { CollaborationHistory } from "@/types";

export function AnalyticsOverview() {
  const { performance, earnings, collaborationHistory } = useAnalytics();

  if (performance.isLoading || earnings.isLoading || collaborationHistory.isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Loading Header */}
        <div className="bg-white rounded-xl border shadow-lg p-4 sm:p-6">
          <Skeleton className="h-5 sm:h-6 w-40 sm:w-48 mb-2" />
          <Skeleton className="h-4 w-72 sm:w-96" />
        </div>
        
        {/* Loading Stats Grid */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="rounded-xl border shadow-lg">
              <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                  <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg" />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 mb-2 sm:mb-3" />
                <Skeleton className="h-2 sm:h-3 w-24 sm:w-32 mb-1 sm:mb-2" />
                <Skeleton className="h-1.5 sm:h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const performanceData = performance.data;
  const earningsData = earnings.data;
  const historyData = collaborationHistory.data;

  // Define colorful stat cards with gradients and responsive design
  const statCards = [
    {
      title: "Total Collaborations",
      value: performanceData?.total_collaborations || 0,
      description: "All time partnerships",
      icon: HiCalendarDays,
      iconBg: "bg-gradient-to-r from-blue-500 to-indigo-500",
      cardBg: "bg-gradient-to-br from-blue-50 to-indigo-50",
      textColor: "text-blue-800",
      border: "border-blue-200",
      trend: performanceData?.growth_metrics?.deals_growth ? {
        value: performanceData.growth_metrics.deals_growth,
        isPositive: performanceData.growth_metrics.deals_growth > 0
      } : undefined
    },
    {
      title: "Total Earnings",
      value: `₹${earningsData?.total_earnings?.toLocaleString() || 0}`,
      description: "Revenue generated",
      icon: HiBanknotes,
      iconBg: "bg-gradient-to-r from-green-500 to-emerald-500",
      cardBg: "bg-gradient-to-br from-green-50 to-emerald-50",
      textColor: "text-green-800",
      border: "border-green-200",
      trend: earningsData?.growth_metrics?.earnings_growth ? {
        value: earningsData.growth_metrics.earnings_growth,
        isPositive: earningsData.growth_metrics.earnings_growth > 0
      } : undefined
    },
    {
      title: "Average Rating",
      value: performanceData?.average_rating ? `${performanceData.average_rating.toFixed(1)} ★` : "N/A",
      description: "Brand satisfaction",
      icon: HiStar,
      iconBg: "bg-gradient-to-r from-yellow-500 to-orange-500",
      cardBg: "bg-gradient-to-br from-yellow-50 to-orange-50",
      textColor: "text-yellow-800",
      border: "border-yellow-200"
    },
    {
      title: "Completion Rate",
      value: performanceData?.completion_rate ? `${performanceData.completion_rate}%` : "0%",
      description: "Successfully completed",
      icon: HiTrophy,
      iconBg: "bg-gradient-to-r from-purple-500 to-pink-500",
      cardBg: "bg-gradient-to-br from-purple-50 to-pink-50",
      textColor: "text-purple-800",
      border: "border-purple-200"
    },
    {
      title: "Active Deals",
      value: performanceData?.active_deals || 0,
      description: "Currently ongoing",
      icon: HiUsers,
      iconBg: "bg-gradient-to-r from-cyan-500 to-blue-500",
      cardBg: "bg-gradient-to-br from-cyan-50 to-blue-50",
      textColor: "text-cyan-800",
      border: "border-cyan-200"
    },
    {
      title: "Growth Rate",
      value: performanceData?.growth_metrics?.overall_growth ? 
        `${performanceData.growth_metrics.overall_growth > 0 ? '+' : ''}${performanceData.growth_metrics.overall_growth}%` 
        : "0%",
      description: "Month over month",
      icon: HiArrowTrendingUp,
      iconBg: "bg-gradient-to-r from-rose-500 to-red-500",
      cardBg: "bg-gradient-to-br from-rose-50 to-red-50",
      textColor: "text-rose-800",
      border: "border-rose-200"
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Enhanced Section Header - Mobile Optimized */}
      <div className="bg-white rounded-xl border shadow-lg p-4 sm:p-6">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <HiChartBar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">Performance Overview</h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Your collaboration analytics at a glance</p>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid - Mobile Optimized */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className={`rounded-xl border shadow-lg hover:shadow-xl transition-all duration-200 ${stat.cardBg} ${stat.border}`}>
              <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 leading-tight">
                    {stat.title}
                  </CardTitle>
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shadow-md ${stat.iconBg}`}>
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className={`text-lg sm:text-2xl font-bold mb-1 sm:mb-2 ${stat.textColor}`}>
                  {stat.value}
                </div>
                
                <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3 leading-tight">
                  {stat.description}
                </p>
                
                {stat.trend && (
                  <div className="flex items-center pt-2 border-t border-white/50">
                    <div className={`flex items-center text-xs sm:text-sm font-medium ${
                      stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.trend.isPositive ? (
                        <HiArrowTrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      ) : (
                        <HiArrowTrendingDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
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

      {/* Recent Activity Section - Mobile Optimized */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Recent Collaborations */}
        <Card className="rounded-xl border shadow-lg">
          <CardHeader className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md">
                <HiCalendarDays className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-gray-900">Recent Activity</CardTitle>
                <p className="text-xs sm:text-sm text-gray-600">Latest collaboration updates</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {historyData && historyData.length > 0 ? (
              <div className="space-y-3">
                {historyData.slice(0, 3).map((item: CollaborationHistory, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <HiUsers className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.brand.name}</p>
                      <p className="text-xs text-gray-600 truncate">{item.campaign_title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">₹{item.total_value.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{item.completed_at ? new Date(item.completed_at).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <HiCalendarDays className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card className="rounded-xl border shadow-lg">
          <CardHeader className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                <HiTrophy className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-gray-900">Performance Insights</CardTitle>
                <p className="text-xs sm:text-sm text-gray-600">Key metrics and achievements</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <HiStar className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">Success Rate</p>
                    <p className="text-xs text-green-600">Campaign completion</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-800">
                    {performanceData?.completion_rate || 0}%
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <HiBanknotes className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800">Avg. Deal Value</p>
                    <p className="text-xs text-blue-600">Per collaboration</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-800">
                    ₹{earningsData?.average_deal_value?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}