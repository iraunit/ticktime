"use client";

import {useState} from "react";
import {useClientTime} from "@/hooks/use-client-time";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Deal} from "@/types";
import {cn} from "@/lib/utils";
import {HiBanknotes, HiClock, HiGlobeAlt, HiStar} from "react-icons/hi2";
import Image from "next/image";
import {DealActions} from "./deal-actions";
import {ContentSubmissionModal} from "./content-submission";
import {RatingDialog} from "./rating-dialog";
import {getPlatformLabel, platformConfig} from "@/lib/platform-config";

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
    shortlisted: "bg-gradient-to-r from-teal-100 to-teal-200 text-teal-800 border-teal-300",
    address_requested: "bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border-amber-300",
    address_provided: "bg-gradient-to-r from-lime-100 to-lime-200 text-lime-800 border-lime-300",
    product_shipped: "bg-gradient-to-r from-sky-100 to-sky-200 text-sky-800 border-sky-300",
    product_delivered: "bg-gradient-to-r from-cyan-100 to-cyan-200 text-cyan-800 border-cyan-300",
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

// Helper function to get platform icon from config
const getPlatformIcon = (platformName: string) => {
    for (const [key, config] of Object.entries(platformConfig)) {
        if (config.label === platformName) {
            return config.icon;
        }
    }

    const normalizedKey = platformName.toLowerCase();
    if (platformConfig[normalizedKey as keyof typeof platformConfig]) {
        return platformConfig[normalizedKey as keyof typeof platformConfig].icon;
    }

    // Fallback
    return HiGlobeAlt;
};

