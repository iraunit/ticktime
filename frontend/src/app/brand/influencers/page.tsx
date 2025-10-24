"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import {Card} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import ReactSelect from "react-select";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Checkbox} from "@/components/ui/checkbox";
import {
    HiArrowPath,
    HiBookmark,
    HiCheck,
    HiCheckBadge,
    HiChevronDown,
    HiChevronUp,
    HiEnvelope,
    HiEye,
    HiEyeSlash,
    HiFunnel,
    HiGlobeAlt,
    HiHeart,
    HiMagnifyingGlass,
    HiMapPin,
    HiPlay,
    HiPlus,
    HiSparkles,
    HiStar,
    HiUsers
} from "react-icons/hi2";
import {HiX} from "react-icons/hi";
import {platformConfig} from "@/lib/platform-config";
import {api} from "@/lib/api";
import {toast} from "@/lib/toast";
import {GlobalLoader} from "@/components/ui/global-loader";


interface Influencer {
    id: number;
    username: string;
    full_name: string;
    industry: string;
    bio: string;
    profile_image?: string;
    is_verified: boolean;
    total_followers: number;
    avg_engagement: number;
    collaboration_count: number;
    avg_rating: number;
    platforms: string[];
    location: string;
    rate_per_post?: number;
    avg_likes?: number;
    avg_views?: number;
    avg_comments?: number;
    total_videos?: number;
    categories?: string[];
    gender?: string;
    is_bookmarked?: boolean;
    platform_handle?: string;
    platform_url?: string;
    platform_bio?: string;
    last_active?: string;
    engagement_rate?: number;
    posts_count?: number;

    // Enhanced fields from competitor analysis
    name?: string;
    handle?: string;
    original_profile_image?: string;
    score?: string;
    available_platforms?: string[];

    // Platform-specific data
    twitter_followers?: string;
    twitter_handle?: string;
    twitter_profile_link?: string;
    youtube_subscribers?: string;
    youtube_handle?: string;
    youtube_profile_link?: string;
    facebook_page_likes?: string;
    facebook_handle?: string;
    facebook_profile_link?: string;

    // Interaction metrics
    average_interaction?: string;
    average_dislikes?: string;

    // Scored categories
    category_scores?: Array<{
        category_name: string;
        score: string;
        is_flag: number;
        is_primary: boolean;
    }>;
}

// Column configuration
const columnConfig = {
    creator: {key: 'creator', label: 'Creator Profile', visible: true, sortable: false},
    rating: {key: 'rating', label: 'Rating', visible: true, sortable: true},
    followers: {key: 'followers', label: 'Followers', visible: true, sortable: true},
    engagement: {key: 'engagement', label: 'Engagement', visible: true, sortable: true},
    posts: {key: 'posts', label: 'Posts', visible: true, sortable: true},
    location: {key: 'location', label: 'Location', visible: true, sortable: false},
    categories: {key: 'categories', label: 'Categories', visible: true, sortable: false},
    actions: {key: 'actions', label: 'Actions', visible: true, sortable: false}
};

const followerRanges = [
    {label: "All Followers", min: 0, max: 999999999},
    {label: "1K - 10K", min: 1000, max: 10000},
    {label: "10K - 50K", min: 10000, max: 50000},
    {label: "50K - 100K", min: 50000, max: 100000},
    {label: "100K - 500K", min: 100000, max: 500000},
    {label: "500K - 1M", min: 500000, max: 1000000},
    {label: "1M - 5M", min: 1000000, max: 5000000},
    {label: "5M+", min: 5000000, max: 999999999}
];

type IndustryOption = { key: string; name: string };

