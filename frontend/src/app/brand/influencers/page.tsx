"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  HiMagnifyingGlass, 
  HiAdjustmentsHorizontal, 
  HiBookmark,
  HiEye,
  HiUserPlus,
  HiCheckBadge
} from "react-icons/hi2";

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
}

export default function InfluencerSearchPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [industryFilter, setIndustryFilter] = useState("all");
  const [followerRange, setFollowerRange] = useState([1000, 1000000]);
  const [engagementRange, setEngagementRange] = useState([1, 10]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [platforms, setPlatforms] = useState<string[]>([]);

  useEffect(() => {
    // TODO: Replace with actual API call
    const fetchInfluencers = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        setTimeout(() => {
          setInfluencers([
            {
              id: 1,
              username: "fashion_guru_sarah",
              full_name: "Sarah Johnson",
              industry: "fashion_beauty",
              bio: "Fashion enthusiast sharing daily style tips and beauty secrets. Collaborate with sustainable brands.",
              profile_image: "/api/placeholder/150/150",
              is_verified: true,
              total_followers: 125000,
              avg_engagement: 4.2,
              collaboration_count: 15,
              avg_rating: 4.8,
              platforms: ["instagram", "tiktok", "youtube"],
              location: "New York, USA"
            },
            {
              id: 2,
              username: "tech_reviewer_mike",
              full_name: "Mike Chen",
              industry: "tech_gaming",
              bio: "Tech reviewer and gadget enthusiast. Honest reviews of the latest technology products.",
              profile_image: "/api/placeholder/150/150",
              is_verified: true,
              total_followers: 89000,
              avg_engagement: 5.1,
              collaboration_count: 23,
              avg_rating: 4.6,
              platforms: ["youtube", "twitter"],
              location: "San Francisco, USA"
            },
            {
              id: 3,
              username: "fitness_life_anna",
              full_name: "Anna Rodriguez",
              industry: "fitness_health",
              bio: "Certified personal trainer sharing workout routines, nutrition tips, and wellness advice.",
              profile_image: "/api/placeholder/150/150",
              is_verified: false,
              total_followers: 45000,
              avg_engagement: 6.8,
              collaboration_count: 8,
              avg_rating: 4.9,
              platforms: ["instagram", "youtube"],
              location: "Los Angeles, USA"
            }
          ]);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        setIsLoading(false);
      }
    };

    fetchInfluencers();
  }, []);

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getPlatformIcon = (platform: string) => {
    // You would typically use actual platform icons here
    return platform.charAt(0).toUpperCase();
  };

  const filteredInfluencers = influencers.filter(influencer => {
    const matchesSearch = influencer.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         influencer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         influencer.bio.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = industryFilter === 'all' || influencer.industry === industryFilter;
    const matchesFollowers = influencer.total_followers >= followerRange[0] && 
                            influencer.total_followers <= followerRange[1];
    const matchesEngagement = influencer.avg_engagement >= engagementRange[0] && 
                             influencer.avg_engagement <= engagementRange[1];
    const matchesVerified = !verifiedOnly || influencer.is_verified;
    const matchesPlatforms = platforms.length === 0 || 
                            platforms.some(p => influencer.platforms.includes(p));

    return matchesSearch && matchesIndustry && matchesFollowers && 
           matchesEngagement && matchesVerified && matchesPlatforms;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Discover Influencers</h1>
          <p className="text-gray-600">Find the perfect influencers for your campaigns</p>
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <HiAdjustmentsHorizontal className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search influencers by name, username, or bio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t">
              {/* Industry Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                  <option value="all">All Industries</option>
                  <option value="fashion_beauty">Fashion & Beauty</option>
                  <option value="tech_gaming">Tech & Gaming</option>
                  <option value="fitness_health">Fitness & Health</option>
                  <option value="food_lifestyle">Food & Lifestyle</option>
                  <option value="travel">Travel</option>
                </Select>
              </div>

              {/* Followers Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Followers: {formatFollowers(followerRange[0])} - {formatFollowers(followerRange[1])}
                </label>
                <Slider
                  value={followerRange}
                  onValueChange={setFollowerRange}
                  max={1000000}
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

              {/* Verified Only */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="verified"
                  checked={verifiedOnly}
                  onCheckedChange={(checked) => setVerifiedOnly(checked === true)}
                />
                <label htmlFor="verified" className="text-sm font-medium text-gray-700">
                  Verified accounts only
                </label>
              </div>

              {/* Platform Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platforms
                </label>
                <div className="space-y-2">
                  {['instagram', 'youtube', 'tiktok', 'twitter'].map(platform => (
                    <div key={platform} className="flex items-center space-x-2">
                      <Checkbox
                        id={platform}
                        checked={platforms.includes(platform)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setPlatforms([...platforms, platform]);
                          } else {
                            setPlatforms(platforms.filter(p => p !== platform));
                          }
                        }}
                      />
                      <label htmlFor={platform} className="text-sm capitalize">
                        {platform}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Found {filteredInfluencers.length} influencer{filteredInfluencers.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Influencer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInfluencers.map((influencer) => (
          <Card key={influencer.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                  {influencer.profile_image ? (
                    <img
                      src={influencer.profile_image}
                      alt={influencer.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
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
              <Button variant="ghost" size="sm">
                <HiBookmark className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-3">{influencer.bio}</p>

            <div className="space-y-3">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Followers</p>
                  <p className="font-semibold">{formatFollowers(influencer.total_followers)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Engagement</p>
                  <p className="font-semibold">{influencer.avg_engagement}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Collaborations</p>
                  <p className="font-semibold">{influencer.collaboration_count}</p>
                </div>
                <div>
                  <p className="text-gray-500">Rating</p>
                  <p className="font-semibold flex items-center">
                    <span className="text-yellow-500 mr-1">★</span>
                    {influencer.avg_rating}
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">
                  {influencer.industry.replace('_', ' ')}
                </Badge>
                {influencer.platforms.map(platform => (
                  <Badge key={platform} variant="outline" className="text-xs">
                    {getPlatformIcon(platform)}
                  </Badge>
                ))}
              </div>

              {/* Location */}
              <p className="text-xs text-gray-500">{influencer.location}</p>

              {/* Actions */}
              <div className="flex gap-2 pt-3">
                <Button size="sm" className="flex-1">
                  <HiUserPlus className="w-4 h-4 mr-1" />
                  Invite
                </Button>
                <Button variant="outline" size="sm">
                  <HiEye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredInfluencers.length === 0 && (
        <Card className="p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No influencers found</h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your search criteria or filters
          </p>
          <Button variant="outline" onClick={() => {
            setSearchTerm("");
            setIndustryFilter("all");
            setFollowerRange([1000, 1000000]);
            setEngagementRange([1, 10]);
            setVerifiedOnly(false);
            setPlatforms([]);
          }}>
            Clear Filters
          </Button>
        </Card>
      )}
    </div>
  );
} 