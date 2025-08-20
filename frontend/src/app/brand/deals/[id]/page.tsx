"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { InlineLoader } from "@/components/ui/inline-loader";
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
  HiThumbUp,
  HiThumbDown,
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
    name: string;
    username: string;
    profile_image?: string;
    followers: number;
    engagement_rate: number;
    avg_rating: number;
  };
  campaign: {
    id: number;
    title: string;
    description: string;
    brand_name: string;
    deal_type: string;
    cash_amount?: number;
    product_value?: number;
    product_name?: string;
    content_requirements: string;
    platforms_required: string[];
  };
  status: 'pending' | 'accepted' | 'rejected' | 'shortlisted' | 'goods_sent' | 'goods_received' | 'content_submitted' | 'content_approved' | 'content_rejected' | 'completed' | 'cancelled';
  invited_at: string;
  responded_at?: string;
  accepted_at?: string;
  shortlisted_at?: string;
  goods_sent_at?: string;
  goods_received_at?: string;
  content_submitted_at?: string;
  content_reviewed_at?: string;
  completed_at?: string;
  tracking_number?: string;
  delivery_address?: string;
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
  { id: 'pending', label: 'Invitation Sent', icon: HiClock, color: 'yellow' },
  { id: 'accepted', label: 'Deal Accepted', icon: HiCheckCircle, color: 'green' },
  { id: 'shortlisted', label: 'Shortlisted', icon: HiStar, color: 'blue' },
  { id: 'goods_sent', label: 'Goods Sent', icon: HiTruck, color: 'indigo' },
  { id: 'goods_received', label: 'Goods Received', icon: HiGift, color: 'purple' },
  { id: 'content_submitted', label: 'Content Submitted', icon: HiPhoto, color: 'pink' },
  { id: 'content_approved', label: 'Content Approved', icon: HiThumbUp, color: 'emerald' },
  { id: 'completed', label: 'Deal Completed', icon: HiCheckCircle, color: 'green' }
];

