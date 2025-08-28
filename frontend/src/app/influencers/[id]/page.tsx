"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlobalLoader } from "@/components/ui/global-loader";
import { toast } from "@/lib/toast";
import { api } from "@/lib/api";
import { 
  HiUser,
  HiStar,
  HiUsers,
  HiHeart,
  HiChatBubbleLeftRight,
  HiEye,
  HiArrowLeft,
  HiGlobeAlt,
  HiMapPin,
  HiCalendarDays,
  HiCheckCircle,
  HiExclamationTriangle,
  HiPhoto,
  HiVideoCamera,
  HiDocumentText,
  HiCurrencyDollar,
  HiGift,
  HiArrowTrendingUp,
  HiArrowTrendingDown,
  HiMinus
} from "react-icons/hi2";

interface InfluencerProfile {
  id: number;
  user_first_name: string;
  user_last_name: string;
  username: string;
  bio: string;
  industry: string;
  categories: string[];
  profile_image?: string;
  is_verified: boolean;
  total_followers: number;
  average_engagement_rate: number;
  social_accounts_count: number;
  created_at: string;
  social_accounts: SocialAccount[];
  recent_collaborations: Collaboration[];
  performance_metrics: PerformanceMetrics;
}

interface SocialAccount {
  id: number;
  platform: string;
  username: string;
  followers_count: number;
  engagement_rate: number;
  is_active: boolean;
  verified: boolean;
}

interface Collaboration {
  id: number;
  brand_name: string;
  campaign_title: string;
  status: string;
  created_at: string;
  rating?: number;
}

interface PerformanceMetrics {
  total_campaigns: number;
  completed_campaigns: number;
  average_rating: number;
  response_rate: number;
  completion_rate: number;
}

