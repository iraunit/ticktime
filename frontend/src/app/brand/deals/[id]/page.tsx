"use client";

import {useCallback, useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Textarea} from "@/components/ui/textarea";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {GlobalLoader, InlineLoader} from "@/components/ui/global-loader";
import {ContentReview} from "@/components/brand/content-review";
import {toast} from "@/lib/toast";
import {api} from "@/lib/api";
import {brandApi} from "@/lib/api-client";
import {getDealTypeConfig, getPlatformConfig} from "@/lib/platform-config";
import {
    HiArrowPath,
    HiBolt,
    HiCalendarDays,
    HiChatBubbleLeftRight,
    HiCheckCircle,
    HiClock,
    HiCurrencyDollar,
    HiDocumentText,
    HiExclamationTriangle,
    HiEye,
    HiGift,
    HiHandThumbUp,
    HiInformationCircle,
    HiMapPin,
    HiMegaphone,
    HiPhoto,
    HiStar,
    HiTruck,
    HiUser,
    HiXCircle
} from "react-icons/hi2";

interface BrandDeal {
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
        products?: Array<{
            name: string;
            description?: string;
            value: number;
            quantity: number;
        }>;
        product_name?: string;
        content_requirements: string;
        platforms_required: string[];
        total_value?: number;
    };
    total_value?: number;
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
    under_review_at?: string;
    revision_requested_at?: string;
    approved_at?: string;
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
    rejection_reason?: string;
    notes: string;
}

const statusSteps = [
    {id: 'invited', label: 'Invitation Sent', icon: HiClock, color: 'yellow'},
    {id: 'pending', label: 'Pending Response', icon: HiClock, color: 'yellow'},
    {id: 'accepted', label: 'Deal Accepted', icon: HiCheckCircle, color: 'green'},
    {id: 'shortlisted', label: 'Shortlisted', icon: HiStar, color: 'blue'},
    {id: 'address_requested', label: 'Address Requested', icon: HiInformationCircle, color: 'orange'},
    {id: 'address_provided', label: 'Address Provided', icon: HiCheckCircle, color: 'teal'},
    {id: 'product_shipped', label: 'Product Shipped', icon: HiTruck, color: 'indigo'},
    {id: 'product_delivered', label: 'Product Delivered', icon: HiGift, color: 'purple'},
    {id: 'active', label: 'Active', icon: HiArrowPath, color: 'blue'},
    {id: 'content_submitted', label: 'Content Submitted', icon: HiPhoto, color: 'pink'},
    {id: 'under_review', label: 'Under Review', icon: HiEye, color: 'orange'},
    {id: 'revision_requested', label: 'Revision Requested', icon: HiArrowPath, color: 'yellow'},
    {id: 'approved', label: 'Content Approved', icon: HiHandThumbUp, color: 'emerald'},
    {id: 'completed', label: 'Deal Completed', icon: HiCheckCircle, color: 'green'}
];

