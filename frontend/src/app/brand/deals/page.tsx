"use client";

import { useState, useEffect } from "react";
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
    name: string;
    username: string;
    followers: number;
    avatar?: string;
    profile_image?: string;
  };
  campaign: {
    id: number;
    title: string;
    brand_name: string;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'content_submitted' | 'approved' | 'completed' | 'cancelled';
  value: number;
  created_at: string;
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
  { value: "pending", label: "Pending Response", color: "yellow" },
  { value: "accepted", label: "Accepted", color: "green" },
  { value: "rejected", label: "Rejected", color: "red" },
  { value: "content_submitted", label: "Content Submitted", color: "blue" },
  { value: "approved", label: "Approved", color: "emerald" },
  { value: "completed", label: "Completed", color: "green" },
  { value: "cancelled", label: "Cancelled", color: "gray" },
];

export default function BrandDealsPage() {
  const [viewMode, setViewMode] = useState<'campaigns' | 'deals'>('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at_desc");
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

  const getStatusBadge = (status: string) => {
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
        {statusOption?.label || status}
      </Badge>
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortBy("created_at_desc");
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, current_page: page }));
  };

  const hasActiveFilters = searchTerm !== "" || statusFilter !== "all" || sortBy !== "created_at_desc";

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        {/* Header */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-blue-500/5 to-purple-500/5 rounded-xl -m-2"></div>
          
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4">
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
                className="border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200 rounded-lg px-4 py-2"
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
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
                  <SelectItem value="created_at_desc">Newest First</SelectItem>
                  <SelectItem value="created_at_asc">Oldest First</SelectItem>
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
          <Card className="p-12 text-center bg-gradient-to-br from-white via-white to-gray-50 border border-gray-200 shadow-md">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-4">
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
                  <Button variant="outline" onClick={clearFilters} className="border-blue-200 hover:bg-blue-50 hover:border-blue-300">
                    <HiArrowPath className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
                <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">
                  <HiDocument className="w-4 h-4 mr-2" />
                  Create First Campaign
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Campaigns View */}
        {!isLoading && viewMode === 'campaigns' && campaigns.length > 0 && (
          <div className="space-y-6">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {campaign.title}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
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
                    <Button variant="outline" size="sm">
                      <HiEye className="w-4 h-4 mr-2" />
                      View Campaign
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {campaign.deals.slice(0, 5).map((deal) => (
                      <div key={deal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {deal.influencer?.name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{deal.influencer?.name || 'Unknown Influencer'}</p>
                            <p className="text-sm text-gray-500">{deal.influencer?.username || 'N/A'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {getStatusBadge(deal.status)}
                          <span className="text-sm font-medium text-gray-700">
                            {formatCurrency(deal.value)}
                          </span>
                          <Button variant="ghost" size="sm">
                            <HiEye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {campaign.deals.length > 5 && (
                      <div className="text-center pt-2">
                        <Button variant="outline" size="sm">
                          View {campaign.deals.length - 5} more deals
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
          <div className="grid gap-4">
            {deals.map((deal) => (
              <Card key={deal.id} className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center">
                        <span className="text-lg font-medium text-white">
                          {deal.influencer?.name?.charAt(0) || '?'}
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-gray-900">{deal.influencer?.name || 'Unknown Influencer'}</h3>
                        <p className="text-sm text-gray-500">{deal.influencer?.username || 'N/A'}</p>
                        <p className="text-sm text-blue-600 font-medium">{deal.campaign?.title || 'Untitled Campaign'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {getStatusBadge(deal.status)}
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(deal.value)}</p>
                        <p className="text-sm text-gray-500">{formatDate(deal.created_at)}</p>
                      </div>
                      <Button variant="outline" size="sm">
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