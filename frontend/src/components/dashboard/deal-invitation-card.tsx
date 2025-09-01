"use client";

import {Card} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Deal} from "@/types";
import {cn} from "@/lib/utils";
import {Calendar, Clock, DollarSign, Eye} from "@/lib/icons";
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
    shortlisted: "bg-teal-100 text-teal-800",
    address_requested: "bg-amber-100 text-amber-800",
    address_provided: "bg-lime-100 text-lime-800",
    product_shipped: "bg-sky-100 text-sky-800",
    product_delivered: "bg-cyan-100 text-cyan-800",
    active: "bg-purple-100 text-purple-800",
    content_submitted: "bg-indigo-100 text-indigo-800",
    under_review: "bg-orange-100 text-orange-800",
    revision_requested: "bg-red-100 text-red-800",
    approved: "bg-emerald-100 text-emerald-800",
    completed: "bg-gray-100 text-gray-800",
    rejected: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
    dispute: "bg-rose-100 text-rose-800",
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

    const getDealTypeLabel = (dealType: string | undefined) => {
        switch (dealType?.toLowerCase()) {
            case 'paid':
                return 'Cash';
            case 'barter':
                return 'Barter';
            case 'hybrid':
                return 'Barter + Cash';
            default:
                return 'Barter'; // Default fallback
        }
    };

    const daysRemaining = getDaysRemaining(deal?.campaign?.application_deadline || new Date().toISOString());
    const isUrgent = daysRemaining <= 2 && daysRemaining > 0;
    const isExpired = daysRemaining < 0;

    return (
        <Card className={cn("transition-all hover:shadow-md border bg-white", {
            "border-red-200": isUrgent,
            "border-gray-300 opacity-75": isExpired,
        })}>
            <div className="p-4">
                {/* First Row: Logo + Title + Status */}
                <div className="flex items-center gap-3 mb-2">
                    {deal?.campaign?.brand?.logo && (
                        <Image
                            src={deal.campaign.brand.logo}
                            alt={deal?.campaign?.brand?.name || 'Brand'}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                    )}
                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm leading-tight truncate">
                            {deal?.campaign?.title || 'Campaign'}
                        </h4>
                        <p className="text-xs text-gray-600 truncate">
                            {deal?.campaign?.brand?.name || 'Brand'}
                        </p>
                    </div>
                    <Badge
                        className={cn(
                            "text-xs px-2 py-1 font-medium flex-shrink-0",
                            statusColors[deal.status] || "bg-gray-100 text-gray-800"
                        )}
                    >
                        {deal.status.replace("_", " ").toUpperCase()}
                    </Badge>
                </div>

                {/* Second Row: Description */}
                <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-normal">
                    {deal?.campaign?.description || 'No description available'}
                </p>

                {/* Third Row: Value, Type, Deadline */}
                <div className="flex items-center gap-4 text-xs text-gray-600 mb-3 flex-wrap">
                    <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3"/>
                        <span className="font-medium">Value:</span>
                        <span>{formatCurrency(deal?.total_value || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3"/>
                        <span className="font-medium">Type:</span>
                        <span>{getDealTypeLabel(deal?.campaign?.deal_type)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3"/>
                        <span className="font-medium">Deadline:</span>
                        <span>{formatDate(deal?.campaign?.application_deadline || new Date().toISOString())}</span>
                        {!isExpired && (
                            <span
                                className={cn("ml-1", {
                                    "text-red-600 font-medium": isUrgent,
                                    "text-gray-500": !isUrgent,
                                })}
                            >
                ({daysRemaining} days left)
              </span>
                        )}
                        {isExpired && (
                            <span className="ml-1 text-red-600 font-medium">
                (Expired)
              </span>
                        )}
                    </div>
                </div>

                {/* Fourth Row: Actions */}
                <div className="flex items-center justify-between gap-2">
                    <Link href={`/deals/${deal.id}`}>
                        <Button variant="outline" size="sm" className="text-xs px-3 py-1">
                            <Eye className="h-3 w-3 mr-1"/>
                            View Details
                        </Button>
                    </Link>

                    {deal.status === "invited" && !isExpired && (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onReject?.(deal.id)}
                                disabled={isLoading}
                                className="text-xs px-3 py-1"
                            >
                                Decline
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => onAccept?.(deal.id)}
                                disabled={isLoading}
                                className="text-xs px-3 py-1"
                            >
                                Accept
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}