"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GlobalLoader } from "@/components/ui/global-loader";
import { InlineLoader } from "@/components/ui/global-loader";
import { toast } from "@/lib/toast";
import { api } from "@/lib/api";
import { 
  HiUser,
  HiMegaphone,
  HiCurrencyDollar,
  HiCalendarDays,
  HiChatBubbleLeftRight,
  HiCheckCircle,
  HiXCircle,
  HiClock,
  HiTruck,
  HiPhoto,
  HiVideoCamera,
  HiEye,
  HiHandThumbUp,
  HiHandThumbDown,
  HiStar,
  HiArrowPath,
  HiDocumentText,
  HiGift,
  HiExclamationTriangle,
  HiInformationCircle
} from "react-icons/hi2";

interface Deal {
  id: number;
  influencer: {
    id: number;
    full_name: string;
    username: string;
    profile_image?: string;
    followers_count: number;
    engagement_rate: number;
    rating: number;
  };
  campaign: {
    id: number;
    title: string;
    description: string;
    brand: {
      name: string;
    };
    deal_type: string;
    cash_amount?: number;
    product_value?: number;
    product_name?: string;
    content_requirements: string;
    platforms_required: string[];
  };
  status: 'invited' | 'pending' | 'accepted' | 'rejected' | 'shortlisted' | 'address_requested' | 'address_provided' | 'product_shipped' | 'product_delivered' | 'active' | 'content_submitted' | 'under_review' | 'revision_requested' | 'approved' | 'completed' | 'cancelled' | 'dispute';
  invited_at: string;
  responded_at?: string;
  accepted_at?: string;
  shortlisted_at?: string;
  address_requested_at?: string;
  address_provided_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  content_submitted_at?: string;
  shipping_address?: any;
  tracking_number?: string;
  tracking_url?: string;
  content_reviewed_at?: string;
  completed_at?: string;
  submitted_content: {
    id: number;
    content_type: string;
    content_url: string;
    caption: string;
    platform: string;
    submitted_at: string;
    status: 'pending' | 'approved' | 'rejected';
    review_notes?: string;
  }[];
  brand_rating?: number;
  brand_review?: string;
  influencer_rating?: number;
  influencer_review?: string;
  notes: string;
}

const statusSteps = [
  { id: 'invited', label: 'Invitation Sent', icon: HiClock, color: 'yellow' },
  { id: 'pending', label: 'Pending Response', icon: HiClock, color: 'yellow' },
  { id: 'accepted', label: 'Deal Accepted', icon: HiCheckCircle, color: 'green' },
  { id: 'shortlisted', label: 'Shortlisted', icon: HiStar, color: 'blue' },
  { id: 'address_requested', label: 'Address Requested', icon: HiInformationCircle, color: 'orange' },
  { id: 'address_provided', label: 'Address Provided', icon: HiCheckCircle, color: 'teal' },
  { id: 'product_shipped', label: 'Product Shipped', icon: HiTruck, color: 'indigo' },
  { id: 'product_delivered', label: 'Product Delivered', icon: HiGift, color: 'purple' },
  { id: 'active', label: 'Active', icon: HiArrowPath, color: 'blue' },
  { id: 'content_submitted', label: 'Content Submitted', icon: HiPhoto, color: 'pink' },
  { id: 'under_review', label: 'Under Review', icon: HiEye, color: 'orange' },
  { id: 'revision_requested', label: 'Revision Requested', icon: HiArrowPath, color: 'yellow' },
  { id: 'approved', label: 'Content Approved', icon: HiHandThumbUp, color: 'emerald' },
  { id: 'completed', label: 'Deal Completed', icon: HiCheckCircle, color: 'green' }
];

