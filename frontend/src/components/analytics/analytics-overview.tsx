"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { useAnalytics } from "@/hooks/use-analytics";
import { 
  HiArrowTrendingUp, 
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
      <div className="space-y-6">
        {/* Loading Header */}
        <div className="bg-white rounded-xl border shadow-lg p-6">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        {/* Loading Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="rounded-xl border shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-3" />
                <Skeleton className="h-3 w-32 mb-2" />
                <Skeleton className="h-2 w-full" />
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

  return (
    <div className="space-y-6">
      {/* Enhanced Section Header */}
      <div className="bg-white rounded-xl border shadow-lg p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg mr-4">
            <HiChartBar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Performance Overview</h2>
            <p className="text-gray-600">Your collaboration analytics at a glance</p>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Collaborations"
          value={performanceData?.total_collaborations || 0}
          description="All time collaborations"
          icon={HiCalendarDays}
          trend={performanceData?.growth_metrics?.deals_growth ? {
            value: performanceData.growth_metrics.deals_growth,
            isPositive: performanceData.growth_metrics.deals_growth > 0
          } : undefined}
        />

        <StatsCard
          title="Total Brands"
          value={performanceData?.total_brands || 0}
          description="Unique brand partnerships"
          icon={HiUsers}
          trend={performanceData?.growth_metrics?.brands_growth ? {
            value: performanceData.growth_metrics.brands_growth,
            isPositive: performanceData.growth_metrics.brands_growth > 0
          } : undefined}
        />

        <StatsCard
          title="Total Earnings"
          value={`₹${(earningsData?.total_earnings || 0).toLocaleString()}`}
          description="All time earnings"
          icon={HiBanknotes}
          trend={earningsData?.growth_metrics?.earnings_growth ? {
            value: earningsData.growth_metrics.earnings_growth,
            isPositive: earningsData.growth_metrics.earnings_growth > 0
          } : undefined}
        />

        <StatsCard
          title="Avg. Rating"
          value={(performanceData?.average_rating || 0).toFixed(1)}
          description="Brand satisfaction score"
          icon={HiStar}
          trend={performanceData?.growth_metrics?.rating_trend ? {
            value: performanceData.growth_metrics.rating_trend,
            isPositive: performanceData.growth_metrics.rating_trend > 0
          } : undefined}
        />

        <StatsCard
          title="Success Rate"
          value={`${(performanceData?.success_rate || 0)}%`}
          description="Completed collaborations"
          icon={HiTrophy}
          trend={performanceData?.growth_metrics?.success_rate_trend ? {
            value: performanceData.growth_metrics.success_rate_trend,
            isPositive: performanceData.growth_metrics.success_rate_trend > 0
          } : undefined}
        />

        <StatsCard
          title="Growth Rate"
          value={`${(performanceData?.growth_metrics?.overall_growth || 0)}%`}
          description="Month over month"
          icon={HiArrowTrendingUp}
          trend={performanceData?.growth_metrics?.overall_growth ? {
            value: performanceData.growth_metrics.overall_growth,
            isPositive: performanceData.growth_metrics.overall_growth > 0
          } : undefined}
        />
      </div>

      {/* Enhanced Recent Activity */}
      <div className="bg-white rounded-xl border shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Performance Highlights</h3>
          <p className="text-gray-600 text-sm mt-1">Key achievements from your latest collaborations</p>
        </div>
        <div className="p-6">
          {historyData && historyData.length > 0 ? (
            <div className="space-y-4">
              {historyData.slice(0, 3).map((collaboration: CollaborationHistory, index: number) => (
                <div key={index} className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-4 shadow-md">
                    <HiTrophy className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900">{collaboration.brand_name}</h4>
                    <p className="text-sm text-blue-700">{collaboration.campaign_title}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-blue-800">₹{collaboration.earnings?.toLocaleString()}</div>
                    <div className="text-xs text-blue-600">{collaboration.completion_date}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <HiChartBar className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No data yet</h4>
              <p className="text-gray-600">Complete your first collaboration to see analytics here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}