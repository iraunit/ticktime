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
      <div className="space-y-3">
        {/* Loading Header */}
        <div className="bg-white rounded-lg border shadow-sm p-3">
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        
        {/* Loading Stats Grid */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="rounded-lg border shadow-sm">
              <CardHeader className="p-3 pb-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-6 rounded-lg" />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <Skeleton className="h-6 w-12 mb-2" />
                <Skeleton className="h-2 w-24 mb-1" />
                <Skeleton className="h-1.5 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const performanceData = performance.data;
  const earningsData = earnings.data;
  const historyData = Array.isArray(collaborationHistory.data) 
    ? collaborationHistory.data 
    : (collaborationHistory.data?.collaborations || []);

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
    <div className="space-y-3">
      {/* Compact Section Header */}
      <div className="bg-white rounded-lg border shadow-sm p-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
            <HiChartBar className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">Performance Overview</h2>
            <p className="text-sm text-gray-600 leading-relaxed">Your collaboration analytics at a glance</p>
          </div>
        </div>
      </div>

      {/* Compact Stats Grid */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className={`rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 ${stat.cardBg} ${stat.border}`}>
              <CardHeader className="p-3 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-gray-600 leading-tight">
                    {stat.title}
                  </CardTitle>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-sm ${stat.iconBg}`}>
                    <Icon className="w-3 h-3 text-white" />
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
                        <HiArrowTrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <HiArrowTrendingDown className="w-3 h-3 mr-1" />
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
              <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                <HiCalendarDays className="w-3 h-3 text-white" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-900">Recent Collaborations</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-2">
              {historyData.length > 0 ? historyData.slice(0, 5).map((collab: CollaborationHistory, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
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
                  <HiCalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No collaborations yet</p>
                  <p className="text-xs text-gray-400">Start collaborating with brands to see your history here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Chart */}
        <Card className="rounded-lg border shadow-sm">
          <CardHeader className="p-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
                <HiChartBar className="w-3 h-3 text-white" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-900">Performance Trend</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <div className="h-32 flex items-center justify-center bg-gray-50 rounded-md">
              <p className="text-sm text-gray-500">Chart visualization would go here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}