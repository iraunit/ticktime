"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DealListSkeleton } from "@/components/ui/skeleton-layouts";
import { toast } from "@/lib/toast";
import { api } from "@/lib/api";
import { 
  HiEye, 
  HiChatBubbleLeftRight, 
  HiCalendarDays,
  HiCurrencyDollar,
  HiUsers,
  HiDocument,
  HiCheckCircle,
  HiClock,
  HiXCircle,
  HiMagnifyingGlass,
  HiChevronLeft,
  HiChevronRight,
  HiFunnel,
  HiArrowPath
} from "react-icons/hi2";

interface Deal {
  id: number;
  influencer: {
    id: number;
    full_name?: string;
    username: string;
    followers?: number;
    avatar?: string;
    profile_image?: string;
  };
  campaign: {
    id: number;
    title: string;
    brand_name: string;
  };
  status: 'invited' | 'pending' | 'accepted' | 'active' | 'content_submitted' | 'under_review' | 'revision_requested' | 'approved' | 'completed' | 'rejected' | 'cancelled' | 'dispute';
  status_display?: string;
  value: number;
  invited_at?: string;
  responded_at?: string;
  accepted_at?: string;
  completed_at?: string;
  deadline: string;
  deliverables: string[];
  submitted_content: any[];
  brand_rating?: number;
  influencer_rating?: number;
}

interface Campaign {
  id: number;
  title: string;
  deals_count: number;
  active_deals: number;
  completed_deals: number;
  total_value: number;
  deals: Deal[];
}

interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
}

const statusOptions = [
  { value: "all", label: "All Status", color: "gray" },
  { value: "invited", label: "Invited", color: "gray" },
  { value: "pending", label: "Pending Response", color: "yellow" },
  { value: "accepted", label: "Accepted", color: "green" },
  { value: "active", label: "Active", color: "green" },
  { value: "rejected", label: "Rejected", color: "red" },
  { value: "content_submitted", label: "Content Submitted", color: "blue" },
  { value: "under_review", label: "Under Review", color: "blue" },
  { value: "revision_requested", label: "Revision Requested", color: "yellow" },
  { value: "approved", label: "Approved", color: "emerald" },
  { value: "completed", label: "Completed", color: "green" },
  { value: "cancelled", label: "Cancelled", color: "gray" },
  { value: "dispute", label: "Dispute", color: "red" },
];

