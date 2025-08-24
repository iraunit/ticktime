"use client";

import { useState, useEffect } from "react";
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
  HiPencilSquare,
  HiTrash,
  HiArrowPath,
  HiCalendarDays,
  HiUsers,
  HiBanknotes,
  HiCheckCircle,
  HiClock,
  HiExclamationTriangle,
  HiXMark
} from "react-icons/hi2";
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
  campaign_start_date: string;
  campaign_end_date: string;
  is_active: boolean;
  is_expired: boolean;
  days_until_deadline: number;
  created_at: string;
  brand_name: string;
  platforms_required: string[];
  content_count: number;
}

export default function BrandCampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at_desc");
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching campaigns...');
      const response = await api.get('/brands/campaigns/', {
        params: {
          search: searchTerm || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          ordering: sortBy,
        }
      });
      console.log('Campaigns response:', response.data);
      setCampaigns(response.data.campaigns || []);
      setDebugInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      toast.error('Failed to load campaigns. Please try again.');
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCampaigns();
    }, searchTerm ? 500 : 0); // Debounce search by 500ms, instant for filters

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, sortBy]);

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
    setStatusFilter("all");
    setSortBy("created_at_desc");
  };

  const hasActiveFilters = searchTerm !== "" || statusFilter !== "all" || sortBy !== "created_at_desc";

  const createTestCampaign = async () => {
    try {
      const testCampaign = {
        title: "Test Campaign",
        description: "This is a test campaign for development",
        objectives: "Test objectives for development",
        deal_type: "cash",
        cash_amount: 1000,
        product_value: 0,
        total_value: 1000,
        product_name: "Test Product",
        product_description: "A test product for development",
        product_quantity: 1,
        platforms_required: ["instagram", "youtube"],
        content_requirements: "Test content requirements",
        content_count: 1,
        special_instructions: "Test instructions",
        application_deadline: "2024-12-31T23:59:59Z",
        content_creation_start: "2024-01-01T00:00:00Z",
        content_creation_end: "2024-01-31T23:59:59Z",
        submission_deadline: "2024-01-31T23:59:59Z",
        campaign_start_date: "2024-02-01T00:00:00Z",
        campaign_end_date: "2024-02-28T23:59:59Z"
      };

      const response = await api.post('/brands/campaigns/', testCampaign);
      if (response.data.status === 'success') {
        toast.success('Test campaign created successfully!');
        fetchCampaigns();
      }
    } catch (error: any) {
      console.error('Failed to create test campaign:', error);
      toast.error('Failed to create test campaign. Please try again.');
    }
  };

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
                  {campaigns.length} campaigns
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
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
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
              const isUrgent = daysUntilDeadline <= 3 && daysUntilDeadline > 0;
              const isExpired = daysUntilDeadline < 0;

              return (
                <Card 
                  key={campaign.id}
                  className="p-6 bg-gradient-to-br from-white via-white to-gray-50 border border-gray-200 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{campaign.title}</h3>
                        <Badge 
                          variant="default"
                          className={`text-xs ${
                            campaign.is_active && !campaign.is_expired ? 'bg-green-100 text-green-800' :
                            campaign.is_expired ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {campaign.is_active && !campaign.is_expired ? 'Active' :
                           campaign.is_expired ? 'Expired' : 'Inactive'}
                        </Badge>
                        {isUrgent && (
                          <Badge className="bg-orange-100 text-orange-800 text-xs">
                            <HiExclamationTriangle className="w-3 h-3 mr-1" />
                            Deadline Soon
                          </Badge>
                        )}
                        {isExpired && (
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            <HiXMark className="w-3 h-3 mr-1" />
                            Expired
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">{campaign.description}</p>
                      
                      {/* Campaign Info */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <HiCalendarDays className="w-4 h-4" />
                          Deadline: {formatDate(campaign.application_deadline)}
                        </div>
                        <div className="flex items-center gap-1">
                          <HiBanknotes className="w-4 h-4" />
                          Budget: {formatCurrency(campaign.total_value)}
                        </div>
                        <div className="flex items-center gap-1">
                          <HiUsers className="w-4 h-4" />
                          {campaign.content_count || 0} content pieces
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => router.push(`/brand/campaigns/${campaign.id}`)}
                      >
                        <HiEye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="hover:bg-green-50 hover:text-green-600"
                        onClick={() => router.push(`/brand/campaigns/${campaign.id}`)}
                      >
                        <HiPencilSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Campaign Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Total Budget</p>
                          <p className="text-lg font-bold text-red-600">{formatCurrency(campaign.total_value)}</p>
                        </div>
                        <HiBanknotes className="w-8 h-8 text-red-500" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Content Count</p>
                          <p className="text-lg font-bold text-green-600">{campaign.content_count || 0}</p>
                        </div>
                        <HiUsers className="w-8 h-8 text-green-500" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Deal Type</p>
                          <p className="text-lg font-bold text-orange-600">{campaign.deal_type_display}</p>
                        </div>
                        <HiCheckCircle className="w-8 h-8 text-orange-500" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Status</p>
                          <p className="text-lg font-bold text-orange-600">
                            {campaign.is_active && !campaign.is_expired ? 'Active' :
                             campaign.is_expired ? 'Expired' : 'Inactive'}
                          </p>
                        </div>
                        <HiClock className="w-8 h-8 text-orange-500" />
                      </div>
                    </div>
                  </div>

                  {/* Platform Requirements */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Platforms:</span>
                      {campaign.platforms_required?.map((platform: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {platform}
                        </Badge>
                      )) || <span className="text-sm text-gray-500">Not specified</span>}
                    </div>
                  </div>
                </Card>
              );
            })}
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
              className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white"
            >
              <HiPlus className="w-4 h-4 mr-2" />
              Create First Campaign
            </Button>
            <Button 
              variant="outline"
              onClick={fetchCampaigns}
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <HiArrowPath className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              variant="outline"
              onClick={createTestCampaign}
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              <HiPlus className="w-4 h-4 mr-2" />
              Create Test Campaign
            </Button>
          </div>
        </div>
        
        {/* Debug Information */}
        {debugInfo && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Debug Information:</h4>
            <pre className="text-xs text-gray-600 overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </Card>
    )}
      </div>
         </div>
   );
 } 