"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  HiMagnifyingGlass, 
  HiBookmark,
  HiEye,
  HiUserPlus,
  HiCheckBadge,
  HiArrowPath,
  HiStar,
  HiMapPin,
  HiPlay,
  HiHeart,
  HiChatBubbleLeftRight,
  HiEnvelope,
  HiPhone,
  HiGlobeAlt,
  HiPlus,
  HiChevronDown,
  HiChevronUp,
  HiAdjustmentsHorizontal,
  HiFunnel,
  HiSparkles,
  HiUsers,
  HiClock,
  HiCalendar
} from "react-icons/hi2";
import { HiX } from "react-icons/hi";
import { 
  FaYoutube, 
  FaInstagram, 
  FaTiktok, 
  FaTwitter, 
  FaFacebook, 
  FaLinkedin, 
  FaSnapchat, 
  FaPinterest 
} from "react-icons/fa";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { GlobalLoader } from "@/components/ui/global-loader";

// Platform configuration with real icons
const platformConfig = {
  youtube: { 
    icon: FaYoutube, 
    color: "text-red-600", 
    bg: "bg-red-50", 
    border: "border-red-200",
    gradient: "from-red-500 to-red-600"
  },
  instagram: { 
    icon: FaInstagram, 
    color: "text-pink-600", 
    bg: "bg-pink-50", 
    border: "border-pink-200",
    gradient: "from-pink-500 to-purple-500"
  },
  tiktok: { 
    icon: FaTiktok, 
    color: "text-gray-800", 
    bg: "bg-gray-50", 
    border: "border-gray-200",
    gradient: "from-gray-800 to-gray-900"
  },
  twitter: { 
    icon: FaTwitter, 
    color: "text-blue-500", 
    bg: "bg-blue-50", 
    border: "border-blue-200",
    gradient: "from-blue-400 to-blue-500"
  },
  facebook: { 
    icon: FaFacebook, 
    color: "text-blue-600", 
    bg: "bg-blue-50", 
    border: "border-blue-200",
    gradient: "from-blue-600 to-blue-700"
  },
  linkedin: { 
    icon: FaLinkedin, 
    color: "text-blue-700", 
    bg: "bg-blue-50", 
    border: "border-blue-200",
    gradient: "from-blue-700 to-blue-800"
  },
  snapchat: { 
    icon: FaSnapchat, 
    color: "text-yellow-500", 
    bg: "bg-yellow-50", 
    border: "border-yellow-200",
    gradient: "from-yellow-400 to-yellow-500"
  },
  pinterest: { 
    icon: FaPinterest, 
    color: "text-red-500", 
    bg: "bg-red-50", 
    border: "border-red-200",
    gradient: "from-red-500 to-red-600"
  }
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
}

// Real categories from your backend
const categoryOptions = [
  "Fashion", "Beauty", "Fitness", "Health", "Food", "Cooking", "Travel", 
  "Lifestyle", "Technology", "Gaming", "Music", "Dance", "Comedy", 
  "Education", "Business", "Finance", "Parenting", "Pets", "Sports", 
  "Art", "Photography", "Entertainment", "News", "Politics", "Other"
];

const followerRanges = [
  { label: "All Followers", min: 0, max: 999999999 },
  { label: "1K - 10K", min: 1000, max: 10000 },
  { label: "10K - 50K", min: 10000, max: 50000 },
  { label: "50K - 100K", min: 50000, max: 100000 },
  { label: "100K - 500K", min: 100000, max: 500000 },
  { label: "500K - 1M", min: 500000, max: 1000000 },
  { label: "1M - 5M", min: 1000000, max: 5000000 },
  { label: "5M+", min: 5000000, max: 999999999 }
];

const industryOptions = [
  "Fashion & Beauty", "Food & Lifestyle", "Tech & Gaming", "Fitness & Health",
  "Travel", "Entertainment", "Education", "Business & Finance", "Other"
];

