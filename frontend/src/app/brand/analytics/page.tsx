"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlobalLoader } from "@/components/ui/global-loader";
import { toast } from "@/lib/toast";
import { api } from "@/lib/api";
import { 
  HiChartBar,
  HiCurrencyDollar,
  HiUsers,
  HiEye,
  HiHeart,
  HiChatBubbleLeft,
  HiShare,
  HiCheckCircle,
  HiClock,
  HiArrowTrendingUp,
  HiArrowTrendingDown,
  HiArrowPath,
  HiCalendarDays,
  HiGlobeAsiaAustralia,
  HiDevicePhoneMobile,
  HiComputerDesktop,
  HiUserGroup
} from "react-icons/hi2";

interface CampaignAnalytics {
  id: number;
  title: string;
  status: string;
  total_investment: number;
  total_reach: number;
  total_impressions: number;
  total_engagement: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_saves: number;
  conversion_rate: number;
  roi: number;
  engagement_rate: number;
  influencers_count: number;
  completed_deals: number;
  pending_deals: number;
  avg_cpm: number;
  avg_cpe: number;
  demographics: {
    age_groups: { range: string; percentage: number }[];
    genders: { gender: string; percentage: number }[];
    locations: { country: string; percentage: number }[];
    devices: { device: string; percentage: number }[];
  };
  performance_timeline: {
    date: string;
    reach: number;
    engagement: number;
    impressions: number;
  }[];
  top_performing_content: {
    influencer_name: string;
    content_type: string;
    reach: number;
    engagement_rate: number;
    platform: string;
  }[];
}

interface OverallAnalytics {
  total_campaigns: number;
  total_investment: number;
  total_reach: number;
  total_engagement: number;
  avg_roi: number;
  avg_engagement_rate: number;
  top_performing_campaigns: CampaignAnalytics[];
  monthly_trends: {
    month: string;
    investment: number;
    reach: number;
    engagement: number;
    roi: number;
  }[];
  demographics?: {
    genders: { gender: string; percentage: number }[];
    devices: { device: string; percentage: number }[];
    locations: { country: string; percentage: number }[];
  };
}

