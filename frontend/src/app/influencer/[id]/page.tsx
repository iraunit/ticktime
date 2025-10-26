"use client";

import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {GlobalLoader} from "@/components/ui/global-loader";
import {toast} from "@/lib/toast";
import {api} from "@/lib/api";
import {CampaignSelectionDialog} from "@/components/campaigns/campaign-selection-dialog";
import {
    HiArrowLeft,
    HiArrowTrendingDown,
    HiArrowTrendingUp,
    HiChatBubbleLeft,
    HiCheckCircle,
    HiExclamationTriangle,
    HiEye,
    HiHeart,
    HiMinus,
    HiPlay,
    HiShare,
    HiStar,
    HiUsers
} from "react-icons/hi2";
import {
    FaFacebook,
    FaInstagram,
    FaLinkedin,
    FaPinterest,
    FaSnapchat,
    FaTiktok,
    FaTwitter,
    FaYoutube
} from "react-icons/fa";
import {getDealTypeConfig} from "@/lib/platform-config";

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
    brand_collaborations: BrandCollaboration[];
    content_keywords: string[];
    hashtags_used: HashtagUsage[];
    performance_metrics: PerformanceMetrics;
    // Collaboration details
    collaboration_types?: ('cash' | 'barter' | 'hybrid')[];
    minimum_collaboration_amount?: number;
    barter_ready?: boolean;
    commerce_ready?: boolean;
}

interface BrandCollaboration {
    id: number;
    name: string;
    logo?: string;
    collaboration_count: number;
}

interface HashtagUsage {
    tag: string;
    count: number;
}

interface PerformanceMetrics {
    total_campaigns: number;
    completed_campaigns: number;
    average_rating: number;
    total_earnings: number;
}

interface SocialAccount {
    id: number;
    platform: string;
    handle: string;
    username: string; // This is now mapped from 'handle' in the serializer
    profile_url?: string;
    platform_handle?: string;
    platform_profile_link?: string;
    followers_count: number;
    following_count: number;
    posts_count: number;
    engagement_rate: number;
    average_likes: number;
    average_comments: number;
    average_shares: number;
    is_active: boolean;
    verified: boolean;

    // Platform-specific metrics
    // Instagram
    average_image_likes?: number;
    average_image_comments?: number;
    average_reel_plays?: number;
    average_reel_likes?: number;
    average_reel_comments?: number;

    // YouTube
    average_video_views?: number;
    average_shorts_plays?: number;
    average_shorts_likes?: number;
    average_shorts_comments?: number;
    subscribers_count?: number;

    // TikTok
    tiktok_followers?: number;
    tiktok_following?: number;
    tiktok_likes?: number;
    tiktok_videos?: number;

    // Twitter
    twitter_followers?: number;
    twitter_following?: number;
    tweets_count?: number;

    // Facebook
    page_likes?: number;
    page_followers?: number;

    // Growth metrics
    follower_growth_rate?: number;
    subscriber_growth_rate?: number;
    last_posted_at?: string;
    post_performance_score?: number;
}

interface Collaboration {
    id: number;
    brand_name: string;
    campaign_title: string;
    status: string;
    created_at: string;
    rating?: number;
}