export default function InfluencerSearchPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  
  // Filter states
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [locationFilter, setLocationFilter] = useState("All");
  const [genderFilter, setGenderFilter] = useState("All");
  const [followerRange, setFollowerRange] = useState("All Followers");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState("All");
  const [sortBy, setSortBy] = useState("followers");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  const observer = useRef<IntersectionObserver>();

  // Infinite scroll setup
  const lastInfluencerElementRef = useCallback((node: HTMLTableRowElement | null) => {
    if (isLoading || typeof window === 'undefined') return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage((prevPage) => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, page]);

  // Load influencers from API
  const fetchInfluencers = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setIsLoading(true);
    
    try {
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
      
      const newInfluencers = response.data.results || [];
      setInfluencers(prev => append ? [...prev, ...newInfluencers] : newInfluencers);
      setHasMore(newInfluencers.length === 20);
    } catch (error: any) {
      console.error('Failed to fetch influencers:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        status: error?.response?.status,
        data: error?.response?.data,
        url: error?.config?.url,
        params: error?.config?.params
      });
      toast.error('Failed to load influencers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedPlatform, locationFilter, genderFilter, followerRange, selectedCategories, selectedIndustry, sortBy, sortOrder]);

  // Bookmark influencer
  const handleBookmark = async (influencerId: number) => {
    try {
      const response = await api.post(`/influencers/bookmark/${influencerId}/`);
      if (response.data.is_bookmarked) {
        toast.success("Influencer bookmarked successfully!");
      } else {
        toast.success("Influencer removed from bookmarks!");
      }
      // Refresh the list to update bookmark status
      fetchInfluencers(1, false);
    } catch (error) {
      console.error('Failed to bookmark influencer:', error);
      toast.error('Failed to bookmark influencer. Please try again.');
    }
  };

  useEffect(() => {
    setPage(1);
    fetchInfluencers(1, false);
  }, [fetchInfluencers]);

  useEffect(() => {
    if (page > 1) {
      fetchInfluencers(page, true);
    }
  }, [page, fetchInfluencers]);

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

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <HiChevronDown className="w-4 h-4 text-gray-400" />;
    return sortOrder === "asc" ? <HiChevronUp className="w-4 h-4" /> : <HiChevronDown className="w-4 h-4" />;
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

  const handleAddToCampaign = (influencer: Influencer) => {
    toast.success(`${influencer.full_name} added to campaign!`);
  };

  const PlatformIcon = ({ platform }: { platform: string }) => {
    const config = platformConfig[platform as keyof typeof platformConfig];
    if (!config) return null;
    
    const IconComponent = config.icon;
    return (
      <div className={`w-8 h-8 ${config.bg} ${config.border} border rounded-lg flex items-center justify-center`}>
        <IconComponent className={`w-4 h-4 ${config.color}`} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Discover Creators
              </h1>
              <p className="text-gray-600 max-w-2xl">
                Find the perfect influencers for your brand. Filter by platform, audience size, and content categories to discover creators who align with your campaign goals.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-gray-500">Found</p>
                <p className="text-lg font-semibold text-gray-900">
                  {influencers.length} creators
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="border-2 border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200"
              >
                <HiFunnel className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <Badge className="ml-2 bg-indigo-100 text-indigo-800 px-2 py-0.5 text-xs">
                    Active
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Quick Filters */}
        <Card className="mb-6 bg-white border-2 border-gray-100 shadow-lg">
          <div className="p-6">
            {/* Search Bar */}
            <div className="relative mb-6">
              <HiMagnifyingGlass className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search creators by name, username, or content keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 text-lg border-2 border-gray-200 focus:border-indigo-300 focus:ring-indigo-200 rounded-xl"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:bg-gray-100 rounded-full"
                >
                  <HiX className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Quick Filters Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Platform Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Platform</label>
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger className="border-2 border-gray-200 hover:border-indigo-300">
                    <SelectValue placeholder="All Platforms" />
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Industry</label>
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger className="border-2 border-gray-200 hover:border-indigo-300">
                    <SelectValue placeholder="All Industries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Industries</SelectItem>
                    {industryOptions.map(industry => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Followers */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Followers</label>
                <Select value={followerRange} onValueChange={setFollowerRange}>
                  <SelectTrigger className="border-2 border-gray-200 hover:border-indigo-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {followerRanges.map(range => (
                      <SelectItem key={range.label} value={range.label}>{range.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="border-2 border-gray-200 hover:border-indigo-300">
                    <SelectValue />
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">&nbsp;</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllFilters}
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  >
                    <HiX className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <Card className="mb-6 bg-white border-2 border-gray-100 shadow-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <HiSparkles className="w-5 h-5 text-indigo-600" />
                  Advanced Filters
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                >
                  <HiX className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid gap-6">
                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Content Categories
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {categoryOptions.map(category => (
                      <div
                        key={category}
                        className={`px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedCategories.includes(category)
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleCategoryToggle(category)}
                      >
                        <span className="text-sm font-medium">{category}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Filters */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Location</label>
                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                      <SelectTrigger className="border-2 border-gray-200">
                        <SelectValue />
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Gender</label>
                    <Select value={genderFilter} onValueChange={setGenderFilter}>
                      <SelectTrigger className="border-2 border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Sort Order</label>
                    <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
                      <SelectTrigger className="border-2 border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Highest First</SelectItem>
                        <SelectItem value="asc">Lowest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="flex-1"
                  >
                    Reset All
                  </Button>
                  <Button
                    onClick={() => setShowFilters(false)}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  >
                    <HiSparkles className="w-4 h-4 mr-2" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Table View */}
        <Card className="bg-white border-2 border-gray-100 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Creator Profile
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort('rating')}
                  >
                    <div className="flex items-center gap-2">
                      <HiStar className="w-4 h-4 text-yellow-500" />
                      Rating
                      <SortIcon column="rating" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort('followers')}
                  >
                    <div className="flex items-center gap-2">
                      <HiUsers className="w-4 h-4 text-blue-500" />
                      Followers
                      <SortIcon column="followers" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort('engagement')}
                  >
                    <div className="flex items-center gap-2">
                      <HiHeart className="w-4 h-4 text-red-500" />
                      Engagement
                      <SortIcon column="engagement" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort('posts')}
                  >
                    <div className="flex items-center gap-2">
                      <HiPlay className="w-4 h-4 text-green-500" />
                      Posts
                      <SortIcon column="posts" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      <HiMapPin className="w-4 h-4 text-purple-500" />
                      Location
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Categories
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {influencers.map((influencer, index) => (
                  <tr 
                    key={influencer.id} 
                    className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200"
                    ref={index === influencers.length - 1 ? lastInfluencerElementRef : null}
                  >
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full overflow-hidden border-2 border-white shadow-lg">
                            {influencer.profile_image ? (
                              <img
                                src={influencer.profile_image}
                                alt={influencer.full_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                                {influencer.full_name.charAt(0)}
                              </div>
                            )}
                          </div>
                          {influencer.is_verified && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center">
                              <HiCheckBadge className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">{influencer.full_name}</h3>
                          </div>
                          <p className="text-sm text-gray-500 mb-2">@{influencer.username}</p>
                          <div className="flex items-center gap-2">
                            {influencer.platforms.slice(0, 3).map(platform => (
                              <PlatformIcon key={platform} platform={platform} />
                            ))}
                            {influencer.platforms.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{influencer.platforms.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <HiStar className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="font-semibold text-gray-900">
                          {influencer.avg_rating?.toFixed(1) || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="font-semibold text-gray-900">
                        {formatNumber(influencer.total_followers)}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <span className="font-semibold text-gray-900">
                        {influencer.engagement_rate?.toFixed(1) || influencer.avg_engagement?.toFixed(1) || "N/A"}%
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <span className="font-semibold text-gray-900">
                        {formatNumber(influencer.posts_count || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <span className="text-gray-600">{influencer.location || "N/A"}</span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-wrap gap-1">
                        {influencer.categories?.slice(0, 2).map(category => (
                          <Badge key={category} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                            {category}
                          </Badge>
                        ))}
                        {influencer.categories && influencer.categories.length > 2 && (
                          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                            +{influencer.categories.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedInfluencer(influencer)}
                              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                            >
                              <HiEye className="w-4 h-4 mr-1" />
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
                                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full overflow-hidden border-4 border-white shadow-xl">
                                      {selectedInfluencer.profile_image ? (
                                        <img
                                          src={selectedInfluencer.profile_image}
                                          alt={selectedInfluencer.full_name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-3xl">
                                          {selectedInfluencer.full_name.charAt(0)}
                                        </div>
                                      )}
                                    </div>
                                    {selectedInfluencer.is_verified && (
                                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 border-4 border-white rounded-full flex items-center justify-center">
                                        <HiCheckBadge className="w-4 h-4 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                      <h2 className="text-2xl font-bold text-gray-900">{selectedInfluencer.full_name}</h2>
                                    </div>
                                    <p className="text-gray-600 mb-3">@{selectedInfluencer.username}</p>
                                    <p className="text-gray-700 mb-4">{selectedInfluencer.bio || "No bio available"}</p>
                                    <div className="flex items-center gap-3">
                                      {selectedInfluencer.platforms.map(platform => (
                                        <PlatformIcon key={platform} platform={platform} />
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex gap-3">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleBookmark(selectedInfluencer.id)}
                                      className={selectedInfluencer.is_bookmarked ? "bg-blue-50 border-blue-200 text-blue-700" : ""}
                                    >
                                      <HiBookmark className={`w-4 h-4 mr-1 ${selectedInfluencer.is_bookmarked ? "fill-current" : ""}`} />
                                      {selectedInfluencer.is_bookmarked ? "Bookmarked" : "Bookmark"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleAddToCampaign(selectedInfluencer)}
                                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                                    >
                                      <HiPlus className="w-4 h-4 mr-1" />
                                      Add to Campaign
                                    </Button>
                                  </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                                    <div className="flex items-center gap-2 mb-2">
                                      <HiUsers className="w-5 h-5 text-blue-600" />
                                      <span className="text-sm font-medium text-blue-700">Followers</span>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-900">
                                      {formatNumber(selectedInfluencer.total_followers)}
                                    </p>
                                  </div>
                                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                                    <div className="flex items-center gap-2 mb-2">
                                      <HiHeart className="w-5 h-5 text-green-600" />
                                      <span className="text-sm font-medium text-green-700">Engagement</span>
                                    </div>
                                    <p className="text-2xl font-bold text-green-900">
                                      {selectedInfluencer.engagement_rate?.toFixed(1) || selectedInfluencer.avg_engagement?.toFixed(1) || "N/A"}%
                                    </p>
                                  </div>
                                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                                    <div className="flex items-center gap-2 mb-2">
                                      <HiPlay className="w-5 h-5 text-purple-600" />
                                      <span className="text-sm font-medium text-purple-700">Posts</span>
                                    </div>
                                    <p className="text-2xl font-bold text-purple-900">
                                      {formatNumber(selectedInfluencer.posts_count || 0)}
                                    </p>
                                  </div>
                                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
                                    <div className="flex items-center gap-2 mb-2">
                                      <HiStar className="w-5 h-5 text-yellow-600 fill-current" />
                                      <span className="text-sm font-medium text-yellow-700">Rating</span>
                                    </div>
                                    <p className="text-2xl font-bold text-yellow-900">
                                      {selectedInfluencer.avg_rating?.toFixed(1) || "N/A"}
                                    </p>
                                  </div>
                                </div>

                                {/* Contact Actions */}
                                <div className="flex gap-3 pt-6 border-t border-gray-200">
                                  <Button
                                    variant="outline"
                                    onClick={() => handleContact(selectedInfluencer)}
                                    className="flex-1 border-2 border-green-200 text-green-700 hover:bg-green-50"
                                  >
                                    <HiEnvelope className="w-4 h-4 mr-2" />
                                    Send Message
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => handleContact(selectedInfluencer)}
                                    className="flex-1 border-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                                  >
                                    <HiPhone className="w-4 h-4 mr-2" />
                                    Contact
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => window.open(`https://${selectedInfluencer.platform_handle}`, '_blank')}
                                    className="flex-1 border-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                                  >
                                    <HiGlobeAlt className="w-4 h-4 mr-2" />
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
                          className={influencer.is_bookmarked ? "text-blue-600" : ""}
                        >
                          <HiBookmark className={`w-4 h-4 ${influencer.is_bookmarked ? "fill-current" : ""}`} />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleContact(influencer)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <HiEnvelope className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddToCampaign(influencer)}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          <HiPlus className="w-4 h-4" />
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
            <GlobalLoader />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && influencers.length === 0 && (
          <Card className="p-12 text-center bg-white border-2 border-gray-100 shadow-lg">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <HiSparkles className="w-10 h-10 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No creators found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Try adjusting your search criteria or filters to discover amazing creators for your campaigns.
            </p>
            <Button 
              variant="outline" 
              onClick={clearAllFilters}
              className="border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              <HiArrowPath className="w-4 h-4 mr-2" />
              Reset All Filters
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
} 