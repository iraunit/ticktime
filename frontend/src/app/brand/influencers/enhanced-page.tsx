"use client";

import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Card} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {
    HiArrowPath,
    HiBookmark,
    HiChatBubbleLeftRight,
    HiCheckBadge,
    HiChevronDown,
    HiChevronUp,
    HiEnvelope,
    HiEye,
    HiFunnel,
    HiGlobeAlt,
    HiHeart,
    HiMagnifyingGlass,
    HiPhone,
    HiPlay,
    HiPlus,
    HiStar,
    HiUserPlus,
    HiXMark
} from "react-icons/hi2";
import {api} from "@/lib/api";
import {toast} from "@/lib/toast";
import {GlobalLoader} from "@/components/ui/global-loader";

// Platform configuration
const platformConfig = {
    youtube: {icon: "📺", color: "from-red-500 to-red-600", bg: "bg-red-50", text: "text-red-600"},
    instagram: {icon: "📷", color: "from-pink-500 to-purple-500", bg: "bg-pink-50", text: "text-pink-600"},
    tiktok: {icon: "🎵", color: "from-black to-gray-800", bg: "bg-gray-50", text: "text-gray-600"},
    twitter: {icon: "🐦", color: "from-blue-400 to-blue-500", bg: "bg-blue-50", text: "text-blue-600"}
};

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
    influence_score?: number;
    avg_likes?: number;
    avg_views?: number;
    avg_comments?: number;
    total_videos?: number;
    categories?: string[];
    gender?: string;
    response_time?: string;
    faster_responses?: boolean;
}

const categoryOptions = [
    "Arts & Entertainment", "Dance", "Movies", "Humor / Comedy", "Fashion & Beauty",
    "Tech & Gaming", "Fitness & Health", "Food & Lifestyle", "Travel & Adventure",
    "Business & Finance", "Education", "Parenting & Family", "Sports", "Music"
];

const followerRanges = [
    {label: "All", min: 0, max: 999999999},
    {label: "1K - 10K", min: 1000, max: 10000},
    {label: "10K - 50K", min: 10000, max: 50000},
    {label: "50K - 100K", min: 50000, max: 100000},
    {label: "100K - 500K", min: 100000, max: 500000},
    {label: "500K - 1M", min: 500000, max: 1000000},
    {label: "1M - 5M", min: 1000000, max: 5000000},
    {label: "5M+", min: 5000000, max: 999999999}
];

