"use client";

import { useState, useMemo } from "react";
import { Deal } from "@/types";
import { DealCard } from "./deal-card";
import { DealFilters } from "./deal-filters";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface DealListProps {
  deals: Deal[];
  isLoading?: boolean;
  onAccept?: (dealId: number) => void;
  onReject?: (dealId: number, reason?: string) => void;
  onViewDetails?: (dealId: number) => void;
  onMessage?: (dealId: number) => void;
  onRefresh?: () => void;
  className?: string;
}

export function DealList({
  deals,
  isLoading = false,
  onAccept,
  onReject,
  onViewDetails,
  onMessage,
  onRefresh,
  className,
}: DealListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dealTypeFilter, setDealTypeFilter] = useState("all");

  // Filter and search deals
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        deal.campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.campaign.brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.campaign.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === "all" || deal.status === statusFilter;

      // Deal type filter
      const matchesType = dealTypeFilter === "all" || deal.campaign.deal_type === dealTypeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [deals, searchQuery, statusFilter, dealTypeFilter]);

  // Sort deals by priority (invited and urgent first, then by date)
  const sortedDeals = useMemo(() => {
    return [...filteredDeals].sort((a, b) => {
      // Priority order: invited (urgent) > invited > active > others
      const getPriority = (deal: Deal) => {
        const daysRemaining = Math.ceil(
          (new Date(deal.campaign.application_deadline).getTime() - new Date().getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        
        if (deal.status === "invited") {
          if (daysRemaining <= 2 && daysRemaining > 0) return 1; // Urgent
          return 2; // Regular invited
        }
        if (deal.status === "active") return 3;
        if (deal.status === "accepted") return 4;
        return 5; // Others
      };

      const priorityA = getPriority(a);
      const priorityB = getPriority(b);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // If same priority, sort by date (newest first)
      return new Date(b.invited_at).getTime() - new Date(a.invited_at).getTime();
    });
  }, [filteredDeals]);

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all" || dealTypeFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDealTypeFilter("all");
  };

  if (isLoading && deals.length === 0) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Your Deals
          </h2>
          <p className="text-muted-foreground">
            {filteredDeals.length} of {deals.length} deals
          </p>
        </div>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", { "animate-spin": isLoading })} />
            Refresh
          </Button>
        )}
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

      {/* Deal Cards */}
      {sortedDeals.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {hasActiveFilters ? "No deals match your filters" : "No deals yet"}
            </h3>
            <p className="text-gray-500 mb-4">
              {hasActiveFilters 
                ? "Try adjusting your search or filter criteria."
                : "When brands invite you to collaborate, they'll appear here."
              }
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {sortedDeals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onAccept={onAccept}
              onReject={onReject}
              onViewDetails={onViewDetails}
              onMessage={onMessage}

              isLoading={isLoading}
              className="w-full"
            />
          ))}
        </div>
      )}

      {/* Loading overlay for refresh */}
      {isLoading && deals.length > 0 && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">Updating deals...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}