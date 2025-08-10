"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X } from "@/lib/icons";
import { DealStatus } from "@/types";

interface DealFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  dealTypeFilter: string;
  onDealTypeFilterChange: (type: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const statusOptions: { value: string; label: string; color: string }[] = [
  { value: "all", label: "All Statuses", color: "default" },
  { value: "invited", label: "Invited", color: "blue" },
  { value: "accepted", label: "Accepted", color: "green" },
  { value: "active", label: "Active", color: "purple" },
  { value: "content_submitted", label: "Content Submitted", color: "indigo" },
  { value: "under_review", label: "Under Review", color: "orange" },
  { value: "approved", label: "Approved", color: "emerald" },
  { value: "completed", label: "Completed", color: "gray" },
  { value: "rejected", label: "Rejected", color: "red" },
];

const dealTypeOptions = [
  { value: "all", label: "All Types" },
  { value: "paid", label: "Paid" },
  { value: "barter", label: "Barter" },
  { value: "hybrid", label: "Hybrid" },
];

export function DealFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  dealTypeFilter,
  onDealTypeFilterChange,
  onClearFilters,
  hasActiveFilters,
}: DealFiltersProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search deals by brand, campaign title..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-4"
        />
      </div>

      {/* Desktop Filters */}
      <div className="hidden md:flex items-center gap-4">
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dealTypeFilter} onValueChange={onDealTypeFilterChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {dealTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Mobile Filter Toggle */}
      <div className="md:hidden flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          <Filter className="h-4 w-4 mr-1" />
          Filters
        </Button>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Mobile Filters */}
      {showMobileFilters && (
        <div className="md:hidden space-y-3 p-4 bg-gray-50 rounded-lg">
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dealTypeFilter} onValueChange={onDealTypeFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {dealTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="text-xs">
              Status: {statusOptions.find(s => s.value === statusFilter)?.label}
            </Badge>
          )}
          {dealTypeFilter !== "all" && (
            <Badge variant="secondary" className="text-xs">
              Type: {dealTypeOptions.find(t => t.value === dealTypeFilter)?.label}
            </Badge>
          )}
          {searchQuery && (
            <Badge variant="secondary" className="text-xs">
              Search: "{searchQuery}"
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}