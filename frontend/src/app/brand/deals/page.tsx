"use client";

import {useCallback, useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {DealListSkeleton} from "@/components/ui/skeleton-layouts";
import {RatingDialog} from "@/components/deals/rating-dialog";
import {toast} from "@/lib/toast";
import api from "@/lib/api";
import {getDealTypeConfig} from "@/lib/platform-config";
import {
    HiArrowPath,
    HiCheckCircle,
    HiChevronLeft,
    HiChevronRight,
    HiCurrencyDollar,
    HiDocument,
    HiEye,
    HiFunnel,
    HiMagnifyingGlass,
    HiStar,
    HiUsers
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
        deal_type?: string;
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
    deal_type?: string;
    deal_type_display?: string;
    target_influencers?: number;
    total_invited?: number;
    total_accepted?: number;
}

interface PaginationInfo {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
}

const statusOptions = [
    {value: "all", label: "All Status", color: "gray"},
    {value: "invited", label: "Invited", color: "gray"},
    {value: "pending", label: "Pending Response", color: "yellow"},
    {value: "accepted", label: "Accepted", color: "green"},
    {value: "active", label: "Active", color: "green"},
    {value: "rejected", label: "Rejected", color: "red"},
    {value: "content_submitted", label: "Content Submitted", color: "blue"},
    {value: "under_review", label: "Under Review", color: "blue"},
    {value: "revision_requested", label: "Revision Requested", color: "yellow"},
    {value: "approved", label: "Approved", color: "emerald"},
    {value: "completed", label: "Completed", color: "green"},
    {value: "cancelled", label: "Cancelled", color: "gray"},
    {value: "dispute", label: "Dispute", color: "red"},
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
    const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
    const [selectedDealForRating, setSelectedDealForRating] = useState<Deal | null>(null);

    const fetchDealsByCampaigns = useCallback(async () => {
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
            setPagination(prev => response.data.pagination || prev);
        } catch (error: any) {
            console.error('Failed to fetch deals by campaigns:', error);
            toast.error(error.response?.data?.message || 'Failed to load deals. Please try again.');
            setCampaigns([]);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, statusFilter, sortBy, pagination.current_page, pagination.items_per_page]);

    const fetchDeals = useCallback(async () => {
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
            setPagination(prev => response.data.pagination || prev);
        } catch (error: any) {
            console.error('Failed to fetch deals:', error);
            toast.error(error.response?.data?.message || 'Failed to load deals. Please try again.');
            setDeals([]);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, statusFilter, sortBy, pagination.current_page, pagination.items_per_page]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (viewMode === 'campaigns') {
                fetchDealsByCampaigns();
            } else {
                fetchDeals();
            }
        }, searchTerm ? 500 : 0);

        return () => clearTimeout(timeoutId);
    }, [viewMode, searchTerm, statusFilter, sortBy, pagination.current_page, fetchDealsByCampaigns, fetchDeals]);

    const formatCurrency = useCallback((amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    }, []);

    const formatDate = useCallback((dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }, []);

    const getLastActivityDate = useCallback((deal: Deal): string | undefined => {
        const ts = deal.completed_at || deal.accepted_at || deal.responded_at || deal.invited_at;
        return ts ? formatDate(ts) : undefined;
    }, [formatDate]);

    const getFullImageUrl = useCallback((imagePath: string | null | undefined) => {
        if (!imagePath) return undefined;
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        // If it's a relative path, construct the full URL using backend domain
        return `http://localhost:8000${imagePath}`;
    }, []);

    const getStatusBadge = useCallback((status: string, display?: string) => {
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
    }, []);

    const getDealTypeBadge = useCallback((dealType?: string, dealTypeDisplay?: string) => {
        if (!dealType) return null;

        const config = getDealTypeConfig(dealType);
        const displayText = dealTypeDisplay || config.label;
        const finalText = displayText === 'Product Only' ? 'Barter Only' : displayText;

        return (
            <Badge className={`${config.bg} ${config.color} ${config.border} border text-xs font-medium shadow-sm`}>
                {config.icon} {finalText}
            </Badge>
        );
    }, []);

    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setSortBy("recent_activity_desc");
        setPagination(prev => ({...prev, current_page: 1}));
    };

    const handlePageChange = (page: number) => {
        setPagination(prev => ({...prev, current_page: page}));
    };

    const hasActiveFilters = searchTerm !== "" || statusFilter !== "all" || sortBy !== "recent_activity_desc";

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-4 max-w-7xl">
                {/* Compact Header */}
                <div
                    className="bg-gradient-to-r from-red-50 via-white to-rose-50 border border-red-200 rounded-xl shadow-md p-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 mb-1">
                                Deal Management
                            </h1>
                            <p className="text-sm text-gray-600">
                                Track and manage all your influencer collaborations across campaigns.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs text-gray-500">Total Deals</p>
                                <p className="text-sm font-medium text-gray-700">
                                    {pagination.total_items}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => viewMode === 'campaigns' ? fetchDealsByCampaigns() : fetchDeals()}
                                disabled={isLoading}
                                className="text-xs px-2 py-1 border-red-200 text-red-700 hover:bg-red-50"
                            >
                                <HiArrowPath className="h-3 w-3 mr-1"/>
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>

                {/* View Mode Tabs */}
                <div className="mb-4">
                    <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'campaigns' | 'deals')}>
                        <TabsList className="grid w-full max-w-md grid-cols-2">
                            <TabsTrigger value="campaigns">By Campaigns</TabsTrigger>
                            <TabsTrigger value="deals">All Deals</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Filters */}
                <div
                    className="bg-gradient-to-r from-white via-red-50/30 to-rose-50/50 rounded-xl border border-red-100 shadow-md p-3 mb-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <HiMagnifyingGlass className="h-5 w-5 text-red-500"/>
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
                                    <SelectValue placeholder="Status"/>
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
                                    <SelectValue placeholder="Sort by"/>
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
                                    <HiFunnel className="w-4 h-4 mr-2"/>
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                {isLoading && deals.length === 0 && campaigns.length === 0 && <DealListSkeleton/>}

                {!isLoading && (viewMode === 'campaigns' ? campaigns.length === 0 : deals.length === 0) && (
                    <Card
                        className="p-8 text-center bg-gradient-to-br from-red-50 via-white to-rose-50 border-0 shadow-lg">
                        <div className="flex flex-col items-center justify-center">
                            <div
                                className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                                <HiDocument className="w-8 h-8 text-white"/>
                            </div>
                            <h3 className="text-base font-semibold text-gray-900 mb-2">
                                {viewMode === 'campaigns' ? 'No Campaigns Found' : 'No Deals Found'}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4 max-w-md">
                                {hasActiveFilters ? "Try adjusting your search criteria or filters." : "Start by creating campaigns and sending deals to influencers."}
                            </p>
                            <div className="flex items-center justify-center gap-2">
                                {hasActiveFilters && (
                                    <Button variant="outline" size="sm" onClick={clearFilters}
                                            className="text-xs px-2 py-1">
                                        <HiArrowPath className="w-3 h-3 mr-1"/>
                                        Clear Filters
                                    </Button>
                                )}
                                <Button size="sm" onClick={() => router.push('/brand/campaigns/create')}
                                        className="text-xs px-2 py-1">
                                    <HiDocument className="w-3 h-3 mr-1"/>
                                    Create Campaign
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Campaigns View */}
                {campaigns.length > 0 && (
                    <div className={viewMode === 'campaigns' ? 'block' : 'hidden'}>
                        <div className="space-y-3">
                            {campaigns.map((campaign) => (
                                <Card key={campaign.id}
                                      className="shadow-md border-0 bg-gradient-to-r from-white via-red-50/20 to-rose-50/30 hover:shadow-lg hover:from-red-50/30 hover:to-rose-50/40 transition-all duration-200">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <CardTitle className="text-base font-semibold text-gray-900">
                                                        {campaign.title}
                                                    </CardTitle>
                                                    {getDealTypeBadge(campaign.deal_type, campaign.deal_type_display)}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-red-600">
                          <HiUsers className="w-3 h-3"/>
                            {campaign.total_invited || campaign.deals_count} deals
                        </span>
                                                    <span className="flex items-center gap-1 text-emerald-600">
                          <HiCheckCircle className="w-3 h-3"/>
                                                        {campaign.completed_deals} completed
                        </span>
                                                    <span className="flex items-center gap-1 text-rose-600">
                          <HiCurrencyDollar className="w-3 h-3"/>
                                                        {formatCurrency(campaign.total_value)}
                        </span>
                                                    {campaign.target_influencers && (
                                                        <span className="flex items-center gap-1 text-amber-600">
                            <HiUsers className="w-3 h-3"/>
                                                            {campaign.total_invited || campaign.deals_count}/{campaign.target_influencers} needed
                          </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm"
                                                        onClick={() => router.push(`/brand/campaigns/${campaign.id}`)}
                                                        className="text-xs px-2 py-1 border-red-200 text-red-700 hover:bg-red-50">
                                                    <HiEye className="w-3 h-3 mr-1"/>
                                                    View
                                                </Button>
                                                <Button size="sm"
                                                        onClick={() => window.open(`/brand/campaigns/${campaign.id}/deals`, '_blank')}
                                                        className="text-xs px-2 py-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700">
                                                    Manage
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent>
                                        <div className="space-y-2">
                                            {campaign.deals.slice(0, 3).map((deal) => (
                                                <div key={deal.id}
                                                     className="flex items-center justify-between p-2 bg-gradient-to-r from-white to-red-50/40 rounded-lg border border-red-100 hover:from-red-50/30 hover:to-rose-50/50 transition-all duration-200">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            {deal.influencer?.profile_image || deal.influencer?.avatar ? (
                                                                <img
                                                                    src={getFullImageUrl(deal.influencer.profile_image || deal.influencer.avatar)}
                                                                    alt={deal.influencer?.full_name || deal.influencer?.username || 'Influencer'}
                                                                    className="w-8 h-8 rounded-full object-cover"
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.style.display = 'none';
                                                                        target.nextElementSibling?.classList.remove('hidden');
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <div
                                                                className={`w-8 h-8 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold text-sm ${deal.influencer?.profile_image || deal.influencer?.avatar ? 'hidden' : ''}`}>
                                                                {(deal.influencer?.full_name || deal.influencer?.username || '?').charAt(0).toUpperCase()}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{deal.influencer?.full_name || deal.influencer?.username || 'Unknown Influencer'}</p>
                                                            <p className="text-xs text-gray-500">{deal.influencer?.username || 'N/A'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        {getStatusBadge(deal.status, deal.status_display)}
                                                        <span className="text-sm font-medium text-gray-700">
                            {formatCurrency(deal.value)}
                          </span>
                                                        <Button variant="ghost" size="sm"
                                                                onClick={() => window.open(`/brand/deals/${deal.id}`, '_blank')}
                                                                className="p-1 hover:bg-red-100">
                                                            <HiEye className="w-3 h-3"/>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}

                                            {campaign.deals.length > 3 && (
                                                <div className="text-center pt-2">
                                                    <Button variant="outline" size="sm"
                                                            onClick={() => window.open(`/brand/campaigns/${campaign.id}/deals`, '_blank')}
                                                            className="text-xs px-2 py-1 border-red-200 text-red-700 hover:bg-red-50">
                                                        View {campaign.deals.length - 3} more
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* All Deals View */}
                {deals.length > 0 && (
                    <div className={viewMode === 'deals' ? 'block' : 'hidden'}>
                        <div className="grid gap-2">
                            {deals.map((deal) => (
                                <Card
                                    key={deal.id}
                                    className="shadow-md border-0 bg-gradient-to-r from-white via-red-50/20 to-rose-50/20 hover:shadow-lg hover:from-red-50/30 hover:to-rose-50/30 transition-all duration-200 cursor-pointer group"
                                    onClick={() => window.open(`/brand/deals/${deal.id}`, '_blank')}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="relative flex-shrink-0">
                                                    {deal.influencer?.profile_image || deal.influencer?.avatar ? (
                                                        <img
                                                            src={getFullImageUrl(deal.influencer.profile_image || deal.influencer.avatar)}
                                                            alt={deal.influencer?.full_name || deal.influencer?.username || 'Influencer'}
                                                            className="w-12 h-12 rounded-full object-cover shadow-md ring-2 ring-white group-hover:ring-red-200 transition-all duration-200"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                target.nextElementSibling?.classList.remove('hidden');
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div
                                                        className={`w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white group-hover:ring-red-200 transition-all duration-200 ${deal.influencer?.profile_image || deal.influencer?.avatar ? 'hidden' : ''}`}>
                                                        {(deal.influencer?.full_name || deal.influencer?.username || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-base font-semibold text-gray-900 group-hover:text-red-700 transition-colors duration-200 truncate">
                                                            {deal.influencer?.full_name || deal.influencer?.username || 'Unknown Influencer'}
                                                        </h3>
                                                        {getStatusBadge(deal.status, deal.status_display)}
                                                    </div>
                                                    <p className="text-sm text-gray-500 mb-1">@{deal.influencer?.username || 'N/A'}</p>
                                                    <p className="text-sm text-red-600 font-medium group-hover:text-red-700 transition-colors duration-200 truncate">
                                                        {deal.campaign?.title || 'Untitled Campaign'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 capitalize">
                                                        {deal.campaign?.deal_type || 'Unknown Type'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 flex-shrink-0">
                                                <div className="text-right">
                                                    <p className="text-base font-bold text-gray-900 group-hover:text-red-700 transition-colors duration-200">
                                                        {formatCurrency(deal.value)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {getLastActivityDate(deal) || 'No activity'}
                                                    </p>
                                                    {deal.status === 'completed' && typeof deal.brand_rating === 'number' && (
                                                        <p className="text-xs text-gray-600 mt-1">You
                                                            rated: {deal.brand_rating}/5 ⭐</p>
                                                    )}
                                                </div>

                                                {deal.status === 'completed' && typeof deal.brand_rating !== 'number' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedDealForRating(deal);
                                                            setRatingDialogOpen(true);
                                                        }}
                                                        className="text-xs px-2 py-1 border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                                                    >
                                                        <HiStar className="w-3 h-3 mr-1"/>
                                                        Rate
                                                    </Button>
                                                )}


                                                <div
                                                    className="w-8 h-8 rounded-full bg-red-100 group-hover:bg-red-200 flex items-center justify-center transition-all duration-200">
                                                    <HiEye className="w-4 h-4 text-red-600 group-hover:text-red-700"/>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {!isLoading && pagination.total_pages > 1 && (
                    <div
                        className="flex items-center justify-between mt-6 p-3 bg-gradient-to-r from-white via-red-50/30 to-rose-50/30 rounded-xl border border-red-100 shadow-md">
                        <div className="text-xs text-gray-600">
                            Showing {((pagination.current_page - 1) * pagination.items_per_page) + 1} to{' '}
                            {Math.min(pagination.current_page * pagination.items_per_page, pagination.total_items)} of{' '}
                            {pagination.total_items} deals
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.current_page === 1}
                                onClick={() => handlePageChange(pagination.current_page - 1)}
                                className="text-xs px-2 py-1"
                            >
                                <HiChevronLeft className="w-3 h-3"/>
                                Prev
                            </Button>

                            <div className="flex items-center gap-1">
                                {Array.from({length: pagination.total_pages}, (_, i) => i + 1)
                                    .filter(page => {
                                        const current = pagination.current_page;
                                        return page === 1 || page === pagination.total_pages || (page >= current - 1 && page <= current + 1);
                                    })
                                    .map((page, index, array) => (
                                        <div key={page}>
                                            {index > 0 && array[index - 1] !== page - 1 && (
                                                <span className="px-1 text-gray-400 text-xs">...</span>
                                            )}
                                            <Button
                                                variant={page === pagination.current_page ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handlePageChange(page)}
                                                className="w-7 h-7 p-0 text-xs"
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
                                className="text-xs px-2 py-1"
                            >
                                Next
                                <HiChevronRight className="w-3 h-3"/>
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Rating Dialog */}
            {selectedDealForRating && (
                <RatingDialog
                    open={ratingDialogOpen}
                    onOpenChange={setRatingDialogOpen}
                    dealId={selectedDealForRating.id}
                    targetName={selectedDealForRating.influencer?.full_name || selectedDealForRating.influencer?.username || 'Influencer'}
                    ratingType="influencer"
                    onRatingSubmitted={() => {
                        if (viewMode === 'campaigns') {
                            fetchDealsByCampaigns();
                        } else {
                            fetchDeals();
                        }
                    }}
                />
            )}
        </div>
    );
} 