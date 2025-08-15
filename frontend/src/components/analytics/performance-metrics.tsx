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
      <div className="space-y-4 sm:space-y-6">
        {/* Loading Header */}
        <div className="bg-white rounded-xl border shadow-lg p-4 sm:p-6">
          <Skeleton className="h-5 sm:h-6 w-40 sm:w-48 mb-2" />
          <Skeleton className="h-4 w-72 sm:w-96" />
        </div>
        
        {/* Loading Stats Grid */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-xl border shadow-lg">
              <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          <Card className="rounded-xl border shadow-lg">
            <CardHeader className="p-4 sm:p-6">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <Skeleton className="h-48 sm:h-64 w-full" />
            </CardContent>
          </Card>
          <Card className="rounded-xl border shadow-lg">
            <CardHeader className="p-4 sm:p-6">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <Skeleton className="h-48 sm:h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const performanceData = performance.data;

  // Define colorful key metrics with gradients
  const keyMetrics = [
    {
      title: "Engagement Rate",
      value: performanceData?.engagement_rate ? `${performanceData.engagement_rate}%` : "0%",
      description: "Avg. audience engagement",
      icon: HiArrowTrendingUp,
      iconBg: "bg-gradient-to-r from-blue-500 to-indigo-500",
      cardBg: "bg-gradient-to-br from-blue-50 to-indigo-50",
      textColor: "text-blue-800",
      border: "border-blue-200"
    },
    {
      title: "Reach",
      value: performanceData?.total_reach ? `${(performanceData.total_reach / 1000).toFixed(1)}K` : "0",
      description: "Total audience reached",
      icon: HiUsers,
      iconBg: "bg-gradient-to-r from-green-500 to-emerald-500",
      cardBg: "bg-gradient-to-br from-green-50 to-emerald-50",
      textColor: "text-green-800",
      border: "border-green-200"
    },
    {
      title: "Brand Rating",
      value: performanceData?.average_rating ? `${performanceData.average_rating.toFixed(1)} ★` : "0 ★",
      description: "Average brand feedback",
      icon: HiStar,
      iconBg: "bg-gradient-to-r from-yellow-500 to-orange-500",
      cardBg: "bg-gradient-to-br from-yellow-50 to-orange-50",
      textColor: "text-yellow-800",
      border: "border-yellow-200"
    },
    {
      title: "Success Rate",
      value: performanceData?.completion_rate ? `${performanceData.completion_rate}%` : "0%",
      description: "Campaign completion",
      icon: HiTrophy,
      iconBg: "bg-gradient-to-r from-purple-500 to-pink-500",
      cardBg: "bg-gradient-to-br from-purple-50 to-pink-50",
      textColor: "text-purple-800",
      border: "border-purple-200"
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Enhanced Header - Mobile Optimized */}
      <div className="bg-white rounded-xl border shadow-lg p-4 sm:p-6">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <HiChartBar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">Performance Metrics</h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Detailed analysis of your collaboration performance</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Overview - Mobile Optimized */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {keyMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className={`rounded-xl border shadow-lg hover:shadow-xl transition-all duration-200 ${metric.cardBg} ${metric.border}`}>
              <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 leading-tight">
                    {metric.title}
                  </CardTitle>
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shadow-md ${metric.iconBg}`}>
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className={`text-lg sm:text-2xl font-bold mb-1 sm:mb-2 ${metric.textColor}`}>
                  {metric.value}
                </div>
                <p className="text-xs sm:text-sm text-gray-500 leading-tight">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section - Mobile Optimized */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Performance Trends */}
        <Card className="rounded-xl border shadow-lg">
          <CardHeader className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                <HiArrowTrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-gray-900">Performance Trends</CardTitle>
                <p className="text-xs sm:text-sm text-gray-600">Monthly performance analysis</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={performanceData?.monthly_performance || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="engagement_rate" fill="#3b82f6" name="Engagement Rate" />
                <Bar dataKey="completion_rate" fill="#10b981" name="Completion Rate" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card className="rounded-xl border shadow-lg">
          <CardHeader className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
                <HiStar className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-gray-900">Rating Distribution</CardTitle>
                <p className="text-xs sm:text-sm text-gray-600">Brand feedback breakdown</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <ResponsiveContainer width="100%" height={250}>
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="20%" 
                outerRadius="80%" 
                data={performanceData?.rating_distribution || []}
              >
                <RadialBar dataKey="count" cornerRadius={10} fill="#8884d8" />
                <Legend />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Goals Section - Mobile Optimized */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Performance Goals */}
        <Card className="rounded-xl border shadow-lg">
          <CardHeader className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                <HiCursorArrowRays className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-gray-900">Performance Goals</CardTitle>
                <p className="text-xs sm:text-sm text-gray-600">Track your progress</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Engagement Rate Goal</span>
                  <span className="text-sm text-gray-600">
                    {performanceData?.engagement_rate || 0}% / 15%
                  </span>
                </div>
                <Progress 
                  value={Math.min(((performanceData?.engagement_rate || 0) / 15) * 100, 100)} 
                  className="h-2"
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Completion Rate Goal</span>
                  <span className="text-sm text-gray-600">
                    {performanceData?.completion_rate || 0}% / 90%
                  </span>
                </div>
                <Progress 
                  value={Math.min(((performanceData?.completion_rate || 0) / 90) * 100, 100)} 
                  className="h-2"
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Rating Goal</span>
                  <span className="text-sm text-gray-600">
                    {performanceData?.average_rating?.toFixed(1) || 0} / 4.5 ★
                  </span>
                </div>
                <Progress 
                  value={Math.min(((performanceData?.average_rating || 0) / 4.5) * 100, 100)} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        <Card className="rounded-xl border shadow-lg">
          <CardHeader className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-md">
                <HiTrophy className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-gray-900">Recent Achievements</CardTitle>
                <p className="text-xs sm:text-sm text-gray-600">Your latest milestones</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3">
              {performanceData?.achievements && performanceData.achievements.length > 0 ? (
                performanceData.achievements.slice(0, 4).map((achievement: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <HiTrophy className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-orange-800">{achievement.title}</p>
                      <p className="text-xs text-orange-600">{achievement.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <HiTrophy className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">Complete more collaborations to unlock achievements</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}