export default function DealDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;
  const searchParams = useSearchParams();
  const campaignParam = searchParams.get('campaign');
  
  const [deal, setDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // State for actions
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [notes, setNotes] = useState("");

  const fetchDeal = async () => {
    setIsLoading(true);
    try {
      // Use the dedicated deal detail endpoint
      const response = await api.get(`/brands/deals/${dealId}/`);
      const dealData = response.data.deal;
      console.log('Deal data received:', dealData); // Debug log
      setDeal(dealData);
      setNotes(dealData.notes || "");
    } catch (error: any) {
      console.error('Failed to fetch deal:', error);
      toast.error('Failed to load deal details.');
      router.push('/brand/deals');
    } finally {
      setIsLoading(false);
    }
  };

  const updateDealStatus = async (status: string, additionalData: any = {}) => {
    setIsUpdating(true);
    try {
      await api.patch(`/brands/deals/${dealId}/status/`, {
        status,
        ...additionalData
      });
      
      await fetchDeal(); // Refresh deal data
      toast.success(`Deal status updated to ${status.replace('_', ' ')}`);
    } catch (error: any) {
      console.error('Failed to update deal status:', error);
      toast.error('Failed to update deal status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const shortlistDeal = () => {
    updateDealStatus('shortlisted');
  };

  const requestAddress = async () => {
    setIsUpdating(true);
    try {
      await api.post(`/brands/deals/${dealId}/request-address/`);
      await fetchDeal();
      toast.success('Address request sent to influencer');
    } catch (error: any) {
      console.error('Failed to request address:', error);
      toast.error('Failed to request address.');
    } finally {
      setIsUpdating(false);
    }
  };

  const updateTracking = async () => {
    if (!trackingNumber) {
      toast.error('Please provide tracking number');
      return;
    }
    setIsUpdating(true);
    try {
      await api.patch(`/brands/deals/${dealId}/tracking/`, {
        tracking_number: trackingNumber,
        tracking_url: trackingUrl
      });
      await fetchDeal();
      toast.success('Tracking information updated and product marked as shipped');
      setTrackingNumber('');
      setTrackingUrl('');
    } catch (error: any) {
      console.error('Failed to update tracking:', error);
      toast.error('Failed to update tracking.');
    } finally {
      setIsUpdating(false);
    }
  };

  const markDelivered = () => {
    updateDealStatus('product_delivered');
  };

  const reviewContent = async (_contentId: number, approved: boolean, notes: string) => {
    setIsUpdating(true);
    try {
      await api.put(`/brands/deals/${dealId}/content/`, { action: approved ? 'approve' : 'reject', feedback: notes });
      
      await fetchDeal();
      toast.success(`Content ${approved ? 'approved' : 'rejected'}`);
    } catch (error: any) {
      console.error('Failed to review content:', error);
      toast.error('Failed to review content.');
    } finally {
      setIsUpdating(false);
    }
  };

  const completeDeal = () => {
    updateDealStatus('completed', {
      brand_rating: rating,
      brand_review: review
    });
  };

  const cancelDeal = () => {
    updateDealStatus('cancelled');
  };

  const updateNotes = async () => {
    try {
      console.log('Updating notes:', notes); // Debug log
      const response = await api.patch(`/brands/deals/${dealId}/notes/`, { notes });
      console.log('Notes update response:', response); // Debug log
      toast.success('Notes updated successfully');
    } catch (error: any) {
      console.error('Failed to update notes:', error);
      console.error('Error details:', error.response?.data); // Debug log
      toast.error('Failed to update notes.');
    }
  };

  useEffect(() => {
    if (dealId) {
      fetchDeal();
    }
  }, [dealId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFollowers = (count: number | undefined | null) => {
    if (!count || count === 0) return "0";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getStatusColor = (status: string) => {
    const step = statusSteps.find(s => s.id === status);
    return step?.color || 'gray';
  };

  const getCurrentStepIndex = () => {
    if (!deal) return 0;
    const filteredSteps = getRelevantSteps();
    return filteredSteps.findIndex(step => step.id === deal.status);
  };

  const getRelevantSteps = () => {
    if (!deal) return statusSteps;
    
    // For cash deals, skip barter-specific steps
    if (deal.campaign?.deal_type === 'cash') {
      return statusSteps.filter(step => 
        !['address_requested', 'address_provided', 'product_shipped', 'product_delivered'].includes(step.id)
      );
    }
    
    // For barter and hybrid deals, include all steps
    return statusSteps;
  };

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      invited: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      shortlisted: 'bg-blue-100 text-blue-800',
      address_requested: 'bg-orange-100 text-orange-800',
      address_provided: 'bg-teal-100 text-teal-800',
      product_shipped: 'bg-indigo-100 text-indigo-800',
      product_delivered: 'bg-purple-100 text-purple-800',
      active: 'bg-blue-100 text-blue-800',
      content_submitted: 'bg-pink-100 text-pink-800',
      under_review: 'bg-orange-100 text-orange-800',
      revision_requested: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-emerald-100 text-emerald-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
      dispute: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={`${colors[status] || 'bg-gray-100 text-gray-800'} border-0`}>
        {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlobalLoader />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <HiExclamationTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Deal not found</h3>
          <p className="text-gray-500 mb-4">The deal you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/brand/deals')}>
            Back to Deals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        {/* Header */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-xl -m-2"></div>
          
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-1">
                Deal Management
              </h1>
              <p className="text-sm text-gray-600">
                Track and manage this collaboration from start to finish.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {getStatusBadge(deal.status)}
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchDeal}
                disabled={isLoading}
                className="border border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              >
                <HiArrowPath className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Deal Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
                onClick={() => {
                  if (deal.campaign?.id) {
                    window.open(`/brand/campaigns/${deal.campaign.id}`, '_blank');
                  }
                }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <HiMegaphone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Campaign</p>
                  <p className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                    {deal.campaign?.title || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  if (deal.influencer?.id) {
                    window.open(`/influencers/${deal.influencer.id}`, '_blank');
                  }
                }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <HiUser className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Influencer</p>
                  <p className="font-semibold text-gray-900 hover:text-purple-600 transition-colors">
                    {deal.influencer?.full_name || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <HiCurrencyDollar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Value</p>
                  <p className="font-semibold text-gray-900">
                    {(() => {
                      const cash = deal.campaign?.cash_amount || 0;
                      const product = deal.campaign?.product_value || 0;
                      const total = cash + product;
                      return total > 0 ? formatCurrency(total) : 'N/A';
                    })()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Steps */}
        <Card className="mb-6 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Deal Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mobile: Vertical Progress */}
            <div className="sm:hidden">
              <div className="space-y-4">
                {getRelevantSteps().map((step, index) => {
                  const currentIndex = getCurrentStepIndex();
                  const isCompleted = index < currentIndex;
                  const isCurrent = index === currentIndex;
                  const isRejected = deal.status === 'rejected' || deal.status === 'cancelled' || deal.status === 'dispute';
                  
                  return (
                    <div key={step.id} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isCompleted || isCurrent
                          ? `bg-${step.color}-500 border-${step.color}-500 text-white`
                          : isRejected && index > currentIndex
                          ? 'border-red-300 text-red-400 bg-red-50'
                          : 'border-gray-300 text-gray-500'
                      }`}>
                        <step.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          isCurrent ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {step.label}
                        </p>
                      </div>
                      {isCompleted && (
                        <div className="text-green-500">
                          <HiCheckCircle className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop: Horizontal Scrollable Progress */}
            <div className="hidden sm:block">
              <div className="overflow-x-auto pb-2">
                <div className="flex items-center min-w-max">
                  {getRelevantSteps().map((step, index) => {
                    const relevantSteps = getRelevantSteps();
                    const currentIndex = getCurrentStepIndex();
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    const isRejected = deal.status === 'rejected' || deal.status === 'cancelled' || deal.status === 'dispute';
                    
                    return (
                      <div key={step.id} className="flex items-center">
                        <div className="flex flex-col items-center min-w-0 px-2">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                            isCompleted || isCurrent
                              ? `bg-${step.color}-500 border-${step.color}-500 text-white`
                              : isRejected && index > currentIndex
                              ? 'border-red-300 text-red-400 bg-red-50'
                              : 'border-gray-300 text-gray-500'
                          }`}>
                            <step.icon className="w-5 h-5" />
                          </div>
                          <div className="mt-2 text-center">
                            <p className={`text-xs font-medium whitespace-nowrap ${
                              isCurrent ? 'text-gray-900' : 'text-gray-500'
                            }`}>
                              {step.label}
                            </p>
                          </div>
                        </div>
                        {index < relevantSteps.length - 1 && (
                          <div className={`w-8 h-0.5 mx-2 transition-colors flex-shrink-0 ${
                            isCompleted ? `bg-${step.color}-500` : 'bg-gray-300'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {deal.campaign?.deal_type !== 'cash' && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Scroll horizontally to see all steps
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deal Overview */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HiMegaphone className="w-5 h-5 text-blue-600" />
                  Deal Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Campaign Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Campaign Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">Campaign Name</label>
                      <p className="font-semibold">
                        {deal.campaign?.title ? (
                          <button
                            onClick={() => window.open(`/brand/campaigns/${deal.campaign.id}`, '_blank')}
                            className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          >
                            {deal.campaign.title}
                          </button>
                        ) : (
                          "N/A"
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Brand</label>
                      <p className="font-semibold">
                        {deal.campaign?.brand?.name ? (
                          <button
                            onClick={() => window.open(`/brand/settings`, '_blank')}
                            className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          >
                            {deal.campaign.brand.name}
                          </button>
                        ) : (
                          "N/A"
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Deal Type</label>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">
                          {deal.campaign?.deal_type || "N/A"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Status</label>
                      <div>{getStatusBadge(deal.status)}</div>
                    </div>
                  </div>
                </div>

                {/* Deal Value */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Deal Value</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {deal.campaign?.cash_amount && deal.campaign.cash_amount > 0 && (
                      <div>
                        <label className="text-sm text-gray-500">Cash Amount</label>
                        <p className="font-semibold text-green-600">
                          {formatCurrency(deal.campaign.cash_amount)}
                        </p>
                      </div>
                    )}
                    {deal.campaign?.product_value && deal.campaign.product_value > 0 && (
                      <div>
                        <label className="text-sm text-gray-500">Product Value</label>
                        <p className="font-semibold text-blue-600">
                          {formatCurrency(deal.campaign.product_value)}
                        </p>
                      </div>
                    )}
                    {deal.campaign?.product_name && (
                      <div className="md:col-span-2">
                        <label className="text-sm text-gray-500">Product</label>
                        <p className="font-semibold">{deal.campaign.product_name}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Platform Requirements */}
                <div>
                  <label className="text-sm text-gray-500">Required Platforms</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {deal.campaign?.platforms_required?.length > 0 ? (
                      deal.campaign.platforms_required.map(platform => (
                        <Badge key={platform} variant="outline" className="text-xs capitalize">
                          {platform}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">No specific platforms required</span>
                    )}
                  </div>
                </div>
                
                {/* Content Requirements */}
                <div>
                  <label className="text-sm text-gray-500">Content Requirements</label>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      {typeof deal.campaign?.content_requirements === 'string' 
                        ? deal.campaign?.content_requirements 
                        : (deal.campaign?.content_requirements as any)?.description || 'No specific content requirements provided'}
                    </p>
                  </div>
                </div>

                {/* Campaign Description */}
                {deal.campaign?.description && (
                  <div>
                    <label className="text-sm text-gray-500">Campaign Description</label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{deal.campaign.description}</p>
                    </div>
                  </div>
                )}

                {/* Shipping Information for Barter Deals */}
                {deal.shipping_address && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Shipping Information</h4>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="font-medium text-blue-900">Delivery Address:</p>
                      <div className="text-sm text-blue-800 mt-1">
                        <p>{deal.shipping_address.full_name}</p>
                        <p>{deal.shipping_address.address_line_1}</p>
                        {deal.shipping_address.address_line_2 && <p>{deal.shipping_address.address_line_2}</p>}
                        <p>{deal.shipping_address.city}, {deal.shipping_address.state} {deal.shipping_address.postal_code}</p>
                        <p>{deal.shipping_address.country}</p>
                        {deal.shipping_address.phone_number && <p>Phone: {deal.shipping_address.phone_number}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tracking Information */}
                {deal.tracking_number && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Tracking Information</h4>
                    <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                      <div className="text-sm">
                        <p><strong>Tracking Number:</strong> {deal.tracking_number}</p>
                        {deal.tracking_url && (
                          <p><strong>Track Package:</strong> 
                            <a href={deal.tracking_url} target="_blank" rel="noopener noreferrer" 
                               className="text-indigo-600 hover:underline ml-1">
                              {deal.tracking_url}
                            </a>
                          </p>
                        )}
                        {deal.shipped_at && (
                          <p><strong>Shipped:</strong> {new Date(deal.shipped_at).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deal Actions */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Deal Accepted - Shortlist */}
                {deal.status === 'accepted' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Next Step: Shortlist Deal</h4>
                      <p className="text-sm text-blue-700 mb-3">
                        The influencer has accepted your deal. You can now shortlist them for final selection.
                      </p>
                      <Button 
                        onClick={shortlistDeal}
                        disabled={isUpdating}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                      >
                        {isUpdating ? <InlineLoader className="mr-2" /> : <HiStar className="w-4 h-4 mr-2" />}
                        Shortlist Deal
                      </Button>
                    </div>
                  </div>
                )}

                {/* Shortlisted - Request Address for Barter Deals */}
                {deal.status === 'shortlisted' && deal.campaign?.deal_type !== 'cash' && (
                  <div className="space-y-4">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <h4 className="font-medium text-indigo-900 mb-2">Request Shipping Address</h4>
                      <p className="text-sm text-indigo-700 mb-3">
                        Request the influencer's shipping address to send products.
                      </p>
                      <Button 
                        onClick={requestAddress}
                        disabled={isUpdating}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                      >
                        {isUpdating ? <InlineLoader className="mr-2" /> : <HiInformationCircle className="w-4 h-4 mr-2" />}
                        Request Address
                      </Button>
                    </div>
                  </div>
                )}

                {/* Address Requested - Waiting */}
                {deal.status === 'address_requested' && (
                  <div className="space-y-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h4 className="font-medium text-orange-900 mb-2">Waiting for Address</h4>
                      <p className="text-sm text-orange-700 mb-3">
                        Address request sent to influencer. Waiting for them to provide shipping address.
                      </p>
                    </div>
                  </div>
                )}

                {/* Address Provided - Ship Products */}
                {deal.status === 'address_provided' && (
                  <div className="space-y-4">
                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                      <h4 className="font-medium text-teal-900 mb-2">Ship Products</h4>
                      <p className="text-sm text-teal-700 mb-3">
                        Address received! Ship the products and provide tracking information.
                      </p>
                      
                      {deal.shipping_address && (
                        <div className="bg-white p-3 rounded border text-sm mb-3">
                          <p className="font-medium">Shipping Address:</p>
                          <p>{deal.shipping_address.full_name}</p>
                          <p>{deal.shipping_address.address_line_1}</p>
                          {deal.shipping_address.address_line_2 && <p>{deal.shipping_address.address_line_2}</p>}
                          <p>{deal.shipping_address.city}, {deal.shipping_address.state} {deal.shipping_address.postal_code}</p>
                          <p>{deal.shipping_address.country}</p>
                          {deal.shipping_address.phone_number && <p>Phone: {deal.shipping_address.phone_number}</p>}
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tracking Number *
                          </label>
                          <Input
                            placeholder="Enter tracking number"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tracking URL (Optional)
                          </label>
                          <Input
                            placeholder="Enter tracking URL"
                            value={trackingUrl}
                            onChange={(e) => setTrackingUrl(e.target.value)}
                          />
                        </div>
                        
                        <Button 
                          onClick={updateTracking}
                          disabled={isUpdating || !trackingNumber}
                          className="bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700"
                        >
                          {isUpdating ? <InlineLoader className="mr-2" /> : <HiTruck className="w-4 h-4 mr-2" />}
                          Ship Products
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Product Shipped - Track Delivery */}
                {deal.status === 'product_shipped' && (
                  <div className="space-y-4">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <h4 className="font-medium text-indigo-900 mb-2">Product Shipped</h4>
                      <p className="text-sm text-indigo-700 mb-3">
                        Products have been shipped. Tracking information:
                      </p>
                      <div className="bg-white p-3 rounded border text-sm mb-3">
                        <p><strong>Tracking Number:</strong> {deal.tracking_number}</p>
                        {deal.tracking_url && (
                          <p><strong>Track Package:</strong> <a href={deal.tracking_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{deal.tracking_url}</a></p>
                        )}
                        <p><strong>Shipped:</strong> {deal.shipped_at && new Date(deal.shipped_at).toLocaleDateString()}</p>
                      </div>
                      <p className="text-sm text-indigo-700 mb-3">
                        Waiting for delivery confirmation...
                      </p>
                      
                      <Button 
                        onClick={markDelivered}
                        disabled={isUpdating}
                        variant="outline"
                        className="border-indigo-300 hover:bg-indigo-50"
                      >
                        {isUpdating ? <InlineLoader className="mr-2" /> : <HiGift className="w-4 h-4 mr-2" />}
                        Mark as Delivered (Override)
                      </Button>
                    </div>
                  </div>
                )}

                {/* Product Delivered - Ready for Content */}
                {deal.status === 'product_delivered' && (
                  <div className="space-y-4">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-medium text-purple-900 mb-2">Products Delivered</h4>
                      <p className="text-sm text-purple-700 mb-3">
                        Products have been delivered! Influencer can now create content.
                      </p>
                      <div className="bg-white p-3 rounded border text-sm">
                        <p><strong>Delivered:</strong> {deal.delivered_at && new Date(deal.delivered_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                )}

                {deal.status === 'content_submitted' && (
                  <div className="space-y-4">
                    <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                      <h4 className="font-medium text-pink-900 mb-2">Review Content</h4>
                      <p className="text-sm text-pink-700 mb-3">
                        The influencer has submitted content for your review.
                      </p>
                    </div>
                  </div>
                )}

                {deal.status === 'approved' && (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-2">Complete Deal</h4>
                      <p className="text-sm text-green-700 mb-3">
                        Content has been approved. Rate the influencer and complete the deal.
                      </p>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rating (1-5 stars)
                          </label>
                          <Select value={rating.toString()} onValueChange={(value) => setRating(parseInt(value))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 Stars - Excellent</SelectItem>
                              <SelectItem value="4">4 Stars - Very Good</SelectItem>
                              <SelectItem value="3">3 Stars - Good</SelectItem>
                              <SelectItem value="2">2 Stars - Fair</SelectItem>
                              <SelectItem value="1">1 Star - Poor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Review (optional)
                          </label>
                          <Textarea
                            placeholder="Share your experience working with this influencer"
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            className="h-20"
                          />
                        </div>
                        
                        <Button 
                          onClick={completeDeal}
                          disabled={isUpdating}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                        >
                          {isUpdating ? <InlineLoader className="mr-2" /> : <HiCheckCircle className="w-4 h-4 mr-2" />}
                          Complete Deal
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cancel Deal Option */}
                {!['completed', 'cancelled'].includes(deal.status) && (
                  <div className="pt-4 border-t border-gray-200">
                    <Button 
                      onClick={cancelDeal}
                      disabled={isUpdating}
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                                                {isUpdating ? <InlineLoader className="mr-2" /> : <HiXCircle className="w-4 h-4 mr-2" />}
                      Cancel Deal
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Review */}
            {deal.submitted_content && deal.submitted_content.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HiPhoto className="w-5 h-5 text-pink-600" />
                    Submitted Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {deal.submitted_content.map((content) => (
                      <div key={content.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{content.platform}</Badge>
                            <Badge variant="outline">{content.content_type}</Badge>
                            {getStatusBadge(content.status)}
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(content.submitted_at)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3">{content.caption}</p>
                        
                        {content.content_url && (
                          <div className="mb-3">
                            <a 
                              href={content.content_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                              View Content →
                            </a>
                          </div>
                        )}
                        
                        {content.review_notes && (
                          <div className="bg-gray-50 p-3 rounded text-sm">
                            <strong>Review Notes:</strong> {content.review_notes}
                          </div>
                        )}
                        
                        {content.status === 'pending' && (
                          <div className="flex gap-2 mt-3">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" className="bg-green-500 hover:bg-green-600">
                                  <HiHandThumbUp className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Approve Content</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <Textarea
                                    placeholder="Optional approval notes"
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                  />
                                  <Button 
                                    onClick={() => {
                                      reviewContent(content.id, true, reviewNotes);
                                      setReviewNotes("");
                                    }}
                                    disabled={isUpdating}
                                    className="w-full"
                                  >
                                    {isUpdating ? <InlineLoader className="mr-2" /> : null}
                                    Approve Content
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                  <HiHandThumbDown className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject Content</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <Textarea
                                    placeholder="Please provide feedback on why this content is being rejected"
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    required
                                  />
                                  <Button 
                                    onClick={() => {
                                      if (!reviewNotes.trim()) {
                                        toast.error('Please provide feedback for rejection');
                                        return;
                                      }
                                      reviewContent(content.id, false, reviewNotes);
                                      setReviewNotes("");
                                    }}
                                    disabled={isUpdating}
                                    variant="outline"
                                    className="w-full text-red-600 hover:text-red-700"
                                  >
                                    {isUpdating ? <InlineLoader className="mr-2" /> : null}
                                    Reject Content
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Influencer Info */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HiUser className="w-5 h-5 text-purple-600" />
                  Influencer Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  {deal.influencer?.profile_image ? (
                    <img 
                      src={deal.influencer.profile_image} 
                      alt={deal.influencer.full_name || 'Influencer'}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {deal.influencer?.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{deal.influencer?.full_name || 'Unknown Influencer'}</h3>
                    <p className="text-sm text-gray-600">@{deal.influencer?.username || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Followers:</span>
                    <span className="font-medium">{formatFollowers(deal.influencer?.followers_count || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Engagement:</span>
                    <span className="font-medium">{(deal.influencer?.engagement_rate || 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Rating:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{(deal.influencer?.rating || 0).toFixed(1)}/5</span>
                      <span className="text-yellow-500">⭐</span>
                    </div>
                  </div>
                </div>

                {/* Deal-specific information */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Deal Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Invited:</span>
                      <span className="font-medium">{formatDate(deal.invited_at)}</span>
                    </div>
                    {deal.accepted_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Accepted:</span>
                        <span className="font-medium text-green-600">{formatDate(deal.accepted_at)}</span>
                      </div>
                    )}
                    {deal.shortlisted_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Shortlisted:</span>
                        <span className="font-medium text-blue-600">{formatDate(deal.shortlisted_at)}</span>
                      </div>
                    )}
                    {deal.completed_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Completed:</span>
                        <span className="font-medium text-green-600">{formatDate(deal.completed_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      const url = `/brand/messages?influencer=${deal.influencer?.id}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <HiChatBubbleLeftRight className="w-4 h-4 mr-2" />
                    Message Influencer
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      const url = `/influencers/${deal.influencer?.id}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <HiEye className="w-4 h-4 mr-2" />
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HiCalendarDays className="w-5 h-5 text-blue-600" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <HiClock className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Invited</p>
                      <p className="text-xs text-gray-500">{formatDate(deal.invited_at)}</p>
                    </div>
                  </div>
                  
                  {deal.responded_at && (
                    <div className="flex items-center gap-3">
                      <HiCheckCircle className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">Responded</p>
                        <p className="text-xs text-gray-500">{formatDate(deal.responded_at)}</p>
                      </div>
                    </div>
                  )}
                  
                  {deal.accepted_at && (
                    <div className="flex items-center gap-3">
                      <HiCheckCircle className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">Accepted</p>
                        <p className="text-xs text-gray-500">{formatDate(deal.accepted_at)}</p>
                      </div>
                    </div>
                  )}
                  
                  {deal.shortlisted_at && (
                    <div className="flex items-center gap-3">
                      <HiStar className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">Shortlisted</p>
                        <p className="text-xs text-gray-500">{formatDate(deal.shortlisted_at)}</p>
                      </div>
                    </div>
                  )}
                  
                  {deal.address_requested_at && (
                    <div className="flex items-center gap-3">
                      <HiInformationCircle className="w-4 h-4 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium">Address Requested</p>
                        <p className="text-xs text-gray-500">{formatDate(deal.address_requested_at)}</p>
                      </div>
                    </div>
                  )}
                  
                  {deal.address_provided_at && (
                    <div className="flex items-center gap-3">
                      <HiCheckCircle className="w-4 h-4 text-teal-500" />
                      <div>
                        <p className="text-sm font-medium">Address Provided</p>
                        <p className="text-xs text-gray-500">{formatDate(deal.address_provided_at)}</p>
                      </div>
                    </div>
                  )}
                  
                  {deal.shipped_at && (
                    <div className="flex items-center gap-3">
                      <HiTruck className="w-4 h-4 text-indigo-500" />
                      <div>
                        <p className="text-sm font-medium">Product Shipped</p>
                        <p className="text-xs text-gray-500">{formatDate(deal.shipped_at)}</p>
                      </div>
                    </div>
                  )}
                  
                  {deal.delivered_at && (
                    <div className="flex items-center gap-3">
                      <HiGift className="w-4 h-4 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium">Product Delivered</p>
                        <p className="text-xs text-gray-500">{formatDate(deal.delivered_at)}</p>
                      </div>
                    </div>
                  )}
                  
                  {deal.content_submitted_at && (
                    <div className="flex items-center gap-3">
                      <HiPhoto className="w-4 h-4 text-pink-500" />
                      <div>
                        <p className="text-sm font-medium">Content Submitted</p>
                        <p className="text-xs text-gray-500">{formatDate(deal.content_submitted_at)}</p>
                      </div>
                    </div>
                  )}
                  
                  {deal.completed_at && (
                    <div className="flex items-center gap-3">
                      <HiCheckCircle className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">Completed</p>
                        <p className="text-xs text-gray-500">{formatDate(deal.completed_at)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HiDocumentText className="w-5 h-5 text-gray-600" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Textarea
                    placeholder="Add notes about this deal..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-24"
                  />
                  <Button 
                    onClick={updateNotes}
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                  >
                    Save Notes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 