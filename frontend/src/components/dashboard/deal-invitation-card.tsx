"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Deal } from "@/types";
import { cn } from "@/lib/utils";
import { Calendar, Clock, DollarSign, Eye } from "@/lib/icons";
import Link from "next/link";
import Image from "next/image";

interface DealInvitationCardProps {
  deal: Deal;
  onAccept?: (dealId: number) => void;
  onReject?: (dealId: number) => void;
  isLoading?: boolean;
}

const statusColors = {
  invited: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  active: "bg-purple-100 text-purple-800",
  content_submitted: "bg-indigo-100 text-indigo-800",
  under_review: "bg-orange-100 text-orange-800",
  revision_requested: "bg-red-100 text-red-800",
  approved: "bg-emerald-100 text-emerald-800",
  completed: "bg-gray-100 text-gray-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
  dispute: "bg-red-100 text-red-800",
};

export function DealInvitationCard({
  deal,
  onAccept,
  onReject,
  isLoading = false,
}: DealInvitationCardProps) {
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
    }).format(amount);
  };

  const getDaysRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining(deal.campaign.application_deadline);
  const isUrgent = daysRemaining <= 2 && daysRemaining > 0;
  const isExpired = daysRemaining < 0;

  return (
    <Card className={cn("transition-all hover:shadow-md", {
      "border-red-200": isUrgent,
      "border-gray-300 opacity-75": isExpired,
    })}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {deal.campaign.brand.logo && (
              <Image
                src={deal.campaign.brand.logo}
                alt={deal.campaign.brand.name}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <div>
              <CardTitle className="text-lg">{deal.campaign.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {deal.campaign.brand.name}
              </p>
            </div>
          </div>
          <Badge
            className={cn(
              "text-xs",
              statusColors[deal.status] || "bg-gray-100 text-gray-800"
            )}
          >
            {deal.status.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">
              <span className="font-medium">Value:</span>{" "}
              {formatCurrency(deal.total_value)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">
              <span className="font-medium">Type:</span>{" "}
              {deal.campaign.deal_type.charAt(0).toUpperCase() +
                deal.campaign.deal_type.slice(1)}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>
            <span className="font-medium">Deadline:</span>{" "}
            {formatDate(deal.campaign.application_deadline)}
          </span>
          {!isExpired && (
            <span
              className={cn("ml-2 text-xs", {
                "text-red-600 font-medium": isUrgent,
                "text-muted-foreground": !isUrgent,
              })}
            >
              ({daysRemaining} days left)
            </span>
          )}
          {isExpired && (
            <span className="ml-2 text-xs text-red-600 font-medium">
              (Expired)
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {deal.campaign.description}
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 gap-3">
          <Link href={`/deals/${deal.id}`}>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
          </Link>

          {deal.status === "invited" && !isExpired && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject?.(deal.id)}
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                Decline
              </Button>
              <Button
                size="sm"
                onClick={() => onAccept?.(deal.id)}
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                Accept
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}