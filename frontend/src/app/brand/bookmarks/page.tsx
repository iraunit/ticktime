"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

import { GlobalLoader } from "@/components/ui/global-loader";
import { toast } from "@/lib/toast";
import { api } from "@/lib/api";
import { 
  HiBookmark, 
  HiMagnifyingGlass,
  HiUsers,
  HiCheckBadge,
  HiTrash,
  HiChatBubbleLeftRight,
  HiEye,
  HiPlus,
  HiArrowPath,
  HiPencil,
  HiHeart
} from "react-icons/hi2";

interface BookmarkedInfluencer {
  id: number;
  influencer: {
    id: number;
    name: string;
    username: string;
    profile_image?: string;
    followers: number;
    engagement_rate: number;
    is_verified: boolean;
    bio: string;
    platforms: string[];
    categories: string[];
    location: string;
    avg_rating: number;
    rate_per_post: number;
  };
  notes: string;
  bookmarked_at: string;
  last_collaboration?: string;
  created_by: {
    id: number;
    name: string;
  };
}

export default function BrandBookmarksPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<BookmarkedInfluencer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isEditingNotes, setIsEditingNotes] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState("");

  const fetchBookmarks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/brands/bookmarks/', {
        params: {
          search: searchTerm || undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
        }
      });
      setBookmarks(response.data.bookmarks || []);
    } catch (error: any) {
      console.error('Failed to fetch bookmarks:', error);
      toast.error(error.response?.data?.message || 'Failed to load bookmarks.');
      setBookmarks([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, categoryFilter]);

  const removeBookmark = async (bookmarkId: number) => {
    try {
      await api.delete(`/brands/bookmarks/${bookmarkId}/`);
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
      toast.success('Influencer removed from bookmarks');
    } catch (error: any) {
      console.error('Failed to remove bookmark:', error);
      toast.error('Failed to remove bookmark.');
    }
  };

  const updateNotes = async (bookmarkId: number, notes: string) => {
    try {
      await api.patch(`/brands/bookmarks/${bookmarkId}/`, { notes });
      setBookmarks(prev => prev.map(b => 
        b.id === bookmarkId ? { ...b, notes } : b
      ));
      setIsEditingNotes(null);
      toast.success('Notes updated successfully');
    } catch (error: any) {
      console.error('Failed to update notes:', error);
      toast.error('Failed to update notes.');
    }
  };



  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchBookmarks();
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, categoryFilter, fetchBookmarks]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatFollowers = (count: number | null | undefined) => {
    if (count == null || count === undefined) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null || amount === undefined) return '₹0';
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get unique categories from bookmarks
  const allCategories = Array.from(new Set(bookmarks.flatMap(b => b.influencer.categories || [])));
  const categories = ["all", ...allCategories];

  // Since backend handles filtering, just display all returned bookmarks
  const filteredBookmarks = bookmarks;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        {/* Header */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-indigo-500/5 rounded-xl -m-2"></div>
          
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-1">
                Bookmarked Influencers
              </h1>
              <p className="text-sm text-gray-600 max-w-2xl">
                Manage your saved influencers and track potential collaboration opportunities.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-500">Total Bookmarks</p>
                <p className="text-xs font-medium text-gray-700">
                  {bookmarks.length} influencers
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchBookmarks}
                disabled={isLoading}
                className="border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all duration-200 rounded-lg px-4 py-2"
              >
                <HiArrowPath className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="border-l-4 border-l-pink-500 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Bookmarks</p>
                  <p className="text-3xl font-bold text-gray-900">{bookmarks.length}</p>
                </div>
                <div className="p-3 bg-pink-100 rounded-lg">
                  <HiBookmark className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Verified Influencers</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {bookmarks.filter(b => b.influencer.is_verified).length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <HiCheckBadge className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Previous Collaborations</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {bookmarks.filter(b => b.last_collaboration).length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <HiUsers className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-sm border border-gray-200 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative flex-1">
                <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search influencers by name, username, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      categoryFilter === category
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category === "all" ? "All Categories" : category}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookmarked Influencers */}
        {isLoading ? (
          <div className="grid gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
                              <GlobalLoader key={i} />
            ))}
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <Card className="p-12 text-center bg-gradient-to-br from-white via-white to-gray-50 border border-gray-200 shadow-md">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <HiBookmark className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-6">
                {searchTerm || categoryFilter !== "all" 
                  ? "No bookmarks found matching your search criteria." 
                  : "Start bookmarking influencers to build your list of potential collaborators."}
              </p>
              <Button 
                onClick={() => router.push('/brand/influencers')}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
              >
                <HiPlus className="w-4 h-4 mr-2" />
                Discover Influencers
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredBookmarks.map((bookmark) => (
              <Card key={bookmark.id} className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Influencer Info */}
                    <div className="flex items-start gap-4 flex-1">
                      {bookmark.influencer?.profile_image ? (
                        <div className="w-16 h-16 rounded-full overflow-hidden shadow-md">
                          <img
                            src={bookmark.influencer.profile_image}
                            alt={bookmark.influencer.name || 'Influencer'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to placeholder if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-md hidden">
                            <span className="text-xl font-bold text-white">
                              {bookmark.influencer?.name?.charAt(0) || '?'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                          <span className="text-xl font-bold text-white">
                            {bookmark.influencer?.name?.charAt(0) || '?'}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {bookmark.influencer?.name || 'Unknown Influencer'}
                          </h3>
                          {bookmark.influencer.is_verified && (
                            <HiCheckBadge className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{bookmark.influencer.username || 'No username'}</p>
                        <p className="text-sm text-gray-700 mb-3 line-clamp-2">{bookmark.influencer.bio || 'No bio available'}</p>
                        
                        <div className="flex items-center gap-4 mb-3">
                          <span className="text-sm text-gray-600">
                            <HiUsers className="w-4 h-4 inline mr-1" />
                            {formatFollowers(bookmark.influencer.total_followers || bookmark.influencer.followers || 0)} followers
                          </span>
                          <span className="text-sm text-gray-600">
                            <HiHeart className="w-4 h-4 inline mr-1" />
                            {bookmark.influencer.average_engagement_rate || bookmark.influencer.engagement_rate || 0}% engagement
                          </span>
                          <span className="text-sm text-gray-600">
                            {formatCurrency(bookmark.influencer.rate_per_post)}/post
                          </span>
                        </div>
                        
                        <div className="flex gap-2 mb-3">
                          {(bookmark.influencer.platforms || []).map((platform) => (
                            <Badge key={platform} variant="outline" className="text-xs">
                              {platform}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex gap-2">
                          {(bookmark.influencer.categories || []).map((category) => (
                            <Badge key={category} className="bg-pink-100 text-pink-800 border-0 text-xs">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Notes Section */}
                    <div className="lg:w-80">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">Notes</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setIsEditingNotes(bookmark.id);
                              setEditNotes(bookmark.notes);
                            }}
                          >
                            <HiPencil className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {isEditingNotes === bookmark.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              className="h-20 text-sm"
                              placeholder="Add notes about this influencer..."
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateNotes(bookmark.id, editNotes)}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                              >
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditingNotes(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {bookmark.notes || "No notes added yet."}
                          </p>
                        )}
                        
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            Bookmarked on {formatDate(bookmark.bookmarked_at)}
                          </p>
                          {bookmark.last_collaboration && (
                            <p className="text-xs text-gray-500">
                              Last collaboration: {bookmark.last_collaboration}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push('/brand/messages')}
                          className="flex-1"
                        >
                          <HiChatBubbleLeftRight className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/influencers/${bookmark.influencer.id}`)}
                          className="flex-1"
                        >
                          <HiEye className="w-4 h-4 mr-2" />
                          View Profile
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeBookmark(bookmark.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <HiTrash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 