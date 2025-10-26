"use client";

import React from "react";
import {Deal, DealStatus} from "@/types";
import {cn} from "@/lib/utils";
import {
    AlertCircle,
    CheckCircle,
    Clock,
    DollarSign,
    Eye,
    Home,
    MapPin,
    MessageSquare,
    Truck,
    Upload,
    XCircle
} from "@/lib/icons";
import {HiXCircle} from "react-icons/hi2";

interface DealTimelineProps {
    deal: Deal;
    className?: string;
}

interface TimelineStep {
    status: DealStatus;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    date?: string;
    isCompleted: boolean;
    isCurrent: boolean;
    isError?: boolean;
}

const statusOrder: DealStatus[] = [
    "invited",
    "accepted",
    "shortlisted",
    "address_requested",
    "address_provided",
    "product_shipped",
    "product_delivered",
    "active",
    "content_submitted",
    "under_review",
    "approved",
    "completed"
];

const cashOnlyStatusOrder: DealStatus[] = [
    "invited",
    "accepted",
    "active",
    "content_submitted",
    "under_review",
    "approved",
    "completed"
];

const statusInfo: Record<DealStatus, {
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
}> = {
    invited: {
        label: "Invitation Received",
        description: "Brand has sent you a collaboration invitation",
        icon: MessageSquare,
    },
    pending: {
        label: "Response Pending",
        description: "Waiting for your response to the invitation",
        icon: Clock,
    },
    accepted: {
        label: "Deal Accepted",
        description: "You have accepted the collaboration deal",
        icon: CheckCircle,
    },
    shortlisted: {
        label: "Shortlisted",
        description: "You have been shortlisted for this collaboration",
        icon: CheckCircle,
    },
    address_requested: {
        label: "Address Requested",
        description: "Brand has requested your shipping address for product delivery",
        icon: MapPin,
    },
    address_provided: {
        label: "Address Provided",
        description: "You have provided your shipping address",
        icon: CheckCircle,
    },
    product_shipped: {
        label: "Product Shipped",
        description: "Brand has shipped the products to your address",
        icon: Truck,
    },
    product_delivered: {
        label: "Product Delivered",
        description: "Products have been delivered to your address",
        icon: Home,
    },
    active: {
        label: "Deal Active",
        description: "Collaboration is now active and ready for content creation",
        icon: CheckCircle,
    },
    content_submitted: {
        label: "Content Submitted",
        description: "Your content has been submitted for review",
        icon: Upload,
    },
    under_review: {
        label: "Under Review",
        description: "Brand is reviewing your submitted content",
        icon: Eye,
    },
    revision_requested: {
        label: "Revision Requested",
        description: "Brand has requested changes to your content",
        icon: AlertCircle,
    },
    approved: {
        label: "Content Approved",
        description: "Your content has been approved by the brand",
        icon: CheckCircle,
    },
    completed: {
        label: "Deal Completed",
        description: "Collaboration completed successfully",
        icon: DollarSign,
    },
    rejected: {
        label: "Deal Rejected",
        description: "Deal was rejected",
        icon: XCircle,
    },
    cancelled: {
        label: "Deal Cancelled",
        description: "Deal was cancelled",
        icon: XCircle,
    },
    dispute: {
        label: "In Dispute",
        description: "Deal is currently in dispute",
        icon: AlertCircle,
    },
};

