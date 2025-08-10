"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { useAnalytics } from "@/hooks/use-analytics";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Award,
  Calendar,
  Star
} from "@/lib/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { CollaborationHistory } from "@/types";

export function AnalyticsOverview() {
  const { performance, earnings, collaborationHistory } = useAnalytics();

  if (performance.isLoading || earnings.isLoading || collaborationHistory.isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const performanceData = performance.data;
  const earningsData = earnings.data;
  const historyData = collaborationHistory.data;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Collaborations"
          value={performanceData?.total_collaborations || 0}
          description="All time collaborations"
          icon={Calendar}
          trend={performanceData?.growth_metrics?.deals_growth ? {
            value: performanceData.growth_metrics.deals_growth,
            isPositive: performanceData.growth_metrics.deals_growth > 0
          } : undefined}
        />

        <StatsCard
          title="Total Brands"
          value={performanceData?.total_brands || 0}
          description="Unique brand partnerships"
          icon={Users}
        />

        <StatsCard
          title="Total Earnings"
          value={`₹${earningsData?.total_earnings?.toLocaleString() || 0}`}
          description="Lifetime earnings"
          icon={DollarSign}
          trend={performanceData?.growth_metrics?.earnings_growth ? {
            value: performanceData.growth_metrics.earnings_growth,
            isPositive: performanceData.growth_metrics.earnings_growth > 0
          } : undefined}
        />

        <StatsCard
          title="Average Deal Value"
          value={`₹${performanceData?.average_deal_value?.toLocaleString() || 0}`}
          description="Per collaboration"
          icon={TrendingUp}
        />

        <StatsCard
          title="Completion Rate"
          value={`${performanceData?.collaboration_completion_rate || 0}%`}
          description="Successfully completed deals"
          icon={Award}
        />

        <StatsCard
          title="Average Rating"
          value={performanceData?.average_rating?.toFixed(1) || "0.0"}
          description="Brand satisfaction rating"
          icon={Star}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {performanceData?.top_performing_platform || "N/A"}
            </div>
            <p className="text-sm text-muted-foreground">
              Your most successful collaboration platform
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(historyData as any[] | undefined)?.slice(0, 3).map((collaboration: CollaborationHistory) => (
                <div key={collaboration.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{collaboration.brand.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {collaboration.campaign_title}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{collaboration.total_value.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {collaboration.status.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              )) || (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}