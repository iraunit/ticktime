"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  HiMagnifyingGlass, 
  HiAdjustmentsHorizontal, 
  HiBookmark,
  HiEye,
  HiUserPlus,
  HiCheckBadge,
  HiXMark,
  HiFunnel,
  HiArrowPath,
  HiStar,
  HiMapPin
} from "react-icons/hi2";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { LoadingSpinner, CardSkeletonLoader } from "@/components/ui/loading-spinner";

// Platform icons mapping
const platformIcons: { [key: string]: string } = {
  instagram: "📷",
  youtube: "📺", 
  tiktok: "🎵",
  twitter: "🐦",
  linkedin: "💼",
  facebook: "👥"
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
  rate_per_reel?: number;
  rate_per_story?: number;
  languages?: string[];
}

const industryOptions = [
  { value: "all", label: "All Industries" },
  { value: "fashion_beauty", label: "Fashion & Beauty" },
  { value: "tech_gaming", label: "Tech & Gaming" },
  { value: "fitness_health", label: "Fitness & Health" },
  { value: "food_lifestyle", label: "Food & Lifestyle" },
  { value: "travel", label: "Travel & Adventure" },
  { value: "business_finance", label: "Business & Finance" },
  { value: "entertainment", label: "Entertainment" },
  { value: "education", label: "Education" },
  { value: "parenting_family", label: "Parenting & Family" },
];

const platformOptions = [
  { value: "instagram", label: "Instagram", color: "from-pink-500 to-red-500" },
  { value: "youtube", label: "YouTube", color: "from-red-500 to-red-600" },
  { value: "tiktok", label: "TikTok", color: "from-black to-gray-800" },
  { value: "twitter", label: "Twitter", color: "from-blue-400 to-blue-500" },
  { value: "linkedin", label: "LinkedIn", color: "from-blue-600 to-blue-700" },
  { value: "facebook", label: "Facebook", color: "from-blue-500 to-blue-600" },
];

const locationOptions = [
  "All Locations",
  "Mumbai, India",
  "Delhi, India", 
  "Bangalore, India",
  "Chennai, India",
  "Kolkata, India",
  "Pune, India",
  "Hyderabad, India",
  "USA",
  "UK",
  "Canada",
  "Australia"
];

