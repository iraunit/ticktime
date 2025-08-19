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
import { HiMagnifyingGlass, HiFunnel, HiXMark } from "react-icons/hi2";
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
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border shadow-sm rounded-lg overflow-hidden">
      {/* Compact Filter Header */}
      <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HiFunnel className="h-4 w-4 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">Filter & Search</h3>
            {hasActiveFilters && (
              <Badge className="bg-blue-100 text-blue-800 px-1.5 py-0.5 text-xs font-medium">
                Active
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 text-xs"
              >
                <HiXMark className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 text-xs lg:hidden"
            >
              {isExpanded ? "Hide" : "Show"} Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Compact Filter Content - Stacked for sidebar */}
      <div className={`p-3 ${isExpanded ? 'block' : 'hidden'} lg:block`}>
        <div className="space-y-3">
          {/* Search Input */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Search Deals
            </label>
            <div className="relative">
              <HiMagnifyingGlass className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by brand, title, or description..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-md text-sm"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Status
            </label>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="border border-gray-200 focus:border-blue-500 rounded-md py-1.5 text-sm">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center space-x-2">
                      {option.value !== "all" && (
                        <div
                          className={`w-2 h-2 rounded-full bg-${option.color}-500`}
                        />
                      )}
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Deal Type Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Deal Type
            </label>
            <Select value={dealTypeFilter} onValueChange={onDealTypeFilterChange}>
              <SelectTrigger className="border border-gray-200 focus:border-blue-500 rounded-md py-1.5 text-sm">
                <SelectValue placeholder="Select type" />
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
        </div>

        {/* Compact Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-3 pt-2 border-t border-gray-100">
            <div className="flex flex-col space-y-1.5">
              <span className="text-xs font-medium text-gray-700">Active filters:</span>
              
              {searchQuery && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 self-start">
                  Search: "{searchQuery}"
                  <button
                    onClick={() => onSearchChange("")}
                    className="ml-1 hover:text-blue-900"
                  >
                    <HiXMark className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 self-start">
                  Status: {statusOptions.find(s => s.value === statusFilter)?.label}
                  <button
                    onClick={() => onStatusFilterChange("all")}
                    className="ml-1 hover:text-green-900"
                  >
                    <HiXMark className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {dealTypeFilter !== "all" && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs px-1.5 py-0.5 self-start">
                  Type: {dealTypeOptions.find(t => t.value === dealTypeFilter)?.label}
                  <button
                    onClick={() => onDealTypeFilterChange("all")}
                    className="ml-1 hover:text-purple-900"
                  >
                    <HiXMark className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}