export default function InfluencerProfilePage() {
    const params = useParams();
    const router = useRouter();
    const influencerId = params.id as string;

    const [profile, setProfile] = useState<InfluencerProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isBookmarking, setIsBookmarking] = useState(false);

    const fetchProfile = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get(`/influencers/${influencerId}/public/`);
            console.log('Influencer profile data:', response.data.influencer);
            setProfile(response.data.influencer);
        } catch (error: any) {
            console.error('Failed to fetch influencer profile:', error);

            // Handle different error types
            if (error?.response?.status === 403) {
                setError('You do not have permission to view this profile.');
                toast.error('Access denied. You can only view your own profile.');
            } else if (error?.response?.status === 404) {
                setError('Influencer profile not found.');
                toast.error('The requested influencer profile does not exist.');
            } else if (error?.response?.data?.message) {
                setError(error.response.data.message);
                toast.error(error.response.data.message);
            } else {
                setError('Failed to load influencer profile.');
                toast.error('Failed to load influencer profile.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const checkBookmarkStatus = async () => {
        try {
            const response = await api.get('/brands/bookmarks/');
            const bookmarks = response.data.bookmarks || [];
            const isBookmarked = bookmarks.some((bookmark: any) =>
                bookmark.influencer.id === parseInt(influencerId)
            );
            setIsBookmarked(isBookmarked);
        } catch (error) {
            console.error('Failed to check bookmark status:', error);
        }
    };

    const handleBookmark = async () => {
        if (!profile) return;

        setIsBookmarking(true);
        try {
            if (isBookmarked) {
                // Remove bookmark
                await api.delete(`/brands/influencers/${influencerId}/unbookmark/`);
                setIsBookmarked(false);
                toast.success('Influencer removed from bookmarks');
            } else {
                // Add bookmark
                await api.post(`/brands/influencers/${influencerId}/bookmark/`);
                setIsBookmarked(true);
                toast.success('Influencer bookmarked successfully');
            }
        } catch (error: any) {
            console.error('Failed to bookmark/unbookmark:', error);
            toast.error(error.response?.data?.message || 'Failed to update bookmark');
        } finally {
            setIsBookmarking(false);
        }
    };


    useEffect(() => {
        if (influencerId) {
            fetchProfile();
            checkBookmarkStatus();
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
        if (rate > 4.0) return {icon: HiArrowTrendingUp, color: 'text-green-500', text: 'High'};
        if (rate > 3.0) return {icon: HiMinus, color: 'text-yellow-500', text: 'Medium'};
        return {icon: HiArrowTrendingDown, color: 'text-red-500', text: 'Low'};
    };

    const getPlatformIcon = (platform: string) => {
        const icons: { [key: string]: { icon: any, color: string, bgColor: string } } = {
            instagram: {
                icon: FaInstagram,
                color: 'text-pink-600',
                bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500'
            },
            youtube: {icon: FaYoutube, color: 'text-red-600', bgColor: 'bg-red-500'},
            tiktok: {icon: FaTiktok, color: 'text-black', bgColor: 'bg-black'},
            twitter: {icon: FaTwitter, color: 'text-blue-500', bgColor: 'bg-blue-500'},
            facebook: {icon: FaFacebook, color: 'text-blue-600', bgColor: 'bg-blue-600'},
            linkedin: {icon: FaLinkedin, color: 'text-blue-700', bgColor: 'bg-blue-700'},
            snapchat: {icon: FaSnapchat, color: 'text-yellow-500', bgColor: 'bg-yellow-500'},
            pinterest: {icon: FaPinterest, color: 'text-red-500', bgColor: 'bg-red-500'}
        };
        return icons[platform] || {icon: '🌐', color: 'text-gray-600', bgColor: 'bg-gray-500'};
    };

    const getPlatformUrl = (platform: string, handle: string, platformProfileLink?: string) => {
        if (platformProfileLink) return platformProfileLink;

        const urls: { [key: string]: string } = {
            instagram: `https://instagram.com/${handle.replace('@', '')}`,
            youtube: `https://youtube.com/@${handle.replace('@', '')}`,
            tiktok: `https://tiktok.com/@${handle.replace('@', '')}`,
            twitter: `https://twitter.com/${handle.replace('@', '')}`,
            facebook: `https://facebook.com/${handle.replace('@', '')}`,
            linkedin: `https://linkedin.com/in/${handle.replace('@', '')}`,
            snapchat: `https://snapchat.com/add/${handle.replace('@', '')}`,
            pinterest: `https://pinterest.com/${handle.replace('@', '')}`
        };
        return urls[platform] || '#';
    };

    const getPlatformSpecificMetrics = (account: SocialAccount) => {
        const metrics = [];

        switch (account.platform) {
            case 'instagram':
                if (account.average_reel_plays) {
                    metrics.push({
                        label: 'Avg Reel Plays',
                        value: formatFollowers(account.average_reel_plays),
                        icon: HiPlay
                    });
                }
                if (account.average_image_likes) {
                    metrics.push({
                        label: 'Avg Image Likes',
                        value: formatFollowers(account.average_image_likes),
                        icon: HiHeart
                    });
                }
                break;
            case 'youtube':
                if (account.average_video_views) {
                    metrics.push({
                        label: 'Avg Video Views',
                        value: formatFollowers(account.average_video_views),
                        icon: HiEye
                    });
                }
                if (account.subscribers_count) {
                    metrics.push({
                        label: 'Subscribers',
                        value: formatFollowers(account.subscribers_count),
                        icon: HiUsers
                    });
                }
                if (account.average_shorts_plays) {
                    metrics.push({
                        label: 'Avg Shorts Plays',
                        value: formatFollowers(account.average_shorts_plays),
                        icon: HiPlay
                    });
                }
                break;
            case 'tiktok':
                if (account.tiktok_likes) {
                    metrics.push({label: 'Total Likes', value: formatFollowers(account.tiktok_likes), icon: HiHeart});
                }
                if (account.tiktok_videos) {
                    metrics.push({label: 'Videos', value: account.tiktok_videos.toString(), icon: HiPlay});
                }
                break;
            case 'twitter':
                if (account.tweets_count) {
                    metrics.push({label: 'Tweets', value: account.tweets_count.toString(), icon: HiChatBubbleLeft});
                }
                break;
        }

        return metrics;
    };


    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <GlobalLoader/>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <HiExclamationTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4"/>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Profile not found</h3>
                    <p className="text-gray-500 mb-4">The influencer profile you're looking for doesn't exist.</p>
                    <Button onClick={() => router.push('/brand/influencers')}>
                        <HiArrowLeft className="w-4 h-4 mr-2"/>
                        Back to Influencers
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-6 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                                Influencer Profile
                            </h1>
                            <p className="text-sm text-gray-500">
                                Professional profile and collaboration history
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {profile.is_verified && (
                                <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                                    <HiCheckCircle className="w-3 h-3 mr-1"/>
                                    Verified
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Profile Overview */}
                        <Card className="border border-gray-200">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-6">
                                    {/* Profile Image */}
                                    <div className="flex-shrink-0">
                                        {profile.profile_image ? (
                                            <img
                                                src={profile.profile_image}
                                                alt={`${profile.user_first_name} ${profile.user_last_name}`}
                                                className="w-20 h-20 rounded-full object-cover border border-gray-200"
                                            />
                                        ) : (
                                            <div
                                                className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                                                <span className="text-gray-600 text-lg font-medium">
                          {profile.user_first_name?.charAt(0)}{profile.user_last_name?.charAt(0)}
                        </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Profile Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h2 className="text-xl font-semibold text-gray-900">
                                                {profile.user_first_name} {profile.user_last_name}
                                            </h2>
                                            {profile.is_verified && (
                                                <HiCheckCircle className="w-5 h-5 text-green-600"/>
                                            )}
                                        </div>

                                        <p className="text-sm text-gray-600 mb-3">@{profile.username}</p>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <Badge variant="outline" className="text-xs">
                                                {profile.industry}
                                            </Badge>
                                            {profile.categories.slice(0, 3).map((category) => (
                                                <Badge key={category} variant="secondary" className="text-xs">
                                                    {category}
                                                </Badge>
                                            ))}
                                        </div>

                                        <p className="text-sm text-gray-700 leading-relaxed mb-4">
                                            {profile.bio}
                                        </p>

                                        {/* Key Metrics */}
                                        <div className="grid grid-cols-5 gap-4">
                                            <div className="text-center">
                                                <div className="text-lg font-semibold text-gray-900">
                                                    {formatFollowers(profile.total_followers)}
                                                </div>
                                                <div className="text-xs text-gray-500">Followers</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-lg font-semibold text-gray-900">
                                                    {profile.average_engagement_rate}%
                                                </div>
                                                <div className="text-xs text-gray-500">Engagement</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-lg font-semibold text-gray-900">
                                                    {profile.social_accounts_count}
                                                </div>
                                                <div className="text-xs text-gray-500">Platforms</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-lg font-semibold text-gray-900">
                                                    {typeof profile.avg_rating === 'number' ? profile.avg_rating.toFixed(1) : 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-500">Avg Rating</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <HiStar className="w-4 h-4 text-yellow-400 fill-yellow-400"/>
                                                    <div className="text-lg font-semibold text-gray-900">
                                                        {profile.rating ? profile.rating.toFixed(1) : 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-500">Rating</div>
                                            </div>
                                        </div>

                                        {/* Collaboration Details */}
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <h4 className="text-sm font-medium text-gray-900 mb-3">Collaboration
                                                Preferences</h4>

                                            {/* Minimum Amount */}
                                            {profile.minimum_collaboration_amount && profile.minimum_collaboration_amount > 0 && (
                                                <div className="mb-3">
                                                    <span className="text-sm text-gray-600">Minimum Amount: </span>
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        ₹{profile.minimum_collaboration_amount.toLocaleString()}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Collaboration Types */}
                                            {profile.collaboration_types && profile.collaboration_types.length > 0 && (
                                                <div className="mb-3">
                                                    <span
                                                        className="text-sm text-gray-600 mb-2 block">Deal Types:</span>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {profile.collaboration_types.map((type) => {
                                                            const config = getDealTypeConfig(type);

                                                            return (
                                                                <Badge key={type} variant="outline"
                                                                       className={`text-xs ${config.bg} ${config.color} ${config.border} flex items-center gap-1`}>
                                                                    <span className="text-sm">{config.icon}</span>
                                                                    {config.label}
                                                                </Badge>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Readiness Indicators */}
                                            <div className="flex gap-2 flex-wrap">
                                                {profile.barter_ready && (
                                                    <Badge variant="outline"
                                                           className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                                        Barter Ready
                                                    </Badge>
                                                )}
                                                {profile.commerce_ready && (
                                                    <Badge variant="outline"
                                                           className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                        Commerce Ready
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Social Media Accounts */}
                        <Card className="border border-gray-200">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold text-gray-900">
                                    Social Media Accounts
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {profile.social_accounts.map((account) => {
                                        const engagement = getEngagementTrend(account.engagement_rate);
                                        const platformIcon = getPlatformIcon(account.platform);
                                        const platformUrl = getPlatformUrl(account.platform, account.handle, account.platform_profile_link);

                                        return (
                                            <div key={account.id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                            <platformIcon.icon
                                                                className={`w-4 h-4 ${platformIcon.color}`}/>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-medium text-gray-900 capitalize">
                                                                {account.platform}
                                                            </h3>
                                                            <p className="text-sm text-gray-600">
                                                                @{account.handle}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {account.verified && (
                                                            <HiCheckCircle className="w-4 h-4 text-green-600"/>
                                                        )}
                                                        <Badge
                                                            variant={account.is_active ? "default" : "secondary"}
                                                            className="text-xs"
                                                        >
                                                            {account.is_active ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-4 mb-3">
                                                    <div className="text-center">
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            {formatFollowers(account.followers_count)}
                                                        </div>
                                                        <div className="text-xs text-gray-500">Followers</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            {account.engagement_rate}%
                                                        </div>
                                                        <div className="text-xs text-gray-500">Engagement</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            {account.posts_count}
                                                        </div>
                                                        <div className="text-xs text-gray-500">Posts</div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 text-xs"
                                                        onClick={() => window.open(platformUrl, '_blank')}
                                                    >
                                                        View Profile
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-xs"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(platformUrl);
                                                            toast.success('Link copied');
                                                        }}
                                                    >
                                                        <HiShare className="w-3 h-3"/>
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Brand Collaborations */}
                        <Card className="border border-gray-200">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold text-gray-900">
                                    Brand Collaborations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {profile.brand_collaborations && profile.brand_collaborations.length > 0 ? (
                                    <div className="space-y-3">
                                        {profile.brand_collaborations.map((brand) => (
                                            <div key={brand.id}
                                                 className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    {brand.logo ? (
                                                        <img
                                                            src={brand.logo.startsWith('http') ? brand.logo : `/media/${brand.logo}`}
                                                            alt={brand.name}
                                                            className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                target.nextElementSibling?.classList.remove('hidden');
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div
                                                        className={`w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center ${brand.logo ? 'hidden' : ''}`}>
                                                        <span className="text-gray-600 font-medium text-sm">
                                                            {brand.name.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 text-sm">{brand.name}</h4>
                                                        <p className="text-xs text-gray-500">
                                                            {brand.collaboration_count} collaboration{brand.collaboration_count !== 1 ? 's' : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="text-xs">
                                                    Partner
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <HiStar className="w-8 h-8 text-gray-300 mx-auto mb-2"/>
                                        <p className="text-sm text-gray-500">No brand collaborations yet</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Content Keywords & Hashtags */}
                        <Card className="border border-gray-200">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold text-gray-900">
                                    Content Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Hashtags */}
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2 text-sm">Popular Hashtags</h4>
                                        {profile.hashtags_used && profile.hashtags_used.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {profile.hashtags_used.slice(0, 10).map((hashtag, index) => (
                                                    <Badge
                                                        key={index}
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        {hashtag.tag} ({hashtag.count})
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-500">No hashtags available</p>
                                        )}
                                    </div>

                                    {/* Content Keywords */}
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2 text-sm">Content Keywords</h4>
                                        {profile.content_keywords && profile.content_keywords.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {profile.content_keywords.slice(0, 10).map((keyword, index) => (
                                                    <Badge
                                                        key={index}
                                                        variant="secondary"
                                                        className="text-xs"
                                                    >
                                                        {keyword}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-500">No keywords available</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Collaborations */}
                        <Card className="border border-gray-200">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold text-gray-900">
                                    Recent Collaborations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {profile.recent_collaborations && profile.recent_collaborations.length > 0 ? (
                                    <div className="space-y-3">
                                        {profile.recent_collaborations.map((collab) => (
                                            <div key={collab.id} className="border border-gray-200 rounded-lg p-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 text-sm">{collab.campaign_title}</h4>
                                                        <p className="text-xs text-gray-600">{collab.brand_name}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {getStatusBadge(collab.status)}
                                                        {collab.rating && (
                                                            <div className="flex items-center gap-1">
                                                                <HiStar className="w-3 h-3 text-yellow-500"/>
                                                                <span
                                                                    className="text-xs font-medium">{collab.rating}/5</span>
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
                                ) : (
                                    <div className="text-center py-6">
                                        <HiStar className="w-8 h-8 text-gray-300 mx-auto mb-2"/>
                                        <p className="text-sm text-gray-500">No recent collaborations</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Performance Overview */}
                        <Card className="border border-gray-200">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold text-gray-900">
                                    Performance Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Total Followers</span>
                                        <span className="font-semibold text-gray-900">
                                            {formatFollowers(profile.total_followers)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Avg. Engagement</span>
                                        <span className="font-semibold text-gray-900">
                                            {profile.average_engagement_rate}%
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Social Accounts</span>
                                        <span className="font-semibold text-gray-900">
                                            {profile.social_accounts_count}
                                        </span>
                                    </div>

                                    {profile.performance_metrics && (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Campaigns</span>
                                                <span className="font-semibold text-gray-900">
                                                    {profile.performance_metrics.completed_campaigns}/{profile.performance_metrics.total_campaigns}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Avg. Rating</span>
                                                <span className="font-semibold text-gray-900">
                                                    {profile.performance_metrics.average_rating.toFixed(1)}/5
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card className="border border-gray-200">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold text-gray-900">
                                    Quick Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={handleBookmark}
                                        disabled={isBookmarking}
                                    >
                                        <HiHeart className={`w-4 h-4 mr-2 ${isBookmarked ? 'text-red-500' : ''}`}/>
                                        {isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
                                    </Button>

                                    <CampaignSelectionDialog
                                        trigger={
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                            >
                                                <HiUsers className="w-4 h-4 mr-2"/>
                                                Add to Campaign
                                            </Button>
                                        }
                                        influencerIds={[parseInt(influencerId)]}
                                        title="Add to Campaign"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Profile Info */}
                        <Card className="border border-gray-200">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold text-gray-900">
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
                                        <span className="text-gray-500">Status:</span>
                                        <Badge variant="outline"
                                               className="border-green-200 text-green-700 bg-green-50">
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
