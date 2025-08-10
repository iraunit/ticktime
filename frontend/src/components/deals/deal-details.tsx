"use client";

import { useState } from "react";
import { Deal } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DealTimeline } from "./deal-timeline";
import { DealActions } from "./deal-actions";
import { ContentSubmissionModal } from "./content-submission";
import { ContentStatus } from "./content-status";
import { useDeal } from "@/hooks/use-deals";
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
  Facebook,
  Globe,
  Package,
  FileText,
  Target,
  Zap,
  ArrowLeft,
} from "@/lib/icons";
import Image from "next/image";
import Link from "next/link";

interface DealDetailsProps {
  deal: Deal;
  onAccept?: (dealId: number) => void;
  onReject?: (dealId: number, reason?: string) => void;
  onMessage?: (dealId: number) => void;
  isLoading?: boolean;
  className?: string;
}

const platformIcons = {
  Instagram: Instagram,
  YouTube: Youtube,
  Twitter: Twitter,
  Facebook: Facebook,
};

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

export function DealDetails({
  deal,
  onAccept,
  onReject,
  onMessage,
  isLoading = false,
  className,
}: DealDetailsProps) {
  const [showContentSubmission, setShowContentSubmission] = useState(false);
  const { contentSubmissions } = useDeal(deal.id);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/deals">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Deals
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            {deal.campaign.title}
          </h1>
          <p className="text-muted-foreground">
            Collaboration with {deal.campaign.brand.name}
          </p>
        </div>
        <Badge
          className={cn(
            "text-sm border",
            statusColors[deal.status] || "bg-gray-100 text-gray-800 border-gray-200"
          )}
        >
          {deal.status.replace("_", " ").toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Brand Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                {deal.campaign.brand.logo && (
                  <Image
                    src={deal.campaign.brand.logo}
                    alt={deal.campaign.brand.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <h3 className="text-xl font-semibold">
                    {deal.campaign.brand.name}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    {deal.campaign.brand.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span>{deal.campaign.brand.rating} rating</span>
                      </div>
                    )}
                    {deal.campaign.brand.total_collaborations && (
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{deal.campaign.brand.total_collaborations} collaborations</span>
                      </div>
                    )}
                    {deal.campaign.brand.website && (
                      <div className="flex items-center space-x-1">
                        <Globe className="h-4 w-4" />
                        <a
                          href={deal.campaign.brand.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {deal.campaign.brand.description}
              </p>
            </CardContent>
          </Card>

          {/* Campaign Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                Campaign Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                {deal.campaign.description}
              </p>
              
              {deal.campaign.content_requirements.special_instructions && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Special Instructions</h4>
                  <p className="text-blue-800 text-sm">
                    {deal.campaign.content_requirements.special_instructions}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                Content Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Platforms */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Platforms</h4>
                <div className="flex flex-wrap gap-2">
                  {deal.campaign.content_requirements.platforms.map((platform) => {
                    const Icon = platformIcons[platform as keyof typeof platformIcons];
                    return (
                      <Badge key={platform} variant="outline" className="flex items-center space-x-1">
                        {Icon && <Icon className="h-3 w-3" />}
                        <span>{platform}</span>
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Content Types */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Content Types</h4>
                <div className="flex flex-wrap gap-2">
                  {deal.campaign.content_requirements.content_types.map((type) => (
                    <Badge key={type} variant="secondary">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Deliverables */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Deliverables</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Posts:</span>
                    <span>{deal.campaign.content_requirements.post_count}</span>
                  </div>
                  {deal.campaign.content_requirements.story_count && (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Stories:</span>
                      <span>{deal.campaign.content_requirements.story_count}</span>
                    </div>
                  )}
                  {deal.campaign.content_requirements.reel_count && (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Reels:</span>
                      <span>{deal.campaign.content_requirements.reel_count}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                Campaign Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Application Deadline</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(deal.campaign.application_deadline)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Campaign Start</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(deal.campaign.campaign_start_date)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Campaign End</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(deal.campaign.campaign_end_date)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Invited On</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(deal.invited_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Deal Value */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                Deal Value
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(deal.total_value)}
                </p>
                <p className="text-sm text-muted-foreground">Total Value</p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Deal Type</span>
                  <Badge variant="outline">
                    {deal.campaign.deal_type.toUpperCase()}
                  </Badge>
                </div>

                {deal.campaign.cash_amount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cash Payment</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(deal.campaign.cash_amount)}
                    </span>
                  </div>
                )}

                {deal.campaign.product_value > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Product Value</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(deal.campaign.product_value)}
                    </span>
                  </div>
                )}

                {deal.payment_status && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Payment Status</span>
                    <Badge
                      variant={deal.payment_status === "completed" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {deal.payment_status.toUpperCase()}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DealActions
                deal={deal}
                onAccept={onAccept}
                onReject={onReject}
                onMessage={onMessage}
                onSubmitContent={() => setShowContentSubmission(true)}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

          {/* Deal Progress */}
          <Card>
            <CardContent className="pt-6">
              <DealTimeline deal={deal} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Status - Show for deals with submitted content */}
      {(['content_submitted', 'under_review', 'revision_requested', 'approved'].includes(deal.status)) && (
        <ContentStatus 
          deal={deal}
          submissions={contentSubmissions.data}
          onResubmit={() => setShowContentSubmission(true)}
        />
      )}

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
    </div>
  );
}