export default function InfluencerSearchPage() {
    const [influencers, setInfluencers] = useState<Influencer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [showColumnSettings, setShowColumnSettings] = useState(false);
    const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
    const [selectedInfluencers, setSelectedInfluencers] = useState<Set<number>>(new Set());
    const [showCampaignDialog, setShowCampaignDialog] = useState(false);
    const [showMessageDialog, setShowMessageDialog] = useState(false);
    const [messageInfluencer, setMessageInfluencer] = useState<Influencer | null>(null);
    const [messageContent, setMessageContent] = useState("");
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
    const [individualInfluencer, setIndividualInfluencer] = useState<number | null>(null);
    const [isLoadingActions, setIsLoadingActions] = useState(false);
    const [showCampaignSelectionInMessage, setShowCampaignSelectionInMessage] = useState(false);
    const [useDropdownForCampaigns, setUseDropdownForCampaigns] = useState(false);
    const [campaignSearchTerm, setCampaignSearchTerm] = useState("");

    // Helper to show @username consistently (fallbacks if username missing)
    const getDisplayUsername = useCallback((inf: Influencer) => {
        const user = (inf?.username || '').trim();
        const handle = (inf?.handle || '').trim();
        const name = (inf?.name || '').trim();
        return user || handle || name || '';
    }, []);

    // Column visibility state
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
        const saved = localStorage.getItem('influencer-table-columns');
        return saved ? JSON.parse(saved) : Object.fromEntries(
            Object.entries(columnConfig).map(([key, config]: [string, any]) => [key, config.visible])
        );
    });

    // Filter states
    const [selectedPlatform, setSelectedPlatform] = useState("all");
    const [locationFilter, setLocationFilter] = useState("All");
    const [genderFilter, setGenderFilter] = useState("All");
    const [followerRange, setFollowerRange] = useState("All Followers");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
    const [selectedIndustry, setSelectedIndustry] = useState("All");
    const [industries, setIndustries] = useState<IndustryOption[]>([]);
    const [sortBy, setSortBy] = useState("followers");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // Save column visibility to localStorage
    useEffect(() => {
        localStorage.setItem('influencer-table-columns', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    // Load influencers from API
    const fetchInfluencers = useCallback(async (pageNum = 1, append = false) => {
        if (pageNum === 1) setIsLoading(true);

        try {
            console.log('Fetching influencers with params:', {
                page: pageNum,
                search: searchTerm,
                platform: selectedPlatform,
                location: locationFilter !== 'All' ? locationFilter : undefined,
                gender: genderFilter !== 'All' ? genderFilter : undefined,
                follower_range: followerRange !== 'All Followers' ? followerRange : undefined,
                categories: selectedCategories.length > 0 ? selectedCategories.join(',') : undefined,
                industry: selectedIndustry !== 'All' ? selectedIndustry : undefined,
                sort_by: sortBy,
                sort_order: sortOrder,
            });

            const response = await api.get('/influencers/search/', {
                params: {
                    page: pageNum,
                    search: searchTerm,
                    platform: selectedPlatform,
                    location: locationFilter !== 'All' ? locationFilter : undefined,
                    gender: genderFilter !== 'All' ? genderFilter : undefined,
                    follower_range: followerRange !== 'All Followers' ? followerRange : undefined,
                    categories: selectedCategories.length > 0 ? selectedCategories.join(',') : undefined,
                    industry: selectedIndustry !== 'All' ? selectedIndustry : undefined,
                    sort_by: sortBy,
                    sort_order: sortOrder,
                }
            });

            console.log('API Response:', response.data);

            const newInfluencers = response.data.results || [];
            const pagination = response.data.pagination || {};

            setInfluencers(prev => append ? [...prev, ...newInfluencers] : newInfluencers);
            setHasMore(pagination.has_next || false);
            setPage(pagination.page || pageNum);
            setTotalPages(pagination.total_pages || 1);
            setTotalCount(pagination.total_count || 0);
        } catch (error: any) {
            console.error('Failed to fetch influencers:', error);
            console.error('Error details:', {
                message: error?.message,
                response: error?.response?.data,
                status: error?.response?.status,
                statusText: error?.response?.statusText
            });

            const errorMessage = error?.response?.data?.message ||
                error?.message ||
                'Failed to load influencers. Please try again.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, selectedPlatform, locationFilter, genderFilter, followerRange, selectedCategories, selectedIndustry, sortBy, sortOrder]);

    // Sync filters and sorting to URL
    useEffect(() => {
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.set('search', searchTerm);
            if (selectedPlatform && selectedPlatform !== 'all') params.set('platform', selectedPlatform);
            if (locationFilter && locationFilter !== 'All') params.set('location', locationFilter);
            if (genderFilter && genderFilter !== 'All') params.set('gender', genderFilter);
            if (followerRange && followerRange !== 'All Followers') params.set('follower_range', followerRange);
            if (selectedCategories.length > 0) params.set('categories', selectedCategories.join(','));
            if (selectedIndustry && selectedIndustry !== 'All') params.set('industry', selectedIndustry);
            if (sortBy) params.set('sort_by', sortBy);
            if (sortOrder) params.set('sort_order', sortOrder);
            const qs = params.toString();
            const url = qs ? `/brand/influencers?${qs}` : '/brand/influencers';
            window.history.replaceState(null, '', url);
        } catch {
        }
    }, [searchTerm, selectedPlatform, locationFilter, genderFilter, followerRange, selectedCategories, selectedIndustry, sortBy, sortOrder]);

    // Bookmark influencer
    const handleBookmark = async (influencerId: number) => {
        try {
            const response = await api.post(`/brands/influencers/${influencerId}/bookmark/`);
            if (response.data) {
                toast.success("Influencer bookmarked successfully!");
                // Update local state immediately
                setInfluencers(prev => prev.map(influencer =>
                    influencer.id === influencerId
                        ? {...influencer, is_bookmarked: true}
                        : influencer
                ));
                if (selectedInfluencer && selectedInfluencer.id === influencerId) {
                    setSelectedInfluencer(prev => prev ? {...prev, is_bookmarked: true} : null);
                }
            }
        } catch (error) {
            console.error('Failed to bookmark influencer:', error);
            toast.error('Failed to bookmark influencer. Please try again.');
        }
    };

    // Remove bookmark
    const handleRemoveBookmark = async (influencerId: number) => {
        try {
            const response = await api.delete(`/brands/influencers/${influencerId}/unbookmark/`);
            if (response.data) {
                toast.success("Influencer removed from bookmarks!");
                // Update local state immediately
                setInfluencers(prev => prev.map(influencer =>
                    influencer.id === influencerId
                        ? {...influencer, is_bookmarked: false}
                        : influencer
                ));
                if (selectedInfluencer && selectedInfluencer.id === influencerId) {
                    setSelectedInfluencer(prev => prev ? {...prev, is_bookmarked: false} : null);
                }
            }
        } catch (error) {
            console.error('Failed to remove bookmark:', error);
            toast.error('Failed to remove bookmark. Please try again.');
        }
    };

    // Fetch campaigns for adding influencers
    const fetchCampaigns = async () => {
        try {
            console.log('Fetching campaigns for influencers...');
            const response = await api.get('/brands/campaigns/for-influencers/');
            console.log('Campaigns for influencers response:', response.data);
            const campaignsData = response.data.campaigns || [];
            setCampaigns(campaignsData);

            // Use dropdown if more than 10 campaigns
            setUseDropdownForCampaigns(campaignsData.length > 10);
        } catch (error) {
            console.error('Failed to fetch campaigns:', error);
            toast.error('Failed to load campaigns. Please try again.');
        }
    };

    // Handle influencer selection
    const handleInfluencerSelect = (influencerId: number) => {
        setSelectedInfluencers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(influencerId)) {
                newSet.delete(influencerId);
            } else {
                newSet.add(influencerId);
            }
            return newSet;
        });
    };

    // Add selected influencers to campaigns
    const handleAddToCampaigns = async () => {
        if (selectedCampaigns.size === 0) {
            toast.error('Please select campaigns.');
            return;
        }

        // Check if we have influencers to add (either individual or bulk)
        if (!individualInfluencer && selectedInfluencers.size === 0) {
            toast.error('Please select influencers.');
            return;
        }

        setIsLoadingActions(true);
        try {
            // Use individual influencer if available, otherwise use bulk selection
            const influencerIds = individualInfluencer ? [individualInfluencer] : Array.from(selectedInfluencers);
            let successCount = 0;
            let errorCount = 0;

            // Add influencers to each selected campaign
            for (const campaignId of selectedCampaigns) {
                try {
                    const response = await api.post(`/brands/campaigns/${campaignId}/add-influencers/`, {
                        influencer_ids: influencerIds
                    });

                    if (response.data) {
                        successCount++;
                    }
                } catch (error: any) {
                    console.error(`Failed to add influencers to campaign ${campaignId}:`, error);
                    errorCount++;
                }
            }

            if (successCount > 0) {
                const influencerText = individualInfluencer ? 'influencer' : `${influencerIds.length} influencer${influencerIds.length > 1 ? 's' : ''}`;
                toast.success(`Successfully added ${influencerText} to ${successCount} campaign${successCount > 1 ? 's' : ''}.`);
                if (errorCount > 0) {
                    toast.error(`Failed to add to ${errorCount} campaign${errorCount > 1 ? 's' : ''}.`);
                }
                // Reset individual influencer state
                setIndividualInfluencer(null);
                setShowCampaignDialog(false);
                setSelectedCampaigns(new Set());
                fetchInfluencers(1, false);
            } else {
                toast.error('Failed to add influencers to any campaigns. Please try again.');
            }
        } catch (error: any) {
            console.error('Failed to add influencers to campaigns:', error);
            toast.error('Failed to add influencers to campaigns. Please try again.');
        } finally {
            setIsLoadingActions(false);
        }
    };

    // Handle campaign selection
    const handleCampaignSelect = (campaignId: string) => {
        setSelectedCampaigns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(campaignId)) {
                newSet.delete(campaignId);
            } else {
                newSet.add(campaignId);
            }
            return newSet;
        });
    };

    // Send message to influencer
    const handleSendMessage = async () => {
        if (!messageInfluencer || !messageContent.trim()) {
            toast.error('Please enter a message.');
            return;
        }

        setIsLoadingActions(true);
        try {
            const response = await api.post(`/brands/influencers/${messageInfluencer.id}/message/`, {
                content: messageContent
            });

            if (response.data) {
                toast.success('Message sent successfully!');
                setMessageContent("");
                setShowMessageDialog(false);
                setMessageInfluencer(null);
            }
        } catch (error: any) {
            console.error('Failed to send message:', error);
            const errorMessage = error.response?.data?.message || 'Failed to send message. Please try again.';

            // Check if it's the campaign requirement error
            if (errorMessage.includes('No existing deal found with this influencer')) {
                setShowCampaignSelectionInMessage(true);
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setIsLoadingActions(false);
        }
    };

    // Open message dialog
    const openMessageDialog = (influencer: Influencer) => {
        // Open messages in a new tab for this influencer
        window.open(`/brand/messages?influencer=${influencer.id}`, '_blank', 'noopener,noreferrer');
    };

    // Open campaign dialog
    const openCampaignDialog = () => {
        if (selectedInfluencers.size === 0) {
            toast.error('Please select influencers first.');
            return;
        }
        fetchCampaigns();
        setShowCampaignDialog(true);
        setCampaignSearchTerm(""); // Clear search when opening
    };

    // Open campaign dialog for individual influencer
    const openIndividualCampaignDialog = (influencerId: number) => {
        setIndividualInfluencer(influencerId);
        fetchCampaigns();
        setShowCampaignDialog(true);
        setCampaignSearchTerm(""); // Clear search when opening
    };

    useEffect(() => {
        // Initialize from query params
        try {
            const params = new URLSearchParams(window.location.search);
            const ind = params.get('industry');
            if (ind) setSelectedIndustry(ind);
            const cats = params.get('categories');
            if (cats) setSelectedCategories(cats.split(',').filter(Boolean));
        } catch {
        }
        // Load industries for dropdown
        api.get('/common/industries/').then(res => {
            setIndustries(res.data?.industries || []);
        }).catch(() => {
        });
    }, []);

    useEffect(() => {
        setPage(1);
        fetchInfluencers(1, false);
    }, [fetchInfluencers]);

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
            setSortOrder("desc");
        }
    };

    const SortIcon = ({column}: { column: string }) => {
        if (sortBy !== column) return <HiChevronDown className="w-3 h-3 text-gray-400"/>;
        return sortOrder === "asc" ? <HiChevronUp className="w-3 h-3"/> : <HiChevronDown className="w-3 h-3"/>;
    };

    const hasActiveFilters = useMemo(() => {
        return searchTerm !== "" ||
            selectedPlatform !== "all" ||
            locationFilter !== "All" ||
            genderFilter !== "All" ||
            followerRange !== "All Followers" ||
            selectedCategories.length > 0 ||
            selectedIndustry !== "All";
    }, [searchTerm, selectedPlatform, locationFilter, genderFilter, followerRange, selectedCategories, selectedIndustry]);

    const clearAllFilters = () => {
        setSearchTerm("");
        setSelectedPlatform("all");
        setLocationFilter("All");
        setGenderFilter("All");
        setFollowerRange("All Followers");
        setSelectedCategories([]);
        setSelectedIndustry("All");
    };

    const handleCategoryToggle = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const handleContact = (influencer: Influencer) => {
        toast.success(`Contacting ${influencer.full_name}...`);
    };

    const handleAddToCampaignOld = (influencer: Influencer) => {
        toast.success(`${influencer.full_name} added to campaign!`);
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchInfluencers(nextPage, true);
    };

    const toggleColumnVisibility = (columnKey: string) => {
        setVisibleColumns((prev: Record<string, boolean>) => ({
            ...prev,
            [columnKey]: !prev[columnKey]
        }));
    };

    const PlatformIcon = ({platform}: { platform: string }) => {
        const config = platformConfig[platform as keyof typeof platformConfig];
        if (!config) return null;

        const IconComponent = config.icon;
        return (
            <div className={`w-6 h-6 ${config.bg} ${config.border} border rounded-md flex items-center justify-center`}>
                <IconComponent className={`w-3 h-3 ${config.color}`}/>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div className="container mx-auto px-4 py-4 max-w-7xl">
                {/* Compact Header */}
                <div className="mb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Discover Creators
                            </h1>
                            <p className="text-sm text-gray-600">
                                Find the perfect influencers for your brand. Filter by platform, audience size, and
                                content categories.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs text-gray-500">Found</p>
                                <p className="text-sm font-semibold text-gray-900">
                                    {totalCount} creators
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowColumnSettings(!showColumnSettings)}
                                className="border border-gray-300 hover:border-gray-400"
                            >
                                <HiEyeSlash className="h-4 w-4 mr-1"/>
                                Columns
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                                className="border border-gray-300 hover:border-gray-400"
                            >
                                <HiFunnel className="h-4 w-4 mr-1"/>
                                Filters
                                {hasActiveFilters && (
                                    <Badge className="ml-1 bg-indigo-100 text-indigo-800 px-1 py-0 text-xs">
                                        Active
                                    </Badge>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Column Settings Panel */}
                {showColumnSettings && (
                    <Card className="mb-3 bg-white border border-gray-200 shadow-sm">
                        <div className="p-3">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-gray-900">Column Visibility</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowColumnSettings(false)}
                                >
                                    <HiX className="w-4 h-4"/>
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {Object.entries(columnConfig).map(([key, config]) => (
                                    <div key={key} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={key}
                                            checked={visibleColumns[key]}
                                            onCheckedChange={() => toggleColumnVisibility(key)}
                                        />
                                        <label htmlFor={key} className="text-sm text-gray-700">
                                            {config.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                )}

                {/* Compact Search and Filters */}
                <Card className="mb-3 bg-white border border-gray-200 shadow-sm">
                    <div className="p-3">
                        {/* Search Bar */}
                        <div className="relative mb-3">
                            <HiMagnifyingGlass
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
                            <Input
                                placeholder="Search creators by name, username, or keywords..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-10 text-sm border border-gray-300 focus:border-indigo-300 focus:ring-indigo-200 rounded-lg"
                            />
                            {searchTerm && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-gray-100 rounded-full h-6 w-6 p-0"
                                >
                                    <HiX className="h-3 w-3"/>
                                </Button>
                            )}
                        </div>

                        {/* Quick Filters Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                            {/* Platform Selector */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700">Platform</label>
                                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                                    <SelectTrigger className="h-8 text-xs border border-gray-300">
                                        <SelectValue placeholder="All Platforms"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Platforms</SelectItem>
                                        <SelectItem value="instagram">Instagram</SelectItem>
                                        <SelectItem value="youtube">YouTube</SelectItem>
                                        <SelectItem value="tiktok">TikTok</SelectItem>
                                        <SelectItem value="twitter">Twitter</SelectItem>
                                        <SelectItem value="facebook">Facebook</SelectItem>
                                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Industry */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700">Industry</label>
                                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                                    <SelectTrigger className="h-8 text-xs border border-gray-300">
                                        <SelectValue placeholder="All Industries"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Industries</SelectItem>
                                        {industries.map((ind) => (
                                            <SelectItem key={ind.key} value={ind.key}>{ind.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Followers */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700">Followers</label>
                                <Select value={followerRange} onValueChange={setFollowerRange}>
                                    <SelectTrigger className="h-8 text-xs border border-gray-300">
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {followerRanges.map(range => (
                                            <SelectItem key={range.label} value={range.label}>{range.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Sort By */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700">Sort By</label>
                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="h-8 text-xs border border-gray-300">
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="followers">Followers</SelectItem>
                                        <SelectItem value="engagement">Engagement</SelectItem>
                                        <SelectItem value="rating">Rating</SelectItem>
                                        <SelectItem value="posts">Posts</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Clear Filters */}
                            {hasActiveFilters && (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-700">&nbsp;</label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={clearAllFilters}
                                        className="w-full h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                        <HiX className="h-3 w-3 mr-1"/>
                                        Clear All
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Advanced Filters Panel */}
                {showFilters && (
                    <Card className="mb-3 bg-white border border-gray-200 shadow-sm">
                        <div className="p-3">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <HiSparkles className="w-4 h-4 text-indigo-600"/>
                                    Advanced Filters
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowFilters(false)}
                                >
                                    <HiX className="w-4 h-4"/>
                                </Button>
                            </div>

                            <div className="grid gap-3">
                                {/* Categories */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-2">
                                        Content Categories
                                    </label>
                                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                        {categoryOptions.map(category => (
                                            <div
                                                key={category}
                                                className={`px-2 py-1 rounded-md border cursor-pointer transition-all text-xs ${
                                                    selectedCategories.includes(category)
                                                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                                }`}
                                                onClick={() => handleCategoryToggle(category)}
                                            >
                                                {category}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Additional Filters */}
                                <div className="grid md:grid-cols-3 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-700">Location</label>
                                        <Select value={locationFilter} onValueChange={setLocationFilter}>
                                            <SelectTrigger className="h-8 text-xs border border-gray-300">
                                                <SelectValue/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="All">All Locations</SelectItem>
                                                <SelectItem value="India">India</SelectItem>
                                                <SelectItem value="USA">USA</SelectItem>
                                                <SelectItem value="UK">UK</SelectItem>
                                                <SelectItem value="Canada">Canada</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-700">Gender</label>
                                        <Select value={genderFilter} onValueChange={setGenderFilter}>
                                            <SelectTrigger className="h-8 text-xs border border-gray-300">
                                                <SelectValue/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="All">All</SelectItem>
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-700">Sort Order</label>
                                        <Select value={sortOrder}
                                                onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
                                            <SelectTrigger className="h-8 text-xs border border-gray-300">
                                                <SelectValue/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="desc">Highest First</SelectItem>
                                                <SelectItem value="asc">Lowest First</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Bulk Actions Bar */}
                {selectedInfluencers.size > 0 && (
                    <Card
                        className="mb-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 shadow-sm">
                        <div className="p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <HiCheck className="w-5 h-5 text-indigo-600"/>
                                        <span className="text-sm font-medium text-indigo-900">
                      {selectedInfluencers.size} influencer{selectedInfluencers.size !== 1 ? 's' : ''} selected
                    </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedInfluencers(new Set())}
                                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100"
                                    >
                                        <HiX className="w-4 h-4"/>
                                        Clear
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={openCampaignDialog}
                                        className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                    >
                                        <HiPlus className="w-4 h-4 mr-1"/>
                                        Add to Campaigns
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Compact Table View */}
                <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                                    <Checkbox
                                        checked={selectedInfluencers.size === influencers.length && influencers.length > 0}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedInfluencers(new Set(influencers.map(i => i.id)));
                                            } else {
                                                setSelectedInfluencers(new Set());
                                            }
                                        }}
                                    />
                                </th>
                                {visibleColumns.creator && (
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                                        Creator Profile
                                    </th>
                                )}
                                {visibleColumns.rating && (
                                    <th
                                        className="px-3 py-2 text-left text-xs font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => handleSort('rating')}
                                    >
                                        <div className="flex items-center gap-1">
                                            <HiStar className="w-3 h-3 text-yellow-500"/>
                                            Rating
                                            <SortIcon column="rating"/>
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.followers && (
                                    <th
                                        className="px-3 py-2 text-left text-xs font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => handleSort('followers')}
                                    >
                                        <div className="flex items-center gap-1">
                                            <HiUsers className="w-3 h-3 text-blue-500"/>
                                            Followers
                                            <SortIcon column="followers"/>
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.engagement && (
                                    <th
                                        className="px-3 py-2 text-left text-xs font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => handleSort('engagement')}
                                    >
                                        <div className="flex items-center gap-1">
                                            <HiHeart className="w-3 h-3 text-red-500"/>
                                            Engagement
                                            <SortIcon column="engagement"/>
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.posts && (
                                    <th
                                        className="px-3 py-2 text-left text-xs font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => handleSort('posts')}
                                    >
                                        <div className="flex items-center gap-1">
                                            <HiPlay className="w-3 h-3 text-green-500"/>
                                            Posts
                                            <SortIcon column="posts"/>
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.location && (
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                                        <div className="flex items-center gap-1">
                                            <HiMapPin className="w-3 h-3 text-purple-500"/>
                                            Location
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.categories && (
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                                        Industry
                                    </th>
                                )}
                                {/* Platform-specific columns */}
                                {selectedPlatform === 'instagram' && (
                                    <>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Avg
                                            Likes
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Avg
                                            Comments
                                        </th>
                                    </>
                                )}
                                {selectedPlatform === 'youtube' && (
                                    <>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Subscribers</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Avg
                                            Views
                                        </th>
                                    </>
                                )}
                                {selectedPlatform === 'twitter' && (
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Followers
                                        (X)</th>
                                )}
                                {selectedPlatform === 'facebook' && (
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Page
                                        Likes</th>
                                )}
                                {visibleColumns.actions && (
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                                        Actions
                                    </th>
                                )}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {influencers.map((influencer) => (
                                <tr
                                    key={influencer.id}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-3 py-2">
                                        <Checkbox
                                            checked={selectedInfluencers.has(influencer.id)}
                                            onCheckedChange={(checked) => handleInfluencerSelect(influencer.id)}
                                        />
                                    </td>
                                    {visibleColumns.creator && (
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <div className="relative">
                                                    <div
                                                        className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full overflow-hidden border border-white shadow-sm">
                                                        {influencer.profile_image ? (
                                                            <img
                                                                src={influencer.profile_image}
                                                                alt={influencer.full_name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div
                                                                className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                                                                {influencer.full_name.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {influencer.is_verified && (
                                                        <div
                                                            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 border border-white rounded-full flex items-center justify-center">
                                                            <HiCheckBadge className="w-2 h-2 text-white"/>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1 mb-0.5">
                                                        <h3 className="font-medium text-gray-900 truncate text-sm">{influencer.full_name}</h3>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mb-1">{getDisplayUsername(influencer) ? `@${getDisplayUsername(influencer)}` : ''}</p>
                                                    <div className="flex items-center gap-1">
                                                        {influencer.platforms.slice(0, 2).map(platform => (
                                                            <PlatformIcon key={platform} platform={platform}/>
                                                        ))}
                                                        {influencer.platforms.length > 2 && (
                                                            <Badge variant="secondary" className="text-xs px-1 py-0">
                                                                +{influencer.platforms.length - 2}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    )}
                                    {visibleColumns.rating && (
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-1">
                                                <HiStar className="w-3 h-3 text-yellow-500 fill-current"/>
                                                <span className="font-medium text-gray-900 text-sm">
                            {influencer.score || (typeof influencer.avg_rating === 'number' ? influencer.avg_rating.toFixed(1) : "N/A")}
                          </span>
                                            </div>
                                        </td>
                                    )}
                                    {visibleColumns.followers && (
                                        <td className="px-3 py-2">
                        <span className="font-medium text-gray-900 text-sm">
                          {formatNumber(influencer.total_followers)}
                        </span>
                                        </td>
                                    )}
                                    {visibleColumns.engagement && (
                                        <td className="px-3 py-2">
                        <span className="font-medium text-gray-900 text-sm">
                          {(typeof influencer.engagement_rate === 'number' ? influencer.engagement_rate.toFixed(1) : null) ||
                              (typeof influencer.avg_engagement === 'number' ? influencer.avg_engagement.toFixed(1) : null) ||
                              "N/A"}%
                        </span>
                                        </td>
                                    )}
                                    {visibleColumns.posts && (
                                        <td className="px-3 py-2">
                        <span className="font-medium text-gray-900 text-sm">
                          {formatNumber(influencer.posts_count || 0)}
                        </span>
                                        </td>
                                    )}
                                    {visibleColumns.location && (
                                        <td className="px-3 py-2">
                                            <span
                                                className="text-gray-600 text-sm">{influencer.location || "N/A"}</span>
                                        </td>
                                    )}
                                    {visibleColumns.categories && (
                                        <td className="px-3 py-2">
                                            <span
                                                className="text-gray-700 text-sm">{influencer.industry || 'N/A'}</span>
                                        </td>
                                    )}
                                    {/* Platform-specific cells */}
                                    {selectedPlatform === 'instagram' && (
                                        <>
                                            <td className="px-3 py-2"><span
                                                className="text-gray-700 text-sm">{influencer.avg_likes || '0'}</span>
                                            </td>
                                            <td className="px-3 py-2"><span
                                                className="text-gray-700 text-sm">{influencer.avg_comments || '0'}</span>
                                            </td>
                                        </>
                                    )}
                                    {selectedPlatform === 'youtube' && (
                                        <>
                                            <td className="px-3 py-2"><span
                                                className="text-gray-700 text-sm">{influencer.youtube_subscribers ?? '0'}</span>
                                            </td>
                                            <td className="px-3 py-2"><span
                                                className="text-gray-700 text-sm">{influencer.avg_views || '0'}</span>
                                            </td>
                                        </>
                                    )}
                                    {selectedPlatform === 'twitter' && (
                                        <td className="px-3 py-2"><span
                                            className="text-gray-700 text-sm">{influencer.twitter_followers ?? '0'}</span>
                                        </td>
                                    )}
                                    {selectedPlatform === 'facebook' && (
                                        <td className="px-3 py-2"><span
                                            className="text-gray-700 text-sm">{influencer.facebook_page_likes ?? '0'}</span>
                                        </td>
                                    )}
                                    {visibleColumns.actions && (
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-1">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setSelectedInfluencer(influencer)}
                                                            className="h-6 px-2 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                                        >
                                                            <HiEye className="w-3 h-3 mr-1"/>
                                                            View
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-4xl">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-2xl font-bold text-gray-900">
                                                                Creator Profile
                                                            </DialogTitle>
                                                        </DialogHeader>
                                                        {selectedInfluencer && (
                                                            <div className="space-y-6">
                                                                {/* Profile Header */}
                                                                <div className="flex items-start gap-6">
                                                                    <div className="relative">
                                                                        <div
                                                                            className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full overflow-hidden border-4 border-white shadow-xl">
                                                                            {selectedInfluencer.profile_image ? (
                                                                                <img
                                                                                    src={selectedInfluencer.profile_image}
                                                                                    alt={selectedInfluencer.full_name}
                                                                                    className="w-full h-full object-cover"
                                                                                />
                                                                            ) : (
                                                                                <div
                                                                                    className="w-full h-full flex items-center justify-center text-white font-bold text-3xl">
                                                                                    {selectedInfluencer.full_name.charAt(0)}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        {selectedInfluencer.is_verified && (
                                                                            <div
                                                                                className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 border-4 border-white rounded-full flex items-center justify-center">
                                                                                <HiCheckBadge
                                                                                    className="w-4 h-4 text-white"/>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-3 mb-3">
                                                                            <h2 className="text-2xl font-bold text-gray-900">{selectedInfluencer.full_name}</h2>
                                                                        </div>
                                                                        <p className="text-gray-600 mb-3">{getDisplayUsername(selectedInfluencer) ? `@${getDisplayUsername(selectedInfluencer)}` : ''}</p>
                                                                        <p className="text-gray-700 mb-4">{selectedInfluencer.bio || "No bio available"}</p>
                                                                        <div className="flex items-center gap-3">
                                                                            {selectedInfluencer.platforms.map(platform => (
                                                                                <PlatformIcon key={platform}
                                                                                              platform={platform}/>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-3">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => selectedInfluencer.is_bookmarked ? handleRemoveBookmark(selectedInfluencer.id) : handleBookmark(selectedInfluencer.id)}
                                                                            className={selectedInfluencer.is_bookmarked ? "bg-blue-50 border-blue-200 text-blue-700" : ""}
                                                                        >
                                                                            <HiBookmark
                                                                                className={`w-4 h-4 mr-1 ${selectedInfluencer.is_bookmarked ? "fill-current" : ""}`}/>
                                                                            {selectedInfluencer.is_bookmarked ? "Bookmarked" : "Bookmark"}
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                // Open individual campaign dialog without affecting bulk selection
                                                                                openIndividualCampaignDialog(selectedInfluencer.id);
                                                                            }}
                                                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                                                                        >
                                                                            <HiPlus className="w-4 h-4 mr-1"/>
                                                                            Add to Campaign
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                {/* Stats Grid */}
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                    <div
                                                                        className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <HiUsers className="w-5 h-5 text-blue-600"/>
                                                                            <span
                                                                                className="text-sm font-medium text-blue-700">Followers</span>
                                                                        </div>
                                                                        <p className="text-2xl font-bold text-blue-900">
                                                                            {formatNumber(selectedInfluencer.total_followers)}
                                                                        </p>
                                                                    </div>
                                                                    <div
                                                                        className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <HiHeart
                                                                                className="w-5 h-5 text-green-600"/>
                                                                            <span
                                                                                className="text-sm font-medium text-green-700">Engagement</span>
                                                                        </div>
                                                                        <p className="text-2xl font-bold text-green-900">
                                                                            {(typeof selectedInfluencer.engagement_rate === 'number' ? selectedInfluencer.engagement_rate.toFixed(1) : null) ||
                                                                                (typeof selectedInfluencer.avg_engagement === 'number' ? selectedInfluencer.avg_engagement.toFixed(1) : null) ||
                                                                                "N/A"}%
                                                                        </p>
                                                                    </div>
                                                                    <div
                                                                        className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <HiPlay
                                                                                className="w-5 h-5 text-purple-600"/>
                                                                            <span
                                                                                className="text-sm font-medium text-purple-700">Posts</span>
                                                                        </div>
                                                                        <p className="text-2xl font-bold text-purple-900">
                                                                            {formatNumber(selectedInfluencer.posts_count || 0)}
                                                                        </p>
                                                                    </div>
                                                                    <div
                                                                        className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <HiStar
                                                                                className="w-5 h-5 text-yellow-600 fill-current"/>
                                                                            <span
                                                                                className="text-sm font-medium text-yellow-700">Rating</span>
                                                                        </div>
                                                                        <p className="text-2xl font-bold text-yellow-900">
                                                                            {typeof selectedInfluencer.avg_rating === 'number' ? selectedInfluencer.avg_rating.toFixed(1) : "N/A"}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Contact Actions */}
                                                                <div
                                                                    className="flex gap-3 pt-6 border-t border-gray-200">
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={() => {
                                                                            // Open individual campaign dialog without affecting bulk selection
                                                                            openIndividualCampaignDialog(selectedInfluencer.id);
                                                                        }}
                                                                        className="flex-1 border-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                                                                    >
                                                                        <HiPlus className="w-4 h-4 mr-2"/>
                                                                        Add to Campaign
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={() => {
                                                                            window.open(`/influencer/${selectedInfluencer.id}`, '_blank', 'noopener,noreferrer');
                                                                        }}
                                                                        className="flex-1 border-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                                                                    >
                                                                        <HiGlobeAlt className="w-4 h-4 mr-2"/>
                                                                        View Profile
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </DialogContent>
                                                </Dialog>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => influencer.is_bookmarked ? handleRemoveBookmark(influencer.id) : handleBookmark(influencer.id)}
                                                    className={`h-6 w-6 p-0 ${influencer.is_bookmarked ? "text-blue-600" : "text-gray-400 hover:text-blue-600"}`}
                                                >
                                                    <HiBookmark
                                                        className={`w-3 h-3 ${influencer.is_bookmarked ? "fill-current" : ""}`}/>
                                                </Button>


                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        // Open individual campaign dialog without affecting bulk selection
                                                        openIndividualCampaignDialog(influencer.id);
                                                    }}
                                                    className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700"
                                                    title="Add to campaigns"
                                                >
                                                    <HiPlus className="w-3 h-3"/>
                                                </Button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center py-4">
                        <GlobalLoader/>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && influencers.length === 0 && (
                    <Card className="p-8 text-center bg-white border border-gray-200 shadow-sm">
                        <div
                            className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <HiSparkles className="w-8 h-8 text-indigo-600"/>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No creators found</h3>
                        <p className="text-gray-600 mb-4 max-w-md mx-auto">
                            Try adjusting your search criteria or filters to discover amazing creators for your
                            campaigns.
                        </p>
                        <Button
                            variant="outline"
                            onClick={clearAllFilters}
                            className="border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                        >
                            <HiArrowPath className="w-4 h-4 mr-2"/>
                            Reset All Filters
                        </Button>
                    </Card>
                )}

                {/* Load More Button - Only show when there are results and more pages available */}
                {!isLoading && influencers.length > 0 && hasMore && (
                    <div className="flex flex-col items-center mt-6 mb-4 space-y-3">
                        <div className="text-sm text-gray-600">
                            Showing {influencers.length} of {totalCount} creators (Page {page} of {totalPages})
                        </div>
                        <Button
                            onClick={handleLoadMore}
                            size="lg"
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3"
                        >
                            <HiArrowPath className="w-5 h-5 mr-2"/>
                            Load More Creators
                        </Button>
                    </div>
                )}

                {/* Campaign Selection Dialog */}
                <Dialog open={showCampaignDialog} onOpenChange={(open) => {
                    setShowCampaignDialog(open);
                    if (!open) setIndividualInfluencer(null);
                }}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-gray-900">
                                {individualInfluencer ? 'Add to Campaigns' : (selectedInfluencers.size === 1 ? 'Add to Campaigns' : `Add ${selectedInfluencers.size} Influencers to Campaigns`)}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            {/* Show which influencer is being added */}
                            {individualInfluencer && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        Adding influencer: <span className="font-medium">
                      {(() => {
                          const influencer = influencers.find(i => i.id === individualInfluencer);
                          return influencer ? (influencer.full_name || influencer.username || `ID ${individualInfluencer}`) : `ID ${individualInfluencer}`;
                      })()}
                    </span>
                                    </p>
                                </div>
                            )}
                            {!individualInfluencer && selectedInfluencers.size === 1 && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        Adding influencer: <span className="font-medium">
                      {(() => {
                          const influencerId = Array.from(selectedInfluencers)[0];
                          const influencer = influencers.find(i => i.id === influencerId);
                          return influencer ? (influencer.full_name || influencer.username || `ID ${influencerId}`) : `ID ${influencerId}`;
                      })()}
                    </span>
                                    </p>
                                </div>
                            )}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Select Campaigns ({selectedCampaigns.size} selected)
                                    </label>

                                </div>

                                {/* Always use searchable multi-select */}
                                <div className="space-y-3">
                                    <ReactSelect
                                        options={campaigns
                                            .sort((a: any, b: any) => {
                                                // Sort by creation date (most recent first)
                                                const getDate = (obj: any) => {
                                                    const dateStr = obj.created_at || obj.created || obj.date_created;
                                                    if (!dateStr) return new Date(0);
                                                    const date = new Date(dateStr);
                                                    return isNaN(date.getTime()) ? new Date(0) : date;
                                                };
                                                const dateA = getDate(a);
                                                const dateB = getDate(b);
                                                return dateB.getTime() - dateA.getTime();
                                            })
                                            .map((c: any) => ({
                                                value: c.id.toString(),
                                                label: `${c.title}${(() => {
                                                    const dateStr = c.created_at || c.created || c.date_created;
                                                    if (!dateStr) return '';
                                                    const date = new Date(dateStr);
                                                    return isNaN(date.getTime()) ? '' : ` (${date.toLocaleDateString()})`;
                                                })()}`,
                                                meta: c
                                            }))}
                                        isMulti
                                        classNamePrefix="rs"
                                        placeholder="Search campaigns..."
                                        value={Array.from(selectedCampaigns).map(id => {
                                            const c = campaigns.find((x: any) => x.id.toString() === id);
                                            return c ? {
                                                value: id,
                                                label: `${c.title}${(() => {
                                                    const dateStr = c.created_at || c.created || c.date_created;
                                                    if (!dateStr) return '';
                                                    const date = new Date(dateStr);
                                                    return isNaN(date.getTime()) ? '' : ` (${date.toLocaleDateString()})`;
                                                })()}`,
                                                meta: c
                                            } : {value: id, label: id} as any;
                                        })}
                                        onChange={(vals) => {
                                            const ids = new Set((vals as any[]).map(v => v.value));
                                            setSelectedCampaigns(ids as Set<string>);
                                        }}
                                        styles={{
                                            control: (base) => ({...base, borderColor: '#e5e7eb', minHeight: 44}),
                                            multiValue: (base) => ({...base, backgroundColor: '#eef2ff'}),
                                            multiValueLabel: (base) => ({...base, color: '#4338ca'}),
                                        }}
                                        menuPlacement="auto"
                                        closeMenuOnSelect={false}
                                        hideSelectedOptions={false}
                                        isClearable={false}
                                    />
                                    {selectedCampaigns.size > 0 && (
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm font-medium text-blue-800 mb-2">
                                                Selected Campaigns ({selectedCampaigns.size}):
                                            </p>
                                            <div className="space-y-1">
                                                {Array.from(selectedCampaigns).slice(0, 10).map(campaignId => {
                                                    const campaign = campaigns.find((c: any) => c.id.toString() === campaignId);
                                                    return campaign ? (
                                                        <div key={campaignId}
                                                             className="flex items-center justify-between text-sm">
                                                            <div className="flex flex-col">
                                                                <span className="text-blue-700">{campaign.title}</span>
                                                                {(campaign.created_at || campaign.created || campaign.date_created) && (
                                                                    <span className="text-xs text-blue-500">
                                    Created: {(() => {
                                                                        const dateStr = campaign.created_at || campaign.created || campaign.date_created;
                                                                        if (!dateStr) return '';
                                                                        const date = new Date(dateStr);
                                                                        return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
                                                                    })()}
                                  </span>
                                                                )}
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleCampaignSelect(campaignId)}
                                                                className="h-4 w-4 p-0 text-blue-600 hover:text-blue-800"
                                                            >
                                                                <HiX className="w-3 h-3"/>
                                                            </Button>
                                                        </div>
                                                    ) : null;
                                                })}
                                                {selectedCampaigns.size > 10 && (
                                                    <div
                                                        className="text-xs text-blue-700">and {selectedCampaigns.size - 10} more...</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedInfluencers.size > 1 && (
                                <div className="text-sm text-gray-600">
                                    <p>Selected influencers: {selectedInfluencers.size}</p>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {(() => {
                                            const names = Array.from(selectedInfluencers).map(id => {
                                                const inf = influencers.find(i => i.id === id);
                                                if (!inf) return '';
                                                const uname = getDisplayUsername(inf);
                                                return inf.full_name || uname || `ID ${id}`;
                                            }).filter(Boolean);
                                            if (names.length > 10) {
                                                const head = names.slice(0, 3).join(', ');
                                                return `${head} and ${names.length - 3} more...`;
                                            }
                                            return names.join(', ');
                                        })()}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowCampaignDialog(false);
                                        setIndividualInfluencer(null);
                                    }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddToCampaigns}
                                    disabled={selectedCampaigns.size === 0 || (!individualInfluencer && selectedInfluencers.size === 0) || isLoadingActions}
                                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                                >
                                    {isLoadingActions ? (
                                        <>
                                            <HiArrowPath className="w-4 h-4 mr-2 animate-spin"/>
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <HiPlus className="w-4 h-4 mr-2"/>
                                            {individualInfluencer ? 'Add to Campaigns' : (selectedInfluencers.size === 1 ? 'Add to Campaigns' : `Add ${selectedInfluencers.size} Influencers to Campaigns`)}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Message Dialog */}
                <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-gray-900">
                                Send Message
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            {messageInfluencer && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div
                                        className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full overflow-hidden">
                                        {messageInfluencer.profile_image ? (
                                            <img
                                                src={messageInfluencer.profile_image}
                                                alt={messageInfluencer.full_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div
                                                className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                                                {messageInfluencer.full_name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{messageInfluencer.full_name}</p>
                                        <p className="text-sm text-gray-500">@{messageInfluencer.username}</p>
                                    </div>
                                </div>
                            )}

                            {showCampaignSelectionInMessage && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800 mb-2">
                                        This influencer needs to be added to a campaign first to send messages.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setShowMessageDialog(false);
                                            setShowCampaignSelectionInMessage(false);
                                            setSelectedInfluencers(new Set([messageInfluencer?.id || 0]));
                                            setShowCampaignDialog(true);
                                        }}
                                        className="text-blue-700 border-blue-300 hover:bg-blue-100"
                                    >
                                        <HiPlus className="w-4 h-4 mr-1"/>
                                        Add to Campaign First
                                    </Button>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Message
                                </label>
                                <Textarea
                                    value={messageContent}
                                    onChange={(e) => setMessageContent(e.target.value)}
                                    placeholder="Type your message here..."
                                    className="min-h-[100px]"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowMessageDialog(false);
                                        setShowCampaignSelectionInMessage(false);
                                    }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                {!showCampaignSelectionInMessage && (
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!messageContent.trim() || isLoadingActions}
                                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                                    >
                                        {isLoadingActions ? (
                                            <>
                                                <HiArrowPath className="w-4 h-4 mr-2 animate-spin"/>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <HiEnvelope className="w-4 h-4 mr-2"/>
                                                Send Message
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
} 