export default function BrandDealsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'campaigns' | 'deals'>('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent_activity_desc");
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 20
  });

  const fetchDealsByCampaigns = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/brands/deals/by-campaigns/', {
        params: {
          search: searchTerm || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          ordering: sortBy,
          page: pagination.current_page,
          page_size: pagination.items_per_page,
        }
      });
      
      setCampaigns(response.data.campaigns || []);
      setPagination(response.data.pagination || pagination);
    } catch (error: any) {
      console.error('Failed to fetch deals by campaigns:', error);
      toast.error(error.response?.data?.message || 'Failed to load deals. Please try again.');
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeals = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/brands/deals/', {
        params: {
          search: searchTerm || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          ordering: sortBy,
          page: pagination.current_page,
          page_size: pagination.items_per_page,
        }
      });
      
      setDeals(response.data.deals || []);
      setPagination(response.data.pagination || pagination);
    } catch (error: any) {
      console.error('Failed to fetch deals:', error);
      toast.error(error.response?.data?.message || 'Failed to load deals. Please try again.');
      setDeals([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (viewMode === 'campaigns') {
        fetchDealsByCampaigns();
      } else {
        fetchDeals();
      }
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [viewMode, searchTerm, statusFilter, sortBy, pagination.current_page]);

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

  const getLastActivityDate = (deal: Deal): string | undefined => {
    const ts = deal.completed_at || deal.accepted_at || deal.responded_at || deal.invited_at;
    return ts ? formatDate(ts) : undefined;
  };

  const getStatusBadge = (status: string, display?: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    const color = statusOption?.color || 'gray';
    
    const colorClasses: Record<string, string> = {
      gray: 'bg-gray-100 text-gray-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      blue: 'bg-blue-100 text-blue-800',
      emerald: 'bg-emerald-100 text-emerald-800',
    };

    return (
      <Badge className={`${colorClasses[color]} border-0`}>
        {display || statusOption?.label || status}
      </Badge>
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortBy("recent_activity_desc");
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, current_page: page }));
  };

  const hasActiveFilters = searchTerm !== "" || statusFilter !== "all" || sortBy !== "recent_activity_desc";

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        {/* Header */}
        <div className="mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-2">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-1">
                Deal Management
              </h1>
              <p className="text-sm text-gray-600 max-w-2xl">
                Track and manage all your influencer collaborations across campaigns.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-500">Total Deals</p>
                <p className="text-xs font-medium text-gray-700">
                  {pagination.total_items} deals
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => viewMode === 'campaigns' ? fetchDealsByCampaigns() : fetchDeals()}
                disabled={isLoading}
                className="border border-gray-200 hover:bg-gray-50 rounded-lg px-4 py-2"
              >
                <HiArrowPath className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="mb-6">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'campaigns' | 'deals')}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="campaigns">By Campaigns</TabsTrigger>
              <TabsTrigger value="deals">All Deals</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 mb-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <HiMagnifyingGlass className="h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search deals, campaigns, or influencers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-0 bg-transparent focus:ring-0 focus:border-0 p-0"
              />
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent_activity_desc">Recent activity</SelectItem>
                  <SelectItem value="created_at_asc">Oldest first</SelectItem>
                  <SelectItem value="deadline_asc">Deadline (Urgent)</SelectItem>
                  <SelectItem value="value_desc">Highest Value</SelectItem>
                  <SelectItem value="value_asc">Lowest Value</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="border-gray-200 hover:bg-gray-50"
                >
                  <HiFunnel className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading && <DealListSkeleton />}

        {!isLoading && (viewMode === 'campaigns' ? campaigns.length === 0 : deals.length === 0) && (
          <Card className="p-10 text-center bg-white border border-gray-200 shadow-sm">
            <div className="flex flex-col items-center justify-center">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <HiDocument className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {viewMode === 'campaigns' ? 'No Campaigns Found' : 'No Deals Found'}
              </h3>
              <p className="text-gray-500 mb-6 max-w-md">
                {hasActiveFilters ? "Try adjusting your search criteria or filters." : "Start by creating campaigns and sending deals to influencers."}
              </p>
              <div className="flex items-center justify-center gap-3">
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="hover:bg-gray-50">
                    <HiArrowPath className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
                <Button onClick={() => router.push('/brand/campaigns/create')}>
                  <HiDocument className="w-4 h-4 mr-2" />
                  Create First Campaign
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Campaigns View */}
        {!isLoading && viewMode === 'campaigns' && campaigns.length > 0 && (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="shadow-sm border border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {campaign.title}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <HiUsers className="w-4 h-4" />
                          {campaign.deals_count} deals
                        </span>
                        <span className="flex items-center gap-1">
                          <HiCheckCircle className="w-4 h-4" />
                          {campaign.completed_deals} completed
                        </span>
                        <span className="flex items-center gap-1">
                          <HiCurrencyDollar className="w-4 h-4" />
                          {formatCurrency(campaign.total_value)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/brand/campaigns/${campaign.id}`)}>
                        <HiEye className="w-4 h-4 mr-2" />
                        View Campaign
                      </Button>
                      <Button size="sm" onClick={() => router.push(`/brand/campaigns/${campaign.id}/deals`)}>
                        Manage Deals
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2">
                    {campaign.deals.slice(0, 3).map((deal) => (
                      <div key={deal.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {(deal.influencer?.full_name || deal.influencer?.username || '?').charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{deal.influencer?.full_name || deal.influencer?.username || 'Unknown Influencer'}</p>
                            <p className="text-sm text-gray-500">{deal.influencer?.username || 'N/A'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {getStatusBadge(deal.status, deal.status_display)}
                          <span className="text-sm font-medium text-gray-700">
                            {formatCurrency(deal.value)}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/brand/deals/${deal.id}`)}>
                            <HiEye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {campaign.deals.length > 3 && (
                      <div className="text-center pt-2">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/brand/campaigns/${campaign.id}/deals`)}>
                          View {campaign.deals.length - 3} more deals
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* All Deals View */}
        {!isLoading && viewMode === 'deals' && deals.length > 0 && (
          <div className="grid gap-3">
            {deals.map((deal) => (
              <Card key={deal.id} className="shadow-sm border border-gray-200">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-base font-medium text-white">
                          {(deal.influencer?.full_name || deal.influencer?.username || '?').charAt(0)}
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-gray-900">{deal.influencer?.full_name || deal.influencer?.username || 'Unknown Influencer'}</h3>
                        <p className="text-sm text-gray-500">{deal.influencer?.username || 'N/A'}</p>
                        <p className="text-sm text-blue-600 font-medium">{deal.campaign?.title || 'Untitled Campaign'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {getStatusBadge(deal.status, deal.status_display)}
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(deal.value)}</p>
                        <p className="text-sm text-gray-500">{getLastActivityDate(deal) || ''}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/brand/deals/${deal.id}`)}>
                        <HiEye className="w-4 h-4 mr-2" />
                        View Deal
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between mt-8 p-4 bg-white rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {((pagination.current_page - 1) * pagination.items_per_page) + 1} to{' '}
              {Math.min(pagination.current_page * pagination.items_per_page, pagination.total_items)} of{' '}
              {pagination.total_items} deals
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={pagination.current_page === 1}
                onClick={() => handlePageChange(pagination.current_page - 1)}
              >
                <HiChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                  .filter(page => {
                    const current = pagination.current_page;
                    return page === 1 || page === pagination.total_pages || (page >= current - 1 && page <= current + 1);
                  })
                  .map((page, index, array) => (
                    <div key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <Button
                        variant={page === pagination.current_page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    </div>
                  ))}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                disabled={pagination.current_page === pagination.total_pages}
                onClick={() => handlePageChange(pagination.current_page + 1)}
              >
                Next
                <HiChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 