function DealTimeline({deal, className}: DealTimelineProps): React.JSX.Element {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getCurrentStatusIndex = () => {
        const isBarterOrHybrid = deal.campaign?.deal_type === 'product' || deal.campaign?.deal_type === 'hybrid';
        const orderToUse = isBarterOrHybrid ? statusOrder : cashOnlyStatusOrder;
        return orderToUse.indexOf(deal.status);
    };

    const getStatusOrder = () => {
        const isBarterOrHybrid = deal.campaign?.deal_type === 'product' || deal.campaign?.deal_type === 'hybrid';
        return isBarterOrHybrid ? statusOrder : cashOnlyStatusOrder;
    };

    const getTimelineSteps = (): TimelineStep[] => {
        const currentIndex = getCurrentStatusIndex();
        const isRejected = deal.status === "rejected";
        const isCancelled = deal.status === "cancelled";
        const isDispute = deal.status === "dispute";
        const isRevisionRequested = deal.status === "revision_requested";

        // Handle special cases
        if (isRejected || isCancelled || isDispute) {
            return [
                {
                    status: "invited",
                    ...statusInfo.invited,
                    date: deal.invited_at ? formatDate(deal.invited_at) : undefined,
                    isCompleted: true,
                    isCurrent: false,
                },
                {
                    status: deal.status,
                    ...statusInfo[deal.status],
                    date: deal.responded_at ? formatDate(deal.responded_at) : undefined,
                    isCompleted: true,
                    isCurrent: true,
                    isError: true,
                },
            ];
        }

        const orderToUse = getStatusOrder();
        return orderToUse.map((status, index) => {
            const info = statusInfo[status];
            let date: string | undefined;

            // Set dates based on deal data
            if (status === "invited") date = deal.invited_at ? formatDate(deal.invited_at) : undefined;
            if (status === "accepted" && deal.responded_at) date = formatDate(deal.responded_at);
            if (status === "shortlisted" && deal.shortlisted_at) date = formatDate(deal.shortlisted_at);
            if (status === "address_requested" && deal.address_requested_at) date = formatDate(deal.address_requested_at);
            if (status === "address_provided" && deal.address_provided_at) date = formatDate(deal.address_provided_at);
            if (status === "product_shipped" && deal.shipped_at) date = formatDate(deal.shipped_at);
            if (status === "product_delivered" && deal.delivered_at) date = formatDate(deal.delivered_at);
            if (status === "completed" && deal.completed_at) date = formatDate(deal.completed_at);

            return {
                status,
                ...info,
                date,
                isCompleted: index < currentIndex || (index === currentIndex && deal.status === status),
                isCurrent: index === currentIndex && deal.status === status,
                isError: false,
            };
        }).filter(step => {
            // Only show steps up to current status + 1 (next step)
            const stepIndex = orderToUse.indexOf(step.status);
            return stepIndex <= currentIndex + 1;
        });
    };

    const steps = getTimelineSteps();

    return (
        <div className={cn("space-y-4", className)}>
            <h3 className="text-lg font-semibold text-gray-900">Deal Progress</h3>

            <div className="relative">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isLast = index === steps.length - 1;

                    return (
                        <div key={step.status} className="relative flex items-start pb-6">
                            {/* Timeline line */}
                            {!isLast && (
                                <div
                                    className={cn(
                                        "absolute left-4 top-8 w-0.5 h-full",
                                        step.isCompleted ? "bg-green-500" : "bg-gray-200"
                                    )}
                                />
                            )}

                            {/* Timeline dot */}
                            <div className={cn(
                                "relative flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white",
                                step.isCompleted && !step.isError && "border-green-500 bg-green-50",
                                step.isCurrent && !step.isError && "border-blue-500 bg-blue-50",
                                step.isError && "border-red-500 bg-red-50",
                                !step.isCompleted && !step.isCurrent && "border-gray-300"
                            )}>
                                <Icon className={cn(
                                    "w-4 h-4",
                                    step.isCompleted && !step.isError && "text-green-600",
                                    step.isCurrent && !step.isError && "text-blue-600",
                                    step.isError && "text-red-600",
                                    !step.isCompleted && !step.isCurrent && "text-gray-400"
                                )}/>
                            </div>

                            {/* Timeline content */}
                            <div className="ml-4 flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h4 className={cn(
                                        "text-sm font-medium",
                                        step.isCompleted && !step.isError && "text-green-900",
                                        step.isCurrent && !step.isError && "text-blue-900",
                                        step.isError && "text-red-900",
                                        !step.isCompleted && !step.isCurrent && "text-gray-500"
                                    )}>
                                        {step.label}
                                    </h4>
                                    {step.date && (
                                        <span className="text-xs text-gray-500 ml-2">
                      {step.date}
                    </span>
                                    )}
                                </div>
                                <p className={cn(
                                    "text-sm mt-1",
                                    step.isCompleted && !step.isError && "text-green-700",
                                    step.isCurrent && !step.isError && "text-blue-700",
                                    step.isError && "text-red-700",
                                    !step.isCompleted && !step.isCurrent && "text-gray-500"
                                )}>
                                    {step.description}
                                </p>

                                {/* Additional details for shipping statuses */}
                                {step.status === "product_shipped" && deal.tracking_number && (
                                    <div className="mt-2 p-2 bg-blue-50 rounded-md">
                                        <p className="text-xs text-blue-800">
                                            <strong>Tracking:</strong> {deal.tracking_number}
                                        </p>
                                        {deal.tracking_url && (
                                            <a
                                                href={deal.tracking_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                                            >
                                                Track Package
                                            </a>
                                        )}
                                    </div>
                                )}

                                {step.status === "address_provided" && deal.shipping_address && (
                                    <div className="mt-2 p-2 bg-green-50 rounded-md">
                                        <p className="text-xs text-green-800">
                                            <strong>Delivery Address:</strong><br/>
                                            {deal.shipping_address.address_line1}<br/>
                                            {deal.shipping_address.address_line2 && (
                                                <>
                                                    {deal.shipping_address.address_line2}<br/>
                                                </>
                                            )}
                                            {deal.shipping_address.city}, {deal.shipping_address.state} {deal.shipping_address.zipcode}<br/>
                                            {deal.shipping_address.country}<br/>
                                            {deal.shipping_address.country_code && deal.shipping_address.phone_number && (
                                                <>
                                                    <strong>Phone:</strong> {deal.shipping_address.country_code} {deal.shipping_address.phone_number}
                                                </>
                                            )}
                                        </p>
                                    </div>
                                )}

                                {deal.notes && step.isCurrent && (
                                    <div className="mt-2 p-2 bg-yellow-50 rounded-md">
                                        <p className="text-xs text-yellow-800">
                                            <strong>Notes:</strong> {deal.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Additional info for special statuses */}
            {deal.status === "revision_requested" && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center">
                        <AlertCircle className="w-4 h-4 text-orange-600 mr-2"/>
                        <span className="text-sm font-medium text-orange-800">
              Revision Required
            </span>
                    </div>
                    <p className="text-sm text-orange-700 mt-1">
                        Please check the feedback and resubmit your content.
                    </p>
                </div>
            )}

            {/* Rejection reason display */}
            {deal.status === "rejected" && deal.rejection_reason && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                        <HiXCircle className="w-4 h-4 text-red-600 mr-2"/>
                        <span className="text-sm font-medium text-red-800">
              Deal Rejected
            </span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                        <strong>Reason:</strong> {deal.rejection_reason}
                    </p>
                </div>
            )}
        </div>
    );
}

export {DealTimeline};