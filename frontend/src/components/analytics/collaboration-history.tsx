"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAnalytics } from "@/hooks/use-analytics";
import { CollaborationHistory as CollaborationHistoryType } from "@/types";
import { 
  HiArrowDownTray, 
  HiStar, 
  HiCalendarDays,
  HiBanknotes,
  HiBuildingOffice2,
  HiFunnel
} from "react-icons/hi2";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandRatingDialog } from "./brand-rating-dialog";

export function CollaborationHistory() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [selectedCollaboration, setSelectedCollaboration] = useState<CollaborationHistoryType | null>(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);

  const { collaborationHistory } = useAnalytics();

  const handleExport = () => {
    // Create CSV content
    const csvContent = [
      ['Brand', 'Campaign', 'Deal Type', 'Value', 'Platforms', 'Status', 'Completed Date', 'Rating'].join(','),
      ...((collaborationHistory.data as any)?.results || collaborationHistory.data?.collaborations || []).map((collaboration: CollaborationHistoryType) => [
        collaboration.brand.name,
        collaboration.campaign_title,
        collaboration.deal_type,
        collaboration.total_value,
        collaboration.platforms.join(';'),
        collaboration.status,
        collaboration.completed_at || '',
        collaboration.rating || ''
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'collaboration-history.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (collaborationHistory.isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Loading Header */}
        <div className="bg-white rounded-xl border shadow-lg p-4 sm:p-6">
          <Skeleton className="h-5 sm:h-6 w-40 sm:w-48 mb-2" />
          <Skeleton className="h-4 w-72 sm:w-96" />
        </div>
        
        {/* Loading Filters */}
        <div className="bg-white rounded-xl border shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Skeleton className="h-10 w-full sm:w-32" />
            <Skeleton className="h-10 w-full sm:w-32" />
            <Skeleton className="h-10 w-full sm:w-24" />
          </div>
        </div>
        
        {/* Loading List */}
        <div className="space-y-3 sm:space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-xl border shadow-lg">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const collaborations = ((collaborationHistory.data as any)?.results || collaborationHistory.data?.collaborations || []) as CollaborationHistoryType[];
  const brands: string[] = Array.from(new Set(collaborations.map((c: CollaborationHistoryType) => c.brand.name)));

  // Filter collaborations
  const filteredCollaborations = collaborations.filter((collaboration: CollaborationHistoryType) => {
    const statusMatch = statusFilter === "all" || collaboration.status === statusFilter;
    const brandMatch = brandFilter === "all" || collaboration.brand.name === brandFilter;
    return statusMatch && brandMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300';
      case 'in_progress':
        return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300';
      case 'cancelled':
        return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-300';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300';
    }
  };

  const openRatingDialog = (collaboration: CollaborationHistoryType) => {
    setSelectedCollaboration(collaboration);
    setShowRatingDialog(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Enhanced Header - Mobile Optimized */}
      <div className="bg-white rounded-xl border shadow-lg p-4 sm:p-6">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <HiCalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">Collaboration History</h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Track your past collaborations and performance</p>
          </div>
        </div>
      </div>

      {/* Enhanced Filters - Mobile Optimized */}
      <Card className="rounded-xl border shadow-lg">
        <CardHeader className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                <HiFunnel className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-gray-900">Filter & Export</CardTitle>
                <p className="text-xs sm:text-sm text-gray-600">Customize your view</p>
              </div>
            </div>
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              className="border-2 border-green-200 hover:border-green-400 hover:bg-green-50 text-green-700 hover:text-green-800 transition-all duration-200 self-start sm:self-auto"
            >
              <HiArrowDownTray className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">Export CSV</span>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-2 border-gray-200 focus:border-blue-400 text-sm">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2 block">Brand</label>
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger className="border-2 border-gray-200 focus:border-blue-400 text-sm">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map((brand: string) => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <div className="w-full">
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2 block">Results</label>
                <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-md text-sm font-medium text-blue-800">
                  {filteredCollaborations.length} found
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collaboration List - Mobile Optimized */}
      <div className="space-y-3 sm:space-y-4">
        {filteredCollaborations.length > 0 ? (
          filteredCollaborations.map((collaboration: CollaborationHistoryType) => (
            <Card key={collaboration.id} className="rounded-xl border shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  {/* Brand Logo */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                      <HiBuildingOffice2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">{collaboration.brand.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{collaboration.campaign_title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-2">
                        <span className="text-xs text-gray-500">{collaboration.deal_type.replace('_', ' ')}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{collaboration.platforms.join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Layout: Value and Details */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    {/* Value */}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <HiBanknotes className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm sm:text-base font-bold text-green-600">
                        ₹{collaboration.total_value.toLocaleString()}
                      </span>
                    </div>

                    {/* Status */}
                    <Badge className={`px-2 py-1 text-xs font-medium border ${getStatusColor(collaboration.status)}`}>
                      {collaboration.status.replace('_', ' ').toUpperCase()}
                    </Badge>

                    {/* Rating & Date */}
                    <div className="flex flex-col sm:items-end gap-1">
                      {collaboration.rating && (
                        <div className="flex items-center gap-1">
                          <HiStar className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs font-medium text-gray-700">{collaboration.rating}/5</span>
                        </div>
                      )}
                      {collaboration.completed_at && (
                        <div className="flex items-center gap-1">
                          <HiCalendarDays className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {new Date(collaboration.completed_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Rate Button */}
                    {collaboration.status === 'completed' && !collaboration.rating && (
                      <Button
                        onClick={() => openRatingDialog(collaboration)}
                        size="sm"
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 text-xs px-3 py-1.5"
                      >
                        Rate Brand
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 sm:py-16">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <HiCalendarDays className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">No collaborations found</h3>
            <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto leading-relaxed">
              {statusFilter !== "all" || brandFilter !== "all" 
                ? "Try adjusting your filters to see more results."
                : "Start collaborating with brands to see your history here."
              }
            </p>
          </div>
        )}
      </div>

      {/* Rating Dialog */}
      {selectedCollaboration && (
        <BrandRatingDialog
          collaboration={selectedCollaboration}
          open={showRatingDialog}
          onOpenChange={setShowRatingDialog}
          onRatingSubmitted={() => {
            setShowRatingDialog(false);
            setSelectedCollaboration(null);
          }}
        />
      )}
         </div>
   );
 }
