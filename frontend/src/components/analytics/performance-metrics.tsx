"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAnalytics } from "@/hooks/use-analytics";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  Award,
  Target,
  Star,
  Activity
} from "@/lib/icons";
import { Skeleton } from "@/components/ui/skeleton";

export function PerformanceMetrics() {
  const { performance } = useAnalytics();

  if (performance.isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const performanceData = performance.data;

  const growthData = [
    {
      metric: 'Deals',
      growth: performanceData?.growth_metrics?.deals_growth || 0,
      color: '#8884d8'
    },
    {
      metric: 'Earnings',
      growth: performanceData?.growth_metrics?.earnings_growth || 0,
      color: '#82ca9d'
    },
    {
      metric: 'Followers',
      growth: performanceData?.growth_metrics?.follower_growth || 0,
      color: '#ffc658'
    }
  ];

  const completionRateData = [
    {
      name: 'Completion Rate',
      value: performanceData?.collaboration_completion_rate || 0,
      fill: '#8884d8'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Collaborations</p>
                <p className="text-2xl font-bold">{performanceData?.total_collaborations || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Brand Partners</p>
                <p className="text-2xl font-bold">{performanceData?.total_brands || 0}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Deal Value</p>
                <p className="text-2xl font-bold">₹{performanceData?.average_deal_value?.toLocaleString() || 0}</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold">{performanceData?.average_rating?.toFixed(1) || "0.0"}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Growth Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Growth Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Growth']}
                />
                <Bar dataKey="growth" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card>
          <CardHeader>
            <CardTitle>Collaboration Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={completionRateData}>
                  <RadialBar
                    dataKey="value"
                    fill="#8884d8"
                  />
                  <Legend iconSize={18} layout="vertical" verticalAlign="middle" />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-4">
              <p className="text-3xl font-bold">{performanceData?.collaboration_completion_rate || 0}%</p>
              <p className="text-sm text-muted-foreground">Successfully completed deals</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Performance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Growth Indicators */}
            <div className="space-y-4">
              <h3 className="font-semibold">Growth Indicators</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {(performanceData?.growth_metrics?.deals_growth || 0) >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span>Deal Growth</span>
                  </div>
                  <span className={`font-semibold ${
                    (performanceData?.growth_metrics?.deals_growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(performanceData?.growth_metrics?.deals_growth || 0) >= 0 ? '+' : ''}
                    {performanceData?.growth_metrics?.deals_growth?.toFixed(1) || 0}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {(performanceData?.growth_metrics?.earnings_growth || 0) >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span>Earnings Growth</span>
                  </div>
                  <span className={`font-semibold ${
                    (performanceData?.growth_metrics?.earnings_growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(performanceData?.growth_metrics?.earnings_growth || 0) >= 0 ? '+' : ''}
                    {performanceData?.growth_metrics?.earnings_growth?.toFixed(1) || 0}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {(performanceData?.growth_metrics?.follower_growth || 0) >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span>Follower Growth</span>
                  </div>
                  <span className={`font-semibold ${
                    (performanceData?.growth_metrics?.follower_growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(performanceData?.growth_metrics?.follower_growth || 0) >= 0 ? '+' : ''}
                    {performanceData?.growth_metrics?.follower_growth?.toFixed(1) || 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Scores */}
            <div className="space-y-4">
              <h3 className="font-semibold">Performance Scores</h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Completion Rate</span>
                    <span className="font-semibold">{performanceData?.collaboration_completion_rate || 0}%</span>
                  </div>
                  <Progress value={performanceData?.collaboration_completion_rate || 0} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span>Average Rating</span>
                    <span className="font-semibold">{performanceData?.average_rating?.toFixed(1) || "0.0"}/5.0</span>
                  </div>
                  <Progress value={(performanceData?.average_rating || 0) * 20} className="h-2" />
                </div>
              </div>
            </div>

            {/* Top Platform */}
            <div className="space-y-2">
              <h3 className="font-semibold">Top Performing Platform</h3>
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">
                    {performanceData?.top_performing_platform || "N/A"}
                  </span>
                  <Award className="h-5 w-5 text-yellow-500" />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Your most successful collaboration platform
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}