export default function InfluencerSearchPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Enhanced filter states
  const [industryFilter, setIndustryFilter] = useState("all");
  const [followerRange, setFollowerRange] = useState([1000, 5000000]);
  const [engagementRange, setEngagementRange] = useState([1, 15]);
  const [rateRange, setRateRange] = useState([1000, 100000]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [exclusivePlatform, setExclusivePlatform] = useState("all");
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [minRating, setMinRating] = useState(0);
  const [minCollaborations, setMinCollaborations] = useState(0);
  const [sortBy, setSortBy] = useState("relevance");

  // Load influencers from API
  const fetchInfluencers = async () => {
    setIsLoading(true);
    try {
              const response = await api.get('/influencers/search/', {
        params: {
          search: searchTerm,
          industry: industryFilter !== 'all' ? industryFilter : undefined,
          min_followers: followerRange[0],
          max_followers: followerRange[1],
          min_engagement: engagementRange[0],
          max_engagement: engagementRange[1],
          min_rate: rateRange[0],
          max_rate: rateRange[1],
          verified_only: verifiedOnly,
          platforms: platforms.length > 0 ? platforms.join(',') : undefined,
          exclusive_platform: exclusivePlatform !== 'all' ? exclusivePlatform : undefined,
          location: locationFilter !== 'All Locations' ? locationFilter : undefined,
          min_rating: minRating > 0 ? minRating : undefined,
          min_collaborations: minCollaborations > 0 ? minCollaborations : undefined,
          sort_by: sortBy,
        }
      });
      setInfluencers(response.data.results || []);
    } catch (error) {
      console.error('Failed to fetch influencers:', error);
      toast.error('Failed to load influencers. Please try again.');
      setInfluencers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInfluencers();
  }, [searchTerm, industryFilter, followerRange, engagementRange, rateRange, verifiedOnly, platforms, exclusivePlatform, locationFilter, minRating, minCollaborations, sortBy]);

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const hasActiveFilters = useMemo(() => {
    return searchTerm !== "" || 
           industryFilter !== "all" || 
           followerRange[0] !== 1000 || 
           followerRange[1] !== 5000000 ||
           engagementRange[0] !== 1 || 
           engagementRange[1] !== 15 ||
           rateRange[0] !== 1000 || 
           rateRange[1] !== 100000 ||
           verifiedOnly || 
           platforms.length > 0 ||
           exclusivePlatform !== "all" ||
           locationFilter !== "All Locations" ||
           minRating > 0 ||
           minCollaborations > 0 ||
           sortBy !== "relevance";
  }, [searchTerm, industryFilter, followerRange, engagementRange, rateRange, verifiedOnly, platforms, exclusivePlatform, locationFilter, minRating, minCollaborations, sortBy]);

  const clearAllFilters = () => {
    setSearchTerm("");
    setIndustryFilter("all");
    setFollowerRange([1000, 5000000]);
    setEngagementRange([1, 15]);
    setRateRange([1000, 100000]);
    setVerifiedOnly(false);
    setPlatforms([]);
    setExclusivePlatform("all");
    setLocationFilter("All Locations");
    setMinRating(0);
    setMinCollaborations(0);
    setSortBy("relevance");
  };

  const handlePlatformToggle = (platform: string) => {
    setPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        {/* Header */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-green-500/5 rounded-xl -m-2"></div>
          
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-1">
                Discover Influencers
              </h1>
              <p className="text-sm text-gray-600 max-w-2xl">
                Find the perfect creators for your campaigns with advanced filtering and comprehensive profiles.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-500">Found</p>
                <p className="text-xs font-medium text-gray-700">
                  {influencers.length} influencers
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 rounded-lg px-4 py-2"
              >
                <HiAdjustmentsHorizontal className="h-4 w-4 mr-1" />
                Filters
                {hasActiveFilters && (
                  <Badge className="ml-2 bg-purple-100 text-purple-800 px-1.5 py-0.5 text-xs">
                    Active
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <Card className="mb-6 bg-gradient-to-br from-white via-white to-gray-50 border border-gray-200 shadow-md">
          <div className="p-4">
            {/* Search Bar */}
            <div className="relative mb-4">
              <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by name, username, bio, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base border-gray-200 focus:border-purple-300 focus:ring-purple-200"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-gray-100"
                >
                  <HiXMark className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Quick Sort */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <HiFunnel className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Sort by:</span>
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="followers_desc">Most Followers</SelectItem>
                    <SelectItem value="followers_asc">Least Followers</SelectItem>
                    <SelectItem value="engagement_desc">Highest Engagement</SelectItem>
                    <SelectItem value="engagement_asc">Lowest Engagement</SelectItem>
                    <SelectItem value="rating_desc">Highest Rated</SelectItem>
                    <SelectItem value="rate_asc">Lowest Rates</SelectItem>
                    <SelectItem value="rate_desc">Highest Rates</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                >
                  <HiXMark className="h-4 w-4 mr-1" />
                  Clear All Filters
                </Button>
              )}
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="pt-4 border-t border-gray-200">
                <div className="grid gap-6">
                  {/* Platform-Specific Filters */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                      Platform Filters
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Multi-Platform Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Active Platforms (Any of selected)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {platformOptions.map(platform => (
                            <div 
                              key={platform.value}
                              className={`relative cursor-pointer transition-all duration-200 rounded-lg border-2 p-3 ${
                                platforms.includes(platform.value)
                                  ? `bg-gradient-to-r ${platform.color} text-white border-transparent shadow-md`
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                              onClick={() => handlePlatformToggle(platform.value)}
                            >
                              <div className="flex items-center space-x-2">
                                <div className="text-lg">{platformIcons[platform.value]}</div>
                                <span className="text-sm font-medium">{platform.label}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Exclusive Platform Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Platform Exclusivity (Only this platform)
                        </label>
                        <Select value={exclusivePlatform} onValueChange={setExclusivePlatform}>
                          <SelectTrigger className="border-gray-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Platforms</SelectItem>
                            {platformOptions.map(platform => (
                              <SelectItem key={platform.value} value={platform.value}>
                                {platformIcons[platform.value]} {platform.label} Only
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Audience & Engagement Filters */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-1 h-5 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
                      Audience & Engagement
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Followers Range */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Followers: {formatFollowers(followerRange[0])} - {formatFollowers(followerRange[1])}
                        </label>
                        <Slider
                          value={followerRange}
                          onValueChange={setFollowerRange}
                          max={5000000}
                          min={1000}
                          step={1000}
                          className="w-full"
                        />
                      </div>

                      {/* Engagement Range */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Engagement: {engagementRange[0]}% - {engagementRange[1]}%
                        </label>
                        <Slider
                          value={engagementRange}
                          onValueChange={setEngagementRange}
                          max={15}
                          min={0.1}
                          step={0.1}
                          className="w-full"
                        />
                      </div>

                      {/* Rate Range */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rate: {formatCurrency(rateRange[0])} - {formatCurrency(rateRange[1])}
                        </label>
                        <Slider
                          value={rateRange}
                          onValueChange={setRateRange}
                          max={100000}
                          min={1000}
                          step={1000}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quality & Location Filters */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                      Quality & Location
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Industry */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Industry
                        </label>
                        <Select value={industryFilter} onValueChange={setIndustryFilter}>
                          <SelectTrigger className="border-gray-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {industryOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Location */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location
                        </label>
                        <Select value={locationFilter} onValueChange={setLocationFilter}>
                          <SelectTrigger className="border-gray-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {locationOptions.map(location => (
                              <SelectItem key={location} value={location}>
                                {location}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Min Rating */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum Rating: {minRating > 0 ? minRating : 'Any'}
                        </label>
                        <Slider
                          value={[minRating]}
                          onValueChange={(value) => setMinRating(value[0])}
                          max={5}
                          min={0}
                          step={0.5}
                          className="w-full"
                        />
                      </div>

                      {/* Min Collaborations */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Min Collaborations: {minCollaborations > 0 ? minCollaborations : 'Any'}
                        </label>
                        <Slider
                          value={[minCollaborations]}
                          onValueChange={(value) => setMinCollaborations(value[0])}
                          max={50}
                          min={0}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Verified Only Checkbox */}
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="verified"
                        checked={verifiedOnly}
                        onCheckedChange={(checked) => setVerifiedOnly(checked === true)}
                      />
                      <label htmlFor="verified" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <HiCheckBadge className="w-4 h-4 text-blue-500" />
                        Verified accounts only
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeletonLoader key={i} />
            ))}
          </div>
        )}

        {/* Influencer Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {influencers.map((influencer) => (
              <Card 
                key={influencer.id} 
                className="p-6 bg-gradient-to-br from-white via-white to-gray-50 border border-gray-200 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full overflow-hidden">
                      {influencer.profile_image ? (
                        <img
                          src={influencer.profile_image}
                          alt={influencer.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                          {influencer.full_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">@{influencer.username}</h3>
                        {influencer.is_verified && (
                          <HiCheckBadge className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{influencer.full_name}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="hover:bg-red-50 hover:text-red-600">
                    <HiBookmark className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{influencer.bio}</p>

                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg">
                      <p className="text-gray-500 text-xs">Followers</p>
                      <p className="font-bold text-blue-600">{formatFollowers(influencer.total_followers)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg">
                      <p className="text-gray-500 text-xs">Engagement</p>
                      <p className="font-bold text-green-600">{influencer.avg_engagement}%</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-3 rounded-lg">
                      <p className="text-gray-500 text-xs">Collaborations</p>
                      <p className="font-bold text-purple-600">{influencer.collaboration_count}</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-3 rounded-lg">
                      <p className="text-gray-500 text-xs">Rating</p>
                      <p className="font-bold text-orange-600 flex items-center">
                        <HiStar className="w-3 h-3 mr-1" />
                        {influencer.avg_rating}
                      </p>
                    </div>
                  </div>

                  {/* Platform Tags */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs bg-gradient-to-r from-gray-100 to-gray-200">
                      {industryOptions.find(i => i.value === influencer.industry)?.label || influencer.industry}
                    </Badge>
                    {influencer.platforms.map(platform => (
                      <Badge 
                        key={platform} 
                        variant="outline" 
                        className="text-xs border-gray-300"
                      >
                        {platformIcons[platform]} {platform}
                      </Badge>
                    ))}
                  </div>

                  {/* Location & Rate */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <HiMapPin className="w-3 h-3" />
                      {influencer.location}
                    </div>
                    {influencer.rate_per_post && (
                      <div className="font-medium text-gray-700">
                        From {formatCurrency(influencer.rate_per_post)}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md">
                      <HiUserPlus className="w-4 h-4 mr-1" />
                      Invite
                    </Button>
                    <Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-50">
                      <HiEye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && influencers.length === 0 && (
          <Card className="p-12 text-center bg-gradient-to-br from-white via-white to-gray-50 border border-gray-200 shadow-md">
            <LoadingSpinner size="lg" text="No influencers found" />
            <div className="mt-8">
              <p className="text-gray-500 mb-4">
                Try adjusting your search criteria or filters to find more creators.
              </p>
              <Button variant="outline" onClick={clearAllFilters} className="border-blue-200 hover:bg-blue-50 hover:border-blue-300">
                <HiArrowPath className="w-4 h-4 mr-2" />
                Reset All Filters
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
} 