export default function DealDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;
  
  const [deal, setDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // State for actions
  const [trackingNumber, setTrackingNumber] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [notes, setNotes] = useState("");

  const fetchDeal = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/brands/deals/${dealId}/`);
      setDeal(response.data.deal);
      setNotes(response.data.deal.notes || "");
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
      await api.patch(`/api/brands/deals/${dealId}/status/`, {
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

  const sendGoods = () => {
    if (!trackingNumber || !deliveryAddress) {
      toast.error('Please provide tracking number and delivery address');
      return;
    }
    updateDealStatus('goods_sent', { 
      tracking_number: trackingNumber,
      delivery_address: deliveryAddress 
    });
  };

  const markGoodsReceived = () => {
    updateDealStatus('goods_received');
  };

  const reviewContent = async (contentId: number, approved: boolean, notes: string) => {
    setIsUpdating(true);
    try {
      await api.patch(`/api/brands/deals/${dealId}/content/${contentId}/review/`, {
        approved,
        review_notes: notes
      });
      
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
      await api.patch(`/api/brands/deals/${dealId}/notes/`, { notes });
      toast.success('Notes updated successfully');
    } catch (error: any) {
      console.error('Failed to update notes:', error);
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

  const formatFollowers = (count: number) => {
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
    return statusSteps.findIndex(step => step.id === deal.status);
  };

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      shortlisted: 'bg-blue-100 text-blue-800',
      goods_sent: 'bg-indigo-100 text-indigo-800',
      goods_received: 'bg-purple-100 text-purple-800',
      content_submitted: 'bg-pink-100 text-pink-800',
      content_approved: 'bg-emerald-100 text-emerald-800',
      content_rejected: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={`${colors[status] || 'bg-gray-100 text-gray-800'} border-0`}>
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading deal details" />
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

        {/* Progress Steps */}
        <Card className="mb-6 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Deal Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {statusSteps.map((step, index) => {
                const currentIndex = getCurrentStepIndex();
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;
                const isRejected = deal.status === 'rejected' || deal.status === 'cancelled' || deal.status === 'content_rejected';
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
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
                        <p className={`text-xs font-medium ${
                          isCurrent ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {step.label}
                        </p>
                      </div>
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div className={`w-16 h-0.5 mx-4 transition-colors ${
                        isCompleted ? `bg-${step.color}-500` : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                );
              })}
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
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Campaign</label>
                    <p className="font-semibold">{deal.campaign.title}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Deal Type</label>
                    <p className="font-semibold capitalize">{deal.campaign.deal_type}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Value</label>
                    <p className="font-semibold">
                      {deal.campaign.cash_amount && formatCurrency(deal.campaign.cash_amount)}
                      {deal.campaign.product_value && ` + ${formatCurrency(deal.campaign.product_value)} (product)`}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Platforms</label>
                    <div className="flex gap-1 mt-1">
                      {deal.campaign.platforms_required.map(platform => (
                        <Badge key={platform} variant="outline" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Content Requirements</label>
                  <p className="text-sm text-gray-700 mt-1">{deal.campaign.content_requirements}</p>
                </div>
              </CardContent>
            </Card>

            {/* Deal Actions */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
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
                        {isUpdating ? <InlineLoader size="sm" className="mr-2" /> : <HiStar className="w-4 h-4 mr-2" />}
                        Shortlist Deal
                      </Button>
                    </div>
                  </div>
                )}

                {deal.status === 'shortlisted' && deal.campaign.deal_type !== 'cash' && (
                  <div className="space-y-4">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <h4 className="font-medium text-indigo-900 mb-2">Send Products/Goods</h4>
                      <p className="text-sm text-indigo-700 mb-3">
                        Send the products to the influencer and provide tracking details.
                      </p>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Delivery Address
                          </label>
                          <Textarea
                            placeholder="Enter delivery address"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            className="h-20"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tracking Number
                          </label>
                          <Input
                            placeholder="Enter tracking number"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                          />
                        </div>
                        
                        <Button 
                          onClick={sendGoods}
                          disabled={isUpdating || !trackingNumber || !deliveryAddress}
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                        >
                          {isUpdating ? <InlineLoader size="sm" className="mr-2" /> : <HiTruck className="w-4 h-4 mr-2" />}
                          Mark as Sent
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {deal.status === 'goods_sent' && (
                  <div className="space-y-4">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-medium text-purple-900 mb-2">Goods Tracking</h4>
                      <p className="text-sm text-purple-700 mb-3">
                        Tracking: <strong>{deal.tracking_number}</strong>
                      </p>
                      <p className="text-sm text-purple-700 mb-3">
                        Waiting for influencer to confirm receipt of goods.
                      </p>
                      
                      <Button 
                        onClick={markGoodsReceived}
                        disabled={isUpdating}
                        variant="outline"
                        className="border-purple-300 hover:bg-purple-50"
                      >
                        {isUpdating ? <InlineLoader size="sm" className="mr-2" /> : <HiGift className="w-4 h-4 mr-2" />}
                        Mark as Received (Override)
                      </Button>
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

                {deal.status === 'content_approved' && (
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
                          {isUpdating ? <InlineLoader size="sm" className="mr-2" /> : <HiCheckCircle className="w-4 h-4 mr-2" />}
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
                      {isUpdating ? <InlineLoader size="sm" className="mr-2" /> : <HiXCircle className="w-4 h-4 mr-2" />}
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
                                  <HiThumbUp className="w-4 h-4 mr-1" />
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
                                    {isUpdating ? <InlineLoader size="sm" className="mr-2" /> : null}
                                    Approve Content
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                  <HiThumbDown className="w-4 h-4 mr-1" />
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
                                    {isUpdating ? <InlineLoader size="sm" className="mr-2" /> : null}
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
                  Influencer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {deal.influencer.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{deal.influencer.name}</h3>
                    <p className="text-sm text-gray-600">{deal.influencer.username}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Followers:</span>
                    <span className="font-medium">{formatFollowers(deal.influencer.followers)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Engagement:</span>
                    <span className="font-medium">{deal.influencer.engagement_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rating:</span>
                    <span className="font-medium">
                      {deal.influencer.avg_rating}/5 ⭐
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button variant="outline" size="sm" className="w-full">
                    <HiChatBubbleLeftRight className="w-4 h-4 mr-2" />
                    Message Influencer
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
                  
                  {deal.goods_sent_at && (
                    <div className="flex items-center gap-3">
                      <HiTruck className="w-4 h-4 text-indigo-500" />
                      <div>
                        <p className="text-sm font-medium">Goods Sent</p>
                        <p className="text-xs text-gray-500">{formatDate(deal.goods_sent_at)}</p>
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