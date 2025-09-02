"use client";

import {DealList} from "@/components/deals/deal-list";
import {DealFilters} from "@/components/deals/deal-filters";
import {useDealMutations, useDeals} from "@/hooks/use-deals";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {useMemo, useState} from "react";
import {Button} from "@/components/ui/button";
import {HiArrowPath, HiBriefcase} from "react-icons/hi2";
import {cn} from "@/lib/utils";

export default function InfluencerDealsPage() {
    const router = useRouter();
    const {deals} = useDeals();
    const {acceptDeal, rejectDeal} = useDealMutations();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dealTypeFilter, setDealTypeFilter] = useState("all");

    const dealsData = deals.data || [];
    const isLoading = deals.isLoading || acceptDeal.isPending || rejectDeal.isPending;

    // Filter and search deals
    const filteredDeals = useMemo(() => {
        return dealsData.filter((deal) => {
            // Search filter
            const title = (deal?.campaign?.title || '').toLowerCase();
            const brandName = (deal?.campaign?.brand?.name || '').toLowerCase();
            const desc = (deal?.campaign?.description || '').toLowerCase();
            const matchesSearch = searchQuery === "" ||
                title.includes(searchQuery.toLowerCase()) ||
                brandName.includes(searchQuery.toLowerCase()) ||
                desc.includes(searchQuery.toLowerCase());

            // Status filter
            const matchesStatus = statusFilter === "all" || deal.status === statusFilter;

            // Deal type filter
            const matchesType = dealTypeFilter === "all" || deal?.campaign?.deal_type === dealTypeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [dealsData, searchQuery, statusFilter, dealTypeFilter]);

    const hasActiveFilters = searchQuery !== "" || statusFilter !== "all" || dealTypeFilter !== "all";

    const clearFilters = () => {
        setSearchQuery("");
        setStatusFilter("all");
        setDealTypeFilter("all");
    };

    const handleAcceptDeal = async (dealId: number) => {
        try {
            console.log('Deals page: handleAcceptDeal called for deal:', dealId);
            await acceptDeal.mutateAsync(dealId);
            toast.success("Deal accepted successfully!");
        } catch (error) {
            console.error('Deals page: handleAcceptDeal failed:', error);
            toast.error("Failed to accept deal. Please try again.");
        }
    };

    const handleRejectDeal = async (dealId: number) => {
        try {
            console.log('Deals page: handleRejectDeal called for deal:', dealId);
            await rejectDeal.mutateAsync({id: dealId});
            toast.success("Deal rejected successfully.");
        } catch (error) {
            console.error('Deals page: handleRejectDeal failed:', error);
            toast.error("Failed to reject deal. Please try again.");
        }
    };

    const handleRefresh = () => {
        deals.refetch();
        toast.success("Deals refreshed");
    };

    return (
        <div className="container mx-auto px-4 py-4 max-w-7xl">
            {/* Enhanced Header */}
            <div className="relative mb-6">
                {/* Background decoration */}
                <div
                    className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 rounded-xl -m-2"></div>

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-1 flex items-center gap-2">
                            Your Deals
                            <div
                                className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                                <HiBriefcase className="w-3 h-3 text-white"/>
                            </div>
                        </h1>
                        <p className="text-sm text-gray-600 max-w-2xl">
                            Manage your collaboration deals and track their progress
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs text-gray-500">Total deals</p>
                            <p className="text-xs font-medium text-gray-700">
                                {filteredDeals.length} of {dealsData.length}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className="border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 rounded-lg px-4 py-2"
                        >
                            <HiArrowPath className="h-4 w-4 mr-1"/>
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>

            {/* Desktop: Side-by-side layout, Mobile: Stacked layout */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Column - Filters (Desktop) / Top Section (Mobile) */}
                <div className="lg:w-80 lg:flex-shrink-0">
                    <div className="mb-6">
                        <div className="flex items-center mb-3">
                            <div
                                className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full mr-3"></div>
                            <h2 className="text-lg font-bold text-gray-900">Filter & Search</h2>
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="ml-auto text-xs text-gray-500 hover:text-gray-700"
                                >
                                    Clear filters
                                </Button>
                            )}
                        </div>
                        <div className={cn(
                            "bg-white rounded-xl border border-gray-200 shadow-sm p-4",
                            "transition-all duration-200 hover:shadow-md"
                        )}>
                            <DealFilters
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                                statusFilter={statusFilter}
                                onStatusFilterChange={setStatusFilter}
                                dealTypeFilter={dealTypeFilter}
                                onDealTypeFilterChange={setDealTypeFilter}
                                onClearFilters={clearFilters}
                                hasActiveFilters={hasActiveFilters}
                            />
                        </div>
                    </div>

                    {/* Deal Stats - Visible only on desktop */}
                    <div className="hidden lg:block">
                        <div className="flex items-center mb-3">
                            <div
                                className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full mr-3"></div>
                            <h2 className="text-sm font-bold text-gray-900">Deal Statistics</h2>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Total Deals</span>
                                <span className="text-sm font-semibold text-gray-900">{dealsData.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Filtered Results</span>
                                <span className="text-sm font-semibold text-gray-900">{filteredDeals.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Active Filters</span>
                                <span className="text-sm font-semibold text-gray-900">
                                    {hasActiveFilters ? "Yes" : "None"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Deal List (Desktop) / Bottom Section (Mobile) */}
                <div className="flex-1 min-w-0">
                    <div className="mb-6">
                        <div className="flex items-center mb-3">
                            <div
                                className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full mr-3"></div>
                            <h2 className="text-lg font-bold text-gray-900">
                                {hasActiveFilters ? "Filtered Results" : "All Deals"}
                            </h2>
                            <div className="ml-2 px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">
                                {filteredDeals.length}
                            </div>
                        </div>

                        <div className={cn(
                            "bg-white rounded-xl border border-gray-200 shadow-sm",
                            "transition-all duration-200 hover:shadow-md"
                        )}>
                            <DealList
                                deals={filteredDeals}
                                onAccept={handleAcceptDeal}
                                onReject={handleRejectDeal}
                                isLoading={isLoading}
                                showHeader={false}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {!isLoading && filteredDeals.length === 0 && (
                <div className="text-center py-12">
                    <div
                        className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                        <HiBriefcase className="w-8 h-8 text-blue-600"/>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {hasActiveFilters ? "No deals match your filters" : "No deals yet"}
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        {hasActiveFilters
                            ? "Try adjusting your search criteria or clearing the filters to see more results."
                            : "Start collaborating with brands to see your deals here. Check out the opportunities on your dashboard!"
                        }
                    </p>
                    {hasActiveFilters && (
                        <Button onClick={clearFilters} size="lg"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                            Clear Filters
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
