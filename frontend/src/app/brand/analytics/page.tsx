"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  HiChartBar, 
  HiCurrencyDollar,
  HiUsers,
  HiEye,
  HiHeart,
  HiChatBubbleLeftRight,
  HiArrowTrendingUp,
  HiArrowTrendingDown,
  HiCalendarDays
} from "react-icons/hi2";

// Mock analytics data
const mockAnalytics = {
  overview: {
    totalSpent: 45000,
    totalCampaigns: 12,
    activeCampaigns: 4,
    totalInfluencers: 8,
    avgEngagementRate: 4.2,
    totalReach: 2500000,
    totalImpressions: 8750000,
    roi: 3.4
  },
  recentCampaigns: [
    {
      id: 1,
      name: "Summer Collection 2024",
      status: "active",
      spent: 15000,
      reach: 850000,
      engagement: 4.8,
      influencers: 3,
      startDate: "2024-01-15",
      endDate: "2024-02-15"
    },
    {
      id: 2,
      name: "Fitness Equipment Launch",
      status: "completed",
      spent: 12000,
      reach: 620000,
      engagement: 5.2,
      influencers: 2,
      startDate: "2024-01-01",
      endDate: "2024-01-31"
    },
    {
      id: 3,
      name: "Tech Review Series",
      status: "completed",
      spent: 18000,
      reach: 1030000,
      engagement: 6.1,
      influencers: 3,
      startDate: "2023-12-01",
      endDate: "2023-12-31"
    }
  ],
  topInfluencers: [
    {
      name: "Sarah Johnson",
      username: "@sarahjohnson",
      campaigns: 3,
      totalReach: 950000,
      avgEngagement: 4.8,
      revenue: 18500
    },
    {
      name: "Mike Chen", 
      username: "@mikechenfit",
      campaigns: 2,
      totalReach: 620000,
      avgEngagement: 5.2,
      revenue: 12000
    },
    {
      name: "Emma Wilson",
      username: "@emmawilson", 
      campaigns: 2,
      totalReach: 930000,
      avgEngagement: 6.1,
      revenue: 14500
    }
  ]
};

export default function BrandAnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
          <p className="text-gray-600 mt-2">
            Track your campaign performance and ROI
          </p>
        </div>
        <div className="flex space-x-2">
          {['7d', '30d', '90d', '1y'].map(period => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(mockAnalytics.overview.totalSpent)}
                </p>
                <div className="flex items-center mt-1">
                  <HiArrowTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+12% from last period</span>
                </div>
              </div>
              <HiCurrencyDollar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reach</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(mockAnalytics.overview.totalReach)}
                </p>
                <div className="flex items-center mt-1">
                  <HiArrowTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+8% from last period</span>
                </div>
              </div>
              <HiUsers className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Engagement</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockAnalytics.overview.avgEngagementRate}%
                </p>
                <div className="flex items-center mt-1">
                  <HiArrowTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+0.3% from last period</span>
                </div>
              </div>
              <HiHeart className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ROI</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockAnalytics.overview.roi}x
                </p>
                <div className="flex items-center mt-1">
                  <HiArrowTrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-sm text-red-600">-0.2x from last period</span>
                </div>
              </div>
              <HiChartBar className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns">Campaign Performance</TabsTrigger>
          <TabsTrigger value="influencers">Top Influencers</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAnalytics.recentCampaigns.map((campaign) => (
                  <div key={campaign.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Spent</p>
                        <p className="font-semibold">{formatCurrency(campaign.spent)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Reach</p>
                        <p className="font-semibold">{formatNumber(campaign.reach)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Engagement</p>
                        <p className="font-semibold">{campaign.engagement}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Influencers</p>
                        <p className="font-semibold">{campaign.influencers}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="influencers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Influencers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAnalytics.topInfluencers.map((influencer, index) => (
                  <div key={influencer.username} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {influencer.name.charAt(0)}
                      </span>
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{influencer.name}</h3>
                      <p className="text-sm text-gray-500">{influencer.username}</p>
                    </div>

                    <div className="grid grid-cols-4 gap-8 text-sm">
                      <div>
                        <p className="text-gray-500">Campaigns</p>
                        <p className="font-semibold">{influencer.campaigns}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Reach</p>
                        <p className="font-semibold">{formatNumber(influencer.totalReach)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Avg Engagement</p>
                        <p className="font-semibold">{influencer.avgEngagement}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Revenue</p>
                        <p className="font-semibold">{formatCurrency(influencer.revenue)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">📈 Engagement Trending Up</h4>
                  <p className="text-sm text-blue-800">
                    Your average engagement rate has increased by 0.3% this period. 
                    Influencers with authentic storytelling are performing best.
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">💰 ROI Optimization</h4>
                  <p className="text-sm text-green-800">
                    Micro-influencers (10K-100K followers) are delivering 1.8x better ROI 
                    compared to macro-influencers.
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2">⏰ Best Posting Times</h4>
                  <p className="text-sm text-yellow-800">
                    Content posted between 2-4 PM on weekdays gets 23% higher engagement 
                    for your target audience.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                  <h4 className="font-semibold text-blue-900 mb-2">Focus on Video Content</h4>
                  <p className="text-sm text-blue-800">
                    Video posts are generating 2.3x more engagement. Consider allocating 
                    more budget to video-focused campaigns.
                  </p>
                </div>

                <div className="p-4 border-l-4 border-green-500 bg-green-50">
                  <h4 className="font-semibold text-green-900 mb-2">Expand Fitness Category</h4>
                  <p className="text-sm text-green-800">
                    Fitness content is showing the highest engagement rates. 
                    Consider partnering with more fitness influencers.
                  </p>
                </div>

                <div className="p-4 border-l-4 border-purple-500 bg-purple-50">
                  <h4 className="font-semibold text-purple-900 mb-2">Long-term Partnerships</h4>
                  <p className="text-sm text-purple-800">
                    Influencers with multiple campaigns show 34% better performance. 
                    Consider establishing ongoing partnerships.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 