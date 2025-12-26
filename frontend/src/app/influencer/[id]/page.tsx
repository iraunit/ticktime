"use client";

import {useEffect, useMemo, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {GlobalLoader} from "@/components/ui/global-loader";
import {toast} from "@/lib/toast";
import {api} from "@/lib/api";
import {normalizeRemoteUrl} from "@/lib/utils";
import {CampaignSelectionDialog} from "@/components/campaigns/campaign-selection-dialog";
import {Dialog, DialogContent,} from "@/components/ui/dialog";
import {
    HiArrowLeft,
    HiArrowPath,
    HiArrowTrendingUp,
    HiChatBubbleLeft,
    HiCheckBadge,
    HiCheckCircle,
    HiExclamationTriangle,
    HiEye,
    HiHeart,
    HiLink,
    HiMapPin,
    HiPlay,
    HiPresentationChartBar,
    HiSparkles,
    HiStar,
    HiUsers
} from "react-icons/hi2";
import {
    FaChrome,
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

const TICKTIME_INSTAGRAM_SCRAPER_STORE_URL =
    "https://chromewebstore.google.com/detail/ticktime-instagram-scrape/lhhmljnmniohfopjonfgdbkmkombkeha";

interface InfluencerProfile {
    id: number;
    user_first_name: string;
    user_last_name: string;
    username: string;
    display_name?: string;
    bio: string;
    industry: string;
    categories: string[];
    profile_image?: string;
    external_url?: string;
    is_verified: boolean;
    total_followers: number;
    average_engagement_rate: number;
    average_interaction?: string;
    average_views?: string;
    average_dislikes?: string;
    available_platforms?: string[];
    influence_score?: number;
    platform_score?: number;
    brand_safety_score?: number;
    content_quality_score?: number;
    response_time?: string;
    faster_responses?: boolean;
    contact_availability?: string;
    avg_rating?: number;
    rating?: number;
    social_accounts_count: number;
    collaboration_count?: number;
    total_earnings?: number;
    created_at: string;
    location?: string;
    audience_gender_distribution?: Record<string, number>;
    audience_age_distribution?: Record<string, number>;
    audience_locations?: string[];
    audience_interests?: string[];
    audience_languages?: string[];
    social_accounts: SocialAccount[];
    recent_posts?: SocialMediaPost[];
    recent_collaborations: Collaboration[];
    brand_collaborations: BrandCollaboration[];
    content_keywords: string[];
    hashtags_used: HashtagUsage[];
    performance_metrics: PerformanceMetrics;
    engagement_overview?: EngagementOverview;
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
    response_rate?: number;
    completion_rate?: number;
}

interface EngagementOverview {
    followers_total: number;
    avg_followers: number;
    avg_engagement_rate: number;
    avg_likes: number;
    avg_comments: number;
    avg_views: number;
    platform_breakdown: {
        platform: string;
        handle: string;
        followers: number;
        engagement_rate: number;
        average_likes: number;
        average_comments: number;
        average_video_views: number;
        last_synced_at?: string | null;
        last_posted_at?: string | null;
    }[];
}

interface EngagementSnapshot {
    post_engagement_rate?: number;
    video_engagement_rate?: number;
    overall_engagement_rate?: number;
    average_post_likes?: number;
    average_post_comments?: number;
    average_video_likes?: number;
    average_video_comments?: number;
    average_video_views?: number;
    post_expected_comments?: number;
    video_expected_comments?: number;
    video_expected_views?: number;
    posts_considered?: number;
    videos_considered?: number;
}

interface SocialMediaPost {
    id: number;
    platform_post_id: string;
    platform: string;
    post_url?: string;
    post_type?: string;
    caption?: string;
    hashtags?: string[];
    mentions?: string[];
    posted_at?: string;
    likes_count?: number;
    comments_count?: number;
    views_count?: number;
    shares_count?: number;
    raw_data?: Record<string, any>;
    thumbnail_url?: string;
    media_urls?: string[];
}

interface SocialAccount {
    id: number;
    platform: string;
    handle: string;
    username: string; // This is now mapped from 'handle' in the serializer
    profile_url?: string;
    display_name?: string;
    bio?: string;
    external_url?: string;
    is_private?: boolean;
    profile_image_url?: string;
    platform_handle?: string;
    platform_profile_link?: string;
    followers_count: number;
    following_count: number;
    posts_count: number;
    engagement_rate: number;
    average_likes: number;
    average_comments: number;
    average_shares: number;
    average_video_views?: number;
    average_video_likes?: number;
    average_video_comments?: number;
    is_active: boolean;
    verified: boolean;            // TickTime-owned verification (belongs to this user)
    platform_verified?: boolean;  // Verified on platform (blue tick etc.)
    follower_growth_rate?: number;
    subscriber_growth_rate?: number;
    last_posted_at?: string;
    last_synced_at?: string;
    engagement_snapshot?: EngagementSnapshot;
    recent_posts?: SocialMediaPost[];
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
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedPost, setSelectedPost] = useState<SocialMediaPost | null>(null);

    const fetchProfile = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get(`/influencers/${influencerId}/public/`);
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

    const formatFollowers = (count: number | undefined) => {
        if (count === undefined || count === null) return "0";
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };

    const formatPercentage = (value?: number | null) => {
        if (!isValidNumber(value)) return "N/A";
        return `${value.toFixed(1)}%`;
    };

    const formatCurrency = (value?: number) => {
        if (value === undefined || value === null || Number.isNaN(value)) return "N/A";
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateString?: string | null) => {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return 'Unknown';
        return date.toLocaleString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isValidNumber = (value: unknown): value is number =>
        typeof value === 'number' && !Number.isNaN(value);

    const formatScore = (value?: number | null, decimals = 1, fallback = 'N/A') =>
        isValidNumber(value) ? value.toFixed(decimals) : fallback;

    const safeArray = <T, >(value?: T[] | null): T[] => (Array.isArray(value) ? value : []);

    // Keep these hooks ABOVE any early returns (loading/error) to avoid hook order changes
    const socialAccounts = profile?.social_accounts;
    const verifiedPlatforms = useMemo(() => {
        return new Set(
            safeArray(socialAccounts)
                .filter((a) => a?.verified)
                .map((a) => String(a.platform).toLowerCase())
        );
    }, [socialAccounts]);

    const platformVerifiedPlatforms = useMemo(() => {
        return new Set(
            safeArray(socialAccounts)
                .filter((a) => a?.platform_verified)
                .map((a) => String(a.platform).toLowerCase())
        );
    }, [socialAccounts]);

    const parseNumericValue = (value?: string | number | null): number | null => {
        if (value === undefined || value === null) return null;
        if (typeof value === 'number') {
            return Number.isFinite(value) ? value : null;
        }
        const sanitized = value.replace(/[^0-9.\-]/g, '');
        if (!sanitized) return null;
        const numeric = Number(sanitized);
        return Number.isFinite(numeric) ? numeric : null;
    };

    const getNumericValue = (value?: string | number | null): number | null => {
        if (value === undefined || value === null) return null;
        if (typeof value === 'number') {
            return Number.isFinite(value) ? value : null;
        }
        return parseNumericValue(value);
    };

    const tryFormatFollowers = (value?: string | number | null): string | null => {
        const numeric = parseNumericValue(value);
        if (numeric === null) return null;
        return formatFollowers(numeric);
    };

    const getPrimaryThumbnail = (post: SocialMediaPost): string | undefined => {
        const raw = post.raw_data || {};
        const get = (path: string): unknown => {
            try {
                // eslint-disable-next-line @typescript-eslint/no-implied-eval
                return Function('obj', `try { return obj?.${path}; } catch { return undefined }`)(raw);
            } catch {
                return undefined;
            }
        };

        // Normalize URL: add https:// if it looks like a domain but doesn't have a protocol
        const normalizeUrl = (url: string | undefined): string | undefined => {
            if (!url || typeof url !== 'string') return undefined;
            // If already has protocol, return as is
            if (url.startsWith('http://') || url.startsWith('https://')) {
                return url;
            }
            // If it looks like a domain (contains a dot and looks like a URL path), add https://
            if (url.includes('.') && (url.includes('/') || url.length > 10)) {
                return `https://${url}`;
            }
            return url;
        };

        const firstFrom = (arr?: unknown[]) => {
            const found = Array.isArray(arr) ? arr.find((x) => typeof x === 'string' && x.length > 0) : undefined;
            return found ? normalizeUrl(found as string) : undefined;
        };

        const directCandidates: Array<unknown> = [
            post.thumbnail_url,
            Array.isArray(post.media_urls) ? post.media_urls[0] : undefined,
        ];

        const candidates: Array<unknown> = [
            raw.thumbnail_url,
            raw.thumbnailUrl,
            raw.image_url,
            raw.imageUrl,
            raw.media_url,
            raw.mediaUrl,
            raw.preview_image_url,
            raw.previewImageUrl,
            raw.preview_url,
            raw.display_url,
            raw.picture,
            raw.cover_image,
            raw.cover,
            raw.image,
            raw.photo,
            raw.media?.[0]?.media_url,
            raw.media?.[0]?.url,
            raw.media?.[0]?.thumbnail_url,
            Array.isArray(raw.media_urls) ? raw.media_urls[0] : undefined,
            Array.isArray(raw.images) ? raw.images[0] : undefined,
            raw.resources?.[0]?.src,
            raw.extended_entities?.media?.[0]?.media_url_https,
            raw.extended_entities?.media?.[0]?.media_url,
            // Instagram common structures
            get('thumbnail_src'),
            get('display_resources?.[0]?.src'),
            get('image_versions2?.candidates?.[0]?.url'),
            get('edge_sidecar_to_children?.edges?.[0]?.node?.display_url'),
            get('edge_sidecar_to_children?.edges?.[0]?.node?.thumbnail_src'),
            // Twitter/X extended media
            get('entities?.media?.[0]?.media_url_https'),
            get('entities?.media?.[0]?.media_url'),
        ];

        // Check direct candidates first (prioritize media_urls from database)
        const directValid = directCandidates
            .map((value) => normalizeUrl(typeof value === 'string' ? value : undefined))
            .find((value) => typeof value === 'string' && (value.startsWith('http') || value.includes('.')));

        if (directValid) {
            return directValid;
        }

        // Then check other candidates
        const candidateValid = candidates
            .map((value) => normalizeUrl(typeof value === 'string' ? value : undefined))
            .find((value) => typeof value === 'string' && (value.startsWith('http') || value.includes('.')));

        if (candidateValid) {
            return candidateValid;
        }

        // Fallback to array searches
        return firstFrom(get('display_resources') as unknown[]) ||
            firstFrom(get('image_versions2?.candidates') as unknown[]);
    };

    const getPostEmbedUrl = (post: SocialMediaPost): string | null => {
        if (!post.post_url) {
            return null;
        }

        try {
            const url = new URL(post.post_url);
            const hostname = url.hostname.toLowerCase();
            const pathnameSegments = url.pathname.split('/').filter(Boolean);

            if (hostname === 'youtu.be') {
                const videoId = pathnameSegments[0];
                if (videoId) {
                    return `https://www.youtube.com/embed/${videoId}`;
                }
            }

            if (hostname.includes('youtube.com')) {
                const videoId =
                    url.searchParams.get('v') ||
                    (pathnameSegments[0] === 'shorts' ? pathnameSegments[1] : null);
                if (videoId) {
                    return `https://www.youtube.com/embed/${videoId}`;
                }
            }

            if (hostname.includes('tiktok.com')) {
                const videoIndex = pathnameSegments.indexOf('video');
                if (videoIndex !== -1 && pathnameSegments[videoIndex + 1]) {
                    return `https://www.tiktok.com/embed/v2/${pathnameSegments[videoIndex + 1]}`;
                }
            }
        } catch (error) {
            return null;
        }

        return null;
    };

    const getAudienceDistribution = (distribution?: Record<string, number>) => {
        if (!distribution) return [];
        return Object.entries(distribution)
            .filter(([_, value]) => value && value > 0)
            .sort((a, b) => (b[1] || 0) - (a[1] || 0));
    };
    const canonicalMetricLabel = (label: string) => {
        const normalized = label.trim().toLowerCase();
        const aliasMap: Record<string, string> = {
            'avg likes': 'Average Likes',
            'average likes': 'Average Likes',
            'avg comments': 'Average Comments',
            'average comments': 'Average Comments',
            'avg shares': 'Average Shares',
            'average shares': 'Average Shares',
            'avg video views': 'Average Video Views',
            'average video views': 'Average Video Views',
            'avg video likes': 'Average Video Likes',
            'average video likes': 'Average Video Likes',
            'avg video comments': 'Average Video Comments',
            'average video comments': 'Average Video Comments',
            'overall engagement rate': 'Overall Engagement Rate',
            'video engagement rate': 'Video Engagement Rate',
            'post engagement rate': 'Post Engagement Rate',
            'video expected views': 'Video Expected Views',
            'video expected comments': 'Video Expected Comments',
            'videos considered': 'Videos Considered',
            'posts considered': 'Posts Considered',
        };
        return aliasMap[normalized] ?? label.replace(/\s+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const renderCaptionWithHighlights = (caption: string) => {
        if (!caption) return null;

        const parts = caption.split(/(\s+)/);

        return parts.map((part, index) => {
            const trimmed = part.trim();
            const isHashtag = trimmed.startsWith('#') && trimmed.length > 1;
            const isMention = trimmed.startsWith('@') && trimmed.length > 1;

            if (isHashtag || isMention) {
                return (
                    <span key={index} className="text-blue-600 break-words break-all">
                        {part}
                    </span>
                );
            }

            return (
                <span key={index} className="break-words break-all">
                    {part}
                </span>
            );
        });
    };

    const RecentPostTile = ({post}: { post: SocialMediaPost }) => {
        const initialThumbnail = getPrimaryThumbnail(post);
        const [thumbnail, setThumbnail] = useState<string | null>(initialThumbnail || null);

        const embedUrl = getPostEmbedUrl(post);
        const hasEmbed = Boolean(embedUrl);
        const hasImage = Boolean(thumbnail);
        const hasMedia = hasEmbed || hasImage;

        const timestamp = post.posted_at ? formatDateTime(post.posted_at) : 'Unknown';
        const postStats = [
            {label: 'Likes', value: formatFollowers(post.likes_count || 0)},
            {label: 'Comments', value: formatFollowers(post.comments_count || 0)},
            {label: 'Views', value: formatFollowers(post.views_count || 0)},
            {label: 'Shares', value: formatFollowers(post.shares_count || 0)},
        ];

        const platformIcon = getPlatformIcon(post.platform);
        const IconComponent = platformIcon.icon;

        const handleOpenPost = (event: React.MouseEvent | React.KeyboardEvent) => {
            if (!post.post_url) {
                return;
            }
            if ('key' in event) {
                if (event.key !== 'Enter' && event.key !== ' ') {
                    return;
                }
                event.preventDefault();
            }
            if ('preventDefault' in event && typeof event.preventDefault === 'function') {
                event.preventDefault();
            }
            window.open(post.post_url, '_blank', 'noopener,noreferrer');
        };

        const overlayVisibilityClass = hasMedia ? 'opacity-0 group-hover:opacity-100' : 'opacity-100';

        return (
            <div
                role={post.post_url ? 'button' : 'presentation'}
                tabIndex={post.post_url ? 0 : -1}
                onClick={post.post_url ? handleOpenPost : undefined}
                onKeyDown={post.post_url ? handleOpenPost : undefined}
                className={`relative group aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-gray-900/5 shadow-sm transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    post.post_url ? 'cursor-pointer' : 'cursor-default'
                }`}
            >
                {hasEmbed && (
                    <iframe
                        src={embedUrl!}
                        title={`post-${post.platform_post_id}`}
                        className="absolute inset-0 h-full w-full pointer-events-none"
                        loading="lazy"
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                        allowFullScreen
                        sandbox="allow-scripts allow-same-origin allow-popups"
                        referrerPolicy="origin-when-cross-origin"
                    />
                )}

                {hasImage && (
                    <img
                        src={thumbnail!}
                        alt={post.caption || `${post.platform} post`}
                        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
                        loading="lazy"
                        onError={() => setThumbnail(null)}
                    />
                )}

                {!hasMedia && (
                    <div
                        className={`absolute inset-0 ${platformIcon.bgColor} flex flex-col items-center justify-center text-white px-4 text-center space-y-2 z-10`}>
                        <div className="bg-white/15 rounded-full p-2">
                            <IconComponent className="w-6 h-6"/>
                        </div>
                        <span className="text-[10px] uppercase tracking-wide text-white/80">
                            {post.platform}
                        </span>
                        <p className="text-sm font-medium text-white/95 whitespace-pre-wrap break-words line-clamp-4">
                            {post.caption || 'Preview unavailable'}
                        </p>
                    </div>
                )}

                <div
                    className={`absolute inset-0 z-20 bg-black/65 text-white flex flex-col justify-between p-3 text-xs transition-opacity pointer-events-none ${overlayVisibilityClass}`}
                >
                    <div className="flex items-center justify-between">
                        <span className="uppercase tracking-wide text-[10px] text-white/70 flex items-center gap-1">
                            <IconComponent className={`w-3 h-3 ${platformIcon.color}`}/>
                            {post.platform}
                        </span>
                        <span>{timestamp}</span>
                    </div>

                    <div>
                        <span className="text-sm font-semibold block mb-2">
                            {post.post_type ? post.post_type.toUpperCase() : 'POST'}
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                            {postStats.map((stat) => (
                                <div
                                    key={`${post.platform_post_id}_${stat.label}`}
                                    className="bg-white/10 rounded-md px-2 py-1"
                                >
                                    <div className="text-[10px] uppercase tracking-wide text-white/70">
                                        {stat.label}
                                    </div>
                                    <div className="text-sm font-semibold">
                                        {stat.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };


    const truncate = (text?: string, max = 120) => {
        if (!text) return '';
        if (text.length <= max) return text;
        return `${text.slice(0, max)}…`;
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
        return icons[platform] || {
            icon: ({className = ''}: { className?: string }) => (
                <span className={`text-gray-600 text-sm ${className}`.trim()}>●</span>
            ),
            color: 'text-gray-600',
            bgColor: 'bg-gray-500'
        };
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
        const snapshot = account.engagement_snapshot || {};

        if (snapshot.post_engagement_rate) {
            metrics.push({
                label: 'Post ER',
                value: `${snapshot.post_engagement_rate.toFixed(2)}%`,
                icon: HiArrowTrendingUp
            });
        }

        if (snapshot.video_engagement_rate) {
            metrics.push({
                label: 'Video ER',
                value: `${snapshot.video_engagement_rate.toFixed(2)}%`,
                icon: HiPlay
            });
        }

        if (snapshot.average_post_likes) {
            metrics.push({
                label: 'Avg Post Likes',
                value: formatFollowers(Math.round(snapshot.average_post_likes)),
                icon: HiHeart
            });
        }

        if (snapshot.average_post_comments) {
            metrics.push({
                label: 'Avg Post Comments',
                value: formatFollowers(Math.round(snapshot.average_post_comments)),
                icon: HiChatBubbleLeft
            });
        }

        if (account.average_video_views) {
            metrics.push({
                label: 'Avg Video Views',
                value: formatFollowers(account.average_video_views),
                icon: HiEye
            });
        }

        if (account.average_video_likes) {
            metrics.push({
                label: 'Avg Video Likes',
                value: formatFollowers(account.average_video_likes),
                icon: HiHeart
            });
        }

        if (account.average_video_comments) {
            metrics.push({
                label: 'Avg Video Comments',
                value: formatFollowers(account.average_video_comments),
                icon: HiChatBubbleLeft
            });
        }

        return metrics;
    };

    const handleRefresh = async () => {
        if (!influencerId) return;
        setIsRefreshing(true);
        try {
            toast.info("For the freshest Instagram data, install the TickTime Chrome Extension, then refresh again.");

            const response = await api.post(`/influencers/${influencerId}/refresh/`);
            const updatedProfile = response.data?.influencer;
            if (updatedProfile) {
                setProfile(updatedProfile);
            }
            toast.success('Profile refreshed');
        } catch (error: any) {
            console.error('Failed to refresh influencer profile:', error);
            const message = error?.response?.data?.message || 'Failed to refresh profile.';
            toast.error(message);
        } finally {
            setIsRefreshing(false);
        }
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

    // Use ONLY influencer profile data for main profile display (NOT social media account data)
    const profileImageSrc = profile.profile_image || undefined;
    const displayName = `${profile.user_first_name} ${profile.user_last_name}`.trim() || profile.username;

    const heroPrimaryStats: Array<{ label: string; value: string }> = [
        {label: 'Followers', value: formatFollowers(profile.total_followers)},
        {label: 'Avg Engagement', value: formatPercentage(profile.average_engagement_rate)},
        {label: 'Platforms', value: `${profile.social_accounts_count ?? 0}`},
    ];

    const heroOptionalStats: Array<{ label: string; value: string | null }> = [
        profile.average_interaction ? {label: 'Avg Interaction', value: profile.average_interaction} : null,
        {label: 'Avg Views', value: tryFormatFollowers(profile.average_views)},
        {label: 'Avg Dislikes', value: tryFormatFollowers(profile.average_dislikes)},
        isValidNumber(profile.influence_score) ? {
            label: 'Influence Score',
            value: formatScore(profile.influence_score)
        } : null,
        isValidNumber(profile.brand_safety_score) ? {
            label: 'Brand Safety',
            value: formatScore(profile.brand_safety_score)
        } : null,
        profile.collaboration_count ? {label: 'Collaborations', value: `${profile.collaboration_count}`} : null,
    ].filter((stat): stat is { label: string; value: string } => Boolean(stat?.value));

    const heroStats = [...heroPrimaryStats, ...heroOptionalStats];

    const statusBadges: Array<{ label: string; value: string }> = [
        profile.response_time ? {label: 'Response Time', value: profile.response_time.replace(/_/g, ' ')} : null,
        profile.contact_availability ? {
            label: 'Availability',
            value: profile.contact_availability.replace(/_/g, ' ')
        } : null,
        profile.faster_responses ? {label: 'Priority Responses', value: 'Enabled'} : null,
    ].filter((badge): badge is { label: string; value: string } => Boolean(badge?.value));

    const kpiTiles: Array<{ label: string; value: string; icon: any; color: string }> = [
        {label: 'Followers', value: formatFollowers(profile.total_followers), icon: HiUsers, color: 'text-blue-600'},
        {
            label: 'ER',
            value: formatPercentage(profile.average_engagement_rate),
            icon: HiArrowTrendingUp,
            color: 'text-emerald-600'
        },
        {
            label: 'Platforms',
            value: String(profile.social_accounts_count ?? 0),
            icon: HiPresentationChartBar,
            color: 'text-violet-600'
        },
    ].filter((tile) => tile.value && tile.value !== '0' && tile.value !== '0%');

    const influenceScoreValue = getNumericValue(profile.influence_score);
    const platformScoreValue = getNumericValue(profile.platform_score);
    const contentQualityScoreValue = getNumericValue(profile.content_quality_score);
    const averageRatingValue = (() => {
        const candidates: Array<string | number | null | undefined> = [
            profile.performance_metrics?.average_rating,
            profile.avg_rating,
            profile.rating,
        ];
        for (const candidate of candidates) {
            const numeric = getNumericValue(candidate ?? null);
            if (numeric !== null && numeric > 0) {
                return numeric;
            }
        }
        return null;
    })();
    const formatDecimal = (value: number | null, digits = 1) =>
        value !== null ? value.toFixed(digits) : null;

    // Build compact per-platform summary for the Platforms KPI
    const platformSummary = (() => {
        const platformMap = new Map<
            string,
            { platform: string; followers?: number; er?: number | null }
        >();

        safeArray(profile.engagement_overview?.platform_breakdown).forEach((item) => {
            const key = String(item.platform).toLowerCase();
            platformMap.set(key, {
                platform: key,
                followers: item.followers,
                er: item.engagement_rate,
            });
        });

        safeArray(profile.social_accounts).forEach((account) => {
            const key = String(account.platform).toLowerCase();
            const existing = platformMap.get(key) ?? {platform: key};
            platformMap.set(key, {
                platform: key,
                followers: account.followers_count ?? existing.followers,
                er: existing.er ?? account.engagement_rate,
            });
        });

        return Array.from(platformMap.values());
    })();

    const getPlatformAbbrev = (p: string) => {
        const map: Record<string, string> = {
            instagram: 'IG',
            youtube: 'YT',
            tiktok: 'TT',
            twitter: 'TW',
            facebook: 'FB',
            linkedin: 'IN',
            snapchat: 'SC',
            pinterest: 'PT',
        };
        return map[p] || p.slice(0, 2).toUpperCase();
    };

    const getFollowersLabelForPlatform = (p: string) => {
        const key = p.toLowerCase();
        if (key === 'youtube') return 'Subs';
        return 'Followers';
    };

    const getRecentHashtagsFromPosts = (posts: SocialMediaPost[]): HashtagUsage[] => {
        const counts = new Map<string, number>();
        posts.forEach((post) => {
            safeArray(post.hashtags).forEach((tag) => {
                const key = String(tag).trim();
                if (!key) return;
                counts.set(key, (counts.get(key) || 0) + 1);
            });
        });
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([tag, count]) => ({tag, count}));
    };

    const extractMentionsFromText = (text: string): string[] => {
        if (!text) return [];
        // Match @mentions in text (e.g., @username, @username123)
        const mentionRegex = /@([a-zA-Z0-9._]+)/g;
        const matches = text.matchAll(mentionRegex);
        const mentions: string[] = [];
        for (const match of matches) {
            const mention = match[1].toLowerCase().trim();
            if (mention && !mentions.includes(mention)) {
                mentions.push(mention);
            }
        }
        return mentions;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div className="container mx-auto px-6 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-semibold text-gray-900">
                                {displayName}
                            </h1>
                            {profile.is_verified && (
                                <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                                    <HiCheckCircle className="w-3 h-3 mr-1"/>
                                    Verified by TickTime
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
                                <HiCheckBadge className="w-3 h-3 mr-1"/>
                                Extension installed
                            </Badge>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="flex items-center gap-2"
                            >
                                <HiArrowPath
                                    className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}/>
                                {isRefreshing ? 'Refreshing' : 'Refresh'}
                            </Button>
                        </div>
                    </div>

                    <div
                        className="mt-4 rounded-2xl border border-gray-100 bg-gradient-to-r from-indigo-50 via-white to-pink-50 p-4 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <FaInstagram className="h-4 w-4 text-pink-600"/>
                                    <span className="text-sm font-semibold text-gray-900">
                                            Get the latest Instagram data instantly
                                        </span>
                                </div>
                                <p className="mt-1 text-sm text-gray-600">
                                    Install <span
                                    className="font-medium text-gray-900">TickTime - Instagram Scraper</span> to
                                    keep this profile updated.
                                    After installing, hit <span
                                    className="font-medium text-gray-900">Refresh</span> to fetch the latest stats &
                                    posts.
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <Button asChild size="sm" className="flex items-center gap-2">
                                    <a
                                        href={TICKTIME_INSTAGRAM_SCRAPER_STORE_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <FaChrome className="w-4 h-4"/>
                                        Install now
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {kpiTiles.length > 0 && (
                    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {kpiTiles.map((tile) => {
                            const Icon = tile.icon;
                            return (
                                <div
                                    key={tile.label}
                                    className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 px-4 py-3 shadow-sm transition-shadow hover:shadow-lg"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="text-[11px] uppercase tracking-wide text-gray-500">
                                            {tile.label}
                                        </div>
                                        <Icon className={`h-4 w-4 ${tile.color}`}/>
                                    </div>
                                    <div className="mt-1 text-lg font-semibold text-gray-900">{tile.value}</div>

                                    {tile.label === 'Followers' && platformSummary.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {platformSummary.map(({platform, followers}) => {
                                                const {icon: PIcon, color} = getPlatformIcon(platform);
                                                return (
                                                    <div key={`followers-${platform}`}
                                                         className="flex items-center gap-1.5 text-xs text-gray-700">
                                                        <PIcon className={`h-3.5 w-3.5 ${color}`}/>
                                                        <span
                                                            className="font-medium">{getPlatformAbbrev(platform)}</span>
                                                        <span className="text-gray-500">
                                                            {formatFollowers(followers)} {getFollowersLabelForPlatform(platform)}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {tile.label === 'ER' && platformSummary.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {platformSummary.map(({platform, er}) => {
                                                const {icon: PIcon, color} = getPlatformIcon(platform);
                                                const erDisplay = isValidNumber(er) ? formatPercentage(er) : '—';
                                                return (
                                                    <div key={`er-${platform}`}
                                                         className="flex items-center gap-1.5 text-xs text-gray-700">
                                                        <PIcon className={`h-3.5 w-3.5 ${color}`}/>
                                                        <span
                                                            className="font-medium">{getPlatformAbbrev(platform)}</span>
                                                        <span className="text-gray-500">{erDisplay}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {tile.label === 'Platforms' && platformSummary.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {platformSummary.map(({platform}) => {
                                                const {icon: PIcon, bgColor} = getPlatformIcon(platform);
                                                const key = String(platform).toLowerCase();
                                                const isVerified = verifiedPlatforms.has(key);
                                                const isPlatformVerified = platformVerifiedPlatforms.has(key);
                                                return (
                                                    <div
                                                        key={`platform-${platform}`}
                                                        className={`relative h-8 w-8 rounded-full flex items-center justify-center text-white ${bgColor} ${
                                                            isVerified ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-white' : ''
                                                        }`}
                                                        title={platform}
                                                    >
                                                        <PIcon className="h-4 w-4"/>
                                                        {isPlatformVerified && (
                                                            <span
                                                                className="absolute -bottom-1 -right-1 z-10 pointer-events-none h-4 w-4 rounded-full bg-blue-600 flex items-center justify-center shadow ring-2 ring-white"
                                                                title="Platform verified"
                                                                aria-label="Platform verified"
                                                            >
                                                                <HiCheckBadge className="h-3 w-3 text-white"/>
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Profile Overview */}
                        <Card className="border border-gray-200 shadow-sm">
                            <CardContent className="space-y-6 p-6">
                                <div className="flex flex-col gap-6 lg:flex-row">
                                    <div className="flex flex-col items-center gap-4 lg:items-start">
                                        <div className="relative group overflow-visible">
                                            <div
                                                className={`relative h-32 w-32 lg:h-36 lg:w-36 overflow-hidden rounded-full border-4 bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg ${
                                                    profile.is_verified ? 'border-green-400' : 'border-gray-200'
                                                }`}
                                                title={profile.is_verified ? 'Verified by TickTime' : undefined}
                                                aria-label={profile.is_verified ? 'Verified by TickTime' : undefined}
                                            >
                                                {profileImageSrc ? (
                                                    <img
                                                        src={profileImageSrc}
                                                        alt={displayName}
                                                        className="h-full w-full object-cover"
                                                        onError={(event) => {
                                                            event.currentTarget.style.display = "none";
                                                            const parent = event.currentTarget.parentElement;
                                                            if (parent && !parent.querySelector('.fallback-initials')) {
                                                                const fallback = document.createElement('div');
                                                                fallback.className = 'fallback-initials flex h-full w-full items-center justify-center text-4xl font-bold text-gray-400';
                                                                fallback.textContent = (displayName || profile.username).charAt(0).toUpperCase();
                                                                parent.appendChild(fallback);
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <div
                                                        className="flex h-full w-full items-center justify-center text-4xl font-bold text-gray-400">
                                                        {(displayName || profile.username).charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            {profile.is_verified && (
                                                <div
                                                    className="absolute -bottom-1 -right-1 z-20 pointer-events-none h-10 w-10 rounded-full bg-green-600 flex items-center justify-center shadow-lg ring-4 ring-white"
                                                    title="Verified by TickTime"
                                                    aria-label="Verified by TickTime"
                                                >
                                                    <HiCheckCircle className="h-6 w-6 text-white"/>
                                                </div>
                                            )}
                                        </div>
                                        {profile.external_url && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => window.open(profile.external_url, '_blank', 'noopener,noreferrer')}
                                                className="w-full lg:w-auto"
                                            >
                                                <HiLink className="w-4 h-4 mr-2"/>
                                                Visit Link
                                            </Button>
                                        )}
                                        {safeArray(profile.available_platforms).length > 0 && (
                                            <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                                                {safeArray(profile.available_platforms).map((platform) => {
                                                    const {icon: PIcon, color} = getPlatformIcon(platform);
                                                    const key = String(platform).toLowerCase();
                                                    const isVerified = verifiedPlatforms.has(key);
                                                    const isPlatformVerified = platformVerifiedPlatforms.has(key);
                                                    return (
                                                        <div key={platform} className="relative">
                                                            <Badge
                                                                variant="outline"
                                                                className={`text-xs uppercase tracking-wide flex items-center gap-1.5 pr-2 ${
                                                                    isVerified ? 'border-green-300 bg-green-50 text-green-800' : ''
                                                                }`}
                                                                title={
                                                                    isVerified
                                                                        ? 'Verified (TickTime)'
                                                                        : undefined
                                                                }
                                                            >
                                                                <PIcon className={`h-3.5 w-3.5 ${color}`}/>
                                                                {platform}
                                                            </Badge>
                                                            {isPlatformVerified && (
                                                                <span
                                                                    className="absolute -bottom-1 -right-1 z-10 pointer-events-none h-4 w-4 rounded-full bg-blue-600 flex items-center justify-center shadow ring-2 ring-white"
                                                                    title="Platform verified"
                                                                    aria-label="Platform verified"
                                                                >
                                                                    <HiCheckBadge className="h-3 w-3 text-white"/>
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        <div className="space-y-4">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h1 className="text-3xl font-bold text-gray-900">
                                                        {displayName}
                                                    </h1>
                                                    {profile.is_verified && (
                                                        <Badge variant="outline"
                                                               className="border-green-200 text-green-700 bg-green-50">
                                                            <HiCheckCircle className="w-3.5 h-3.5 mr-1"/>
                                                            Verified
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                                    <span
                                                        className="font-medium text-gray-700">@{profile.username}</span>
                                                    {profile.location && (
                                                        <span
                                                            className="inline-flex items-center gap-1.5 text-gray-600">
                                                            <HiMapPin className="h-4 w-4 text-gray-400"/>
                                                            {profile.location}
                                                        </span>
                                                    )}
                                                    <span className="inline-flex items-center gap-1.5 text-gray-600">
                                                        <HiSparkles className="h-4 w-4 text-yellow-500"/>
                                                        {profile.industry}
                                                    </span>
                                                </div>

                                                {safeArray(profile.categories).length > 0 && (
                                                    <div className="flex flex-wrap gap-2 pt-1">
                                                        {safeArray(profile.categories).slice(0, 6).map((category) => (
                                                            <Badge key={category} variant="secondary"
                                                                   className="text-xs font-medium bg-purple-50 text-purple-700 border-purple-200">
                                                                {category}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}

                                                {profile.bio && (
                                                    <div className="pt-2">
                                                        <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">
                                                            {profile.bio}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {statusBadges.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    {statusBadges.map((badge) => (
                                                        <div
                                                            key={badge.label}
                                                            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700"
                                                        >
                                                            <span className="font-semibold">{badge.label}:</span> <span
                                                            className="text-gray-600">{badge.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-4">
                                    <h4 className="mb-3 text-sm font-medium text-gray-900">Collaboration</h4>

                                    {profile.minimum_collaboration_amount && profile.minimum_collaboration_amount > 0 && (
                                        <div className="mb-3 text-sm text-gray-700">
                                            Min Amount:{' '}
                                            <span className="font-semibold text-gray-900">
                                                ₹{profile.minimum_collaboration_amount.toLocaleString()}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-center gap-2">
                                        {profile.collaboration_types && profile.collaboration_types.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm text-gray-600">Deal Types:</span>
                                                {profile.collaboration_types.map((type) => {
                                                    const config = getDealTypeConfig(type);
                                                    return (
                                                        <Badge
                                                            key={type}
                                                            variant="outline"
                                                            className={`text-xs ${config.bg} ${config.color} ${config.border} flex items-center gap-1`}
                                                        >
                                                            <span className="text-sm">{config.icon}</span>
                                                            {config.label}
                                                        </Badge>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {profile.barter_ready && (
                                            <Badge
                                                variant="outline"
                                                className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                                            >
                                                Barter Ready
                                            </Badge>
                                        )}
                                        {profile.commerce_ready && (
                                            <Badge
                                                variant="outline"
                                                className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                            >
                                                Commerce Ready
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Social Media Accounts */}
                        <Card className="border border-gray-200 shadow-sm">
                            <CardHeader className="pb-4 border-b border-gray-100">
                                <CardTitle className="text-xl font-bold text-gray-900">
                                    Social Media Accounts
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {safeArray(profile.social_accounts).map((account) => {
                                        const platformIcon = getPlatformIcon(account.platform);
                                        const IconComponent = platformIcon.icon;
                                        const platformUrl = getPlatformUrl(account.platform, account.handle, account.platform_profile_link);
                                        // Use profile_image_url
                                        const accountProfileImage = normalizeRemoteUrl(account.profile_image_url) || '';

                                        const primaryStats = [
                                            {
                                                label: 'Followers',
                                                value: account.followers_count,
                                                formatter: formatFollowers,
                                                always: true,
                                            },
                                            {
                                                label: 'Engagement',
                                                value: account.engagement_rate,
                                                formatter: formatPercentage,
                                                always: false,
                                            },
                                            {
                                                label: 'Posts',
                                                value: account.posts_count,
                                                formatter: (value?: number | null) =>
                                                    (isValidNumber(value) ? value : 0).toString(),
                                                always: true,
                                            },
                                        ].filter((stat) =>
                                            stat.always || (isValidNumber(stat.value) && stat.value > 0)
                                        );

                                        const metricChips = [
                                            {label: 'Avg Likes', value: account.average_likes, highlight: true},
                                            {label: 'Avg Comments', value: account.average_comments, highlight: true},
                                            {label: 'Avg Shares', value: account.average_shares},
                                            {
                                                label: 'Avg Video Views',
                                                value: account.average_video_views,
                                                highlight: true
                                            },
                                            {
                                                label: 'Avg Video Likes',
                                                value: account.average_video_likes,
                                                highlight: true
                                            },
                                            {
                                                label: 'Avg Video Comments',
                                                value: account.average_video_comments,
                                                highlight: true
                                            },
                                        ].filter((metric) => isValidNumber(metric.value) && metric.value > 0);

                                        return (
                                            <div
                                                key={account.id}
                                                role={platformUrl ? 'button' : 'group'}
                                                tabIndex={platformUrl ? 0 : -1}
                                                onClick={platformUrl ? () => window.open(platformUrl, '_blank', 'noopener,noreferrer') : undefined}
                                                onKeyDown={(event) => {
                                                    if (!platformUrl) return;
                                                    if (event.key === 'Enter' || event.key === ' ') {
                                                        event.preventDefault();
                                                        window.open(platformUrl, '_blank', 'noopener,noreferrer');
                                                    }
                                                }}
                                                className={`rounded-xl border-2 border-gray-200 bg-white p-5 transition-all ${platformUrl ? 'hover:shadow-lg hover:border-primary/30 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary' : ''}`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    {/* Profile Picture */}
                                                    <div className="relative flex-shrink-0 overflow-visible">
                                                        {accountProfileImage ? (
                                                            <div
                                                                className={`h-20 w-20 rounded-full overflow-hidden border-2 ring-2 ring-white shadow-md ${
                                                                    account.verified ? 'border-green-500' : 'border-gray-200'
                                                                }`}
                                                                title={account.verified ? 'Verified (TickTime)' : undefined}
                                                                aria-label={account.verified ? 'Verified (TickTime)' : undefined}
                                                            >
                                                                <img
                                                                    src={accountProfileImage}
                                                                    alt={`${account.handle} profile`}
                                                                    className="h-full w-full object-cover"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                    }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className={`h-20 w-20 rounded-full flex items-center justify-center text-white ${platformIcon.bgColor} border-2 shadow-md ${
                                                                    account.verified ? 'border-green-500' : 'border-gray-200'
                                                                }`}
                                                                title={account.verified ? 'Verified (TickTime)' : undefined}
                                                                aria-label={account.verified ? 'Verified (TickTime)' : undefined}
                                                            >
                                                                <IconComponent className="h-8 w-8"/>
                                                            </div>
                                                        )}
                                                        {account.platform_verified && (
                                                            <div
                                                                className="absolute -bottom-1 -right-1 z-10 pointer-events-none h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center shadow-md ring-2 ring-white"
                                                                title="Platform verified"
                                                                aria-label="Platform verified"
                                                            >
                                                                <HiCheckBadge className="h-4 w-4 text-white"/>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Account Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-lg font-bold text-gray-900">
                                                                @{account.handle ?? 'unknown'}
                                                            </span>
                                                            {account.verified && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-green-200 text-green-800 bg-green-50 text-xs"
                                                                    title="Verified (TickTime)"
                                                                >
                                                                    Verified
                                                                </Badge>
                                                            )}
                                                            {account.is_active && (
                                                                <Badge
                                                                    className="bg-green-100 text-green-700 border-green-200 text-xs">
                                                                    Active
                                                                </Badge>
                                                            )}
                                                            {account.is_private && (
                                                                <Badge
                                                                    className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                                                    Private
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        {account.display_name && account.display_name !== account.handle && (
                                                            <p className="text-sm font-medium text-gray-700 mb-1">
                                                                {account.display_name}
                                                            </p>
                                                        )}

                                                        {account.bio && (
                                                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                                {account.bio}
                                                            </p>
                                                        )}

                                                        {/* Stats Row */}
                                                        <div className="flex items-center gap-6 mb-3">
                                                            {primaryStats.map((stat) => (
                                                                <div key={`${account.id}_${stat.label}`}
                                                                     className="text-center">
                                                                    <div className="text-lg font-bold text-gray-900">
                                                                        {stat.formatter(stat.value as number)}
                                                                    </div>
                                                                    <div
                                                                        className="text-xs text-gray-500 uppercase tracking-wide">
                                                                        {stat.label}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Highlighted Metrics */}
                                                        {metricChips.length > 0 && (
                                                            <div
                                                                className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                                                                {metricChips.map((metric) => (
                                                                    <div
                                                                        key={`${account.id}_${metric.label}`}
                                                                        className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                                                                            metric.highlight
                                                                                ? 'border-2 border-blue-300 bg-blue-50 text-blue-900 font-semibold'
                                                                                : 'border border-gray-200 bg-gray-50 text-gray-700'
                                                                        }`}
                                                                    >
                                                                        <span
                                                                            className="text-[10px] uppercase tracking-wide opacity-75 mr-1">
                                                                            {metric.label}:
                                                            </span>
                                                                        <span className="font-bold">
                                                                {formatFollowers(metric.value as number)}
                                                            </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {account.external_url && (
                                                            <button
                                                                type="button"
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    window.open(account.external_url as string, "_blank", "noopener,noreferrer");
                                                                }}
                                                                className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                                                            >
                                                                <HiLink className="h-3.5 w-3.5"/>
                                                                <span>{account.external_url}</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Hashtags */}
                        {(() => {
                            const recentHashtags = getRecentHashtagsFromPosts(safeArray(profile.recent_posts));
                            const hashtags =
                                recentHashtags.length > 0 ? recentHashtags : safeArray(profile.hashtags_used);
                            return hashtags.length > 0;
                        })() && (
                            <Card className="border border-gray-200 shadow-sm">
                                <CardHeader className="pb-4 border-b border-gray-100">
                                    <CardTitle className="text-xl font-bold text-gray-900">
                                        Hashtag Highlights
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {(() => {
                                        const recent = getRecentHashtagsFromPosts(safeArray(profile.recent_posts));
                                        const hashtags = (recent.length > 0 ? recent : safeArray(profile.hashtags_used)).sort(
                                            (a, b) => (b.count || 0) - (a.count || 0)
                                        );
                                        if (hashtags.length === 0) {
                                            return <p className="text-xs text-gray-500">No hashtags available</p>;
                                        }

                                        return (
                                            <div className="flex flex-wrap gap-2">
                                                {hashtags.slice(0, 20).map((hashtag, index) => (
                                                    <Badge
                                                        key={index}
                                                        variant="outline"
                                                        className="rounded-full bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 text-xs font-medium px-3 py-1"
                                                    >
                                                        <span className="font-semibold">
                                                        #{hashtag.tag.replace(/^#/, '')}
                                                    </span>
                                                        {hashtag.count !== undefined && hashtag.count !== null && (
                                                            <span className="text-[11px] ml-1 opacity-75">
                                                            ({hashtag.count})
                                                        </span>
                                                        )}
                                                    </Badge>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </CardContent>
                            </Card>
                        )}

                        {/* Tagged Accounts */}
                        {(() => {
                            const taggedAccounts = new Map<string, number>();
                            safeArray(profile.recent_posts).forEach((post) => {
                                // First, get mentions from the mentions array
                                safeArray(post.mentions).forEach((mention) => {
                                    const account = String(mention).replace(/^@/, '').trim().toLowerCase();
                                    if (account) {
                                        taggedAccounts.set(account, (taggedAccounts.get(account) || 0) + 1);
                                    }
                                });
                                // Also extract mentions from caption text if it exists
                                if (post.caption) {
                                    const mentionsFromCaption = extractMentionsFromText(post.caption);
                                    mentionsFromCaption.forEach((account) => {
                                        if (account) {
                                            taggedAccounts.set(account, (taggedAccounts.get(account) || 0) + 1);
                                        }
                                    });
                                }
                            });
                            return Array.from(taggedAccounts.entries()).length > 0;
                        })() && (
                            <Card className="border border-gray-200 shadow-sm">
                                <CardHeader className="pb-4 border-b border-gray-100">
                                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <HiUsers className="w-5 h-5 text-blue-600"/>
                                        Tagged Accounts
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {(() => {
                                        const taggedAccounts = new Map<string, number>();
                                        safeArray(profile.recent_posts).forEach((post) => {
                                            // First, get mentions from the mentions array
                                            safeArray(post.mentions).forEach((mention) => {
                                                const account = String(mention).replace(/^@/, '').trim().toLowerCase();
                                                if (account) {
                                                    taggedAccounts.set(account, (taggedAccounts.get(account) || 0) + 1);
                                                }
                                            });
                                            // Also extract mentions from caption text if it exists
                                            if (post.caption) {
                                                const mentionsFromCaption = extractMentionsFromText(post.caption);
                                                mentionsFromCaption.forEach((account) => {
                                                    if (account) {
                                                        taggedAccounts.set(account, (taggedAccounts.get(account) || 0) + 1);
                                                    }
                                                });
                                            }
                                        });
                                        const sorted = Array.from(taggedAccounts.entries())
                                            .sort((a, b) => b[1] - a[1])
                                            .slice(0, 30);

                                        if (sorted.length === 0) {
                                            return <p className="text-xs text-gray-500">No tagged accounts
                                                available</p>;
                                        }

                                        return (
                                            <div className="flex flex-wrap gap-2">
                                                {sorted.map(([account, count], index) => (
                                                    <Badge
                                                        key={index}
                                                        variant="outline"
                                                        className="rounded-full bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 text-xs font-medium px-3 py-1"
                                                    >
                                                        <HiUsers className="w-3 h-3 mr-1.5 inline"/>
                                                        <span className="font-semibold">@{account}</span>
                                                        {count > 1 && (
                                                            <span className="text-[11px] ml-1 opacity-75">
                                                                ({count})
                                                            </span>
                                                        )}
                                                    </Badge>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6 lg:sticky lg:top-6">
                        {/* Engagement Overview */}
                        <Card className="border border-gray-200 shadow-sm">
                            <CardHeader className="pb-4 border-b border-gray-100">
                                <CardTitle className="text-xl font-bold text-gray-900">
                                    Engagement Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {(() => {
                                    // Show data from actual social accounts, not averaged/calculated
                                    const activeAccounts = safeArray(profile.social_accounts).filter(acc => acc.is_active);

                                    if (activeAccounts.length === 0) {
                                        return <p className="text-sm text-gray-500">No active social accounts</p>;
                                    }

                                    // Aggregate real values from accounts
                                    const totalFollowers = activeAccounts.reduce((sum, acc) => sum + (acc.followers_count || 0), 0);
                                    const accountsWithER = activeAccounts.filter(acc => isValidNumber(acc.engagement_rate) && acc.engagement_rate > 0);
                                    const avgER = accountsWithER.length > 0
                                        ? accountsWithER.reduce((sum, acc) => sum + (acc.engagement_rate || 0), 0) / accountsWithER.length
                                        : null;

                                    // Get actual metrics from accounts (not averaged, show what exists)
                                    const likes = activeAccounts.filter(acc => isValidNumber(acc.average_likes) && acc.average_likes > 0);
                                    const comments = activeAccounts.filter(acc => isValidNumber(acc.average_comments) && acc.average_comments > 0);
                                    const views = activeAccounts.filter(acc => isValidNumber(acc.average_video_views) && acc.average_video_views > 0);
                                    const shares = activeAccounts.filter(acc => isValidNumber(acc.average_shares) && acc.average_shares > 0);

                                    return (
                                        <div className="space-y-4 text-sm">
                                            <div className="space-y-3">
                                                <div
                                                    className="flex items-center justify-between pb-2 border-b border-gray-100">
                                                    <span className="text-gray-600 font-medium">Total Followers</span>
                                                    <span className="font-bold text-lg text-gray-900">
                                                        {formatFollowers(totalFollowers)}
                                                        </span>
                                                </div>
                                                {avgER !== null && (
                                                    <div
                                                        className="flex items-center justify-between pb-2 border-b border-gray-100">
                                                        <span
                                                            className="text-gray-600 font-medium">Avg Engagement Rate</span>
                                                        <span className="font-bold text-lg text-gray-900">
                                                            {formatPercentage(avgER)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-2">
                                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Metrics
                                                    by Platform</h4>
                                                <div className="space-y-2">
                                                    {activeAccounts.map((account) => {
                                                        const platformIcon = getPlatformIcon(account.platform);
                                                        const IconComponent = platformIcon.icon;
                                                        const hasMetrics =
                                                            (isValidNumber(account.average_likes) && account.average_likes > 0) ||
                                                            (isValidNumber(account.average_comments) && account.average_comments > 0) ||
                                                            (isValidNumber(account.average_video_views) && account.average_video_views > 0);

                                                        if (!hasMetrics) return null;

                                                        return (
                                                            <div key={account.id}
                                                                 className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <IconComponent
                                                                        className={`h-4 w-4 ${platformIcon.color}`}/>
                                                                    <span
                                                                        className="font-semibold text-gray-900 capitalize text-xs">
                                                                        {account.platform}
                                                                    </span>
                                                                    {isValidNumber(account.engagement_rate) && account.engagement_rate > 0 && (
                                                                        <span
                                                                            className="ml-auto text-xs font-medium text-gray-600">
                                                                            {formatPercentage(account.engagement_rate)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                                    {isValidNumber(account.average_likes) && account.average_likes > 0 && (
                                                                        <div>
                                                                            <span
                                                                                className="text-gray-500">Likes: </span>
                                                                            <span
                                                                                className="font-semibold text-gray-900">
                                                                                {formatFollowers(account.average_likes)}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    {isValidNumber(account.average_comments) && account.average_comments > 0 && (
                                                                        <div>
                                                                            <span
                                                                                className="text-gray-500">Comments: </span>
                                                                            <span
                                                                                className="font-semibold text-gray-900">
                                                                                {formatFollowers(account.average_comments)}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    {isValidNumber(account.average_video_views) && account.average_video_views > 0 && (
                                                                        <div>
                                                                            <span
                                                                                className="text-gray-500">Video Views: </span>
                                                                            <span
                                                                                className="font-semibold text-gray-900">
                                                                                {formatFollowers(account.average_video_views)}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    {isValidNumber(account.average_shares) && account.average_shares > 0 && (
                                                                        <div>
                                                                            <span
                                                                                className="text-gray-500">Shares: </span>
                                                                            <span
                                                                                className="font-semibold text-gray-900">
                                                                                {formatFollowers(account.average_shares)}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
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

                                    {influenceScoreValue !== null && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Influence Score:</span>
                                            <span className="font-medium">
                                                {formatScore(influenceScoreValue)}
                                            </span>
                                        </div>
                                    )}

                                    {platformScoreValue !== null && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Platform Score:</span>
                                            <span className="font-medium">
                                                {formatScore(platformScoreValue)}/10
                                            </span>
                                        </div>
                                    )}

                                    {contentQualityScoreValue !== null && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Content Quality:</span>
                                            <span className="font-medium">
                                                {formatScore(contentQualityScoreValue)}
                                            </span>
                                        </div>
                                    )}

                                    {averageRatingValue !== null && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Avg Rating:</span>
                                            <span className="font-medium text-gray-900 inline-flex items-center gap-1">
                                                {formatDecimal(averageRatingValue, 1)}
                                                <HiStar className="h-4 w-4 text-yellow-500"/>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Audience Insights removed for now */}
                    </div>
                </div>

                {/* Recent Posts - Full Width Instagram-like Grid */}
                <Card className="border border-gray-200 shadow-sm mt-6">
                    <CardHeader className="pb-4 border-b border-gray-100">
                        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <HiPresentationChartBar className="w-6 h-6 text-primary"/>
                            Recent Posts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {safeArray(profile.recent_posts).length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-[3px]">
                                {safeArray(profile.recent_posts).map((post) => {
                                    const mediaUrl = getPrimaryThumbnail(post);
                                    const hasMedia = Boolean(mediaUrl);
                                    const {icon: PIcon, color, bgColor} = getPlatformIcon(post.platform);

                                    // If no media, show text card with full details
                                    if (!hasMedia) {
                                        return (
                                            <div
                                                key={`${post.platform}_${post.platform_post_id}`}
                                                className="rounded-sm border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
                                                onClick={() => setSelectedPost(post)}
                                            >
                                                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                                                    <div className="flex items-center gap-2">
                                                        <PIcon className={`h-3.5 w-3.5 ${color}`}/>
                                                        <span
                                                            className="font-semibold text-xs capitalize text-gray-700">
                                                            {post.platform}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-3 space-y-2">
                                                    {post.caption && (
                                                        <p className="text-xs text-gray-800 leading-relaxed line-clamp-4">
                                                            {post.caption}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-3 text-xs text-gray-600 pt-1">
                                                        {post.likes_count !== undefined && post.likes_count !== null && (
                                                            <span className="inline-flex items-center gap-1">
                                                                <HiHeart className="h-3.5 w-3.5 text-rose-500"/>
                                                                {formatFollowers(post.likes_count)}
                                                            </span>
                                                        )}
                                                        {post.comments_count !== undefined && post.comments_count !== null && (
                                                            <span className="inline-flex items-center gap-1">
                                                                <HiChatBubbleLeft className="h-3.5 w-3.5 text-sky-500"/>
                                                                {formatFollowers(post.comments_count)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // Instagram-like image card - compact image grid with key metrics
                                    const viewCount =
                                        typeof post.views_count === 'number' ? post.views_count : null;
                                    return (
                                        <div
                                            key={`${post.platform}_${post.platform_post_id}`}
                                            className="group relative aspect-square overflow-hidden cursor-pointer bg-gray-900"
                                            onClick={() => setSelectedPost(post)}
                                        >
                                            {/* Image */}
                                            <img
                                                src={mediaUrl!}
                                                alt={post.caption || `${post.platform} post`}
                                                className="absolute inset-0 h-full w-full object-cover"
                                                loading="lazy"
                                            />

                                            {/* Top-left view badge - only when views are available */}
                                            {viewCount !== null && viewCount > 0 && (
                                                <div className="absolute top-1.5 left-1.5 z-10">
                                                    <div
                                                        className="inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-white shadow-sm backdrop-blur">
                                                        <HiEye className="w-3.5 h-3.5"/>
                                                        <span className="text-[11px] font-semibold leading-none">
                                                            {formatFollowers(viewCount)}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Bottom metrics row - likes & comments always visible */}
                                            <div
                                                className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 via-black/40 to-transparent px-2.5 py-1.5">
                                                <div
                                                    className="flex items-center justify-end gap-3 text-white text-[11px]">
                                                    {post.likes_count !== undefined && post.likes_count !== null && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <HiHeart className="h-3 w-3"/>
                                                            <span className="font-medium">
                                                                {formatFollowers(post.likes_count)}
                                                            </span>
                                                        </span>
                                                    )}
                                                    {post.comments_count !== undefined && post.comments_count !== null && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <HiChatBubbleLeft className="h-3 w-3"/>
                                                            <span className="font-medium">
                                                                {formatFollowers(post.comments_count)}
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Hover overlay for stronger focus (no extra icons) */}
                                            <div
                                                className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-5"
                                            >
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <HiExclamationTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                                <p className="text-sm font-medium text-gray-600">No recent posts available</p>
                                <p className="text-xs text-gray-500 mt-1">Posts will appear here once they're synced</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Post Detail Dialog - Instagram style */}
                <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
                    <DialogContent
                        className="max-w-4xl max-h-[82vh] w-full p-0 overflow-hidden overflow-x-hidden bg-white gap-0 [&>button]:hidden">
                        {selectedPost && (
                            <div className="flex h-full w-full overflow-hidden">
                                {/* Left - Image (compact) */}
                                <div className="flex-1 min-w-0 bg-black flex items-center justify-center max-h-[80vh]">
                                    {getPrimaryThumbnail(selectedPost) ? (
                                        <img
                                            src={getPrimaryThumbnail(selectedPost)!}
                                            alt=""
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center w-full h-full">
                                            {(() => {
                                                const {icon: PIcon, bgColor} = getPlatformIcon(selectedPost.platform);
                                                return (
                                                    <div className={`${bgColor} p-8 rounded-full opacity-70`}>
                                                        <PIcon className="h-20 w-20 text-white"/>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>

                                {/* Right - Details */}
                                <div className="w-[360px] min-w-0 flex flex-col bg-white border-l border-gray-300">
                                    {/* Header */}
                                    <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200">
                                        <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0">
                                            {profileImageSrc ? (
                                                <img src={profileImageSrc} alt=""
                                                     className="h-full w-full object-cover"/>
                                            ) : (
                                                <div
                                                    className="h-full w-full bg-gradient-to-br from-purple-400 via-pink-500 to-red-400 flex items-center justify-center text-white text-xs font-bold">
                                                    {(displayName || profile.username).charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {displayName || profile.username}
                                        </span>
                                        <div className="ml-auto flex items-center gap-2 mr-8">
                                            {selectedPost.post_url && (
                                                <button
                                                    onClick={() => window.open(selectedPost.post_url, '_blank', 'noopener,noreferrer')}
                                                    className="text-xs font-semibold text-blue-500 hover:text-blue-700"
                                                >
                                                    View Original
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Comments/Content - Scrollable */}
                                    <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4">
                                        {/* Caption */}
                                        {selectedPost.caption && (
                                            <div className="mb-4">
                                                <div
                                                    className="text-sm text-gray-900 whitespace-pre-wrap break-words break-all">
                                                    {renderCaptionWithHighlights(selectedPost.caption)}
                                                </div>
                                                {/* Tagged accounts (from mentions) */}
                                                {safeArray(selectedPost.mentions).length > 0 && (
                                                    <div className="text-sm text-blue-600 mt-2 space-x-1">
                                                        {safeArray(selectedPost.mentions).map((tag, i) => (
                                                            <span key={i} className="hover:underline cursor-pointer">
                                                                @{String(tag).replace(/^@/, "")}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Stats info */}
                                        {(() => {
                                            const likes = selectedPost.likes_count ?? 0;
                                            const comments = selectedPost.comments_count ?? 0;
                                            const views = selectedPost.views_count ?? likes ?? 0;
                                            const shares = selectedPost.shares_count ?? 0;
                                            const hasAny =
                                                (likes && likes > 0) ||
                                                (comments && comments > 0) ||
                                                (views && views > 0) ||
                                                (shares && shares > 0);
                                            if (!hasAny) return null;
                                            return (
                                                <div className="text-xs text-gray-700 space-y-1 mb-4">
                                                    {likes > 0 && (
                                                        <p className="font-medium">
                                                            {formatFollowers(likes)} likes
                                                        </p>
                                                    )}
                                                    {comments > 0 && (
                                                        <p>{formatFollowers(comments)} comments</p>
                                                    )}
                                                    {views > 0 && (
                                                        <p>{formatFollowers(views)} views</p>
                                                    )}
                                                    {shares > 0 && (
                                                        <p>{formatFollowers(shares)} shares</p>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        {/* Relative date */}
                                        {selectedPost.posted_at && (
                                            <div className="text-[11px] text-gray-500">
                                                {new Date(selectedPost.posted_at).toLocaleDateString('en-US', {
                                                    month: 'long',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
