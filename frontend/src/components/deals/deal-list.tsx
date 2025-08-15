"use client";

import { useState, useMemo } from "react";
import { Deal } from "@/types";
import { DealCard } from "./deal-card";
import { DealFilters } from "./deal-filters";
import { Button } from "@/components/ui/button";
import { HiArrowPath, HiBriefcase } from "react-icons/hi2";
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
  }, [deals, searchQuery, statusFilter, dealTypeFilter]);

  // Sort deals by priority (invited and urgent first, then by date)
  const sortedDeals = useMemo(() => {
    return [...filteredDeals].sort((a, b) => {
      // Priority order: invited (urgent) > invited > active > others
      const getPriority = (deal: Deal) => {
        const deadline = deal?.campaign?.application_deadline || new Date().toISOString();
        const daysRemaining = Math.ceil(
          (new Date(deadline).getTime() - new Date().getTime()) / 
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
      return new Date(b?.invited_at || 0).getTime() - new Date(a?.invited_at || 0).getTime();
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
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="flex justify-center space-x-3 mb-6">
              {[
                { color: 'from-blue-500 to-indigo-500', delay: 0 },
                { color: 'from-indigo-500 to-purple-500', delay: 0.15 },
                { color: 'from-purple-500 to-pink-500', delay: 0.3 }
              ].map((ball, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full bg-gradient-to-r shadow-lg ${ball.color}`}
                  style={{
                    animation: `bigBounce 1.2s ease-in-out ${ball.delay}s infinite`,
                  }}
                />
              ))}
            </div>
            <p className="text-lg font-semibold text-gray-700">Loading your deals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Enhanced Header with stats */}
      <div className="bg-white rounded-xl border shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
              <HiBriefcase className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-blue-600 flex-shrink-0" />
              <span>Your Deals</span>
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-2 gap-1 sm:gap-0">
              <p className="text-sm sm:text-base text-gray-600">
                {filteredDeals.length} of {deals.length} deals
              </p>
              {hasActiveFilters && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full self-start">
                  Filtered
                </span>
              )}
            </div>
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 rounded-lg px-3 sm:px-4 py-2 self-start sm:self-auto"
            >
              <HiArrowPath className={cn("h-4 w-4 mr-1 sm:mr-2", { "animate-spin": isLoading })} />
              <span className="text-xs sm:text-sm">Refresh</span>
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-6">
          {[
            { label: "Total", value: deals.length, color: "blue" },
            { label: "Invited", value: deals.filter(d => d.status === "invited").length, color: "orange" },
            { label: "Active", value: deals.filter(d => d.status === "active").length, color: "green" },
            { label: "Completed", value: deals.filter(d => d.status === "completed").length, color: "purple" }
          ].map((stat, index) => (
            <div key={index} className={`bg-${stat.color}-50 border border-${stat.color}-200 rounded-lg p-2 sm:p-3`}>
              <div className={`text-base sm:text-lg font-bold text-${stat.color}-600`}>{stat.value}</div>
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

      {/* Deal Cards */}
      {sortedDeals.length === 0 ? (
        <div className="text-center py-12 sm:py-16">
          <div className="mx-auto max-w-md px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
              <HiBriefcase className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
              {hasActiveFilters ? "No deals match your filters" : "No deals yet"}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
              {hasActiveFilters 
                ? "Try adjusting your search or filter criteria to find more opportunities."
                : "When brands invite you to collaborate, they'll appear here. Complete your profile to get started!"
              }
            </p>
            {hasActiveFilters ? (
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 px-4 sm:px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
              >
                Clear Filters
              </Button>
            ) : (
              <Button 
                asChild
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
              >
                <a href="/profile">Complete Profile</a>
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

      {/* Enhanced Loading overlay for refresh */}
      {isLoading && deals.length > 0 && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl border border-gray-200 max-w-sm mx-4">
            <div className="text-center">
              <div className="flex justify-center space-x-2 mb-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-bounce shadow-md"
                    style={{
                      animationDelay: `${i * 0.15}s`,
                      animationDuration: '1s'
                    }}
                  />
                ))}
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">Updating deals...</p>
              <p className="text-sm text-gray-600">Fetching the latest opportunities for you</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}