export default function DealDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const dealId = params.id as string;

    const [deal, setDeal] = useState<BrandDeal | null>(null);
    const [contentSubmissions, setContentSubmissions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // State for actions
    const [trackingNumber, setTrackingNumber] = useState("");
    const [trackingUrl, setTrackingUrl] = useState("");
    const [rating, setRating] = useState(5);
    const [review, setReview] = useState("");
    const [notes, setNotes] = useState("");
    const [isEditingNotes, setIsEditingNotes] = useState(false);

    const fetchDeal = useCallback(async () => {
        setIsLoading(true);
        try {
            // Use the dedicated deal detail endpoint
            const response = await api.get(`/brands/deals/${dealId}/`);
            const dealData = response.data.deal;
            setDeal(dealData);
            setNotes(dealData.notes || "");
        } catch (error: any) {
            console.error('Failed to fetch deal:', error);
            toast.error('Failed to load deal details.');
            router.push('/brand/deals');
        } finally {
            setIsLoading(false);
        }
    }, [dealId, router]);

    const fetchContentSubmissions = useCallback(async () => {
        try {
            const response = await brandApi.getContentSubmissions(parseInt(dealId));
            setContentSubmissions(response.data.submissions || []);
        } catch (error: any) {
            console.error('Failed to fetch content submissions:', error);
            // Don't show error for this as it's supplementary data
        }
    }, [dealId]);

    const handleContentReview = async (submissionId: number, action: 'approve' | 'reject' | 'request_revision', feedback?: string, revisionNotes?: string) => {
        try {
            await brandApi.reviewContent(parseInt(dealId), submissionId, {
                action,
                feedback,
                revision_notes: revisionNotes,
            });
            // Refresh data
            await Promise.all([fetchDeal(), fetchContentSubmissions()]);
            toast.success(`Content ${action.replace('_', ' ')}d successfully`);
        } catch (error: any) {
            console.error('Failed to review content:', error);
            throw error;
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

    const sendReminder = async () => {
        try {
            // This would typically call an API to send a reminder
            await api.post(`/brands/deals/${dealId}/remind/`);
            toast.success('Reminder sent to influencer successfully');
        } catch (error: any) {
            console.error('Failed to send reminder:', error);
            toast.error('Failed to send reminder. Please try again.');
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
            const response = await api.patch(`/brands/deals/${dealId}/notes/`, {notes});
            console.log('Notes update response:', response); // Debug log

            // Update local state with the new notes
            if (deal) {
                setDeal({
                    ...deal,
                    notes: notes
                });
            }

            toast.success('Notes updated successfully');
            setIsEditingNotes(false); // Exit edit mode after successful update
        } catch (error: any) {
            console.error('Failed to update notes:', error);
            console.error('Error details:', error.response?.data); // Debug log
            toast.error('Failed to update notes.');
        }
    };

    const cancelEditNotes = () => {
        setNotes(deal?.notes || ""); // Reset to original notes
        setIsEditingNotes(false);
    };

    useEffect(() => {
        if (dealId) {
            fetchDeal();
            fetchContentSubmissions();
        }
    }, [dealId, fetchDeal, fetchContentSubmissions]);

    useEffect(() => {
        if (deal && ['content_submitted', 'under_review'].includes(deal.status) && contentSubmissions.length > 0 && activeTab === 'overview') {
            setActiveTab('content');
        }
    }, [deal?.status, contentSubmissions.length]);

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
                <GlobalLoader/>
            </div>
        );
    }

    if (!deal) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <HiExclamationTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4"/>
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
                    <div
                        className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl -m-2"></div>

                    <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2">
                                Deal Management
                            </h1>
                            <p className="text-base text-gray-600 leading-relaxed">
                                Track and manage this collaboration from start to finish with real-time updates and
                                comprehensive controls.
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Current
                                    Status</p>
                                {getStatusBadge(deal.status)}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchDeal}
                                disabled={isLoading}
                                className="border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                            >
                                <HiArrowPath className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}/>
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Deal Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card
                        className="shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group border-l-4 border-l-blue-500"
                        onClick={() => {
                            if (deal.campaign?.id) {
                                window.open(`/brand/campaigns/${deal.campaign.id}`, '_blank');
                            }
                        }}>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <HiMegaphone className="w-6 h-6 text-blue-600"/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Campaign</p>
                                    <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                        {deal.campaign?.title || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        className="shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group border-l-4 border-l-purple-500"
                        onClick={() => {
                            if (deal.influencer?.id) {
                                window.open(`/influencer/${deal.influencer.id}`, '_blank');
                            }
                        }}>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <HiUser className="w-6 h-6 text-purple-600"/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Influencer</p>
                                    <p className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors truncate">
                                        {deal.influencer?.full_name || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        className="shadow-sm hover:shadow-lg transition-all duration-200 group border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <HiCurrencyDollar className="w-6 h-6 text-green-600"/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total
                                        Value</p>
                                    <p className="font-bold text-gray-900 text-lg">
                                        {deal.total_value && deal.total_value > 0 ? formatCurrency(deal.total_value) :
                                            deal.campaign?.total_value && deal.campaign.total_value > 0 ? formatCurrency(deal.campaign.total_value) : 'N/A'}
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
                                    const Icon = step.icon;

                                    return (
                                        <div key={step.id} className="flex items-center gap-3">
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                                                    isCompleted || isCurrent
                                                        ? `bg-${step.color}-500 border-${step.color}-500 text-white`
                                                        : isRejected && index > currentIndex
                                                            ? 'border-red-300 text-red-400 bg-red-50'
                                                            : 'border-gray-300 text-gray-500'
                                                }`}>
                                                <Icon className="w-4 h-4"/>
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
                                                    <HiCheckCircle className="w-4 h-4"/>
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
                                        const Icon = step.icon;

                                        return (
                                            <div key={step.id} className="flex items-center">
                                                <div className="flex flex-col items-center min-w-0 px-2">
                                                    <div
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                                                            isCompleted || isCurrent
                                                                ? `bg-${step.color}-500 border-${step.color}-500 text-white`
                                                                : isRejected && index > currentIndex
                                                                    ? 'border-red-300 text-red-400 bg-red-50'
                                                                    : 'border-gray-300 text-gray-500'
                                                        }`}>
                                                        <Icon className="w-5 h-5"/>
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
                                                    }`}/>
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

                {/* Tabs for Deal Content */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                    <TabsList
                        className="grid w-full grid-cols-3 bg-gradient-to-r from-gray-50 to-white p-1 rounded-xl border border-gray-200">
                        <TabsTrigger
                            value="overview"
                            className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 rounded-lg transition-all duration-200"
                        >
                            <HiEye className="w-4 h-4 mr-2"/>
                            Deal Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="content"
                            disabled={!['content_submitted', 'under_review', 'revision_requested', 'approved', 'completed'].includes(deal.status)}
                            className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-pink-700 rounded-lg transition-all duration-200 disabled:opacity-50"
                        >
                            <HiPhoto className="w-4 h-4 mr-2"/>
                            Content Review {contentSubmissions.length > 0 && `(${contentSubmissions.length})`}
                        </TabsTrigger>
                        <TabsTrigger
                            value="timeline"
                            className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-green-700 rounded-lg transition-all duration-200"
                        >
                            <HiCalendarDays className="w-4 h-4 mr-2"/>
                            Timeline & Actions
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Main Content */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Deal Overview */}
                                <Card className="shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <HiMegaphone className="w-5 h-5 text-blue-600"/>
                                            Deal Overview
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Campaign Information */}
                                        <div
                                            className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border border-gray-200">
                                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <HiMegaphone className="w-5 h-5 text-blue-600"/>
                                                Campaign Details
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label
                                                        className="text-xs font-medium text-gray-500 uppercase tracking-wide">Campaign
                                                        Name</label>
                                                    <div className="font-semibold text-gray-900">
                                                        {deal.campaign?.title ? (
                                                            <button
                                                                onClick={() => window.open(`/brand/campaigns/${deal.campaign.id}`, '_blank')}
                                                                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors text-left"
                                                            >
                                                                {deal.campaign.title}
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-400">N/A</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label
                                                        className="text-xs font-medium text-gray-500 uppercase tracking-wide">Brand</label>
                                                    <div className="font-semibold text-gray-900">
                                                        {deal.campaign?.brand?.name ? (
                                                            <button
                                                                onClick={() => window.open(`/brand/settings`, '_blank')}
                                                                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors text-left"
                                                            >
                                                                {deal.campaign.brand.name}
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-400">N/A</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label
                                                        className="text-xs font-medium text-gray-500 uppercase tracking-wide">Deal
                                                        Type</label>
                                                    <div>
                                                        {(() => {
                                                            const dealType = deal.campaign?.deal_type;
                                                            const config = getDealTypeConfig(dealType || '');
                                                            return (
                                                                <div
                                                                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${config.bg} ${config.border}`}>
                                                                    <span className="text-sm">{config.icon}</span>
                                                                    <span
                                                                        className={`text-sm font-medium ${config.color}`}>
                                                                        {config.label}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label
                                                        className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                                                    <div>{getStatusBadge(deal.status)}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Deal Value */}
                                        <div
                                            className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <HiCurrencyDollar className="w-5 h-5 text-green-600"/>
                                                Deal Value
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {deal.campaign?.cash_amount && deal.campaign.cash_amount > 0 && (
                                                    <div className="bg-white p-3 rounded-lg border border-green-200">
                                                        <label
                                                            className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cash
                                                            Amount</label>
                                                        <p className="font-bold text-green-600 text-lg">
                                                            {formatCurrency(deal.campaign.cash_amount)}
                                                        </p>
                                                    </div>
                                                )}
                                                {deal.campaign?.product_value && deal.campaign.product_value > 0 && (
                                                    <div className="bg-white p-3 rounded-lg border border-green-200">
                                                        <label
                                                            className="text-xs font-medium text-gray-500 uppercase tracking-wide">Product
                                                            Value</label>
                                                        <p className="font-bold text-blue-600 text-lg">
                                                            {formatCurrency(deal.campaign.product_value)}
                                                        </p>
                                                    </div>
                                                )}
                                                {deal.campaign?.product_name && (
                                                    <div
                                                        className="md:col-span-2 bg-white p-3 rounded-lg border border-green-200">
                                                        <label
                                                            className="text-xs font-medium text-gray-500 uppercase tracking-wide">Product
                                                            Name</label>
                                                        <p className="font-semibold text-gray-900">{deal.campaign.product_name}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Products Section for Barter Deals */}
                                        {(deal.campaign?.deal_type === 'product' || deal.campaign?.deal_type === 'hybrid') &&
                                            deal.campaign?.products && deal.campaign.products.length > 0 && (
                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-3">Barter Products</h4>
                                                    <div className="space-y-3">
                                                        {deal.campaign.products.map((product: any, index: number) => (
                                                            <div key={index}
                                                                 className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <h5 className="font-semibold text-orange-900">{product.name}</h5>
                                                                    <div className="text-right">
                                                                        <div
                                                                            className="text-sm font-bold text-orange-800">
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
                                                                <div
                                                                    className="flex justify-between items-center text-xs text-orange-600">
                                                                    <span>Quantity: {product.quantity}</span>
                                                                    <span>Unit Value: {formatCurrency(product.value)}</span>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        <div
                                                            className="text-center bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg p-3 border border-orange-200">
                                                            <div className="text-lg font-bold text-orange-800">
                                                                Total Product Value: {formatCurrency(
                                                                deal.campaign.products.reduce((total: number, product: any) =>
                                                                    total + (product.value * product.quantity), 0
                                                                )
                                                            )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                        {/* Platform Requirements */}
                                        <div
                                            className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                <HiPhoto className="w-5 h-5 text-purple-600"/>
                                                Platform & Content Requirements
                                            </h4>

                                            <div className="space-y-4">
                                                <div>
                                                    <label
                                                        className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Required
                                                        Platforms</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {deal.campaign?.platforms_required?.length > 0 ? (
                                                            deal.campaign.platforms_required.map((platform: string) => {
                                                                const config = getPlatformConfig(platform);
                                                                const Icon = config?.icon;
                                                                return (
                                                                    <div key={platform}
                                                                         className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-2 shadow-sm ${config ? config.bg + ' ' + config.border : 'bg-gray-50 border-gray-200'}`}>
                                                                        {Icon && <Icon
                                                                            className={`w-4 h-4 ${config?.color}`}/>}
                                                                        <span
                                                                            className="capitalize font-medium">{platform}</span>
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            <div
                                                                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm">
                                                                <span className="text-sm text-gray-500">No specific platforms required</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label
                                                        className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Content
                                                        Requirements</label>
                                                    <div className="bg-white p-3 rounded-lg border border-purple-200">
                                                        <p className="text-sm text-gray-700 leading-relaxed">
                                                            {typeof deal.campaign?.content_requirements === 'string'
                                                                ? deal.campaign?.content_requirements
                                                                : (deal.campaign?.content_requirements as any)?.description || 'No specific content requirements provided'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Campaign Description */}
                                        {deal.campaign?.description && (
                                            <div
                                                className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                    <HiDocumentText className="w-5 h-5 text-blue-600"/>
                                                    Campaign Description
                                                </h4>
                                                <div className="bg-white p-4 rounded-lg border border-blue-200">
                                                    <p className="text-sm text-gray-700 leading-relaxed">{deal.campaign.description}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Comprehensive Information Section - Always Visible */}
                                        <div
                                            className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border border-gray-200">
                                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <HiInformationCircle className="w-5 h-5 text-gray-600"/>
                                                Complete Deal Information
                                            </h4>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Shipping Information */}
                                                {deal.shipping_address && (
                                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                                        <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                                                            <HiMapPin className="w-4 h-4"/>
                                                            Shipping Address
                                                        </h5>
                                                        <div className="text-sm text-blue-800 space-y-1">
                                                            <p>
                                                                <strong>Address:</strong> {deal.shipping_address.address_line1 || deal.shipping_address.address_line_1 || 'N/A'}
                                                            </p>
                                                            {(deal.shipping_address.address_line2 || deal.shipping_address.address_line_2) && (
                                                                <p><strong>Address Line
                                                                    2:</strong> {deal.shipping_address.address_line2 || deal.shipping_address.address_line_2}
                                                                </p>
                                                            )}
                                                            <p>
                                                                <strong>City:</strong> {deal.shipping_address.city || 'N/A'}
                                                            </p>
                                                            <p>
                                                                <strong>State:</strong> {deal.shipping_address.state || 'N/A'}
                                                            </p>
                                                            <p><strong>ZIP/Postal
                                                                Code:</strong> {deal.shipping_address.zipcode || deal.shipping_address.postal_code || 'N/A'}
                                                            </p>
                                                            <p>
                                                                <strong>Country:</strong> {deal.shipping_address.country || 'N/A'}
                                                            </p>
                                                            {deal.shipping_address.phone_number && (
                                                                <p>
                                                                    <strong>Phone:</strong> {deal.shipping_address.country_code && `${deal.shipping_address.country_code} `}{deal.shipping_address.phone_number}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Tracking Information */}
                                                {deal.tracking_number && (
                                                    <div
                                                        className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                                                        <h5 className="font-medium text-indigo-900 mb-2 flex items-center gap-2">
                                                            <HiTruck className="w-4 h-4"/>
                                                            Tracking Information
                                                        </h5>
                                                        <div className="text-sm text-indigo-800 space-y-1">
                                                            <p><strong>Tracking Number:</strong> {deal.tracking_number}
                                                            </p>
                                                            {deal.tracking_url && (
                                                                <p><strong>Track Package:</strong> <a
                                                                    href={deal.tracking_url} target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-indigo-600 hover:underline">{deal.tracking_url}</a>
                                                                </p>
                                                            )}
                                                            {deal.shipped_at && (
                                                                <p><strong>Shipped
                                                                    Date:</strong> {new Date(deal.shipped_at).toLocaleDateString()}
                                                                </p>
                                                            )}
                                                            {deal.delivered_at && (
                                                                <p><strong>Delivered
                                                                    Date:</strong> {new Date(deal.delivered_at).toLocaleDateString()}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Content Information */}
                                                {deal.content_submitted_at && (
                                                    <div className="bg-pink-50 p-3 rounded-lg border border-pink-200">
                                                        <h5 className="font-medium text-pink-900 mb-2 flex items-center gap-2">
                                                            <HiPhoto className="w-4 h-4"/>
                                                            Content Information
                                                        </h5>
                                                        <div className="text-sm text-pink-800 space-y-1">
                                                            <p><strong>Content
                                                                Submitted:</strong> {new Date(deal.content_submitted_at).toLocaleDateString()}
                                                            </p>
                                                            {deal.submitted_content && deal.submitted_content.length > 0 && (
                                                                <p><strong>Content
                                                                    Count:</strong> {deal.submitted_content.length} submission(s)
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Deal Completion Information */}
                                                {deal.completed_at && (
                                                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                                        <h5 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                                                            <HiCheckCircle className="w-4 h-4"/>
                                                            Deal Completion
                                                        </h5>
                                                        <div className="text-sm text-green-800 space-y-1">
                                                            <p><strong>Completed
                                                                Date:</strong> {new Date(deal.completed_at).toLocaleDateString()}
                                                            </p>
                                                            {deal.brand_rating && (
                                                                <p><strong>Brand Rating:</strong> {deal.brand_rating}/5
                                                                    ⭐</p>
                                                            )}
                                                            {deal.brand_review && (
                                                                <p><strong>Brand Review:</strong> {deal.brand_review}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* General Deal Information - Always Visible */}
                                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                    <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                                        <HiInformationCircle className="w-4 h-4"/>
                                                        Deal Timeline
                                                    </h5>
                                                    <div className="text-sm text-gray-700 space-y-1">
                                                        <p>
                                                            <strong>Invited:</strong> {new Date(deal.invited_at).toLocaleDateString()}
                                                        </p>
                                                        {deal.responded_at && (
                                                            <p>
                                                                <strong>Responded:</strong> {new Date(deal.responded_at).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                        {deal.accepted_at && (
                                                            <p>
                                                                <strong>Accepted:</strong> {new Date(deal.accepted_at).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                        {deal.shortlisted_at && (
                                                            <p>
                                                                <strong>Shortlisted:</strong> {new Date(deal.shortlisted_at).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                        {deal.content_submitted_at && (
                                                            <p><strong>Content
                                                                Submitted:</strong> {new Date(deal.content_submitted_at).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                        {deal.completed_at && (
                                                            <p>
                                                                <strong>Completed:</strong> {new Date(deal.completed_at).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Deal Notes - Always Visible */}
                                                {deal.notes && (
                                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                                        <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                                                            <HiDocumentText className="w-4 h-4"/>
                                                            Deal Notes
                                                        </h5>
                                                        <div className="text-sm text-blue-800">
                                                            <p>{deal.notes}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Quick Actions Card */}
                                <Card className="shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <HiBolt className="w-5 h-5 text-yellow-600"/>
                                            Quick Actions
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {['content_submitted', 'under_review', 'revision_requested'].includes(deal.status) && (
                                                <Button
                                                    onClick={() => setActiveTab('content')}
                                                    className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white"
                                                >
                                                    <HiPhoto className="w-4 h-4 mr-2"/>
                                                    Review Content
                                                </Button>
                                            )}

                                            {deal.status === 'accepted' && (
                                                <Button
                                                    onClick={shortlistDeal}
                                                    disabled={isUpdating}
                                                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                                                >
                                                    <HiStar className="w-4 h-4 mr-2"/>
                                                    Shortlist
                                                </Button>
                                            )}

                                            {deal.status === 'shortlisted' && deal.campaign?.deal_type !== 'cash' && (
                                                <Button
                                                    onClick={requestAddress}
                                                    disabled={isUpdating}
                                                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                                                >
                                                    <HiMapPin className="w-4 h-4 mr-2"/>
                                                    Request Address
                                                </Button>
                                            )}

                                            <Button
                                                onClick={() => setActiveTab('timeline')}
                                                variant="outline"
                                                className="border-blue-200 hover:bg-blue-50"
                                            >
                                                <HiCalendarDays className="w-4 h-4 mr-2"/>
                                                All Actions
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                {/* Influencer Info */}
                                <Card className="shadow-sm hover:shadow-md transition-shadow">
                                    <CardHeader
                                        className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200">
                                        <CardTitle className="flex items-center gap-2 text-purple-900">
                                            <HiUser className="w-5 h-5 text-purple-600"/>
                                            Influencer Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            {deal.influencer?.profile_image ? (
                                                <img
                                                    src={deal.influencer.profile_image}
                                                    alt={deal.influencer.full_name || 'Influencer'}
                                                    className="w-14 h-14 rounded-full object-cover border-2 border-purple-200 shadow-md"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                        target.nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                            ) : null}
                                            <div
                                                className={`w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-md ${deal.influencer?.profile_image ? 'hidden' : ''}`}>
                                                 <span className="text-white font-bold text-xl">
                                                     {deal.influencer?.full_name?.charAt(0)?.toUpperCase() || '?'}
                                                 </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 text-lg truncate">{deal.influencer?.full_name || 'Unknown Influencer'}</h3>
                                                <p className="text-sm text-gray-600">@{deal.influencer?.username || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 text-sm mb-4">
                                            <div
                                                className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-200">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span
                                                        className="text-xs font-medium text-gray-500 uppercase tracking-wide">Followers</span>
                                                    <span
                                                        className="font-bold text-purple-700 text-lg">{formatFollowers(deal.influencer?.followers_count || 0)}</span>
                                                </div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span
                                                        className="text-xs font-medium text-gray-500 uppercase tracking-wide">Engagement</span>
                                                    <span
                                                        className="font-bold text-purple-700">{(deal.influencer?.engagement_rate || 0).toFixed(1)}%</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span
                                                        className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rating</span>
                                                    <div className="flex items-center gap-1">
                                                        <span
                                                            className="font-bold text-purple-700">{(deal.influencer?.rating || 0).toFixed(1)}/5</span>
                                                        <span className="text-yellow-500 text-lg">⭐</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Deal-specific information */}
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                                <HiCalendarDays className="w-4 h-4 text-gray-600"/>
                                                Deal Timeline
                                            </h4>
                                            <div className="space-y-3 text-sm">
                                                <div
                                                    className="bg-gradient-to-r from-gray-50 to-white p-3 rounded-lg border border-gray-200">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span
                                                            className="text-xs font-medium text-gray-500 uppercase tracking-wide">Invited</span>
                                                        <span
                                                            className="font-bold text-gray-700">{formatDate(deal.invited_at)}</span>
                                                    </div>
                                                </div>
                                                {deal.accepted_at && (
                                                    <div
                                                        className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span
                                                                className="text-xs font-medium text-gray-500 uppercase tracking-wide">Accepted</span>
                                                            <span
                                                                className="font-bold text-green-700">{formatDate(deal.accepted_at)}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {deal.shortlisted_at && (
                                                    <div
                                                        className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span
                                                                className="text-xs font-medium text-gray-500 uppercase tracking-wide">Shortlisted</span>
                                                            <span
                                                                className="font-bold text-blue-700">{formatDate(deal.shortlisted_at)}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {deal.completed_at && (
                                                    <div
                                                        className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span
                                                                className="text-xs font-medium text-gray-500 uppercase tracking-wide">Completed</span>
                                                            <span
                                                                className="font-bold text-green-700">{formatDate(deal.completed_at)}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full border-purple-200 hover:bg-purple-50 hover:border-purple-300 text-purple-700"
                                                onClick={() => {
                                                    const url = `/brand/messages?influencer=${deal.influencer?.id}`;
                                                    window.open(url, '_blank');
                                                }}
                                            >
                                                <HiChatBubbleLeftRight className="w-4 h-4 mr-2"/>
                                                Message Influencer
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-blue-700"
                                                onClick={() => {
                                                    const url = `/influencer/${deal.influencer?.id}`;
                                                    window.open(url, '_blank');
                                                }}
                                            >
                                                <HiEye className="w-4 h-4 mr-2"/>
                                                View Profile
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="content" className="mt-6">
                        <ContentReview
                            deal={deal as any}
                            submissions={contentSubmissions}
                            onReview={handleContentReview}
                            isLoading={isUpdating}
                        />
                    </TabsContent>

                    <TabsContent value="timeline" className="mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Deal Actions */}
                            <div className="lg:col-span-2">
                                <Card className="shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <HiBolt className="w-5 h-5 text-yellow-600"/>
                                            Deal Actions & Stage Management
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Stage Management Section */}
                                        <div
                                            className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                            <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                                                <HiArrowPath className="w-4 h-4"/>
                                                Manual Stage Management
                                            </h4>
                                            <p className="text-sm text-blue-700 mb-3">
                                                You can manually change the deal stage if needed. Use this carefully as
                                                it affects the deal flow.
                                            </p>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => updateDealStatus('invited')}
                                                    disabled={isUpdating}
                                                    className="text-xs h-8 border-blue-200 text-blue-700 hover:bg-blue-50"
                                                >
                                                    Invited
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => updateDealStatus('accepted')}
                                                    disabled={isUpdating}
                                                    className="text-xs h-8 border-green-200 text-green-700 hover:bg-green-50"
                                                >
                                                    Accepted
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => updateDealStatus('shortlisted')}
                                                    disabled={isUpdating}
                                                    className="text-xs h-8 border-blue-200 text-blue-700 hover:bg-blue-50"
                                                >
                                                    Shortlisted
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => updateDealStatus('active')}
                                                    disabled={isUpdating}
                                                    className="text-xs h-8 border-purple-200 text-purple-700 hover:bg-purple-50"
                                                >
                                                    Active
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => updateDealStatus('content_submitted')}
                                                    disabled={isUpdating}
                                                    className="text-xs h-8 border-pink-200 text-pink-700 hover:bg-pink-50"
                                                >
                                                    Content Submitted
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => updateDealStatus('completed')}
                                                    disabled={isUpdating}
                                                    className="text-xs h-8 border-green-200 text-green-700 hover:bg-green-50"
                                                >
                                                    Completed
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Always Visible Information Section */}
                                        <div
                                            className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
                                            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                                <HiInformationCircle className="w-4 h-4 text-gray-600"/>
                                                Deal Information & History
                                            </h4>

                                            {/* Shipping Information - Always Visible */}
                                            {deal.shipping_address && (
                                                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                    <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                                                        <HiMapPin className="w-4 h-4"/>
                                                        Shipping Address
                                                    </h5>
                                                    <div className="text-sm text-blue-800 space-y-1">
                                                        <p>
                                                            <strong>Address:</strong> {deal.shipping_address.address_line1 || deal.shipping_address.address_line_1 || 'N/A'}
                                                        </p>
                                                        {(deal.shipping_address.address_line2 || deal.shipping_address.address_line_2) && (
                                                            <p><strong>Address Line
                                                                2:</strong> {deal.shipping_address.address_line2 || deal.shipping_address.address_line_2}
                                                            </p>
                                                        )}
                                                        <p><strong>City:</strong> {deal.shipping_address.city || 'N/A'}
                                                        </p>
                                                        <p>
                                                            <strong>State:</strong> {deal.shipping_address.state || 'N/A'}
                                                        </p>
                                                        <p><strong>ZIP/Postal
                                                            Code:</strong> {deal.shipping_address.zipcode || deal.shipping_address.postal_code || 'N/A'}
                                                        </p>
                                                        <p>
                                                            <strong>Country:</strong> {deal.shipping_address.country || 'N/A'}
                                                        </p>
                                                        {deal.shipping_address.phone_number && (
                                                            <p>
                                                                <strong>Phone:</strong> {deal.shipping_address.country_code && `${deal.shipping_address.country_code} `}{deal.shipping_address.phone_number}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Tracking Information - Always Visible */}
                                            {deal.tracking_number && (
                                                <div
                                                    className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                                                    <h5 className="font-medium text-indigo-900 mb-2 flex items-center gap-2">
                                                        <HiTruck className="w-4 h-4"/>
                                                        Tracking Information
                                                    </h5>
                                                    <div className="text-sm text-indigo-800 space-y-1">
                                                        <p><strong>Tracking Number:</strong> {deal.tracking_number}</p>
                                                        {deal.tracking_url && (
                                                            <p><strong>Track Package:</strong> <a
                                                                href={deal.tracking_url} target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-indigo-600 hover:underline">{deal.tracking_url}</a>
                                                            </p>
                                                        )}
                                                        {deal.shipped_at && (
                                                            <p><strong>Shipped
                                                                Date:</strong> {new Date(deal.shipped_at).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                        {deal.delivered_at && (
                                                            <p><strong>Delivered
                                                                Date:</strong> {new Date(deal.delivered_at).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Content Information - Always Visible */}
                                            {deal.content_submitted_at && (
                                                <div className="mb-4 p-3 bg-pink-50 rounded-lg border border-pink-200">
                                                    <h5 className="font-medium text-pink-900 mb-2 flex items-center gap-2">
                                                        <HiPhoto className="w-4 h-4"/>
                                                        Content Information
                                                    </h5>
                                                    <div className="text-sm text-pink-800 space-y-1">
                                                        <p><strong>Content
                                                            Submitted:</strong> {new Date(deal.content_submitted_at).toLocaleDateString()}
                                                        </p>
                                                        {deal.content_reviewed_at && (
                                                            <p><strong>Content
                                                                Reviewed:</strong> {new Date(deal.content_reviewed_at).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                        {deal.submitted_content && deal.submitted_content.length > 0 && (
                                                            <p><strong>Content
                                                                Count:</strong> {deal.submitted_content.length} submission(s)
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Deal Completion Information - Always Visible */}
                                            {deal.completed_at && (
                                                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                                    <h5 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                                                        <HiCheckCircle className="w-4 h-4"/>
                                                        Deal Completion
                                                    </h5>
                                                    <div className="text-sm text-green-800 space-y-1">
                                                        <p><strong>Completed
                                                            Date:</strong> {new Date(deal.completed_at).toLocaleDateString()}
                                                        </p>
                                                        {deal.brand_rating && (
                                                            <p><strong>Brand Rating:</strong> {deal.brand_rating}/5 ⭐
                                                            </p>
                                                        )}
                                                        {deal.brand_review && (
                                                            <p><strong>Brand Review:</strong> {deal.brand_review}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Deal Accepted - Shortlist */}
                                        {deal.status === 'accepted' && (
                                            <div className="space-y-4">
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                    <h4 className="font-medium text-blue-900 mb-2">Next Step: Shortlist
                                                        Deal</h4>
                                                    <p className="text-sm text-blue-700 mb-3">
                                                        The influencer has accepted your deal. You can now shortlist
                                                        them for final selection.
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={shortlistDeal}
                                                            disabled={isUpdating}
                                                            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                                                        >
                                                            {isUpdating ? <InlineLoader className="mr-2"/> :
                                                                <HiStar className="w-4 h-4 mr-2"/>}
                                                            Shortlist Deal
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => updateDealStatus('rejected')}
                                                            disabled={isUpdating}
                                                            className="border-red-200 text-red-700 hover:bg-red-50"
                                                        >
                                                            <HiXCircle className="w-4 h-4 mr-2"/>
                                                            Reject Deal
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Shortlisted - Request Address for Barter Deals */}
                                        {deal.status === 'shortlisted' && deal.campaign?.deal_type !== 'cash' && (
                                            <div className="space-y-4">
                                                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                                    <h4 className="font-medium text-indigo-900 mb-2">Request Shipping
                                                        Address</h4>
                                                    <p className="text-sm text-indigo-700 mb-3">
                                                        Request the influencer's shipping address to send products.
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={requestAddress}
                                                            disabled={isUpdating}
                                                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                                                        >
                                                            {isUpdating ? <InlineLoader className="mr-2"/> :
                                                                <HiInformationCircle className="w-4 h-4 mr-2"/>}
                                                            Request Address
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => updateDealStatus('active')}
                                                            disabled={isUpdating}
                                                            className="border-green-200 text-green-700 hover:bg-green-50"
                                                        >
                                                            <HiCheckCircle className="w-4 h-4 mr-2"/>
                                                            Skip to Active
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Shortlisted - For Cash Deals */}
                                        {deal.status === 'shortlisted' && deal.campaign?.deal_type === 'cash' && (
                                            <div className="space-y-4">
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                    <h4 className="font-medium text-green-900 mb-2">Move to Active</h4>
                                                    <p className="text-sm text-green-700 mb-3">
                                                        For cash deals, you can move directly to active status to start
                                                        content creation.
                                                    </p>
                                                    <Button
                                                        onClick={() => updateDealStatus('active')}
                                                        disabled={isUpdating}
                                                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                                                    >
                                                        {isUpdating ? <InlineLoader className="mr-2"/> :
                                                            <HiCheckCircle className="w-4 h-4 mr-2"/>}
                                                        Activate Deal
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Address Requested - Waiting */}
                                        {deal.status === 'address_requested' && (
                                            <div className="space-y-4">
                                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                                    <h4 className="font-medium text-orange-900 mb-2">Waiting for
                                                        Address</h4>
                                                    <p className="text-sm text-orange-700 mb-3">
                                                        Address request sent to influencer. Waiting for them to provide
                                                        shipping address.
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => updateDealStatus('active')}
                                                            disabled={isUpdating}
                                                            className="border-green-200 text-green-700 hover:bg-green-50"
                                                        >
                                                            <HiCheckCircle className="w-4 h-4 mr-2"/>
                                                            Skip to Active
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => updateDealStatus('cancelled')}
                                                            disabled={isUpdating}
                                                            className="border-red-200 text-red-700 hover:bg-red-50"
                                                        >
                                                            <HiXCircle className="w-4 h-4 mr-2"/>
                                                            Cancel Deal
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Address Provided - Ship Products */}
                                        {deal.status === 'address_provided' && (
                                            <div className="space-y-4">
                                                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                                                    <h4 className="font-medium text-teal-900 mb-2">Ship Products</h4>
                                                    <p className="text-sm text-teal-700 mb-3">
                                                        Address received! Ship the products and provide tracking
                                                        information.
                                                    </p>

                                                    {deal.shipping_address && (
                                                        <div className="bg-white p-3 rounded border text-sm mb-3">
                                                            <p className="font-medium">Shipping Address:</p>
                                                            <p>{deal.shipping_address.address_line1 || deal.shipping_address.address_line_1 || 'N/A'}</p>
                                                            {(deal.shipping_address.address_line2 || deal.shipping_address.address_line_2) && (
                                                                <p>{deal.shipping_address.address_line2 || deal.shipping_address.address_line_2}</p>
                                                            )}
                                                            <p>
                                                                {deal.shipping_address.city || 'N/A'}, {deal.shipping_address.state || 'N/A'} {deal.shipping_address.zipcode || deal.shipping_address.postal_code || 'N/A'}
                                                            </p>
                                                            <p>{deal.shipping_address.country || 'N/A'}</p>
                                                            {deal.shipping_address.phone_number && (
                                                                <p>Phone: {deal.shipping_address.country_code && `${deal.shipping_address.country_code} `}{deal.shipping_address.phone_number}</p>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="space-y-3">
                                                        <div>
                                                            <label
                                                                className="block text-sm font-medium text-gray-700 mb-1">
                                                                Tracking Number *
                                                            </label>
                                                            <Input
                                                                placeholder="Enter tracking number"
                                                                value={trackingNumber}
                                                                onChange={(e) => setTrackingNumber(e.target.value)}
                                                            />
                                                        </div>

                                                        <div>
                                                            <label
                                                                className="block text-sm font-medium text-gray-700 mb-1">
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
                                                            {isUpdating ? <InlineLoader className="mr-2"/> :
                                                                <HiTruck className="w-4 h-4 mr-2"/>}
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
                                                    <h4 className="font-medium text-indigo-900 mb-2">Product
                                                        Shipped</h4>
                                                    <p className="text-sm text-indigo-700 mb-3">
                                                        Products have been shipped. Tracking information:
                                                    </p>
                                                    <div className="bg-white p-3 rounded border text-sm mb-3">
                                                        <p><strong>Tracking Number:</strong> {deal.tracking_number}</p>
                                                        {deal.tracking_url && (
                                                            <p><strong>Track Package:</strong> <a
                                                                href={deal.tracking_url} target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:underline">{deal.tracking_url}</a>
                                                            </p>
                                                        )}
                                                        <p>
                                                            <strong>Shipped:</strong> {deal.shipped_at && new Date(deal.shipped_at).toLocaleDateString()}
                                                        </p>
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
                                                        {isUpdating ? <InlineLoader className="mr-2"/> :
                                                            <HiGift className="w-4 h-4 mr-2"/>}
                                                        Mark as Delivered (Override)
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Product Delivered - Ready for Content */}
                                        {deal.status === 'product_delivered' && (
                                            <div className="space-y-4">
                                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                                    <h4 className="font-medium text-purple-900 mb-2">Products
                                                        Delivered</h4>
                                                    <p className="text-sm text-purple-700 mb-3">
                                                        Products have been delivered! Influencer can now create content.
                                                    </p>
                                                    <div className="bg-white p-3 rounded border text-sm">
                                                        <p>
                                                            <strong>Delivered:</strong> {deal.delivered_at && new Date(deal.delivered_at).toLocaleDateString()}
                                                        </p>
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
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => setActiveTab('content')}
                                                            className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700"
                                                        >
                                                            <HiPhoto className="w-4 h-4 mr-2"/>
                                                            Review Content
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => updateDealStatus('under_review')}
                                                            disabled={isUpdating}
                                                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <HiEye className="w-4 h-4 mr-2"/>
                                                            Mark Under Review
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {deal.status === 'under_review' && (
                                            <div className="space-y-4">
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                    <h4 className="font-medium text-blue-900 mb-2">Content Under
                                                        Review</h4>
                                                    <p className="text-sm text-blue-700 mb-3">
                                                        Content is currently being reviewed. You can continue the review
                                                        process.
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => setActiveTab('content')}
                                                            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                                                        >
                                                            <HiEye className="w-4 h-4 mr-2"/>
                                                            Continue Review
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => updateDealStatus('revision_requested')}
                                                            disabled={isUpdating}
                                                            className="border-orange-200 text-orange-700 hover:bg-orange-50"
                                                        >
                                                            <HiArrowPath className="w-4 h-4 mr-2"/>
                                                            Request Revision
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {deal.status === 'revision_requested' && (
                                            <div className="space-y-4">
                                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                                    <h4 className="font-medium text-orange-900 mb-2">Revision
                                                        Requested</h4>
                                                    <p className="text-sm text-orange-700 mb-3">
                                                        You have requested changes from the influencer. Wait for them to
                                                        submit revised content.
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => setActiveTab('content')}
                                                            className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                                                        >
                                                            <HiPhoto className="w-4 h-4 mr-2"/>
                                                            Check for Revisions
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => updateDealStatus('under_review')}
                                                            disabled={isUpdating}
                                                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <HiEye className="w-4 h-4 mr-2"/>
                                                            Mark Under Review
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {deal.status === 'approved' && (
                                            <div className="space-y-4">
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                    <h4 className="font-medium text-green-900 mb-2">Complete Deal</h4>
                                                    <p className="text-sm text-green-700 mb-3">
                                                        Content has been approved. Rate the influencer and complete the
                                                        deal.
                                                    </p>

                                                    <div className="space-y-3">
                                                        <div>
                                                            <label
                                                                className="block text-sm font-medium text-gray-700 mb-1">
                                                                Rating (1-5 stars)
                                                            </label>
                                                            <Select value={rating.toString()}
                                                                    onValueChange={(value) => setRating(parseInt(value))}>
                                                                <SelectTrigger>
                                                                    <SelectValue/>
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="5">5 Stars -
                                                                        Excellent</SelectItem>
                                                                    <SelectItem value="4">4 Stars - Very
                                                                        Good</SelectItem>
                                                                    <SelectItem value="3">3 Stars - Good</SelectItem>
                                                                    <SelectItem value="2">2 Stars - Fair</SelectItem>
                                                                    <SelectItem value="1">1 Star - Poor</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        <div>
                                                            <label
                                                                className="block text-sm font-medium text-gray-700 mb-1">
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
                                                            {isUpdating ? <InlineLoader className="mr-2"/> :
                                                                <HiCheckCircle className="w-4 h-4 mr-2"/>}
                                                            Complete Deal
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Deal Information Display/Editing */}
                                        <div className="pt-6 border-t border-gray-200">
                                            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                                <HiDocumentText className="w-4 h-4 text-gray-600"/>
                                                Deal Information
                                            </h4>
                                            <div className="space-y-4">
                                                {/* Rejection Reason Display */}
                                                {deal?.rejection_reason && (
                                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <HiXCircle className="w-4 h-4 text-red-600"/>
                                                            <span className="text-sm font-medium text-red-800">Reason to Reject</span>
                                                        </div>
                                                        <p className="text-sm text-red-700">{deal.rejection_reason}</p>
                                                    </div>
                                                )}

                                                {/* Deal Notes Section */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Deal Notes
                                                        </label>
                                                        {!isEditingNotes && (
                                                            <Button
                                                                onClick={() => setIsEditingNotes(true)}
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            >
                                                                Edit
                                                            </Button>
                                                        )}
                                                    </div>

                                                    {isEditingNotes ? (
                                                        <div className="space-y-2">
                                                            <Textarea
                                                                placeholder="Add or update notes about this deal..."
                                                                value={notes}
                                                                onChange={(e) => setNotes(e.target.value)}
                                                                className="h-20"
                                                            />
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    onClick={updateNotes}
                                                                    size="sm"
                                                                    variant="outline"
                                                                >
                                                                    Update Notes
                                                                </Button>
                                                                <Button
                                                                    onClick={cancelEditNotes}
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="text-gray-600 hover:text-gray-700"
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className="bg-gray-50 border border-gray-200 rounded-lg p-3 min-h-[5rem]">
                                                            {deal?.notes ? (
                                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{deal.notes}</p>
                                                            ) : (
                                                                <p className="text-sm text-gray-500 italic">No notes
                                                                    added yet</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Cancel Deal Option */}
                                        {!['completed', 'cancelled'].includes(deal.status) && (
                                            <div className="pt-4 border-t border-gray-200">
                                                <Button
                                                    onClick={cancelDeal}
                                                    disabled={isUpdating}
                                                    variant="outline"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                >
                                                    {isUpdating ? <InlineLoader className="mr-2"/> :
                                                        <HiXCircle className="w-4 h-4 mr-2"/>}
                                                    Cancel Deal
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Timeline Sidebar */}
                            <div className="space-y-6">
                                {/* Enhanced Timeline */}
                                <Card className="shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <HiCalendarDays className="w-5 h-5 text-blue-600"/>
                                            Complete Timeline
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {/* Invited Stage */}
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                                                        deal.status === 'invited' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
                                                    }`}>
                                                    {deal.status === 'invited' ? (
                                                        <HiClock className="w-4 h-4 text-blue-600"/>
                                                    ) : (
                                                        <HiCheckCircle className="w-4 h-4 text-green-600"/>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className={`text-sm font-medium ${deal.status === 'invited' ? 'text-blue-900' : 'text-gray-500'}`}>
                                                            Deal Invitation Sent
                                                        </p>
                                                        <span
                                                            className="text-xs text-gray-500">{formatDate(deal.invited_at)}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-600">Campaign invitation sent to
                                                        influencer</p>
                                                    {deal.status === 'invited' && (
                                                        <div className="mt-2 flex gap-2">
                                                            <Button size="sm" variant="outline"
                                                                    className="text-xs h-6 px-2">
                                                                <HiStar className="w-3 h-3 mr-1"/>
                                                                Shortlist
                                                            </Button>
                                                            <Button size="sm" variant="outline"
                                                                    className="text-xs h-6 px-2 text-red-600">
                                                                <HiXCircle className="w-3 h-3 mr-1"/>
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Responded Stage */}
                                            {deal.responded_at && (
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-green-300 bg-green-50">
                                                        <HiCheckCircle className="w-4 h-4 text-green-600"/>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-medium text-green-900">Influencer
                                                                Responded</p>
                                                            <span
                                                                className="text-xs text-gray-500">{formatDate(deal.responded_at)}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-600">Influencer has responded to
                                                            the invitation</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Accepted Stage */}
                                            {deal.accepted_at && (
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-green-500 bg-green-50">
                                                        <HiCheckCircle className="w-4 h-4 text-green-600"/>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-medium text-green-900">Deal
                                                                Accepted</p>
                                                            <span
                                                                className="text-xs text-gray-500">{formatDate(deal.accepted_at)}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-600">Influencer accepted the
                                                            collaboration</p>
                                                        {deal.status === 'accepted' && (
                                                            <div className="mt-2">
                                                                <Button size="sm" onClick={shortlistDeal}
                                                                        disabled={isUpdating}
                                                                        className="text-xs h-6 px-2">
                                                                    <HiStar className="w-3 h-3 mr-1"/>
                                                                    Shortlist Deal
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Shortlisted Stage */}
                                            {deal.shortlisted_at && (
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-blue-500 bg-blue-50">
                                                        <HiStar className="w-4 h-4 text-blue-600"/>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-medium text-blue-900">Deal
                                                                Shortlisted</p>
                                                            <span
                                                                className="text-xs text-gray-500">{formatDate(deal.shortlisted_at)}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-600">Deal moved to shortlist for
                                                            final selection</p>
                                                        {deal.status === 'shortlisted' && deal.campaign?.deal_type !== 'cash' && (
                                                            <div className="mt-2">
                                                                <Button size="sm" onClick={requestAddress}
                                                                        disabled={isUpdating}
                                                                        className="text-xs h-6 px-2">
                                                                    <HiMapPin className="w-3 h-3 mr-1"/>
                                                                    Request Address
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Address Requested Stage */}
                                            {deal.address_requested_at && (
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                                                            deal.status === 'address_requested' ? 'border-orange-500 bg-orange-50' : 'border-orange-300 bg-orange-50'
                                                        }`}>
                                                        <HiInformationCircle
                                                            className={`w-4 h-4 ${deal.status === 'address_requested' ? 'text-orange-600' : 'text-orange-400'}`}/>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <p className={`text-sm font-medium ${deal.status === 'address_requested' ? 'text-orange-900' : 'text-orange-700'}`}>
                                                                Address Requested
                                                            </p>
                                                            <span
                                                                className="text-xs text-gray-500">{formatDate(deal.address_requested_at)}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-600">Waiting for influencer to
                                                            provide shipping address</p>
                                                        {deal.status === 'address_requested' && (
                                                            <div className="mt-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-xs h-6 px-2 text-orange-600"
                                                                    onClick={sendReminder}
                                                                >
                                                                    <HiClock className="w-3 h-3 mr-1"/>
                                                                    Remind Influencer
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Address Provided Stage */}
                                            {deal.address_provided_at && (
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-teal-500 bg-teal-50">
                                                        <HiCheckCircle className="w-4 h-4 text-teal-600"/>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-medium text-teal-900">Address
                                                                Provided</p>
                                                            <span
                                                                className="text-xs text-gray-500">{formatDate(deal.address_provided_at)}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-600">Shipping address received
                                                            from influencer</p>
                                                        {deal.status === 'address_provided' && (
                                                            <div className="mt-2">
                                                                <Button size="sm"
                                                                        onClick={() => setActiveTab('timeline')}
                                                                        className="text-xs h-6 px-2">
                                                                    <HiTruck className="w-3 h-3 mr-1"/>
                                                                    Ship Products
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Product Shipped Stage */}
                                            {deal.shipped_at && (
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-indigo-500 bg-indigo-50">
                                                        <HiTruck className="w-4 h-4 text-indigo-600"/>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-medium text-indigo-900">Product
                                                                Shipped</p>
                                                            <span
                                                                className="text-xs text-gray-500">{formatDate(deal.shipped_at)}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-600">Products have been shipped
                                                            to influencer</p>
                                                        {deal.tracking_number && (
                                                            <div
                                                                className="mt-2 p-2 bg-indigo-50 rounded text-xs text-indigo-700">
                                                                <strong>Tracking:</strong> {deal.tracking_number}
                                                                {deal.tracking_url && (
                                                                    <a href={deal.tracking_url} target="_blank"
                                                                       rel="noopener noreferrer"
                                                                       className="ml-2 text-indigo-600 hover:underline">Track
                                                                        Package</a>
                                                                )}
                                                            </div>
                                                        )}
                                                        {deal.status === 'product_shipped' && (
                                                            <div className="mt-2">
                                                                <Button size="sm" onClick={markDelivered}
                                                                        disabled={isUpdating}
                                                                        className="text-xs h-6 px-2">
                                                                    <HiGift className="w-3 h-3 mr-1"/>
                                                                    Mark Delivered
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Product Delivered Stage */}
                                            {deal.delivered_at && (
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-purple-500 bg-purple-50">
                                                        <HiGift className="w-4 h-4 text-purple-600"/>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-medium text-purple-900">Product
                                                                Delivered</p>
                                                            <span
                                                                className="text-xs text-gray-500">{formatDate(deal.delivered_at)}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-600">Products successfully
                                                            delivered to influencer</p>
                                                        {deal.status === 'product_delivered' && (
                                                            <div className="mt-2">
                                                                <Button size="sm" variant="outline"
                                                                        className="text-xs h-6 px-2 text-purple-600">
                                                                    <HiClock className="w-3 h-3 mr-1"/>
                                                                    Waiting for Content
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Content Submitted Stage */}
                                            {deal.content_submitted_at && (
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-pink-500 bg-pink-50">
                                                        <HiPhoto className="w-4 h-4 text-pink-600"/>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-medium text-pink-900">Content
                                                                Submitted</p>
                                                            <span
                                                                className="text-xs text-gray-500">{formatDate(deal.content_submitted_at)}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-600">Influencer has submitted
                                                            content for review</p>
                                                        {deal.status === 'content_submitted' && (
                                                            <div className="mt-2">
                                                                <Button size="sm"
                                                                        onClick={() => setActiveTab('content')}
                                                                        className="text-xs h-6 px-2">
                                                                    <HiEye className="w-3 h-3 mr-1"/>
                                                                    Review Content
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Under Review Stage */}
                                            {deal.under_review_at && (
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-blue-500 bg-blue-50">
                                                        <HiEye className="w-4 h-4 text-blue-600"/>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-medium text-blue-900">Under
                                                                Review</p>
                                                            <span
                                                                className="text-xs text-gray-500">{formatDate(deal.under_review_at)}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-600">Content is currently being
                                                            reviewed</p>
                                                        {deal.status === 'under_review' && (
                                                            <div className="mt-2">
                                                                <Button size="sm"
                                                                        onClick={() => setActiveTab('content')}
                                                                        className="text-xs h-6 px-2">
                                                                    <HiEye className="w-3 h-3 mr-1"/>
                                                                    Continue Review
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Revision Requested Stage */}
                                            {deal.revision_requested_at && (
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-orange-500 bg-orange-50">
                                                        <HiArrowPath className="w-4 h-4 text-orange-600"/>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-medium text-orange-900">Revision
                                                                Requested</p>
                                                            <span
                                                                className="text-xs text-gray-500">{formatDate(deal.revision_requested_at)}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-600">Changes requested from
                                                            influencer</p>
                                                        {deal.status === 'revision_requested' && (
                                                            <div className="mt-2">
                                                                <Button size="sm"
                                                                        onClick={() => setActiveTab('content')}
                                                                        className="text-xs h-6 px-2">
                                                                    <HiPhoto className="w-3 h-3 mr-1"/>
                                                                    Check Revision
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Approved Stage */}
                                            {deal.approved_at && (
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-green-500 bg-green-50">
                                                        <HiHandThumbUp className="w-4 h-4 text-green-600"/>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-medium text-green-900">Content
                                                                Approved</p>
                                                            <span
                                                                className="text-xs text-gray-500">{formatDate(deal.approved_at)}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-600">Content has been approved
                                                            and is ready</p>
                                                        {deal.status === 'approved' && (
                                                            <div className="mt-2">
                                                                <Button size="sm"
                                                                        onClick={() => setActiveTab('timeline')}
                                                                        className="text-xs h-6 px-2">
                                                                    <HiCheckCircle className="w-3 h-3 mr-1"/>
                                                                    Complete Deal
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Completed Stage */}
                                            {deal.completed_at && (
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-green-500 bg-green-50">
                                                        <HiCheckCircle className="w-4 h-4 text-green-600"/>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-medium text-green-900">Deal
                                                                Completed</p>
                                                            <span
                                                                className="text-xs text-gray-500">{formatDate(deal.completed_at)}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-600">Collaboration successfully
                                                            completed</p>
                                                        <div
                                                            className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
                                                            <strong>Status:</strong> Successfully completed
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Future Stages (if applicable) */}
                                            {!deal.completed_at && (
                                                <div className="flex items-center gap-3 opacity-50">
                                                    <div
                                                        className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-gray-300 bg-gray-50">
                                                        <HiCheckCircle className="w-4 h-4 text-gray-400"/>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-400">Future
                                                            Stages</p>
                                                        <p className="text-xs text-gray-400">Additional stages will
                                                            appear as the deal progresses</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>


                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
} 