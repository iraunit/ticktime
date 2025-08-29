"use client";

import { useState } from "react";
import { useClientTime } from "@/hooks/use-client-time";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Deal } from "@/types";
import { cn } from "@/lib/utils";
import { 
  HiCalendarDays, 
  HiClock, 
  HiBanknotes, 
  HiMapPin, 
  HiStar,
  HiUsers,
  HiCamera,
  HiPlayCircle,
  HiGlobeAlt,
  HiShare
} from "react-icons/hi2";
import Image from "next/image";
import { DealActions } from "./deal-actions";
import { ContentSubmissionModal } from "./content-submission";

interface DealCardProps {
  deal: Deal;
  onAccept?: (dealId: number) => void;
  onReject?: (dealId: number, reason?: string) => void;
  isLoading?: boolean;
  className?: string;
}

const statusColors = {
  invited: "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300",
  pending: "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300",
  accepted: "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300",
  active: "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300",
  content_submitted: "bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 border-indigo-300",
  under_review: "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300",
  revision_requested: "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300",
  approved: "bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300",
  completed: "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300",
  rejected: "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300",
  cancelled: "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300",
  dispute: "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300",
};

const dealTypeColors = {
  cash: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300",
  paid: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300",
  product: "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300",
  barter: "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300", 
  hybrid: "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-300",
};

const platformIcons = {
  Instagram: HiCamera,
  YouTube: HiPlayCircle,
  Twitter: HiGlobeAlt,
  Facebook: HiShare,
};

export function DealCard({
  deal,
  onAccept,
  onReject,
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
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5",
        "border shadow-sm bg-gradient-to-br from-white via-gray-50/30 to-white",
        {
          "border-l-blue-500 border-l-4": deal.status === "invited",
          "border-l-green-500 border-l-4": deal.status === "accepted" || deal.status === "active",
          "border-l-yellow-500 border-l-4": deal.status === "pending",
          "border-l-purple-500 border-l-4": deal.status === "content_submitted",
          "border-l-gray-500 border-l-4": deal.status === "completed",
          "border-l-red-500 border-l-4": deal.status === "rejected" || deal.status === "cancelled",
        },
        className
      )}>
        {/* Urgent indicator */}
        {isUrgent && deal.status === "invited" && (
          <div className="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-0.5 text-xs font-bold rounded-bl-lg shadow-md">
            URGENT
          </div>
        )}

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='9' cy='9' r='1'/%3E%3Ccircle cx='19' cy='19' r='1'/%3E%3Ccircle cx='29' cy='29' r='1'/%3E%3Ccircle cx='39' cy='39' r='1'/%3E%3Ccircle cx='49' cy='49' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>

        <CardHeader className="relative pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3 flex-1">
              {/* Brand Logo */}
              {deal?.campaign?.brand?.logo && (
                <div className="w-12 h-12 rounded-lg overflow-hidden shadow-md border border-white bg-white flex-shrink-0">
                  <Image
                    src={deal.campaign.brand.logo}
                    alt={deal?.campaign?.brand?.name || "Brand"}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Badge className={cn("text-xs font-medium border", statusColors[deal.status])}>
                    {deal.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  {deal?.campaign?.deal_type && (
                    <Badge className={cn("text-xs font-medium border", dealTypeColors[deal.campaign.deal_type as keyof typeof dealTypeColors] || dealTypeColors.hybrid)}>
                      {deal.campaign.deal_type.toUpperCase()}
                    </Badge>
                  )}
                  {isUrgent && (
                    <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold animate-pulse">
                      URGENT
                    </Badge>
                  )}
                </div>
                
                <CardTitle className="text-lg font-bold text-gray-900 mb-1 leading-tight">
                  {deal?.campaign?.title || "Campaign Title"}
                </CardTitle>
                
                <p className="text-sm font-semibold text-blue-600 mb-1">
                  {deal?.campaign?.brand?.name || "Brand Name"}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative pt-0">
          {/* Campaign Description */}
          <p className="text-gray-700 mb-3 leading-relaxed line-clamp-2 text-sm">
            {deal?.campaign?.description || "No description available."}
          </p>

          {/* Compact Key Details Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
            {/* Compensation */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-md p-2 border border-green-200">
              <div className="flex items-center text-green-700 mb-0.5">
                <HiBanknotes className="h-3 w-3 mr-1" />
                <span className="text-xs font-medium">
                  {deal?.campaign?.deal_type === 'product' ? 'Barter Value' : 
                   deal?.campaign?.deal_type === 'hybrid' ? 'Total Value' : 'Cash'}
                </span>
              </div>
              <div className="text-sm font-bold text-green-800">
                {deal?.total_value ? formatCurrency(deal.total_value) : 
                 deal?.campaign?.cash_amount ? formatCurrency(deal.campaign.cash_amount) : "TBD"}
              </div>
              {(deal?.campaign?.deal_type === 'product' || deal?.campaign?.deal_type === 'hybrid') && 
               deal?.campaign?.products && deal.campaign.products.length > 0 && (
                <div className="text-xs text-green-600 mt-0.5">
                  {deal.campaign.products.length} product{deal.campaign.products.length > 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Deadline */}
            <div className={cn(
              "rounded-md p-2 border",
              isUrgent 
                ? "bg-gradient-to-br from-red-50 to-orange-100 border-red-200"
                : "bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200"
            )}>
              <div className={cn(
                "flex items-center mb-0.5",
                isUrgent ? "text-red-700" : "text-blue-700"
              )}>
                <HiClock className="h-3 w-3 mr-1" />
                <span className="text-xs font-medium">Deadline</span>
              </div>
              <div className={cn(
                "text-sm font-bold",
                isUrgent ? "text-red-800" : "text-blue-800"
              )}>
                {isExpired ? "Expired" : `${daysRemaining} days`}
              </div>
            </div>

            {/* Deliverables */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-md p-2 border border-purple-200">
              <div className="flex items-center text-purple-700 mb-0.5">
                <HiCamera className="h-3 w-3 mr-1" />
                <span className="text-xs font-medium">Content</span>
              </div>
              <div className="text-sm font-bold text-purple-800">
                {typeof deal?.campaign?.content_requirements === 'object' && deal?.campaign?.content_requirements?.post_count || 0} pieces
              </div>
            </div>

            {/* Platform */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-100 rounded-md p-2 border border-indigo-200">
              <div className="flex items-center text-indigo-700 mb-0.5">
                <HiGlobeAlt className="h-3 w-3 mr-1" />
                <span className="text-xs font-medium">Platform</span>
              </div>
              <div className="text-sm font-bold text-indigo-800">
                {typeof deal?.campaign?.content_requirements === 'object' && deal?.campaign?.content_requirements?.platforms?.join(", ") || "Multi"}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <DealActions
            deal={deal}
            onAccept={onAccept}
            onReject={onReject}
            onContentSubmission={() => setShowContentSubmission(true)}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Content Submission Modal */}
      {showContentSubmission && (
        <ContentSubmissionModal
          deal={deal}
          isOpen={showContentSubmission}
          onClose={() => setShowContentSubmission(false)}
        />
      )}
    </>
  );
}