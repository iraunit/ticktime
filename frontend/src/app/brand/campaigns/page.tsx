"use client";

import { useState, useEffect } from "react";
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
import { LoadingSpinner, CardSkeletonLoader } from "@/components/ui/loading-spinner";

interface Campaign {
  id: number;
  title: string;
  description: string;
  industry: string;
  status: string;
  application_deadline: string;
  campaign_duration_start: string;
  campaign_duration_end: string;
  total_budget: number;
  cash_amount: number;
  product_value: number;
  target_audience_age_min: number;
  target_audience_age_max: number;
  target_audience_gender: string;
  target_audience_location: string;
  platform_requirements: string[];
  content_requirements: string;
  deliverables: string[];
  created_at: string;
  brand_name: string;
  applicants_count?: number;
  accepted_count?: number;
  completed_count?: number;
}

const statusOptions = [
  { value: "all", label: "All Status", color: "gray" },
  { value: "draft", label: "Draft", color: "gray" },
  { value: "active", label: "Active", color: "green" },
  { value: "paused", label: "Paused", color: "yellow" },
  { value: "completed", label: "Completed", color: "blue" },
  { value: "cancelled", label: "Cancelled", color: "red" },
];

export default function BrandCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at_desc");

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/campaigns/', {
        params: {
          search: searchTerm || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          ordering: sortBy,
        }
      });
      setCampaigns(response.data.results || []);
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

  const getStatusBadgeColor = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.color || 'gray';
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortBy("created_at_desc");
  };

  const hasActiveFilters = searchTerm !== "" || statusFilter !== "all" || sortBy !== "created_at_desc";

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        {/* Header */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-xl -m-2"></div>
          
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
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md"
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
                className="pl-10 h-12 text-base border-gray-200 focus:border-blue-300 focus:ring-blue-200"
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
                      {statusOptions.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
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
              <CardSkeletonLoader key={i} />
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
                          variant={getStatusBadgeColor(campaign.status) === 'green' ? 'default' : 'secondary'}
                          className={`text-xs ${
                            getStatusBadgeColor(campaign.status) === 'green' ? 'bg-green-100 text-green-800' :
                            getStatusBadgeColor(campaign.status) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                            getStatusBadgeColor(campaign.status) === 'blue' ? 'bg-blue-100 text-blue-800' :
                            getStatusBadgeColor(campaign.status) === 'red' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {statusOptions.find(s => s.value === campaign.status)?.label || campaign.status}
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
                          Budget: {formatCurrency(campaign.total_budget)}
                        </div>
                        <div className="flex items-center gap-1">
                          <HiUsers className="w-4 h-4" />
                          {campaign.applicants_count || 0} applicants
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="ghost" size="sm" className="hover:bg-blue-50 hover:text-blue-600">
                        <HiEye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="hover:bg-green-50 hover:text-green-600">
                        <HiPencilSquare className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="hover:bg-red-50 hover:text-red-600">
                        <HiTrash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Campaign Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Total Budget</p>
                          <p className="text-lg font-bold text-blue-600">{formatCurrency(campaign.total_budget)}</p>
                        </div>
                        <HiBanknotes className="w-8 h-8 text-blue-500" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Applicants</p>
                          <p className="text-lg font-bold text-green-600">{campaign.applicants_count || 0}</p>
                        </div>
                        <HiUsers className="w-8 h-8 text-green-500" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Accepted</p>
                          <p className="text-lg font-bold text-purple-600">{campaign.accepted_count || 0}</p>
                        </div>
                        <HiCheckCircle className="w-8 h-8 text-purple-500" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Completed</p>
                          <p className="text-lg font-bold text-orange-600">{campaign.completed_count || 0}</p>
                        </div>
                        <HiClock className="w-8 h-8 text-orange-500" />
                      </div>
                    </div>
                  </div>

                  {/* Platform Requirements */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Platforms:</span>
                      {campaign.platform_requirements?.map((platform, index) => (
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
            <LoadingSpinner size="lg" text="No campaigns found" />
            <div className="mt-8">
              <p className="text-gray-500 mb-6">
                {hasActiveFilters ? "Try adjusting your search criteria or filters." : "Get started by creating your first campaign."}
              </p>
              <div className="flex items-center justify-center gap-3">
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="border-blue-200 hover:bg-blue-50 hover:border-blue-300">
                    <HiArrowPath className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
                <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
                  <HiPlus className="w-4 h-4 mr-2" />
                  Create First Campaign
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
} 