export default function BrandAnalyticsPage() {
  const [overallAnalytics, setOverallAnalytics] = useState<OverallAnalytics | null>(null);
  const [campaignAnalytics, setCampaignAnalytics] = useState<CampaignAnalytics[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("last_30_days");
  const [activeTab, setActiveTab] = useState("overview");

  const fetchOverallAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/brands/analytics/overview/', {
        params: { time_range: timeRange }
      });
      setOverallAnalytics(response.data.analytics);
    } catch (error: any) {
      console.error('Failed to fetch overall analytics:', error);
      toast.error('Failed to load analytics data.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCampaignAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/brands/analytics/campaigns/', {
        params: { time_range: timeRange }
      });
      setCampaignAnalytics(response.data.campaigns);
    } catch (error: any) {
      console.error('Failed to fetch campaign analytics:', error);
      toast.error('Failed to load campaign analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverallAnalytics();
    fetchCampaignAnalytics();
  }, [timeRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const getPerformanceColor = (value: number, good: number = 5, excellent: number = 10) => {
    if (value >= excellent) return "text-green-600";
    if (value >= good) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      paused: 'bg-yellow-100 text-yellow-800',
      draft: 'bg-gray-100 text-gray-800',
    };
    return (
      <Badge className={`${colors[status] || 'bg-gray-100 text-gray-800'} border-0`}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        {/* Header */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 rounded-xl -m-2"></div>
          
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-1">
                Analytics Dashboard
              </h1>
              <p className="text-sm text-gray-600 max-w-2xl">
                Comprehensive insights into your campaign performance, audience engagement, and ROI metrics.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                  <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  fetchOverallAnalytics();
                  fetchCampaignAnalytics();
                }}
                disabled={isLoading}
                className="border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 rounded-lg px-4 py-2"
              >
                <HiArrowPath className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {isLoading ? (
              <div className="grid gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <GlobalLoader key={i} />
                ))}
              </div>
            ) : overallAnalytics ? (
              <>
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Total Investment</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(overallAnalytics.total_investment)}
                          </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <HiCurrencyDollar className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Total Reach</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {formatNumber(overallAnalytics.total_reach)}
                          </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                          <HiUsers className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Engagement</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {formatNumber(overallAnalytics.total_engagement)}
                          </p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <HiHeart className="w-6 h-6 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-yellow-500 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Average ROI</p>
                          <p className={`text-2xl font-bold ${getPerformanceColor(overallAnalytics.avg_roi, 2, 5)}`}>
                            {formatPercentage(overallAnalytics.avg_roi)}
                          </p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-lg">
                          <HiArrowTrendingUp className="w-6 h-6 text-yellow-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Performing Campaigns */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HiChartBar className="w-5 h-5 text-blue-600" />
                      Top Performing Campaigns
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {overallAnalytics.top_performing_campaigns.map((campaign) => (
                        <div key={campaign.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div>
                              <h3 className="font-semibold text-gray-900">{campaign.title}</h3>
                              <div className="flex items-center gap-3 mt-1">
                                {getStatusBadge(campaign.status)}
                                <span className="text-sm text-gray-500">
                                  {campaign.influencers_count} influencers
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-6 text-center">
                            <div>
                              <p className="text-sm text-gray-500">Reach</p>
                              <p className="font-semibold">{formatNumber(campaign.total_reach)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Engagement</p>
                              <p className="font-semibold">{formatPercentage(campaign.engagement_rate)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">ROI</p>
                              <p className={`font-semibold ${getPerformanceColor(campaign.roi, 2, 5)}`}>
                                {formatPercentage(campaign.roi)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Investment</p>
                              <p className="font-semibold">{formatCurrency(campaign.total_investment)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Trends */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HiCalendarDays className="w-5 h-5 text-green-600" />
                      Monthly Performance Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {overallAnalytics.monthly_trends.map((trend, index) => (
                        <div key={index} className="grid grid-cols-5 gap-4 p-4 border border-gray-200 rounded-lg">
                          <div>
                            <p className="text-sm text-gray-500">Month</p>
                            <p className="font-semibold">{trend.month}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Investment</p>
                            <p className="font-semibold">{formatCurrency(trend.investment)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Reach</p>
                            <p className="font-semibold">{formatNumber(trend.reach)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Engagement</p>
                            <p className="font-semibold">{formatNumber(trend.engagement)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">ROI</p>
                            <p className={`font-semibold ${getPerformanceColor(trend.roi, 2, 5)}`}>
                              {formatPercentage(trend.roi)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12">
                <GlobalLoader />
                <p className="text-gray-500 mt-4">Start creating campaigns to see analytics.</p>
              </div>
            )}
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            {isLoading ? (
              <div className="grid gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <GlobalLoader key={i} />
                ))}
              </div>
            ) : campaignAnalytics.length > 0 ? (
              <div className="space-y-6">
                {campaignAnalytics.map((campaign) => (
                  <Card key={campaign.id} className="shadow-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{campaign.title}</CardTitle>
                          <div className="flex items-center gap-3 mt-2">
                            {getStatusBadge(campaign.status)}
                            <span className="text-sm text-gray-500">
                              {campaign.influencers_count} influencers • {campaign.completed_deals} completed
                            </span>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => setSelectedCampaign(selectedCampaign?.id === campaign.id ? null : campaign)}
                        >
                          {selectedCampaign?.id === campaign.id ? 'Hide Details' : 'View Details'}
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      {/* Key Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <HiCurrencyDollar className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                          <p className="text-xs text-gray-500">Investment</p>
                          <p className="font-semibold">{formatCurrency(campaign.total_investment)}</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <HiUsers className="w-5 h-5 text-green-600 mx-auto mb-1" />
                          <p className="text-xs text-gray-500">Reach</p>
                          <p className="font-semibold">{formatNumber(campaign.total_reach)}</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <HiHeart className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                          <p className="text-xs text-gray-500">Engagement</p>
                          <p className="font-semibold">{formatPercentage(campaign.engagement_rate)}</p>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                          <HiArrowTrendingUp className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                          <p className="text-xs text-gray-500">ROI</p>
                          <p className={`font-semibold ${getPerformanceColor(campaign.roi, 2, 5)}`}>
                            {formatPercentage(campaign.roi)}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-indigo-50 rounded-lg">
                          <HiEye className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                          <p className="text-xs text-gray-500">Impressions</p>
                          <p className="font-semibold">{formatNumber(campaign.total_impressions)}</p>
                        </div>
                        <div className="text-center p-3 bg-pink-50 rounded-lg">
                          <HiShare className="w-5 h-5 text-pink-600 mx-auto mb-1" />
                          <p className="text-xs text-gray-500">Shares</p>
                          <p className="font-semibold">{formatNumber(campaign.total_shares)}</p>
                        </div>
                      </div>

                      {/* Detailed Analytics for Selected Campaign */}
                      {selectedCampaign?.id === campaign.id && (
                        <div className="border-t pt-6 space-y-6">
                          {/* Top Performing Content */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Top Performing Content</h4>
                            <div className="space-y-3">
                              {campaign.top_performing_content.map((content, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div>
                                    <p className="font-medium">{content.influencer_name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {content.platform}
                                      </Badge>
                                      <span className="text-xs text-gray-500">{content.content_type}</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold">{formatNumber(content.reach)} reach</p>
                                    <p className="text-sm text-green-600">
                                      {formatPercentage(content.engagement_rate)} engagement
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Demographics */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-4">Age Demographics</h4>
                              <div className="space-y-2">
                                {campaign.demographics.age_groups.map((age, index) => (
                                  <div key={index} className="flex items-center justify-between">
                                    <span className="text-sm">{age.range}</span>
                                    <div className="flex items-center gap-2">
                                      <div className="w-24 h-2 bg-gray-200 rounded">
                                        <div 
                                          className="h-2 bg-blue-500 rounded" 
                                          style={{ width: `${age.percentage}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-sm font-medium">{formatPercentage(age.percentage)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold text-gray-900 mb-4">Top Locations</h4>
                              <div className="space-y-2">
                                {campaign.demographics.locations.map((location, index) => (
                                  <div key={index} className="flex items-center justify-between">
                                    <span className="text-sm">{location.country}</span>
                                    <div className="flex items-center gap-2">
                                      <div className="w-24 h-2 bg-gray-200 rounded">
                                        <div 
                                          className="h-2 bg-green-500 rounded" 
                                          style={{ width: `${location.percentage}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-sm font-medium">{formatPercentage(location.percentage)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <GlobalLoader />
                <p className="text-gray-500 mt-4">Create and launch campaigns to see detailed analytics.</p>
              </div>
            )}
          </TabsContent>

          {/* Audience Tab */}
          <TabsContent value="audience" className="space-y-6">
            {isLoading ? (
              <div className="grid gap-6">
                {Array.from({ length: 2 }).map((_, i) => (
                  <GlobalLoader key={i} />
                ))}
              </div>
            ) : overallAnalytics && campaignAnalytics.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Combined Demographics */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HiUserGroup className="w-5 h-5 text-purple-600" />
                      Audience Demographics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Gender Distribution</h4>
                        <div className="space-y-2">
                          {overallAnalytics?.demographics?.genders?.map((gender, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-sm">{gender.gender}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-32 h-2 bg-gray-200 rounded">
                                  <div 
                                    className="h-2 bg-purple-500 rounded" 
                                    style={{ width: `${gender.percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">{formatPercentage(gender.percentage)}</span>
                              </div>
                            </div>
                          )) || (
                            <p className="text-sm text-gray-500">No gender data available</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Device Usage</h4>
                        <div className="space-y-2">
                          {overallAnalytics?.demographics?.devices?.map((device, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {device.device === 'Mobile' ? (
                                  <HiDevicePhoneMobile className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <HiComputerDesktop className="w-4 h-4 text-gray-500" />
                                )}
                                <span className="text-sm">{device.device}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-32 h-2 bg-gray-200 rounded">
                                  <div 
                                    className="h-2 bg-indigo-500 rounded" 
                                    style={{ width: `${device.percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">{formatPercentage(device.percentage)}</span>
                              </div>
                            </div>
                          )) || (
                            <p className="text-sm text-gray-500">No device data available</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Geographic Distribution */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HiGlobeAsiaAustralia className="w-5 h-5 text-blue-600" />
                      Geographic Reach
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {overallAnalytics?.demographics?.locations?.map((location, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">🌍</span>
                            <span className="text-sm font-medium">{location.country}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 rounded">
                              <div 
                                className="h-2 bg-blue-500 rounded" 
                                style={{ width: `${location.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{formatPercentage(location.percentage)}</span>
                          </div>
                        </div>
                      )) || (
                        <p className="text-sm text-gray-500">No geographic data available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <GlobalLoader />
                <p className="text-gray-500 mt-4">Complete some campaigns to see audience insights.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 