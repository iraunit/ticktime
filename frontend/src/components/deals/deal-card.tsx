"use client";

import { useState } from "react";
import { useClientTime } from "@/hooks/use-client-time";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Deal } from "@/types";
import { cn } from "@/lib/utils";
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  MapPin, 
  Star,
  Users,
  Instagram,
  Youtube,
  Twitter,
  Facebook
} from "@/lib/icons";
import Image from "next/image";
import { DealActions } from "./deal-actions";
import { ContentSubmissionModal } from "./content-submission";

interface DealCardProps {
  deal: Deal;
  onAccept?: (dealId: number) => void;
  onReject?: (dealId: number, reason?: string) => void;
  onViewDetails?: (dealId: number) => void;
  onMessage?: (dealId: number) => void;
  isLoading?: boolean;
  className?: string;
}

const statusColors = {
  invited: "bg-blue-100 text-blue-800 border-blue-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  accepted: "bg-green-100 text-green-800 border-green-200",
  active: "bg-purple-100 text-purple-800 border-purple-200",
  content_submitted: "bg-indigo-100 text-indigo-800 border-indigo-200",
  under_review: "bg-orange-100 text-orange-800 border-orange-200",
  revision_requested: "bg-red-100 text-red-800 border-red-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  completed: "bg-gray-100 text-gray-800 border-gray-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
  dispute: "bg-red-100 text-red-800 border-red-200",
};

const dealTypeColors = {
  paid: "bg-green-100 text-green-800",
  barter: "bg-blue-100 text-blue-800", 
  hybrid: "bg-purple-100 text-purple-800",
};

const platformIcons = {
  Instagram: Instagram,
  YouTube: Youtube,
  Twitter: Twitter,
  Facebook: Facebook,
};

export function DealCard({
  deal,
  onAccept,
  onReject,
  onViewDetails,
  onMessage,
  isLoading = false,
  className,
}: DealCardProps) {
  const [showContentSubmission, setShowContentSubmission] = useState(false);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const { getDaysRemaining } = useClientTime();

  const applicationDeadline = deal?.campaign?.application_deadline || new Date().toISOString();
  const daysRemaining = getDaysRemaining(applicationDeadline);
  const isUrgent = daysRemaining <= 2 && daysRemaining > 0;
  const isExpired = daysRemaining < 0;

  return (
    <>
    <Card className={cn(
      "transition-all hover:shadow-lg border-l-4",
      {
        "border-l-red-500": isUrgent || deal.status === "rejected" || deal.status === "cancelled",
        "border-l-gray-400": isExpired,
        "border-l-blue-500": deal.status === "invited" && !isUrgent && !isExpired,
        "border-l-green-500": deal.status === "accepted" || deal.status === "active",
        "border-l-purple-500": deal.status === "content_submitted" || deal.status === "under_review",
        "border-l-emerald-500": deal.status === "approved" || deal.status === "completed",
      },
      className
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {deal?.campaign?.brand?.logo && (
              <div className="flex-shrink-0">
                <Image
                  src={deal.campaign.brand.logo}
                  alt={deal?.campaign?.brand?.name || 'Brand'}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">
                {deal?.campaign?.title || 'Campaign'}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-sm text-muted-foreground truncate">
                  {deal?.campaign?.brand?.name || 'Brand'}
                </p>
                {deal?.campaign?.brand?.rating && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span className="text-xs text-muted-foreground">
                      {deal.campaign.brand.rating}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Badge
              className={cn(
                "text-xs border",
                statusColors[deal.status] || "bg-gray-100 text-gray-800 border-gray-200"
              )}
            >
              {deal.status.replace("_", " ").toUpperCase()}
            </Badge>
            <Badge
              className={cn(
                "text-xs",
                deal?.campaign?.deal_type ? dealTypeColors[deal.campaign.deal_type] : 'bg-gray-100 text-gray-800'
              )}
            >
              {(deal?.campaign?.deal_type || 'N/A').toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Deal Value and Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Value</span>
            </div>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(deal?.total_value || 0)}
            </p>
            {deal?.campaign?.deal_type === "hybrid" && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Cash: {formatCurrency(deal?.campaign?.cash_amount || 0)}</div>
                <div>Products: {formatCurrency(deal?.campaign?.product_value || 0)}</div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Deadline</span>
            </div>
            <p className="text-sm">
              {formatDate(applicationDeadline)}
            </p>
            {!isExpired && (
              <p className={cn("text-xs", {
                "text-red-600 font-medium": isUrgent,
                "text-muted-foreground": !isUrgent,
              })}>
                {daysRemaining} days remaining
              </p>
            )}
            {isExpired && (
              <p className="text-xs text-red-600 font-medium">
                Expired
              </p>
            )}
          </div>
        </div>

        {/* Campaign Details */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {deal.campaign.description}
          </p>

          {/* Platforms and Content Requirements */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-muted-foreground">PLATFORMS:</span>
              <div className="flex items-center space-x-1">
                {(deal?.campaign?.content_requirements?.platforms || []).map((platform) => {
                  const Icon = platformIcons[platform as keyof typeof platformIcons];
                  return (
                    <div key={platform} className="flex items-center space-x-1">
                      {Icon && <Icon className="h-3 w-3" />}
                      <span className="text-xs">{platform}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span>Posts: {deal?.campaign?.content_requirements?.post_count ?? 0}</span>
              {deal?.campaign?.content_requirements?.story_count && (
                <span>Stories: {deal.campaign.content_requirements.story_count}</span>
              )}
              {deal?.campaign?.content_requirements?.reel_count && (
                <span>Reels: {deal.campaign.content_requirements.reel_count}</span>
              )}
            </div>
          </div>

          {/* Brand Info */}
          {deal?.campaign?.brand?.total_collaborations && (
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{deal.campaign.brand.total_collaborations} collaborations</span>
            </div>
          )}
        </div>

        {/* Campaign Timeline */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Campaign Timeline</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">Start:</span> {formatDate(deal.campaign.campaign_start_date)}
            </div>
            <div>
              <span className="font-medium">End:</span> {formatDate(deal.campaign.campaign_end_date)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <DealActions
          deal={deal}
          onAccept={onAccept}
          onReject={onReject}
          onViewDetails={onViewDetails}
          onMessage={onMessage}
          onSubmitContent={() => setShowContentSubmission(true)}
          isLoading={isLoading}
          className="pt-2 border-t"
        />
      </CardContent>
    </Card>

    {/* Content Submission Modal */}
    <ContentSubmissionModal
      deal={deal}
      isOpen={showContentSubmission}
      onClose={() => setShowContentSubmission(false)}
      onSuccess={() => {
        setShowContentSubmission(false);
        // Refresh deal data would happen through React Query
      }}
    />
    </>
  );
}