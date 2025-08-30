"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  HiMagnifyingGlass, 
  HiPlus, 
  HiEye,
  HiArrowPath,
  HiCalendarDays,
  HiXMark,
  HiChevronDown, 
  HiExclamationTriangle
} from "react-icons/hi2";
import { FaYoutube, FaInstagram, FaTiktok, FaTwitter, FaLinkedin } from "react-icons/fa";

// Real platform icons with brand colors (same as create page)
const platformConfig = {
  youtube: { icon: FaYoutube, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", gradient: "from-red-500 to-red-600" },
  instagram: { icon: FaInstagram, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200", gradient: "from-pink-500 to-purple-500" },
  tiktok: { icon: FaTiktok, color: "text-gray-800", bg: "bg-gray-50", border: "border-gray-200", gradient: "from-gray-800 to-gray-900" },
  twitter: { icon: FaTwitter, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200", gradient: "from-blue-400 to-blue-500" },
  linkedin: { icon: FaLinkedin, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", gradient: "from-blue-700 to-blue-800" },
} as const;

const platformDisplayNames: Record<string, string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  twitter: 'Twitter',
  linkedin: 'LinkedIn',
};
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { GlobalLoader } from "@/components/ui/global-loader";

interface Campaign {
  id: number;
  title: string;
  description: string;
  deal_type: string;
  deal_type_display: string;
  cash_amount: number;
  product_value: number;
  total_value: number;
  product_name: string;
  application_deadline: string;
  campaign_live_date: string;
  campaign_start_date: string;
  campaign_end_date: string;
  is_active: boolean;
  is_expired: boolean;
  days_until_deadline: number;
  created_at: string;
  brand_name: string;
  platforms_required: string[];
  content_count: number;
  target_influencers?: number;
  total_invited?: number;
}

export default function BrandCampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [campaignTime, setCampaignTime] = useState("all"); // all, upcoming, past
  const [sortBy, setSortBy] = useState("created_at_desc");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [dealType, setDealType] = useState<string>("all");
  const [platform, setPlatform] = useState<string>("all");

  const fetchCampaigns = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    setIsLoading(true);
    try {
      console.log('Fetching campaigns...');
      const orderingMap: Record<string, string> = {
        created_at_desc: '-created_at',
        created_at_asc: 'created_at',
        title_asc: 'title',
        title_desc: '-title',
        application_deadline_asc: 'application_deadline',
        total_budget_desc: '-cash_amount',
        total_budget_asc: 'cash_amount',
        influencers_desc: '-target_influencers',
        influencers_asc: 'target_influencers',
      };
      const response = await api.get('/brands/campaigns/', {
        params: {
          search: searchTerm || undefined,
          // Use campaign_live_date for upcoming/past logic instead of status
          ...(campaignTime === 'upcoming' ? { campaign_live_date__gt: new Date().toISOString() } : {}),
          ...(campaignTime === 'past' ? { campaign_live_date__lt: new Date().toISOString() } : {}),
          ordering: orderingMap[sortBy] || '-created_at',
          page: pageNum,
          page_size: 20,
          deal_type: dealType !== 'all' ? dealType : undefined,
          platform: platform !== 'all' ? platform : undefined,
        }
      });
      console.log('Campaigns response:', response.data);
      const next = response.data.campaigns || [];
      setCampaigns(prev => append ? prev.concat(next) : next);
      const pg = response.data.pagination || { current_page: 1, total_pages: 1, total_count: next.length };
      setPage(pg.current_page || 1);
      setTotalPages(pg.total_pages || 1);
      setTotalCount(pg.total_count || next.length);

    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      toast.error('Failed to load campaigns. Please try again.');
      if (!append) {
      setCampaigns([]);
        setPage(1);
        setTotalPages(1);
        setTotalCount(0);
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, campaignTime, sortBy, dealType, platform]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1);
      fetchCampaigns(1, false);
    }, searchTerm ? 500 : 0); // Debounce search by 500ms, instant for filters

    return () => clearTimeout(timeoutId);
  }, [searchTerm, campaignTime, sortBy, dealType, platform, fetchCampaigns]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCampaignTime("all");
    setSortBy("created_at_desc");
    setPage(1);
    setDealType('all');
    setPlatform('all');
  };

  const hasActiveFilters = searchTerm !== "" || campaignTime !== "all" || sortBy !== "created_at_desc" || dealType !== "all" || platform !== "all";

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        {/* Header */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-orange-500/5 to-red-500/5 rounded-xl -m-2"></div>
          
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-1">
                Campaign Management
              </h1>
              <p className="text-sm text-gray-600 max-w-2xl">
                Create, manage, and track your influencer marketing campaigns with comprehensive analytics.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-500">Total Campaigns</p>
                <p className="text-xs font-medium text-gray-700">
                  {totalCount} campaigns
                </p>
              </div>
              <Button 
                size="sm"
                onClick={() => router.push('/brand/campaigns/create')}
                className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white shadow-md"
              >
                <HiPlus className="h-4 w-4 mr-1" />
                Create Campaign
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 bg-gradient-to-br from-white via-white to-gray-50 border border-gray-200 shadow-md">
          <div className="p-4">
            {/* Search Bar */}
            <div className="relative mb-4">
              <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search campaigns by title, description, or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base border-gray-200 focus:border-red-300 focus:ring-red-200"
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

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Timeline:</span>
                  <Select value={campaignTime} onValueChange={setCampaignTime}>
                    <SelectTrigger className="w-40 border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Campaigns</SelectItem>
                      <SelectItem value="upcoming">🚀 Upcoming</SelectItem>
                      <SelectItem value="past">📅 Past</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Sort:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48 border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at_desc">Newest First</SelectItem>
                      <SelectItem value="created_at_asc">Oldest First</SelectItem>
                      <SelectItem value="title_asc">Title A-Z</SelectItem>
                      <SelectItem value="title_desc">Title Z-A</SelectItem>
                      <SelectItem value="application_deadline_asc">Deadline Soon</SelectItem>
                      <SelectItem value="total_budget_desc">Highest Budget</SelectItem>
                      <SelectItem value="total_budget_asc">Lowest Budget</SelectItem>
                      <SelectItem value="influencers_desc">Most Influencers</SelectItem>
                      <SelectItem value="influencers_asc">Least Influencers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Type:</span>
                  <Select value={dealType} onValueChange={setDealType}>
                    <SelectTrigger className="w-40 border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="cash">💰 Cash Payment</SelectItem>
                      <SelectItem value="product">🎁 Barter Only</SelectItem>
                      <SelectItem value="hybrid">💰🎁 Cash + Barter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Platform:</span>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger className="w-44 border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Platforms</SelectItem>
                      <SelectItem value="youtube">🔴 YouTube</SelectItem>
                      <SelectItem value="instagram">📸 Instagram</SelectItem>
                      <SelectItem value="tiktok">🎵 TikTok</SelectItem>
                      <SelectItem value="twitter">🐦 Twitter</SelectItem>
                      <SelectItem value="linkedin">💼 LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>


              </div>
              
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                >
                  <HiXMark className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
                              <GlobalLoader key={i} />
            ))}
          </div>
        )}

        {/* Campaigns List */}
        {!isLoading && (
          <div className="space-y-6">
            {campaigns.map((campaign) => {
              const daysUntilDeadline = getDaysUntilDeadline(campaign.application_deadline);

              return (
                <Card 
                  key={campaign.id}
                  className="p-5 bg-gradient-to-br from-white to-gray-50/50 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-xl"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-gray-900">{campaign.title}</h3>
                        <div className="flex gap-1">
                          {daysUntilDeadline <= 3 && daysUntilDeadline > 0 && (
                            <Badge className="bg-orange-100 text-orange-700 text-xs animate-pulse">
                              ⚡ {daysUntilDeadline}d left
                            </Badge>
                          )}
                          {(() => {
                            const isUpcoming = campaign.campaign_live_date && new Date(campaign.campaign_live_date) > new Date();
                            const isPast = campaign.campaign_live_date && new Date(campaign.campaign_live_date) < new Date();
                            if (isUpcoming) return <Badge className="bg-blue-100 text-blue-800 text-xs">🚀 Upcoming</Badge>;
                            if (isPast) return <Badge className="bg-gray-100 text-gray-800 text-xs">📅 Past</Badge>;
                            return <Badge className="bg-green-100 text-green-800 text-xs">✨ Live</Badge>;
                          })()}
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2 leading-relaxed">{campaign.description}</p>
                      
                      {/* Live Date Info (if available) */}
                      {campaign.campaign_live_date && (
                        <div className="text-sm text-gray-600">
                          <span className="inline-flex items-center gap-1.5 font-medium">
                            <HiCalendarDays className="w-4 h-4 text-indigo-500" /> 
                            Goes Live: {formatDate(campaign.campaign_live_date)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                        onClick={() => router.push(`/brand/campaigns/${campaign.id}`)}
                      >
                        <HiEye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Compact Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="rounded-lg p-3 bg-gradient-to-br from-emerald-50 to-green-50 border border-green-200/50">
                      <p className="text-xs font-medium text-emerald-700 mb-1">💰 Budget</p>
                      <p className="text-lg font-bold text-emerald-800">{formatCurrency(campaign.total_value)}</p>
                    </div>
                    <div className="rounded-lg p-3 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200/50">
                      <p className="text-xs font-medium text-purple-700 mb-1">👥 Influencers</p>
                      <p className="text-lg font-bold text-purple-800">{campaign.total_invited ?? 0}</p>
                    </div>
                    <div className="rounded-lg p-3 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50">
                      <p className="text-xs font-medium text-amber-700 mb-1">🤝 Deal Type</p>
                      <p className="text-sm font-bold text-amber-800">{campaign.deal_type_display}</p>
                    </div>
                    <div className="rounded-lg p-3 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/50">
                      <p className="text-xs font-medium text-blue-700 mb-1">📅 Deadline</p>
                      <p className="text-sm font-bold text-blue-800">{formatDate(campaign.application_deadline)}</p>
                    </div>
                  </div>

                  {/* Platform Requirements */}
                  <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700">Platforms:</span>
                    <div className="flex gap-1">
                      {(campaign.platforms_required || []).map((platformId, i) => {
                        const config = platformConfig[platformId as keyof typeof platformConfig];
                        if (!config) return <Badge key={`${platformId}-${i}`} variant="outline" className="text-xs px-1">{platformId}</Badge>;
                        
                        const Icon = config.icon;
                        return (
                          <div key={`${platformId}-${i}`} 
                               className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.bg} ${config.border} border hover:scale-110 transition-transform`}
                               title={platformDisplayNames[platformId] || platformId}>
                            <Icon className={`w-4 h-4 ${config.color}`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Load More */}
            {page < totalPages && (
              <div className="flex justify-center">
                <Button onClick={() => { setIsLoadingMore(true); fetchCampaigns(page + 1, true).finally(() => setIsLoadingMore(false)); }} disabled={isLoadingMore} className="bg-white border border-gray-300 text-gray-800 hover:bg-gray-50">
                  <HiChevronDown className="w-4 h-4 mr-1" /> {isLoadingMore ? 'Loading…' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        )}

            {/* Empty State */}
    {!isLoading && campaigns.length === 0 && (
      <Card className="p-12 text-center bg-gradient-to-br from-white via-white to-gray-50 border border-gray-200 shadow-md">
        <div className="flex justify-center">
          <HiExclamationTriangle className="w-16 h-16 text-orange-500 mb-4" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns found</h3>
        <div className="mt-4">
          <p className="text-gray-500 mb-6">
            {hasActiveFilters ? "Try adjusting your search criteria or filters." : "Get started by creating your first campaign."}
          </p>
          <div className="flex items-center justify-center gap-3">
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="border-red-200 hover:bg-red-50 hover:border-red-300">
                <HiArrowPath className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
            <Button 
              onClick={() => router.push('/brand/campaigns/create')}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            >
              <HiPlus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </div>
        </div>
        
      </Card>
    )}
      </div>
         </div>
   );
 } 