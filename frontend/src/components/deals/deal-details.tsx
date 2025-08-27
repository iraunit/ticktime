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
    <div className={cn("space-y-3", className)}>
      {/* Compact Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border-0 shadow-lg p-3">
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {deal?.campaign?.title || 'Campaign'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Collaboration with {deal?.campaign?.brand?.name || 'Brand'}
            </p>
          </div>
          <Badge
            className={cn(
              "text-sm border-2 px-3 py-1 rounded-full",
              statusColors[deal.status] || "bg-gray-100 text-gray-800 border-gray-200"
            )}
          >
            {deal.status.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-3">
          {/* Compact Brand Information */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-3">
                {deal?.campaign?.brand?.logo && (
                  <div className="relative">
                    <Image
                      src={deal.campaign.brand.logo}
                      alt={deal?.campaign?.brand?.name || 'Brand'}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-lg object-cover ring-2 ring-blue-100"
                    />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {deal?.campaign?.brand?.name || 'Brand'}
                  </h3>
                  <div className="flex items-center space-x-3 text-xs text-gray-600 mt-1">
                    {deal?.campaign?.brand?.rating && (
                      <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-full">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="font-medium">{deal.campaign.brand.rating} rating</span>
                      </div>
                    )}
                    {deal?.campaign?.brand?.total_collaborations && (
                      <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded-full">
                        <Users className="h-3 w-3 text-blue-500" />
                        <span className="font-medium">{deal.campaign.brand.total_collaborations} collaborations</span>
                      </div>
                    )}
                    {deal?.campaign?.brand?.website && (
                      <div className="flex items-center space-x-1 bg-purple-50 px-2 py-1 rounded-full">
                        <Globe className="h-3 w-3 text-purple-500" />
                        <a
                          href={deal.campaign.brand.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-700 font-medium"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600 leading-relaxed">
                {deal?.campaign?.brand?.description || '—'}
              </p>
            </CardContent>
          </Card>

          {/* Compact Campaign Description */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <Target className="h-3 w-3 text-white" />
                </div>
                <span className="text-base font-bold">Campaign Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-700 leading-relaxed">
                {deal?.campaign?.description || '—'}
              </p>
              
              {deal?.campaign?.content_requirements?.special_instructions && (
                <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                    Special Instructions
                  </h4>
                  <p className="text-sm text-blue-800">
                    {deal.campaign.content_requirements.special_instructions}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compact Content Requirements */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <FileText className="h-3 w-3 text-white" />
                </div>
                <span className="text-base font-bold">Content Requirements</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {/* Platforms */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                  Platforms
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(deal?.campaign?.content_requirements?.platforms || []).map((platform) => {
                    const Icon = platformIcons[platform as keyof typeof platformIcons];
                    return (
                      <Badge key={platform} variant="outline" className="flex items-center space-x-1 bg-white/50 backdrop-blur-sm border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors">
                        {Icon && <Icon className="h-3 w-3" />}
                        <span>{platform}</span>
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Content Types */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <span className="w-1 h-1 bg-green-500 rounded-full mr-2"></span>
                  Content Types
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(deal?.campaign?.content_requirements?.content_types || []).map((type) => (
                    <Badge key={type} variant="secondary" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Deliverables */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <span className="w-1 h-1 bg-purple-500 rounded-full mr-2"></span>
                  Deliverables
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="bg-white/50 backdrop-blur-sm rounded-lg p-2 border border-gray-200">
                    <div className="text-base font-bold text-blue-600">{deal?.campaign?.content_requirements?.post_count ?? 0}</div>
                    <div className="text-xs text-gray-600">Posts</div>
                  </div>
                  {deal?.campaign?.content_requirements?.story_count && (
                    <div className="bg-white/50 backdrop-blur-sm rounded-lg p-2 border border-gray-200">
                      <div className="text-base font-bold text-green-600">{deal.campaign.content_requirements.story_count}</div>
                      <div className="text-xs text-gray-600">Stories</div>
                    </div>
                  )}
                  {deal?.campaign?.content_requirements?.reel_count && (
                    <div className="bg-white/50 backdrop-blur-sm rounded-lg p-2 border border-gray-200">
                      <div className="text-base font-bold text-purple-600">{deal.campaign.content_requirements.reel_count}</div>
                      <div className="text-xs text-gray-600">Reels</div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compact Timeline */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <Calendar className="h-3 w-3 text-white" />
                </div>
                <span className="text-base font-bold">Campaign Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-1">Application Deadline</h4>
                  <p className="text-sm text-blue-700">
                    {formatDate(deal?.campaign?.application_deadline || new Date().toISOString())}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-1">Campaign Start</h4>
                  <p className="text-sm text-green-700">
                    {formatDate(deal?.campaign?.campaign_start_date || new Date().toISOString())}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-1">Campaign End</h4>
                  <p className="text-sm text-purple-700">
                    {formatDate(deal?.campaign?.campaign_end_date || new Date().toISOString())}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-3 border border-orange-200">
                  <h4 className="font-semibold text-orange-900 mb-1">Invited On</h4>
                  <p className="text-sm text-orange-700">
                    {formatDateTime(deal?.invited_at || new Date().toISOString())}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Status */}
          {['active', 'content_submitted', 'under_review', 'revision_requested', 'approved', 'completed'].includes(deal.status) && (
            <ContentStatus 
              deal={deal} 
              submissions={contentSubmissions.data}
              onResubmit={() => setShowContentSubmission(true)}
            />
          )}
        </div>

        {/* Compact Sidebar */}
        <div className="space-y-3">
          {/* Compact Deal Value */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-3 w-3 text-white" />
                </div>
                <span className="text-base font-bold">Deal Value</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="text-center bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {formatCurrency(deal.total_value || 0)}
                </div>
                <p className="text-sm text-green-700 font-medium">Total Value</p>
              </div>
              
              <Separator className="bg-gray-200" />
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center bg-white/50 backdrop-blur-sm rounded-lg p-2">
                  <span className="text-gray-600">Deal Type:</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {deal.campaign?.deal_type || 'N/A'}
                  </Badge>
                </div>
                {deal.campaign?.product_value && (
                  <div className="flex justify-between items-center bg-white/50 backdrop-blur-sm rounded-lg p-2">
                    <span className="text-gray-600">Product Value:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(deal.campaign.product_value)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center bg-white/50 backdrop-blur-sm rounded-lg p-2">
                  <span className="text-gray-600">Payment Status:</span>
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

          {/* Products Section for Barter Deals */}
          {(deal.campaign?.deal_type === 'product' || deal.campaign?.deal_type === 'hybrid') && 
           deal.campaign?.products && deal.campaign.products.length > 0 && (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                    <Package className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-base font-bold">Barter Products</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {deal.campaign.products.map((product, index) => (
                  <div key={index} className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-200">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-orange-900">{product.name}</h4>
                      <div className="text-right">
                        <div className="text-sm font-bold text-orange-800">
                          {formatCurrency(product.value * product.quantity)}
                        </div>
                        <div className="text-xs text-orange-600">
                          {formatCurrency(product.value)} × {product.quantity}
                        </div>
                      </div>
                    </div>
                    {product.description && (
                      <p className="text-sm text-orange-700 mb-2">{product.description}</p>
                    )}
                    <div className="flex justify-between items-center text-xs text-orange-600">
                      <span>Quantity: {product.quantity}</span>
                      <span>Unit Value: {formatCurrency(product.value)}</span>
                    </div>
                  </div>
                ))}
                
                <Separator className="bg-orange-200" />
                
                <div className="text-center bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg p-2 border border-orange-200">
                  <div className="text-lg font-bold text-orange-800">
                    Total Product Value: {formatCurrency(
                      deal.campaign.products.reduce((total, product) => 
                        total + (product.value * product.quantity), 0
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compact Actions */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Zap className="h-3 w-3 text-white" />
                </div>
                <span className="text-base font-bold">Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <DealActions
                deal={deal}
                onAccept={onAccept}
                onReject={onReject}
                onMessage={onMessage}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

          {/* Compact Deal Progress */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-3">
              <DealTimeline deal={deal} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Back to Deals Button - Floating */}
      <div className="fixed bottom-6 left-6 z-50">
        <Link href="/deals">
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
    </div>
  );
}