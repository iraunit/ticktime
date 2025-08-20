"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  HiBookmark, 
  HiMagnifyingGlass,
  HiUsers,
  HiCheckBadge,
  HiTrash,
  HiChatBubbleLeftRight,
  HiEye
} from "react-icons/hi2";

// Mock data for bookmarked influencers
const mockBookmarks = [
  {
    id: 1,
    influencer: {
      name: "Sarah Johnson",
      username: "@sarahjohnson",
      avatar: null,
      followers: 125000,
      engagement_rate: 4.2,
      is_verified: true,
      bio: "Fashion & lifestyle content creator. Spreading positivity through style and self-love.",
      platforms: ["instagram", "tiktok"],
      categories: ["Fashion", "Lifestyle"]
    },
    notes: "Great engagement with fashion content. Perfect for our summer collection.",
    bookmarked_at: "2024-01-15T10:30:00Z",
    last_collaboration: "Summer Collection 2023"
  },
  {
    id: 2,
    influencer: {
      name: "Mike Chen",
      username: "@mikechenfit",
      avatar: null,
      followers: 89000,
      engagement_rate: 5.1,
      is_verified: false,
      bio: "Fitness coach helping people transform their lives through health and wellness.",
      platforms: ["youtube", "instagram"],
      categories: ["Fitness", "Health"]
    },
    notes: "High-quality fitness content. Good for equipment and supplement campaigns.",
    bookmarked_at: "2024-01-10T14:15:00Z",
    last_collaboration: null
  },
  {
    id: 3,
    influencer: {
      name: "Emma Wilson",
      username: "@emmawilson",
      avatar: null,
      followers: 67000,
      engagement_rate: 6.8,
      is_verified: true,
      bio: "Tech reviewer and software engineer. Making technology accessible for everyone.",
      platforms: ["youtube", "twitter"],
      categories: ["Technology", "Education"]
    },
    notes: "Excellent tech reviews. Perfect for our product launch campaigns.",
    bookmarked_at: "2024-01-05T09:00:00Z",
    last_collaboration: "Tech Review Series 2023"
  }
];

export default function BrandBookmarksPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = ["all", ...Array.from(new Set(mockBookmarks.flatMap(b => b.influencer.categories)))];

  const filteredBookmarks = mockBookmarks.filter(bookmark => {
    const matchesSearch = bookmark.influencer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bookmark.influencer.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bookmark.notes.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || 
                           bookmark.influencer.categories.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleRemoveBookmark = (bookmarkId: number) => {
    // Here you would call the API to remove the bookmark
    console.log("Removing bookmark:", bookmarkId);
  };

  const handleStartCampaign = (influencer: any) => {
    // Here you would navigate to campaign creation with pre-filled influencer
    console.log("Starting campaign with:", influencer);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bookmarked Influencers</h1>
        <p className="text-gray-600 mt-2">
          Manage your saved influencers and start new collaborations
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search bookmarked influencers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookmarks</p>
                <p className="text-3xl font-bold text-gray-900">{mockBookmarks.length}</p>
              </div>
              <HiBookmark className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified Influencers</p>
                <p className="text-3xl font-bold text-green-600">
                  {mockBookmarks.filter(b => b.influencer.is_verified).length}
                </p>
              </div>
              <HiCheckBadge className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Previous Collaborators</p>
                <p className="text-3xl font-bold text-purple-600">
                  {mockBookmarks.filter(b => b.last_collaboration).length}
                </p>
              </div>
              <HiUsers className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookmarked Influencers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBookmarks.map((bookmark) => (
          <Card key={bookmark.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                    {bookmark.influencer.avatar ? (
                      <img
                        src={bookmark.influencer.avatar}
                        alt={bookmark.influencer.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        {bookmark.influencer.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{bookmark.influencer.name}</h3>
                      {bookmark.influencer.is_verified && (
                        <HiCheckBadge className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{bookmark.influencer.username}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveBookmark(bookmark.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <HiTrash className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{bookmark.influencer.bio}</p>

              <div className="space-y-3">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Followers</p>
                    <p className="font-semibold">{formatFollowers(bookmark.influencer.followers)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Engagement</p>
                    <p className="font-semibold">{bookmark.influencer.engagement_rate}%</p>
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">Categories</p>
                  <div className="flex flex-wrap gap-1">
                    {bookmark.influencer.categories.map((category, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-700 line-clamp-2">{bookmark.notes}</p>
                </div>

                {/* Last Collaboration */}
                {bookmark.last_collaboration && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Last Collaboration</p>
                    <p className="text-sm text-gray-700">{bookmark.last_collaboration}</p>
                  </div>
                )}

                <div className="text-xs text-gray-400">
                  Bookmarked {formatDate(bookmark.bookmarked_at)}
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleStartCampaign(bookmark.influencer)}
                    className="flex-1"
                  >
                    Start Campaign
                  </Button>
                  <Button variant="outline" size="sm">
                    <HiEye className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <HiChatBubbleLeftRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBookmarks.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <HiBookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookmarks found</h3>
            <p className="text-gray-500">
              {searchTerm || selectedCategory !== "all" 
                ? "No influencers match your current filters."
                : "You haven't bookmarked any influencers yet. Start by searching and bookmarking influencers you'd like to work with."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 