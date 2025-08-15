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
  HiArrowTrendingUp, 
  HiArrowTrendingDown,
  HiUsers,
  HiTrophy,
  HiCursorArrowRays,
  HiStar,
  HiChartBar
} from "react-icons/hi2";
import { Skeleton } from "@/components/ui/skeleton";

export function PerformanceMetrics() {
  const { performance } = useAnalytics();

  if (performance.isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (performance.isError) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Unable to load performance metrics. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  const performanceData = performance.data;

  const metrics = [
    {
      name: 'Engagement Rate',
      value: performanceData?.engagement_rate || 0,
      change: performanceData?.growth_metrics?.engagement_growth || 0,
      target: 75
    },
    {
      name: 'Completion Rate',
      value: performanceData?.completion_rate || 0,
      change: performanceData?.growth_metrics?.completion_growth || 0,
      target: 85
    },
    {
      name: 'Brand Satisfaction',
      value: (performanceData?.average_rating || 0) * 20, // Convert 5-star to percentage
      change: performanceData?.growth_metrics?.rating_trend || 0,
      target: 90
    }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Collaborations</p>
                <p className="text-2xl font-bold">{performanceData?.total_collaborations || 0}</p>
              </div>
              <HiChartBar className="h-8 w-8 text-blue-500" />
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
              <HiUsers className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{performanceData?.success_rate || 0}%</p>
              </div>
              <HiCursorArrowRays className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Rating</p>
                <p className="text-2xl font-bold">{(performanceData?.average_rating || 0).toFixed(1)}</p>
              </div>
              <HiStar className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData?.monthly_performance || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="collaborations" fill="#8884d8" />
                <Bar dataKey="completion_rate" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
                             <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" barSize={10} 
                             data={performanceData?.rating_distribution || []}>
                 <RadialBar 
                   label={{ position: 'insideStart', fill: '#fff' }} 
                   background 
                   dataKey="value" 
                 />
                <Legend iconSize={18} layout="vertical" verticalAlign="middle" wrapperStyle={{ fontSize: '12px' }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Goals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {metrics.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{metric.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{metric.value}%</span>
                  {metric.change > 0 ? (
                    <HiArrowTrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <HiArrowTrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-xs ${metric.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(metric.change)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={metric.value} className="flex-1" />
                <span className="text-xs text-muted-foreground">Goal: {metric.target}%</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Performance Highlights */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceData?.recent_achievements?.map((achievement: any, index: number) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {achievement.type === 'rating' && <HiStar className="h-4 w-4 text-yellow-500" />}
                  {achievement.type === 'completion' && (
                    achievement.change > 0 ? (
                      <HiArrowTrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <HiArrowTrendingDown className="h-4 w-4 text-red-500" />
                    )
                  )}
                  {achievement.type === 'engagement' && (
                    achievement.change > 0 ? (
                      <HiArrowTrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <HiArrowTrendingDown className="h-4 w-4 text-red-500" />
                    )
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </div>
                <span className="text-xs text-muted-foreground">{achievement.date}</span>
              </div>
            )) || (
              <div className="text-center py-8">
                <HiTrophy className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No recent achievements to display</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}