export function DealCard({
                             deal,
                             onAccept,
                             onReject,
                             isLoading = false,
                             className,
                         }: DealCardProps) {
    const [showContentSubmission, setShowContentSubmission] = useState(false);
    const [showRatingDialog, setShowRatingDialog] = useState(false);

    // Debug logging
    console.log('DealCard render:', {
        dealId: deal?.id,
        campaignTitle: deal?.campaign?.title,
        brandName: deal?.campaign?.brand?.name,
        brandLogo: deal?.campaign?.brand?.logo,
        brandLogoType: typeof deal?.campaign?.brand?.logo,
        brandLogoLength: deal?.campaign?.brand?.logo?.length,
        applicationDeadline: deal?.campaign?.application_deadline,
        submissionDeadline: deal?.campaign?.submission_deadline,
        barterSubmissionDays: deal?.campaign?.barter_submission_after_days,
        platforms: deal?.campaign?.platforms_required,
        dealType: deal?.campaign?.deal_type,
        fullCampaign: deal?.campaign,
        fullBrand: deal?.campaign?.brand
    });

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

    const {getDaysRemaining} = useClientTime();

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
                    <div
                        className="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-0.5 text-xs font-bold rounded-bl-lg shadow-md">
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
                            <div
                                className="w-12 h-12 rounded-lg overflow-hidden shadow-md border border-white bg-white flex-shrink-0">
                                {deal?.campaign?.brand?.logo ? (
                                    <Image
                                        src={deal.campaign.brand.logo}
                                        alt={deal?.campaign?.brand?.name || "Brand"}
                                        width={48}
                                        height={48}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            // Fallback to initials if image fails to load
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const parent = target.parentElement;
                                            if (parent) {
                                                parent.innerHTML = `
                                                    <div class="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                                                        <span class="text-lg font-bold text-blue-600">
                                                            ${deal?.campaign?.brand?.name?.charAt(0)?.toUpperCase() || "B"}
                                                        </span>
                                                    </div>
                                                `;
                                            }
                                        }}
                                    />
                                ) : (
                                    <div
                                        className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                                        <span className="text-lg font-bold text-blue-600">
                                            {deal?.campaign?.brand?.name?.charAt(0)?.toUpperCase() || "B"}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <Badge className={cn("text-xs font-medium border", statusColors[deal.status])}>
                                        {deal.status.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                    {deal?.campaign?.deal_type && (
                                        <Badge
                                            className={cn("text-xs font-medium border", dealTypeColors[deal.campaign.deal_type as keyof typeof dealTypeColors] || dealTypeColors.hybrid)}>
                                            {deal.campaign.deal_type === 'product' ? 'BARTER' : deal.campaign.deal_type.toUpperCase()}
                                        </Badge>
                                    )}
                                    {isUrgent && (
                                        <Badge
                                            className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold animate-pulse">
                                            URGENT
                                        </Badge>
                                    )}
                                </div>

                                <CardTitle className="text-lg font-bold text-gray-900 mb-1 leading-tight">
                                    <a
                                        href={`/influencer/deals/${deal.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-blue-600 transition-colors duration-200 cursor-pointer"
                                        onClick={(e) => {
                                            // Allow middle click and ctrl+click to open in new tab
                                            if (e.ctrlKey || e.metaKey || e.button === 1) {
                                                return; // Let browser handle it
                                            }
                                            // For regular clicks, prevent default and handle navigation
                                            e.preventDefault();
                                            window.location.href = `/influencer/deals/${deal.id}`;
                                        }}
                                    >
                                        {deal?.campaign?.title || "Campaign Title"}
                                    </a>
                                </CardTitle>

                                <p className="text-sm font-semibold text-blue-600 mb-1">
                                    {deal?.campaign?.brand?.name || "Brand Name"}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="relative pt-0">
                    {/* Campaign Description - more concise */}
                    <p className="text-gray-600 mb-3 leading-relaxed line-clamp-1 text-sm">
                        {deal?.campaign?.description || "No description available."}
                    </p>

                    {/* Compact Key Details Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
                        {/* Compensation */}
                        <div
                            className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-md p-1.5 border border-green-200">
                            <div className="flex items-center text-green-700 mb-0.5">
                                <HiBanknotes className="h-3 w-3 mr-1"/>
                                <span className="text-xs font-medium">
                  {deal?.campaign?.deal_type === 'product' ? 'Barter Value' :
                      deal?.campaign?.deal_type === 'hybrid' ? 'Total Value' : 'Cash'}
                </span>
                            </div>
                            <div className="text-sm font-bold text-green-800">
                                {deal?.total_value ? formatCurrency(deal.total_value) :
                                    deal?.campaign?.total_value ? formatCurrency(deal.campaign.total_value) :
                                        deal?.campaign?.cash_amount ? formatCurrency(Number(deal.campaign.cash_amount)) : "TBD"}
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
                            "rounded-md p-1.5 border",
                            isUrgent
                                ? "bg-gradient-to-br from-red-50 to-orange-100 border-red-200"
                                : "bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200"
                        )}>
                            <div className={cn(
                                "flex items-center mb-0.5",
                                isUrgent ? "text-red-700" : "text-blue-700"
                            )}>
                                <HiClock className="h-3 w-3 mr-1"/>
                                <span className="text-xs font-medium">Deadline</span>
                            </div>
                            <div className={cn(
                                "text-sm font-bold",
                                isUrgent ? "text-red-800" : "text-blue-800"
                            )}>
                                {isExpired ? "Expired" : `${daysRemaining} days`}
                            </div>
                        </div>

                        {/* Submission Deadline */}
                        <div
                            className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-md p-1.5 border border-purple-200">
                            <div className="flex items-center text-purple-700 mb-0.5">
                                <HiClock className="h-3 w-3 mr-1"/>
                                <span className="text-xs font-medium">Submit By</span>
                            </div>
                            <div className="text-sm font-bold text-purple-800">
                                {(() => {
                                    if (deal?.campaign?.submission_deadline) {
                                        return formatDate(deal.campaign.submission_deadline);
                                    } else if (deal?.campaign?.barter_submission_after_days) {
                                        return `${deal.campaign.barter_submission_after_days} days after delivery`;
                                    } else if (deal?.campaign?.application_deadline) {
                                        // Fallback to application deadline if no submission deadline
                                        const appDeadline = new Date(deal.campaign.application_deadline);
                                        const now = new Date();
                                        const daysDiff = Math.ceil((appDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                        if (daysDiff > 0) {
                                            return `${daysDiff} days`;
                                        } else {
                                            return "ASAP";
                                        }
                                    }
                                    return "TBD";
                                })()}
                            </div>
                        </div>

                        {/* Platform */}
                        <div
                            className="bg-gradient-to-br from-indigo-50 to-blue-100 rounded-md p-1.5 border border-indigo-200">
                            <div className="flex items-center text-indigo-700 mb-0.5">
                                <HiGlobeAlt className="h-3 w-3 mr-1"/>
                                <span className="text-xs font-medium">Platform</span>
                            </div>
                            <div className="text-sm font-bold text-indigo-800">
                                {(() => {
                                    const platforms = deal?.campaign?.platforms_required || [];

                                    if (platforms.length === 0) return "Multi";

                                    if (platforms.length === 1) {
                                        const platform = platforms[0];
                                        const IconComponent = getPlatformIcon(platform);
                                        return (
                                            <div className="flex items-center">
                                                {IconComponent && <IconComponent className="h-3 w-3 mr-1"/>}
                                                <span>{getPlatformLabel(platform) || platform}</span>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="flex items-center space-x-1">
                                            {platforms.slice(0, 2).map((platform: string, index: number) => {
                                                const IconComponent = getPlatformIcon(platform);
                                                return IconComponent ? (
                                                    <IconComponent key={index} className="h-3 w-3"
                                                                   title={getPlatformLabel(platform) || platform}/>
                                                ) : (
                                                    <span key={index} className="text-xs">{platform.slice(0, 2)}</span>
                                                );
                                            })}
                                            {platforms.length > 2 && (
                                                <span className="text-xs">+{platforms.length - 2}</span>
                                            )}
                                        </div>
                                    );
                                })()}
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

                    {/* Rating Button for Completed Deals */}
                    {deal.status === 'completed' && !deal.influencer_rating && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <Button
                                onClick={() => setShowRatingDialog(true)}
                                size="sm"
                                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                            >
                                <HiStar className="w-4 h-4 mr-2"/>
                                Rate Brand
                            </Button>
                        </div>
                    )}

                    {/* Display Rating if Already Rated */}
                    {deal.status === 'completed' && deal.influencer_rating && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Your Rating:</span>
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <HiStar
                                            key={i}
                                            className={`w-4 h-4 ${
                                                i < (deal.influencer_rating || 0)
                                                    ? "text-yellow-400 fill-yellow-400"
                                                    : "text-gray-300"
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
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

            {/* Rating Dialog */}
            {showRatingDialog && (
                <RatingDialog
                    open={showRatingDialog}
                    onOpenChange={setShowRatingDialog}
                    dealId={deal.id}
                    targetName={deal.campaign?.brand?.name || 'Brand'}
                    ratingType="brand"
                    onRatingSubmitted={() => {
                        // Refresh the deals list
                        window.location.reload();
                    }}
                />
            )}
        </>
    );
}