export default function EnhancedInfluencerSearchPage() {
    const [influencers, setInfluencers] = useState<Influencer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);

    // Filter states
    const [selectedPlatform, setSelectedPlatform] = useState("youtube");
    const [locationFilter, setLocationFilter] = useState("All");
    const [genderFilter, setGenderFilter] = useState("All");
    const [followerRange, setFollowerRange] = useState("All");
    const [credibilityScoreRange, setCredibilityScoreRange] = useState("All");
    const [fasterResponses, setFasterResponses] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [captionKeywords, setCaptionKeywords] = useState("");
    const [bioKeywords, setBioKeywords] = useState("");
    const [sortBy, setSortBy] = useState("subscribers");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const observer = useRef<IntersectionObserver | null>(null);

    // Infinite scroll setup
    const lastInfluencerElementRef = useCallback((node: HTMLTableRowElement | null) => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoading, hasMore]);

    // Load influencers from API
    const fetchInfluencers = async (pageNum = 1, append = false) => {
        if (pageNum === 1) setIsLoading(true);

        try {
            const response = await api.get('/influencers/search/', {
                params: {
                    page: pageNum,
                    search: searchTerm,
                    platform: selectedPlatform,
                    location: locationFilter !== 'All' ? locationFilter : undefined,
                    gender: genderFilter !== 'All' ? genderFilter : undefined,
                    follower_range: followerRange !== 'All' ? followerRange : undefined,
                    credibility_score: credibilityScoreRange !== 'All' ? credibilityScoreRange : undefined,
                    faster_responses: fasterResponses,
                    categories: selectedCategories.length > 0 ? selectedCategories.join(',') : undefined,
                    caption_keywords: captionKeywords,
                    bio_keywords: bioKeywords,
                    sort_by: sortBy,
                    sort_order: sortOrder,
                }
            });

            const newInfluencers = response.data.results || [];
            setInfluencers(prev => append ? [...prev, ...newInfluencers] : newInfluencers);
            setHasMore(newInfluencers.length === 20);
        } catch (error) {
            console.error('Failed to fetch influencers:', error);
            toast.error('Failed to load influencers. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
        fetchInfluencers(1, false);
    }, [searchTerm, selectedPlatform, locationFilter, genderFilter, followerRange, credibilityScoreRange, fasterResponses, selectedCategories, captionKeywords, bioKeywords, sortBy, sortOrder]);

    useEffect(() => {
        if (page > 1) {
            fetchInfluencers(page, true);
        }
    }, [page]);

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}m`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
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
        if (sortBy !== column) return <HiChevronDown className="w-4 h-4 text-gray-400"/>;
        return sortOrder === "asc" ? <HiChevronUp className="w-4 h-4"/> : <HiChevronDown className="w-4 h-4"/>;
    };

    const hasActiveFilters = useMemo(() => {
        return searchTerm !== "" ||
            locationFilter !== "All" ||
            genderFilter !== "All" ||
            followerRange !== "All" ||
            credibilityScoreRange !== "All" ||
            fasterResponses ||
            selectedCategories.length > 0 ||
            captionKeywords !== "" ||
            bioKeywords !== "";
    }, [searchTerm, locationFilter, genderFilter, followerRange, credibilityScoreRange, fasterResponses, selectedCategories, captionKeywords, bioKeywords]);

    const clearAllFilters = () => {
        setSearchTerm("");
        setLocationFilter("All");
        setGenderFilter("All");
        setFollowerRange("All");
        setCredibilityScoreRange("All");
        setFasterResponses(false);
        setSelectedCategories([]);
        setCaptionKeywords("");
        setBioKeywords("");
    };

    const handleCategoryToggle = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const handleBookmark = (id: number) => {
        toast.success("Influencer bookmarked!");
    };

    const handleContact = (influencer: Influencer) => {
        toast.success(`Contacting ${influencer.full_name}...`);
    };

    const handleAddToCampaign = (influencer: Influencer) => {
        toast.success(`${influencer.full_name} added to campaign!`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">
                                Influencer Search
                            </h1>
                            <p className="text-sm text-gray-600">
                                Discover and connect with the perfect creators for your campaigns
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs text-gray-500">Found</p>
                                <p className="text-sm font-medium text-gray-700">
                                    {influencers.length} influencers
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                                className="border border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                            >
                                <HiFunnel className="h-4 w-4 mr-1"/>
                                All Filters
                                {hasActiveFilters && (
                                    <Badge className="ml-2 bg-orange-100 text-orange-800 px-1.5 py-0.5 text-xs">
                                        Active
                                    </Badge>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Search and Quick Filters */}
                <Card className="mb-6 bg-white border border-gray-200 shadow-sm">
                    <div className="p-4">
                        {/* Search Bar */}
                        <div className="relative mb-4">
                            <HiMagnifyingGlass
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
                            <Input
                                placeholder="Type names, categories or keywords mentioned in their posts or bios"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-12 text-base border-gray-200 focus:border-orange-300 focus:ring-orange-200"
                            />
                            {searchTerm && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-gray-100"
                                >
                                    <HiXMark className="h-4 w-4"/>
                                </Button>
                            )}
                        </div>

                        {/* Quick Filters Row */}
                        <div className="flex items-center gap-4 flex-wrap">
                            {/* Platform Selector */}
                            <div className="flex items-center gap-2">
                                <div
                                    className={`w-8 h-8 rounded-lg bg-gradient-to-r ${platformConfig[selectedPlatform as keyof typeof platformConfig]?.color} flex items-center justify-center text-white text-sm`}>
                                    {platformConfig[selectedPlatform as keyof typeof platformConfig]?.icon}
                                </div>
                                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                                    <SelectTrigger className="w-32 border-gray-200">
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="youtube">YouTube</SelectItem>
                                        <SelectItem value="instagram">Instagram</SelectItem>
                                        <SelectItem value="tiktok">TikTok</SelectItem>
                                        <SelectItem value="twitter">Twitter</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Location */}
                            <Select value={locationFilter} onValueChange={setLocationFilter}>
                                <SelectTrigger className="w-32 border-gray-200">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">Location</SelectItem>
                                    <SelectItem value="India">India</SelectItem>
                                    <SelectItem value="USA">USA</SelectItem>
                                    <SelectItem value="UK">UK</SelectItem>
                                    <SelectItem value="Canada">Canada</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Gender */}
                            <Select value={genderFilter} onValueChange={setGenderFilter}>
                                <SelectTrigger className="w-32 border-gray-200">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">Gender</SelectItem>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Followers */}
                            <Select value={followerRange} onValueChange={setFollowerRange}>
                                <SelectTrigger className="w-32 border-gray-200">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    {followerRanges.map(range => (
                                        <SelectItem key={range.label} value={range.label}>{range.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Credibility Score */}
                            <Select value={credibilityScoreRange} onValueChange={setCredibilityScoreRange}>
                                <SelectTrigger className="w-32 border-gray-200">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">Credibility Score</SelectItem>
                                    <SelectItem value="7+">7+</SelectItem>
                                    <SelectItem value="8+">8+</SelectItem>
                                    <SelectItem value="9+">9+</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Faster Responses Toggle */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Faster Responses</span>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        id="fasterResponses"
                                        checked={fasterResponses}
                                        onChange={(e) => setFasterResponses(e.target.checked)}
                                        className="sr-only"
                                    />
                                    <label
                                        htmlFor="fasterResponses"
                                        className={`block w-12 h-6 rounded-full transition-colors ${
                                            fasterResponses ? 'bg-orange-500' : 'bg-gray-300'
                                        }`}
                                    >
                                        <div
                                            className={`w-4 h-4 bg-white rounded-full transition-transform transform ${
                                                fasterResponses ? 'translate-x-6' : 'translate-x-1'
                                            } mt-1`}
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Clear Filters */}
                            {hasActiveFilters && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearAllFilters}
                                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                >
                                    <HiXMark className="h-4 w-4 mr-1"/>
                                    Reset
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Advanced Filters Panel */}
                {showFilters && (
                    <Card className="mb-6 bg-white border border-gray-200 shadow-sm">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">ALL FILTERS</h3>

                            <div className="grid gap-6">
                                {/* Categories */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Categories
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                        {categoryOptions.map(category => (
                                            <div
                                                key={category}
                                                className={`px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                                                    selectedCategories.includes(category)
                                                        ? 'bg-orange-100 border-orange-300 text-orange-700'
                                                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                                }`}
                                                onClick={() => handleCategoryToggle(category)}
                                            >
                                                <span className="text-sm">{category}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Keywords */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Captions Keywords & Hashtags
                                        </label>
                                        <Input
                                            placeholder="Enter keywords..."
                                            value={captionKeywords}
                                            onChange={(e) => setCaptionKeywords(e.target.value)}
                                            className="border-gray-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Bio Keywords
                                        </label>
                                        <Input
                                            placeholder="Enter keywords..."
                                            value={bioKeywords}
                                            onChange={(e) => setBioKeywords(e.target.value)}
                                            className="border-gray-200"
                                        />
                                    </div>
                                </div>

                                <p className="text-sm text-gray-500 italic">
                                    Note: Profiles matching any of the three — category, keyword, or bio — will be
                                    shown.
                                </p>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4 border-t border-gray-200">
                                    <Button
                                        variant="outline"
                                        onClick={clearAllFilters}
                                        className="flex-1"
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        onClick={() => setShowFilters(false)}
                                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                                    >
                                        <HiStar className="w-4 h-4 mr-2"/>
                                        SHOW PROFILES
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Table View */}
                <Card className="bg-white border border-gray-200 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                    {selectedPlatform === 'youtube' ? 'YouTube Profiles' : `${selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} Profiles`}
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('credibility_score')}
                                >
                                    <div className="flex items-center gap-1">
                                        Credibility Score
                                        <SortIcon column="credibility_score"/>
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('subscribers')}
                                >
                                    <div className="flex items-center gap-1">
                                        Subscribers
                                        <SortIcon column="subscribers"/>
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('avg_likes')}
                                >
                                    <div className="flex items-center gap-1">
                                        Avg Likes
                                        <SortIcon column="avg_likes"/>
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('avg_views')}
                                >
                                    <div className="flex items-center gap-1">
                                        Avg Views
                                        <SortIcon column="avg_views"/>
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('avg_comments')}
                                >
                                    <div className="flex items-center gap-1">
                                        Avg Comments
                                        <SortIcon column="avg_comments"/>
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                    Location
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                    Categories
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                    Actions
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {influencers.map((influencer, index) => (
                                <tr
                                    key={influencer.id}
                                    className="hover:bg-gray-50 transition-colors"
                                    ref={index === influencers.length - 1 ? lastInfluencerElementRef : null}
                                >
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full overflow-hidden">
                                                {influencer.profile_image ? (
                                                    <img
                                                        src={influencer.profile_image}
                                                        alt={influencer.full_name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div
                                                        className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                                                        {influencer.full_name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-gray-900">{influencer.full_name}</h3>
                                                    {influencer.is_verified && (
                                                        <HiCheckBadge className="w-4 h-4 text-blue-500"/>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500">@{influencer.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                      <span className="font-medium text-gray-900">
                        {influencer.influence_score?.toFixed(2) || "N/A"}
                      </span>
                                    </td>
                                    <td className="px-4 py-4">
                      <span className="font-medium text-gray-900">
                        {formatNumber(influencer.total_followers)}
                      </span>
                                    </td>
                                    <td className="px-4 py-4">
                      <span className="font-medium text-gray-900">
                        {formatNumber(influencer.avg_likes || 0)}
                      </span>
                                    </td>
                                    <td className="px-4 py-4">
                      <span className="font-medium text-gray-900">
                        {formatNumber(influencer.avg_views || 0)}
                      </span>
                                    </td>
                                    <td className="px-4 py-4">
                      <span className="font-medium text-gray-900">
                        {formatNumber(influencer.avg_comments || 0)}
                      </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-gray-600">{influencer.location}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {influencer.categories?.slice(0, 2).map(category => (
                                                <Badge key={category} variant="secondary" className="text-xs">
                                                    {category}
                                                </Badge>
                                            ))}
                                            {influencer.categories && influencer.categories.length > 2 && (
                                                <Badge variant="secondary" className="text-xs">
                                                    +{influencer.categories.length - 2} more
                                                </Badge>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedInfluencer(influencer)}
                                                    >
                                                        <HiEye className="w-4 h-4"/>
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-4xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Influencer Profile</DialogTitle>
                                                    </DialogHeader>
                                                    {selectedInfluencer && (
                                                        <div className="space-y-6">
                                                            {/* Profile Header */}
                                                            <div className="flex items-start gap-4">
                                                                <div
                                                                    className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full overflow-hidden">
                                                                    {selectedInfluencer.profile_image ? (
                                                                        <img
                                                                            src={selectedInfluencer.profile_image}
                                                                            alt={selectedInfluencer.full_name}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div
                                                                            className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-xl">
                                                                            {selectedInfluencer.full_name.charAt(0)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <h2 className="text-xl font-bold text-gray-900">{selectedInfluencer.full_name}</h2>
                                                                        {selectedInfluencer.is_verified && (
                                                                            <HiCheckBadge
                                                                                className="w-5 h-5 text-blue-500"/>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-gray-600 mb-2">@{selectedInfluencer.username}</p>
                                                                    <p className="text-sm text-gray-500">{selectedInfluencer.bio}</p>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleBookmark(selectedInfluencer.id)}
                                                                    >
                                                                        <HiBookmark className="w-4 h-4 mr-1"/>
                                                                        Bookmark
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleAddToCampaign(selectedInfluencer)}
                                                                    >
                                                                        <HiPlus className="w-4 h-4 mr-1"/>
                                                                        Add to Campaign
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            {/* Stats Grid */}
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                <div className="bg-blue-50 p-4 rounded-lg">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <HiPlay className="w-4 h-4 text-blue-600"/>
                                                                        <span
                                                                            className="text-sm text-blue-600">Subscribers</span>
                                                                    </div>
                                                                    <p className="text-xl font-bold text-blue-900">
                                                                        {formatNumber(selectedInfluencer.total_followers)}
                                                                    </p>
                                                                </div>
                                                                <div className="bg-green-50 p-4 rounded-lg">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <HiHeart className="w-4 h-4 text-green-600"/>
                                                                        <span className="text-sm text-green-600">Avg Likes</span>
                                                                    </div>
                                                                    <p className="text-xl font-bold text-green-900">
                                                                        {formatNumber(selectedInfluencer.avg_likes || 0)}
                                                                    </p>
                                                                </div>
                                                                <div className="bg-purple-50 p-4 rounded-lg">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <HiEye className="w-4 h-4 text-purple-600"/>
                                                                        <span className="text-sm text-purple-600">Avg Views</span>
                                                                    </div>
                                                                    <p className="text-xl font-bold text-purple-900">
                                                                        {formatNumber(selectedInfluencer.avg_views || 0)}
                                                                    </p>
                                                                </div>
                                                                <div className="bg-orange-50 p-4 rounded-lg">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <HiChatBubbleLeftRight
                                                                            className="w-4 h-4 text-orange-600"/>
                                                                        <span className="text-sm text-orange-600">Avg Comments</span>
                                                                    </div>
                                                                    <p className="text-xl font-bold text-orange-900">
                                                                        {formatNumber(selectedInfluencer.avg_comments || 0)}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Contact Actions */}
                                                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => handleContact(selectedInfluencer)}
                                                                    className="flex-1"
                                                                >
                                                                    <HiEnvelope className="w-4 h-4 mr-2"/>
                                                                    Message
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => handleContact(selectedInfluencer)}
                                                                    className="flex-1"
                                                                >
                                                                    <HiPhone className="w-4 h-4 mr-2"/>
                                                                    Contact
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => window.open(`https://${selectedPlatform}.com/${selectedInfluencer.username}`, '_blank')}
                                                                    className="flex-1"
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
                                                onClick={() => handleBookmark(influencer.id)}
                                            >
                                                <HiBookmark className="w-4 h-4"/>
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleContact(influencer)}
                                            >
                                                <HiEnvelope className="w-4 h-4"/>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center py-8">
                        <GlobalLoader/>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && influencers.length === 0 && (
                    <Card className="p-12 text-center bg-white border border-gray-200 shadow-sm">
                        <div
                            className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <HiMagnifyingGlass className="w-8 h-8 text-gray-400"/>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No influencers found</h3>
                        <p className="text-gray-500 mb-4">
                            Try adjusting your search criteria or filters to find more creators.
                        </p>
                        <Button variant="outline" onClick={clearAllFilters}>
                            <HiArrowPath className="w-4 h-4 mr-2"/>
                            Reset All Filters
                        </Button>
                    </Card>
                )}

                {/* Right Sidebar - Promotional Content */}
                <div
                    className="fixed right-4 top-1/2 transform -translate-y-1/2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 hidden xl:block">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Improve your efficiency with our
                        platform!</h3>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <HiUserPlus className="w-4 h-4 text-blue-600"/>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 text-sm">Add Influencers</h4>
                                <p className="text-xs text-gray-500">Maybe a way to communicate plan & list
                                    hierarchy.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <HiStar className="w-4 h-4 text-green-600"/>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 text-sm">Get Costs</h4>
                                <p className="text-xs text-gray-500">Reach out to influencers & get their updated
                                    costs.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <HiArrowPath className="w-4 h-4 text-purple-600"/>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 text-sm">Download Lists</h4>
                                <p className="text-xs text-gray-500">Download influencer lists with their metrics on an
                                    excel sheet!</p>
                            </div>
                        </div>
                    </div>

                    <Button className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white">
                        <HiPlus className="w-4 h-4 mr-2"/>
                        Create List
                    </Button>
                </div>
            </div>
        </div>
    );
}
