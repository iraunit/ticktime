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
      ...(collaborationHistory.data?.results || []).map((collaboration: CollaborationHistoryType) => [
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
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rejected':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getDealTypeColor = (dealType: string) => {
    switch (dealType) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'barter':
        return 'bg-purple-100 text-purple-800';
      case 'hybrid':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCollaborations = (collaborationHistory.data as CollaborationHistoryType[] | undefined)?.filter((collaboration: CollaborationHistoryType) => {
    const statusMatch = statusFilter === "all" || collaboration.status === statusFilter;
    const brandMatch = brandFilter === "all" || collaboration.brand.name === brandFilter;
    return statusMatch && brandMatch;
  }) || [];

  const uniqueBrands: string[] = Array.from(
    new Set(((collaborationHistory.data as CollaborationHistoryType[] | undefined) || []).map((c: CollaborationHistoryType) => c.brand.name))
  );

  if (collaborationHistory.isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <HiFunnel className="h-5 w-5" />
              Filters & Export
            </CardTitle>
            <Button onClick={handleExport} variant="outline" size="sm">
                              <HiArrowDownTray className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {uniqueBrands.map((brand) => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collaboration List */}
      <div className="space-y-4">
        {filteredCollaborations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No collaborations found matching your filters.</p>
            </CardContent>
          </Card>
        ) : (
          filteredCollaborations.map((collaboration: CollaborationHistoryType) => (
            <Card key={collaboration.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <HiBuildingOffice2 className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold">{collaboration.brand.name}</h3>
                      </div>
                      <Badge className={getDealTypeColor(collaboration.deal_type)}>
                        {collaboration.deal_type}
                      </Badge>
                      <Badge className={getStatusColor(collaboration.status)}>
                        {collaboration.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {collaboration.campaign_title}
                    </p>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1">
                        <HiBanknotes className="h-4 w-4 text-muted-foreground" />
                        <span>₹{collaboration.total_value.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Platforms:</span>
                        <span>{collaboration.platforms.join(', ')}</span>
                      </div>

                      {collaboration.completed_at && (
                        <div className="flex items-center gap-1">
                          <HiCalendarDays className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(collaboration.completed_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {collaboration.rating ? (
                      <div className="flex items-center gap-1">
                        <HiStar className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{collaboration.rating}</span>
                      </div>
                    ) : collaboration.status === 'completed' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCollaboration(collaboration);
                          setShowRatingDialog(true);
                        }}
                      >
                        <HiStar className="h-4 w-4 mr-1" />
                        Rate
                      </Button>
                    ) : null}
                  </div>
                </div>

                {collaboration.review && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm">{collaboration.review}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Brand Rating Dialog */}
      {selectedCollaboration && (
        <BrandRatingDialog
          open={showRatingDialog}
          onOpenChange={setShowRatingDialog}
          collaboration={selectedCollaboration}
          onRatingSubmitted={() => {
            setShowRatingDialog(false);
            setSelectedCollaboration(null);
          }}
        />
      )}
    </div>
  );
}