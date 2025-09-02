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
import { ContentSubmissionsList } from "./content-submissions-list";
import { AddressSubmission } from "./address-submission";
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
  Upload,
} from "@/lib/icons";
import { HiChatBubbleLeftRight } from "react-icons/hi2";
import Image from "next/image";
import Link from "next/link";

interface DealDetailsProps {
  deal: Deal;
  onAccept?: (dealId: number) => void;
  onReject?: (dealId: number, reason?: string) => void;
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
  shortlisted: "bg-green-100 text-green-800 border-green-200",
  address_requested: "bg-orange-100 text-orange-800 border-orange-200",
  address_provided: "bg-blue-100 text-blue-800 border-blue-200",
  product_shipped: "bg-purple-100 text-purple-800 border-purple-200",
  product_delivered: "bg-green-100 text-green-800 border-green-200",
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
  isLoading = false,
  className,
}: DealDetailsProps) {
  const { contentSubmissions } = useDeal(deal.id);
  const [showContentSubmission, setShowContentSubmission] = useState(false);
  const [showAddressSubmission, setShowAddressSubmission] = useState(false);
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
    <div className={cn("space-y-3", className)}>
      {/* Streamlined Header */}
      <div className="bg-gradient-to-r from-blue-50 via-white to-indigo-50 border border-blue-200 rounded-xl shadow-md p-4">
        <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
            {/* Brand Logo */}
            {deal?.campaign?.brand?.logo && (
              <div className="w-14 h-14 rounded-xl overflow-hidden shadow-md border-2 border-white bg-white flex-shrink-0">
                <Image
                  src={deal.campaign.brand.logo}
                  alt={deal?.campaign?.brand?.name || "Brand"}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-1">
                {deal?.campaign?.title || 'Campaign'}
              </h1>
              <div className="flex items-center justify-between mb-2">
                <p className="text-lg font-semibold text-blue-600">
                  {deal?.campaign?.brand?.name || 'Brand Name'}
                </p>
                <Link href={`/messages?deal=${deal.id}`} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 text-xs"
                    title={`Contact ${deal?.campaign?.brand?.name || 'brand'}`}
                  >
                    <HiChatBubbleLeftRight className="h-3 w-3 mr-1" />
                    Contact Brand
                  </Button>
                </Link>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>Invited {formatDateTime(deal?.invited_at || new Date().toISOString())}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Badge
              className={cn(
                "text-sm border-2 px-3 py-1.5 rounded-full font-semibold shadow-sm",
                statusColors[deal.status] || "bg-gray-100 text-gray-800 border-gray-200"
              )}
            >
              {deal.status.replace("_", " ").toUpperCase()}
            </Badge>
            <div className="text-right">
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(deal.total_value || 0)}
              </div>
              <div className="text-xs text-gray-500">Total Value</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-3">

          {/* Campaign & Content Requirements - Combined */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <Target className="h-3 w-3 text-white" />
                </div>
                <span className="text-lg font-bold">Campaign Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {/* Description */}
              <div>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  {deal?.campaign?.description || '—'}
                </p>
                
                {typeof deal?.campaign?.content_requirements === 'object' && deal?.campaign?.content_requirements?.special_instructions && (
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-1 text-sm">
                      📌 Special Instructions
                    </h4>
                    <p className="text-xs text-blue-800">
                      {deal.campaign.content_requirements.special_instructions}
                    </p>
                  </div>
                )}
              </div>

              {/* Content Requirements Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Platforms & Types */}
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">📱 Platforms</h4>
                    <div className="flex flex-wrap gap-1">
                      {(typeof deal?.campaign?.content_requirements === 'object' && deal?.campaign?.content_requirements?.platforms || []).map((platform) => {
                        const Icon = platformIcons[platform as keyof typeof platformIcons];
                        return (
                          <Badge key={platform} variant="outline" className="flex items-center space-x-1 bg-blue-50 border-blue-200 text-blue-700 text-xs">
                            {Icon && <Icon className="h-3 w-3" />}
                            <span>{platform}</span>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">🎯 Content Types</h4>
                    <div className="flex flex-wrap gap-1">
                      {(typeof deal?.campaign?.content_requirements === 'object' && deal?.campaign?.content_requirements?.content_types || []).map((type) => (
                        <Badge key={type} variant="secondary" className="bg-green-50 text-green-700 border-green-200 text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Deliverables */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">📊 Deliverables</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-2 border border-blue-200 text-center">
                      <div className="text-lg font-bold text-blue-600">{(typeof deal?.campaign?.content_requirements === 'object' && deal?.campaign?.content_requirements?.post_count) ?? 0}</div>
                      <div className="text-xs text-blue-700">Posts</div>
                    </div>
                    {typeof deal?.campaign?.content_requirements === 'object' && deal?.campaign?.content_requirements?.story_count && (
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-2 border border-green-200 text-center">
                        <div className="text-lg font-bold text-green-600">{deal.campaign.content_requirements.story_count}</div>
                        <div className="text-xs text-green-700">Stories</div>
                      </div>
                    )}
                    {typeof deal?.campaign?.content_requirements === 'object' && deal?.campaign?.content_requirements?.reel_count && (
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-2 border border-purple-200 text-center">
                        <div className="text-lg font-bold text-purple-600">{deal.campaign.content_requirements.reel_count}</div>
                        <div className="text-xs text-purple-700">Reels</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <Calendar className="h-3 w-3 text-white" />
                </div>
                <span className="text-lg font-bold">Key Dates</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-3 border border-red-200 text-center">
                  <h4 className="font-semibold text-red-900 text-sm mb-1">⏰ Apply By</h4>
                  <p className="text-xs text-red-700 font-medium">
                    {formatDate(deal?.campaign?.application_deadline || new Date().toISOString())}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200 text-center">
                  <h4 className="font-semibold text-green-900 text-sm mb-1">🚀 Campaign</h4>
                  <p className="text-xs text-green-700 font-medium">
                    {formatDate(deal?.campaign?.campaign_start_date || new Date().toISOString())} - {formatDate(deal?.campaign?.campaign_end_date || new Date().toISOString())}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Request Alert for Barter/Hybrid Deals */}
          {(['address_requested', 'shortlisted', 'accepted'].includes(deal.status)) && (deal.campaign?.deal_type === 'product' || deal.campaign?.deal_type === 'hybrid') && (
            <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-orange-800">
                  <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                    <MapPin className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-base font-bold">Address Required</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-orange-700 mb-3">
                  The brand has requested your shipping address to send the products for this collaboration.
                </p>
                <Button
                  onClick={() => setShowAddressSubmission(true)}
                  className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Provide Address
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Content Submission Alert for Product Delivered Deals */}
          {deal.status === 'product_delivered' && (
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-green-800">
                  <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <Upload className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-base font-bold">Content Submission Required</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-green-700 mb-3">
                  Your products have been delivered! Now it's time to create and submit your content for this campaign.
                </p>
                <Button
                  onClick={() => setShowContentSubmission(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Content
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Content Status */}
          {['active', 'content_submitted', 'under_review', 'revision_requested', 'approved', 'completed'].includes(deal.status) && (
            <ContentStatus 
              deal={deal} 
              submissions={contentSubmissions.data}
              onResubmit={() => setShowContentSubmission(true)}
            />
          )}

          {/* Content Submissions */}
          <ContentSubmissionsList 
            deal={deal} 
            submissions={contentSubmissions.data || []}
            onRefresh={() => contentSubmissions.refetch()}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          {/* Deal Value */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-3 w-3 text-white" />
                </div>
                <span className="text-lg font-bold">Payment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="text-center bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(deal.total_value || 0)}
                </div>
                <p className="text-xs text-green-700 font-medium">Total Value</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Type:</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                    {deal.campaign?.deal_type?.toUpperCase() || 'N/A'}
                  </Badge>
                </div>
                {deal.campaign?.product_value && (
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Product:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(deal.campaign.product_value)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="outline" className={cn(
                    "text-xs",
                    deal.payment_status === 'completed' ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"
                  )}>
                    {deal.payment_status?.toUpperCase() || 'PENDING'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products */}
          {(deal.campaign?.deal_type === 'product' || deal.campaign?.deal_type === 'hybrid') && 
           deal.campaign?.products && deal.campaign.products.length > 0 && (
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                    <Package className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-lg font-bold">Products</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {deal.campaign.products.map((product, index) => (
                  <div key={index} className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-200">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-orange-900 text-sm">{product.name}</h4>
                      <div className="text-right">
                        <div className="text-sm font-bold text-orange-800">
                          {formatCurrency(product.value * product.quantity)}
                        </div>
                      </div>
                    </div>
                    {product.description && (
                      <p className="text-xs text-orange-700 mb-1">{product.description}</p>
                    )}
                    <div className="text-xs text-orange-600">
                      Qty: {product.quantity} × {formatCurrency(product.value)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}



          {/* Actions */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Zap className="h-3 w-3 text-white" />
                </div>
                <span className="text-lg font-bold">Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <DealActions
                deal={deal}
                onAccept={onAccept}
                onReject={onReject}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

          {/* Progress */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-md">
            <CardContent className="pt-4">
              <DealTimeline deal={deal} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Back to Deals Button - Floating */}
      <div className="fixed bottom-6 left-6 z-50">
        <Link href="/influencer/deals">
          <Button variant="outline" size="sm" className="bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-200 rounded-full w-12 h-12 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Content Submission Modal */}
      <ContentSubmissionModal
        isOpen={showContentSubmission}
        onClose={() => setShowContentSubmission(false)}
        deal={deal}
      />

      {/* Address Submission Modal */}
      <AddressSubmission
        isOpen={showAddressSubmission}
        onClose={() => setShowAddressSubmission(false)}
        deal={deal}
        onSuccess={() => {
          // Refresh deal data or update local state
          window.location.reload(); // Simple refresh for now
        }}
      />
    </div>
  );
}