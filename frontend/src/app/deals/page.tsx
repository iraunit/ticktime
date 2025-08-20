"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { DealList } from "@/components/deals/deal-list";
import { DealFilters } from "@/components/deals/deal-filters";
import { useDeals } from "@/hooks/use-deals";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RequireInfluencerAuth } from "@/components/auth/require-influencer-auth";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { HiArrowPath, HiBriefcase } from "react-icons/hi2";
import { cn } from "@/lib/utils";

export default function DealsPage() {
  const router = useRouter();
  const { deals, acceptDeal, rejectDeal } = useDeals();
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

  const handleAccept = async (dealId: number) => {
    try {
      await acceptDeal.mutateAsync(dealId);
      toast.success("Deal accepted successfully!");
    } catch (error) {
      toast.error("Failed to accept deal. Please try again.");
    }
  };

  const handleReject = async (dealId: number, reason?: string) => {
    try {
      await rejectDeal.mutateAsync({ id: dealId, reason });
      toast.success("Deal declined successfully.");
    } catch (error) {
      toast.error("Failed to decline deal. Please try again.");
    }
  };

  const handleViewDetails = (dealId: number) => {
    router.push(`/deals/${dealId}`);
  };

  const handleMessage = (dealId: number) => {
    router.push(`/messages?deal=${dealId}`);
  };

  const handleRefresh = () => {
    deals.refetch();
  };

  return (
    <RequireInfluencerAuth>
      <MainLayout showFooter={false}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 max-w-7xl">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Left Sidebar - Filters and Stats */}
              <div className="lg:w-80 flex-shrink-0">
                <div className="sticky top-4 space-y-4">
                  {/* Header with Stats */}
                  <div className="bg-white rounded-lg border shadow-sm p-3">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-bold text-gray-900 flex items-center">
                        <HiBriefcase className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                        <span>Your Deals</span>
                      </h2>
                      {handleRefresh && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRefresh}
                          disabled={isLoading}
                          className="border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 rounded-lg px-2 py-1"
                        >
                          <HiArrowPath className={cn("h-4 w-4", { "animate-spin": isLoading })} />
                        </Button>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      {filteredDeals.length} of {dealsData.length} deals
                      {hasActiveFilters && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          Filtered
                        </span>
                      )}
                    </div>

                    {/* Compact Stats */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Total", value: dealsData.length, color: "blue" },
                        { label: "Invited", value: dealsData.filter(d => d.status === "invited").length, color: "orange" },
                        { label: "Active", value: dealsData.filter(d => d.status === "active").length, color: "green" },
                        { label: "Completed", value: dealsData.filter(d => d.status === "completed").length, color: "purple" }
                      ].map((stat, index) => (
                        <div key={index} className={`bg-${stat.color}-50 border border-${stat.color}-200 rounded-lg p-2`}>
                          <div className={`text-lg font-bold text-${stat.color}-600`}>{stat.value}</div>
                          <div className="text-xs text-gray-600">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Filters */}
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

              {/* Right Column - Deals List */}
              <div className="flex-1">
                <DealList
                  deals={filteredDeals}
                  isLoading={isLoading}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onViewDetails={handleViewDetails}
                  onMessage={handleMessage}
                  onRefresh={handleRefresh}
                  showHeader={false}
                />
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </RequireInfluencerAuth>
  );
}