export default function InfluencerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const influencerId = params.id as string;
  
  const [profile, setProfile] = useState<InfluencerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // For now, we'll use a mock API call since the backend endpoint doesn't exist yet
      // This should be replaced with: const response = await api.get(`/influencers/${influencerId}/public/`);
      
      // Mock data for demonstration
      const mockProfile: InfluencerProfile = {
        id: parseInt(influencerId),
        user_first_name: "Sarah",
        user_last_name: "Johnson",
        username: "sarahjohnson",
        bio: "Lifestyle & Fashion Content Creator | Travel Enthusiast | Brand Collaborator | Helping brands connect with authentic audiences through engaging content.",
        industry: "lifestyle",
        categories: ["fashion", "lifestyle", "travel", "beauty"],
        profile_image: "/api/placeholder/200/200",
        is_verified: true,
        total_followers: 125000,
        average_engagement_rate: 4.2,
        social_accounts_count: 3,
        created_at: "2023-01-15T10:30:00Z",
        social_accounts: [
          {
            id: 1,
            platform: "instagram",
            username: "@sarahjohnson",
            followers_count: 85000,
            engagement_rate: 4.5,
            is_active: true,
            verified: true
          },
          {
            id: 2,
            platform: "youtube",
            username: "Sarah Johnson",
            followers_count: 25000,
            engagement_rate: 3.8,
            is_active: true,
            verified: false
          },
          {
            id: 3,
            platform: "tiktok",
            username: "@sarahj",
            followers_count: 15000,
            engagement_rate: 4.1,
            is_active: true,
            verified: false
          }
        ],
        recent_collaborations: [
          {
            id: 1,
            brand_name: "Fashion Forward",
            campaign_title: "Summer Collection 2024",
            status: "completed",
            created_at: "2024-01-15T10:30:00Z",
            rating: 5
          },
          {
            id: 2,
            brand_name: "Beauty Brand",
            campaign_title: "Skincare Routine",
            status: "completed",
            created_at: "2024-01-10T14:20:00Z",
            rating: 4
          },
          {
            id: 3,
            brand_name: "Travel Co",
            campaign_title: "Destination Guide",
            status: "active",
            created_at: "2024-01-20T09:15:00Z"
          }
        ],
        performance_metrics: {
          total_campaigns: 15,
          completed_campaigns: 12,
          average_rating: 4.6,
          response_rate: 95,
          completion_rate: 80
        }
      };
      
      setProfile(mockProfile);
    } catch (error: any) {
      console.error('Failed to fetch influencer profile:', error);
      setError('Failed to load influencer profile.');
      toast.error('Failed to load influencer profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (influencerId) {
      fetchProfile();
    }
  }, [influencerId]);

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={`${colors[status] || 'bg-gray-100 text-gray-800'} border-0 text-xs`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getEngagementTrend = (rate: number) => {
    if (rate > 4.0) return { icon: HiArrowTrendingUp, color: 'text-green-500', text: 'High' };
    if (rate > 3.0) return { icon: HiMinus, color: 'text-yellow-500', text: 'Medium' };
    return { icon: HiArrowTrendingDown, color: 'text-red-500', text: 'Low' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlobalLoader />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <HiExclamationTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Profile not found</h3>
          <p className="text-gray-500 mb-4">The influencer profile you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/brand/influencers')}>
            <HiArrowLeft className="w-4 h-4 mr-2" />
            Back to Influencers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5 rounded-xl -m-2"></div>
          
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.back()}
                className="border border-gray-200 hover:border-purple-300 hover:bg-purple-50"
              >
                <HiArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-gray-900 bg-clip-text text-transparent mb-1">
                  Influencer Profile
                </h1>
                <p className="text-sm text-gray-600">
                  View detailed profile and collaboration history.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {profile.is_verified && (
                <Badge className="bg-blue-100 text-blue-800 border-0">
                  <HiCheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchProfile}
                disabled={isLoading}
                className="border border-gray-200 hover:border-purple-300 hover:bg-purple-50"
              >
                <HiEye className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Overview */}
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Profile Image */}
                  <div className="flex-shrink-0">
                    {profile.profile_image ? (
                      <img 
                        src={profile.profile_image} 
                        alt={`${profile.user_first_name} ${profile.user_last_name}`}
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                        <span className="text-white text-2xl font-bold">
                          {profile.user_first_name?.charAt(0)}{profile.user_last_name?.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Profile Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {profile.user_first_name} {profile.user_last_name}
                      </h2>
                      {profile.is_verified && (
                        <HiCheckCircle className="w-6 h-6 text-blue-500" />
                      )}
                    </div>
                    
                    <p className="text-lg text-gray-600 mb-2">@{profile.username}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline" className="capitalize">
                        {profile.industry}
                      </Badge>
                      {profile.categories.map((category) => (
                        <Badge key={category} variant="secondary" className="capitalize">
                          {category}
                        </Badge>
                      ))}
                    </div>
                    
                    <p className="text-gray-700 leading-relaxed">
                      {profile.bio}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Media Accounts */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HiGlobeAlt className="w-5 h-5 text-blue-600" />
                  Social Media Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile.social_accounts.map((account) => {
                    const engagement = getEngagementTrend(account.engagement_rate);
                    return (
                      <div key={account.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {account.platform}
                            </Badge>
                            {account.verified && (
                              <HiCheckCircle className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                          <Badge 
                            variant={account.is_active ? "default" : "secondary"}
                            className={account.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                          >
                            {account.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="font-medium text-gray-900">{account.username}</p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Followers:</span>
                            <span className="font-medium">{formatFollowers(account.followers_count)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Engagement:</span>
                            <div className="flex items-center gap-1">
                              <engagement.icon className={`w-4 h-4 ${engagement.color}`} />
                              <span className="font-medium">{account.engagement_rate}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Collaborations */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HiStar className="w-5 h-5 text-yellow-600" />
                  Recent Collaborations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.recent_collaborations.map((collab) => (
                    <div key={collab.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{collab.campaign_title}</h4>
                          <p className="text-sm text-gray-600">{collab.brand_name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(collab.status)}
                          {collab.rating && (
                            <div className="flex items-center gap-1">
                              <HiStar className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm font-medium">{collab.rating}/5</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatDate(collab.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Overview */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HiArrowTrendingUp className="w-5 h-5 text-green-600" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Total Followers:</span>
                    <span className="font-semibold text-lg">{formatFollowers(profile.total_followers)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Avg. Engagement:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">{profile.average_engagement_rate}%</span>
                      {(() => {
                        const engagement = getEngagementTrend(profile.average_engagement_rate);
                        return <engagement.icon className={`w-4 h-4 ${engagement.color}`} />;
                      })()}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Social Accounts:</span>
                    <span className="font-semibold">{profile.social_accounts_count}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Total Campaigns:</span>
                    <span className="font-semibold">{profile.performance_metrics.total_campaigns}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Completion Rate:</span>
                    <span className="font-semibold text-green-600">{profile.performance_metrics.completion_rate}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Avg. Rating:</span>
                    <div className="flex items-center gap-1">
                      <HiStar className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold">{profile.performance_metrics.average_rating}/5</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                    onClick={() => {
                      const url = `/brand/messages?influencer=${profile.id}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <HiChatBubbleLeftRight className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-purple-200 hover:bg-purple-50"
                    onClick={() => {
                      // This would bookmark the influencer
                      toast.success('Influencer bookmarked!');
                    }}
                  >
                    <HiHeart className="w-4 h-4 mr-2" />
                    Bookmark
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-blue-200 hover:bg-blue-50"
                    onClick={() => {
                      // This would invite to campaign
                      toast.info('Campaign invitation feature coming soon!');
                    }}
                  >
                    <HiUsers className="w-4 h-4 mr-2" />
                    Invite to Campaign
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Profile Info */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HiUser className="w-5 h-5 text-gray-600" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Member since:</span>
                    <span className="font-medium">{formatDate(profile.created_at)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Industry:</span>
                    <span className="font-medium capitalize">{profile.industry}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Response Rate:</span>
                    <span className="font-medium text-green-600">{profile.performance_metrics.response_rate}%</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <Badge className="bg-green-100 text-green-800 border-0">
                      Active
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
