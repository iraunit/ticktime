"use client";

import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Tabs, TabsContent} from "@/components/ui/tabs";
import {
    HiArrowLeft,
    HiBanknotes,
    HiCalendarDays,
    HiChatBubbleLeftRight,
    HiCheck,
    HiCheckBadge,
    HiCheckCircle,
    HiClock,
    HiCog6Tooth,
    HiDocumentText,
    HiEye,
    HiMagnifyingGlass,
    HiPencilSquare,
    HiSparkles,
    HiStar,
    HiTrash,
    HiUserGroup,
    HiUsers,
    HiXCircle
} from "react-icons/hi2";
import {platformConfig} from "@/lib/platform-config";
import {api} from "@/lib/api";
import {toast} from "@/lib/toast";
import {GlobalLoader} from "@/components/ui/global-loader";

interface Campaign {
    id: number;
    title: string;
    description: string;
    objectives: string;
    deal_type: string;
    deal_type_display: string;
    cash_amount: number;
    total_value: number;
    products?: Array<{ name: string; description?: string; value?: number; quantity?: number }>;
    platforms_required: string[];
    content_requirements: string | { description: string };
    content_count: number;
    special_instructions: string;
    application_deadline: string;
    submission_deadline: string;
    campaign_live_date?: string;
    campaign_start_date?: string;
    campaign_end_date?: string;
    is_active: boolean;
    is_expired: boolean;
    days_until_deadline: number;
    created_at: string;
    brand_name: string;
    brand?: {
        id: number;
        name: string;
        logo?: string;
        description?: string;
        website?: string;
        industry?: string;
    };
    industry?: string;
    industry_display?: string;
    execution_mode?: 'manual' | 'manual_managed' | 'fully_managed' | string;
    target_influencers?: number;
    application_deadline_visible_to_influencers?: boolean;
    barter_submission_after_days?: number | null;
    deals?: Deal[];
    total_invited?: number;
    total_accepted?: number;
    total_completed?: number;
    total_rejected?: number;
}

interface Deal {
    id: number;
    status: string;
    status_display: string;
    invited_at: string;
    responded_at?: string;
    accepted_at?: string;
    completed_at?: string;
    payment_status: string;
    payment_date?: string;
    brand_rating?: number;
    brand_review?: string;
    influencer_rating?: number;
    influencer_review?: string;
    rejection_reason?: string;
    negotiation_notes?: string;
    custom_terms_agreed?: string;
    influencer: Influencer;
    conversation?: Conversation;
    last_message?: Message;
    unread_count?: number;
}

interface Influencer {
    id: number;
    username: string;
    full_name: string;
    profile_image?: string;
    bio?: string;
    followers_count: number;
    following_count: number;
    total_likes: number;
    engagement_rate: number;
    categories: string[];
    platforms: string[];
    location?: string;
    email?: string;
    phone?: string;
    website?: string;
    is_verified: boolean;
    rating: number;
    total_campaigns: number;
    completed_campaigns: number;
}

interface Conversation {
    id: number;
    messages: Message[];
    unread_count_for_brand: number;
    unread_count_for_influencer: number;
}

interface Message {
    id: number;
    sender_type: 'brand' | 'influencer';
    sender_user: {
        id: number;
        username: string;
        full_name: string;
    };
    content: string;
    file_attachment?: string;
    file_name?: string;
    read_by_brand: boolean;
    read_by_influencer: boolean;
    created_at: string;
}


const dealStatusColors = {
    invited: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    accepted: 'bg-green-100 text-green-800 hover:bg-green-200',
    active: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
    content_submitted: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
    under_review: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
    revision_requested: 'bg-red-100 text-red-800 hover:bg-red-200',
    approved: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
    completed: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    rejected: 'bg-red-100 text-red-800 hover:bg-red-200',
    cancelled: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    dispute: 'bg-red-100 text-red-800 hover:bg-red-200',
};

export default function CampaignDetailPage() {
    const router = useRouter();
    const params = useParams();
    const campaignId = params.id as string;

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editData, setEditData] = useState<Partial<Campaign>>({});
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchCampaign();
    }, [campaignId]);

    const fetchCampaign = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/brands/campaigns/${campaignId}/`);
            setCampaign(response.data.campaign);
            setEditData(response.data.campaign);
        } catch (error: any) {
            console.error('Failed to fetch campaign:', error);
            toast.error('Failed to load campaign details.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = () => {
        // Redirect to creation page with campaign data for editing
        router.push(`/brand/campaigns/create?edit=${campaignId}`);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditData(campaign || {});
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await api.patch(`/brands/campaigns/${campaignId}/`, editData);
            setCampaign(response.data.campaign);
            setEditData(response.data.campaign);
            setIsEditing(false);
            toast.success('Campaign updated successfully!');
        } catch (error: any) {
            console.error('Failed to update campaign:', error);
            if (error.response?.data?.errors) {
                const errorMessages: string[] = [];
                Object.entries(error.response.data.errors).forEach(([field, messages]) => {
                    if (field === 'non_field_errors') {
                        if (Array.isArray(messages)) {
                            errorMessages.push(...messages);
                        } else {
                            errorMessages.push(String(messages));
                        }
                    } else {
                        if (Array.isArray(messages)) {
                            errorMessages.push(`${field}: ${messages.join(', ')}`);
                        } else {
                            errorMessages.push(`${field}: ${messages}`);
                        }
                    }
                });
                errorMessages.forEach(errorMsg => {
                    toast.error(errorMsg);
                });
            } else {
                toast.error(error.response?.data?.message || 'Failed to update campaign.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/brands/campaigns/${campaignId}/`);
            toast.success('Campaign deleted successfully!');
            router.push('/brand/campaigns');
        } catch (error: any) {
            console.error('Failed to delete campaign:', error);

            // Handle specific error types
            if (error?.response?.status === 403) {
                toast.error('You do not have permission to delete this campaign.');
            } else if (error?.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to delete campaign. Please try again.');
            }
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setEditData(prev => ({...prev, [field]: value}));
    };

    const handlePlatformToggle = (platform: string) => {
        setEditData(prev => ({
            ...prev,
            platforms_required: Array.isArray(prev.platforms_required) && prev.platforms_required.includes(platform)
                ? prev.platforms_required.filter(p => p !== platform)
                : [...(Array.isArray(prev.platforms_required) ? prev.platforms_required : []), platform]
        }));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatFollowers = (count: number) => {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        } else if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    };

    const getFullImageUrl = (imagePath: string | null | undefined) => {
        if (!imagePath) return undefined;
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        // If it's a relative path, construct the full URL using backend domain
        return `http://localhost:8000${imagePath}`;
    };


    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <GlobalLoader/>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign Not Found</h2>
                    <p className="text-gray-600 mb-6">The campaign you're looking for doesn't exist or you don't have
                        permission to view it.</p>
                    <Button onClick={() => router.push('/brand/campaigns')}>
                        <HiArrowLeft className="w-4 h-4 mr-2"/>
                        Back to Campaigns
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div className="container mx-auto px-4 py-4 max-w-7xl">
                {/* Compact Header */}
                <div
                    className="bg-gradient-to-r from-blue-50 via-white to-indigo-50 border border-blue-200 rounded-xl shadow-md p-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <HiSparkles className="w-5 h-5 text-white"/>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 mb-1">
                                    {isEditing ? 'Edit Campaign' : campaign.title}
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {isEditing ? 'Update campaign details and settings' : 'Campaign overview and performance metrics'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {!isEditing ? (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const url = `/brand/messages?campaign=${campaign.id}`;
                                            window.open(url, '_blank');
                                        }}
                                        className="text-xs px-2 py-1"
                                    >
                                        <HiChatBubbleLeftRight className="w-3 h-3 mr-1"/>
                                        Messages
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleEdit}
                                        className="text-xs px-2 py-1"
                                    >
                                        <HiPencilSquare className="w-3 h-3 mr-1"/>
                                        Edit
                                    </Button>

                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs px-2 py-1 text-red-600 border-red-200 hover:bg-red-50"
                                            >
                                                <HiTrash className="w-3 h-3 mr-1"/>
                                                Delete
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Delete Campaign</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <p>Are you sure you want to delete "{campaign.title}"? This action
                                                    cannot be undone.</p>
                                                <div className="flex justify-end gap-3">
                                                    <Button variant="outline">Cancel</Button>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={handleDelete}
                                                    >
                                                        Delete Campaign
                                                    </Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCancel}
                                        disabled={isSaving}
                                        className="text-xs"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="text-xs"
                                    >
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Compact Campaign Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-100">
                        <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <HiUserGroup className="w-4 h-4 text-white"/>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-blue-700">Invited</p>
                                    <p className="text-lg font-bold text-blue-900">{campaign.total_invited || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-green-100">
                        <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                                    <HiCheck className="w-4 h-4 text-white"/>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-emerald-700">Accepted</p>
                                    <p className="text-lg font-bold text-emerald-900">{campaign.total_accepted || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-pink-100">
                        <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                                    <HiCheckCircle className="w-4 h-4 text-white"/>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-purple-700">Completed</p>
                                    <p className="text-lg font-bold text-purple-900">{campaign.total_completed || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-100">
                        <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                                    <HiXCircle className="w-4 h-4 text-white"/>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-amber-700">Rejected</p>
                                    <p className="text-lg font-bold text-amber-900">{campaign.total_rejected || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Compact Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-6">
                            {[
                                {id: 'overview', label: 'Overview', icon: HiEye},
                                {
                                    id: 'influencers',
                                    label: `Influencers (${campaign.deals?.length || 0})`,
                                    icon: HiUsers
                                },
                                {id: 'messages', label: 'Messages', icon: HiChatBubbleLeftRight},
                                {id: 'analytics', label: 'Analytics', icon: HiStar}
                            ].map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`group inline-flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                                            isActive
                                                ? 'border-indigo-500 text-indigo-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <Icon className={`w-3 h-3 transition-colors duration-200 ${
                                            isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'
                                        }`}/>
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-3">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                            {/* Main Content */}
                            <div className="lg:col-span-2 space-y-3">
                                {/* Campaign Details */}
                                <Card className="border-0 shadow-md bg-white/90 backdrop-blur-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle
                                            className="text-base font-bold text-gray-900 flex items-center gap-2">
                                            <HiDocumentText className="w-4 h-4 text-indigo-600"/>
                                            Campaign Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {isEditing ? (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Campaign Title *
                                                    </label>
                                                    <Input
                                                        value={editData.title || ''}
                                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                                        className="w-full"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Description *
                                                    </label>
                                                    <Textarea
                                                        value={editData.description || ''}
                                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                                        className="w-full h-32"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Objectives *
                                                    </label>
                                                    <Textarea
                                                        value={editData.objectives || ''}
                                                        onChange={(e) => handleInputChange('objectives', e.target.value)}
                                                        className="w-full h-24"
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div>
                                                    <h3 className="text-base font-semibold text-gray-900">{campaign.title}</h3>
                                                    <p className="text-sm text-gray-600 mt-2">{campaign.description}</p>
                                                </div>

                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Objectives</h4>
                                                    <p className="text-sm text-gray-600">{campaign.objectives}</p>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Deal Structure */}
                                <Card className="border-0 shadow-md bg-white/90 backdrop-blur-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle
                                            className="text-base font-bold text-gray-900 flex items-center gap-2">
                                            <HiBanknotes className="w-4 h-4 text-emerald-600"/>
                                            Deal Structure
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {isEditing ? (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Deal Type *
                                                    </label>
                                                    <Select
                                                        value={editData.deal_type || ''}
                                                        onValueChange={(value) => handleInputChange('deal_type', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue/>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="cash">Cash Payment</SelectItem>
                                                            <SelectItem value="product">Barter</SelectItem>
                                                            <SelectItem value="hybrid">Cash + Product</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {(editData.deal_type === 'cash' || editData.deal_type === 'hybrid') && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Cash Amount (INR)
                                                        </label>
                                                        <Input
                                                            type="number"
                                                            value={editData.cash_amount || ''}
                                                            onChange={(e) => handleInputChange('cash_amount', parseFloat(e.target.value))}
                                                        />
                                                    </div>
                                                )}

                                                {(editData.deal_type === 'product' || editData.deal_type === 'hybrid') && (
                                                    <div className="space-y-3">
                                                        <div className="text-sm text-gray-600">Barter Products</div>
                                                        <div
                                                            className="p-3 border border-gray-200 rounded-lg text-sm text-gray-500">
                                                            Edit products in campaign creation/edit form (not inline
                                                            here).
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                {/* Products Section for Barter Deals */}
                                                {(campaign.deal_type === 'product' || campaign.deal_type === 'hybrid') &&
                                                    campaign.products && campaign.products.length > 0 && (
                                                        <div className="mb-6">
                                                            <h4 className="font-medium text-gray-900 mb-3">Barter
                                                                Products</h4>
                                                            <div className="space-y-3">
                                                                {campaign.products.map((product, index) => (
                                                                    <div key={index}
                                                                         className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                                                                        <div
                                                                            className="flex justify-between items-start mb-2">
                                                                            <h5 className="font-semibold text-orange-900">{product.name}</h5>
                                                                            <div className="text-right">
                                                                                <div
                                                                                    className="text-sm font-bold text-orange-800">
                                                                                    {formatCurrency((product.value || 0) * (product.quantity || 1))}
                                                                                </div>
                                                                                <div
                                                                                    className="text-xs text-orange-600">
                                                                                    {formatCurrency(product.value || 0)} × {product.quantity || 1}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        {product.description && (
                                                                            <p className="text-sm text-orange-700 mb-2">{product.description}</p>
                                                                        )}
                                                                        <div
                                                                            className="flex justify-between items-center text-xs text-orange-600">
                                                                            <span>Quantity: {product.quantity || 1}</span>
                                                                            <span>Unit Value: {formatCurrency(product.value || 0)}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}

                                                                <div
                                                                    className="text-center bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg p-3 border border-orange-200">
                                                                    <div className="text-lg font-bold text-orange-800">
                                                                        Total Product Value: {formatCurrency(
                                                                        campaign.products.reduce((total, product) =>
                                                                            total + ((product.value || 0) * (product.quantity || 1)), 0
                                                                        )
                                                                    )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                            </>
                                        )}

                                        {!isEditing && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <div
                                                    className="bg-gradient-to-br from-blue-50 to-indigo-100 p-3 rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                                                            <HiCheckCircle className="w-3 h-3 text-white"/>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-medium text-blue-700 mb-1">Deal
                                                                Type</p>
                                                            <p className="text-sm font-semibold text-blue-900">{campaign.deal_type_display === 'Product Only' ? 'Barter Only' : campaign.deal_type_display}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div
                                                    className="bg-gradient-to-br from-emerald-50 to-green-100 p-3 rounded-lg border border-emerald-200 hover:shadow-md transition-all duration-200">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
                                                            <HiBanknotes className="w-3 h-3 text-white"/>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-medium text-emerald-700 mb-1">Total
                                                                Value</p>
                                                            <p className="text-sm font-semibold text-emerald-900">{formatCurrency(campaign.total_value)}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Requirements */}
                                <Card className="border-0 shadow-md bg-white/90 backdrop-blur-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle
                                            className="text-base font-bold text-gray-900 flex items-center gap-2">
                                            <HiCog6Tooth className="w-4 h-4 text-purple-600"/>
                                            Requirements
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {isEditing ? (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Required Platforms *
                                                    </label>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                        {Object.keys(platformConfig).map((key) => {
                                                            const k = key as keyof typeof platformConfig;
                                                            const cfg = platformConfig[k];
                                                            const isActive = Array.isArray(editData.platforms_required) && editData.platforms_required.includes(k);
                                                            const Icon = cfg.icon;
                                                            return (
                                                                <button
                                                                    key={k}
                                                                    onClick={() => handlePlatformToggle(k)}
                                                                    className={`p-3 border-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                                                                        isActive ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                                                                    }`}
                                                                >
                                                                    <Icon className={`w-4 h-4 ${cfg.color}`}/>
                                                                    <span
                                                                        className="text-sm font-medium capitalize">{k}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Content Requirements *
                                                    </label>
                                                    <Textarea
                                                        value={typeof editData.content_requirements === 'string' ? editData.content_requirements : ''}
                                                        onChange={(e) => handleInputChange('content_requirements', e.target.value)}
                                                        className="w-full h-32"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Special Instructions
                                                    </label>
                                                    <Textarea
                                                        value={editData.special_instructions || ''}
                                                        onChange={(e) => handleInputChange('special_instructions', e.target.value)}
                                                        className="w-full h-24"
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-2">Platforms</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Array.isArray(campaign.platforms_required) && campaign.platforms_required.length > 0 ? (
                                                            campaign.platforms_required.map((platform) => {
                                                                const cfg = platformConfig[platform as keyof typeof platformConfig];
                                                                const Icon = cfg?.icon;
                                                                return (
                                                                    <div key={platform}
                                                                         className={`px-2 py-1 rounded-md border text-xs flex items-center gap-1 ${cfg ? cfg.bg + ' ' + cfg.border : 'bg-gray-50 border-gray-200'}`}>
                                                                        {Icon &&
                                                                            <Icon className={`w-3 h-3 ${cfg.color}`}/>}
                                                                        <span className="capitalize">{platform}</span>
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            <span className="text-sm text-gray-500">No platforms specified</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-2">Content
                                                        Requirements</h4>
                                                    <p className="text-gray-600">
                                                        {typeof campaign.content_requirements === 'string'
                                                            ? campaign.content_requirements
                                                            : campaign.content_requirements?.description || 'No content requirements specified'}
                                                    </p>
                                                </div>

                                                {campaign.industry_display && (
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 mb-2">Industry</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            <Badge variant="secondary"
                                                                   className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 capitalize">
                                                                {campaign.industry_display}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                )}

                                                {campaign.special_instructions && (
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 mb-2">Special
                                                            Instructions</h4>
                                                        <p className="text-gray-600">{campaign.special_instructions}</p>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-3">
                                {/* Timeline */}
                                <Card className="border-0 shadow-md bg-white/90 backdrop-blur-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle
                                            className="text-base font-bold text-gray-900 flex items-center gap-2">
                                            <HiCalendarDays className="w-4 h-4 text-blue-600"/>
                                            Timeline
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {isEditing ? (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Application Deadline *
                                                    </label>
                                                    <Input
                                                        type="date"
                                                        value={editData.application_deadline || ''}
                                                        onChange={(e) => handleInputChange('application_deadline', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Campaign
                                                        Live Date *</label>
                                                    <Input
                                                        type="date"
                                                        value={editData.campaign_live_date || ''}
                                                        onChange={(e) => handleInputChange('campaign_live_date', e.target.value)}
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <HiCalendarDays className="w-4 h-4 text-gray-500"/>
                                                    <span className="text-gray-500">Application Deadline:</span>
                                                    <span
                                                        className="font-medium">{formatDate(campaign.application_deadline)}</span>
                                                </div>
                                                {campaign.campaign_live_date && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <HiCalendarDays className="w-4 h-4 text-gray-500"/>
                                                        <span className="text-gray-500">Campaign Live:</span>
                                                        <span
                                                            className="font-medium">{formatDate(campaign.campaign_live_date)}</span>
                                                    </div>
                                                )}

                                                {campaign.days_until_deadline !== null && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <HiClock className="w-4 h-4 text-gray-500"/>
                                                        <span className="text-gray-500">Days until deadline:</span>
                                                        <span className={`font-medium ${
                                                            campaign.days_until_deadline <= 3 ? 'text-red-600' :
                                                                campaign.days_until_deadline <= 7 ? 'text-orange-600' : 'text-green-600'
                                                        }`}>
                              {campaign.days_until_deadline}
                            </span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Campaign Info */}
                                <Card className="border-0 shadow-md bg-white/90 backdrop-blur-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle
                                            className="text-base font-bold text-gray-900 flex items-center gap-2">
                                            <HiSparkles className="w-4 h-4 text-gray-600"/>
                                            Campaign Info
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Created:</span>
                                            <span className="font-medium">{formatDate(campaign.created_at)}</span>
                                        </div>

                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Brand:</span>
                                            <div className="text-right">
                                                {campaign.brand ? (
                                                    <div className="flex items-center gap-2">
                                                        {campaign.brand.logo && (
                                                            <img
                                                                src={getFullImageUrl(campaign.brand.logo)}
                                                                alt={campaign.brand.name}
                                                                className="w-6 h-6 rounded object-cover"
                                                            />
                                                        )}
                                                        <span className="font-medium">{campaign.brand.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="font-medium">{campaign.brand_name}</span>
                                                )}
                                            </div>
                                        </div>
                                        {typeof campaign.target_influencers === 'number' && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Target Influencers:</span>
                                                <span
                                                    className="font-medium">{campaign.total_accepted || 0} / {campaign.target_influencers}</span>
                                            </div>
                                        )}
                                        {campaign.execution_mode && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Execution Mode:</span>
                                                <span
                                                    className="font-medium capitalize">{campaign.execution_mode}</span>
                                            </div>
                                        )}

                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Influencers Tab */}
                    <TabsContent value="influencers" className="space-y-4">
                        <Card className="border-0 shadow-md bg-white/90 backdrop-blur-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    <HiUserGroup className="w-4 h-4 text-indigo-600"/>
                                    Influencer Collaborations ({campaign.deals?.length || 0})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {campaign.deals && campaign.deals.length > 0 ? (
                                    <div className="space-y-3">
                                        {campaign.deals.map((deal) => (
                                            <div key={deal.id}
                                                 className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all duration-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            {deal.influencer.profile_image ? (
                                                                <img
                                                                    src={getFullImageUrl(deal.influencer.profile_image)}
                                                                    alt={deal.influencer.full_name}
                                                                    className="w-10 h-10 rounded-full object-cover shadow-md"
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.style.display = 'none';
                                                                        target.nextElementSibling?.classList.remove('hidden');
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <div
                                                                className={`w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ${deal.influencer.profile_image ? 'hidden' : ''}`}>
                                                                {deal.influencer.full_name.charAt(0).toUpperCase()}
                                                            </div>
                                                            {deal.influencer.is_verified && (
                                                                <div
                                                                    className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center">
                                                                    <HiCheckBadge className="w-2 h-2 text-white"/>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="font-semibold text-gray-900 truncate">{deal.influencer.full_name}</h4>
                                                                <Badge
                                                                    className={'text-xs font-medium px-2 py-0.5 rounded-full ' + (dealStatusColors[deal.status as keyof typeof dealStatusColors] || 'bg-gray-100 text-gray-800')}
                                                                >
                                                                    {deal.status_display}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-xs text-gray-600 mb-1">@{deal.influencer.username}</p>
                                                            <div
                                                                className="flex items-center gap-3 text-xs text-gray-600">
                                                                <span>👥 {formatFollowers(deal.influencer.followers_count)}</span>
                                                                <span>❤️ {deal.influencer.engagement_rate}%</span>
                                                                <span>⭐ {deal.influencer.rating}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => window.open(`/brand/deals/${deal.id}`, '_blank')}
                                                            className="text-xs px-2 py-1 h-7 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                                                        >
                                                            <HiEye className="w-3 h-3 mr-1"/>
                                                            View
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                const url = `/brand/messages?deal=${deal.id}`;
                                                                window.open(url, '_blank');
                                                            }}
                                                            className="text-xs px-2 py-1 h-7 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
                                                        >
                                                            <HiChatBubbleLeftRight className="w-3 h-3 mr-1"/>
                                                            Chat
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => window.open(`/influencer/${deal.influencer.id}`, '_blank')}
                                                            className="text-xs px-2 py-1 h-7 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300"
                                                        >
                                                            View Profile
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div
                                            className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                            <HiUserGroup className="w-10 h-10 text-indigo-600"/>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-3">No influencers invited
                                            yet</h3>
                                        <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">Start building your
                                            campaign by discovering and inviting talented influencers who align with
                                            your brand.</p>
                                        <Button
                                            onClick={() => router.push('/brand/influencers')}
                                            size="lg"
                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8"
                                        >
                                            <HiMagnifyingGlass className="w-5 h-5 mr-2"/>
                                            Discover Influencers
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Messages Tab */}
                    <TabsContent value="messages" className="space-y-4">
                        <Card className="border-0 shadow-md bg-white/90 backdrop-blur-sm">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                                        <HiChatBubbleLeftRight className="w-4 h-4 text-green-600"/>
                                        Deal Conversations
                                    </CardTitle>
                                    <div className="text-sm text-gray-500">
                                        {campaign.deals?.filter(deal => deal.conversation).length || 0} active
                                        conversations
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {campaign.deals && campaign.deals.length > 0 ? (
                                    <div className="space-y-3">
                                        {campaign.deals
                                            .filter(deal => deal.conversation) // Only show deals with conversations
                                            .sort((a, b) => {
                                                // Sort by last message time, then by deal creation time
                                                const aTime = a.last_message?.created_at || a.invited_at;
                                                const bTime = b.last_message?.created_at || b.invited_at;
                                                return new Date(bTime).getTime() - new Date(aTime).getTime();
                                            })
                                            .map((deal) => (
                                                <div key={deal.id}
                                                     className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all duration-200">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative">
                                                                {deal.influencer.profile_image ? (
                                                                    <img
                                                                        src={getFullImageUrl(deal.influencer.profile_image)}
                                                                        alt={deal.influencer.full_name}
                                                                        className="w-10 h-10 rounded-full object-cover shadow-md"
                                                                        onError={(e) => {
                                                                            const target = e.target as HTMLImageElement;
                                                                            target.style.display = 'none';
                                                                            target.nextElementSibling?.classList.remove('hidden');
                                                                        }}
                                                                    />
                                                                ) : null}
                                                                <div
                                                                    className={`w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ${deal.influencer.profile_image ? 'hidden' : ''}`}>
                                                                    {deal.influencer.full_name.charAt(0).toUpperCase()}
                                                                </div>
                                                                {deal.influencer.is_verified && (
                                                                    <div
                                                                        className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center">
                                                                        <HiCheckBadge className="w-2 h-2 text-white"/>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h4 className="font-semibold text-gray-900 truncate">{deal.influencer.full_name}</h4>
                                                                    <Badge
                                                                        className={'text-xs font-medium px-2 py-0.5 rounded-full ' + (dealStatusColors[deal.status as keyof typeof dealStatusColors] || 'bg-gray-100 text-gray-800')}
                                                                    >
                                                                        {deal.status_display}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-xs text-gray-600 mb-1">@{deal.influencer.username}</p>
                                                                <div
                                                                    className="flex items-center gap-3 text-xs text-gray-600">
                                                                    <span>💬 {deal.last_message ? 'Last: ' + formatDate(deal.last_message.created_at) : 'No messages'}</span>
                                                                    {deal.last_message && (
                                                                        <span className="truncate max-w-40">
                                      {deal.last_message.sender_type === 'brand' ? 'You: ' : ''}
                                                                            {deal.last_message.content}
                                    </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    const url = `/brand/messages?deal=${deal.id}`;
                                                                    window.open(url, '_blank');
                                                                }}
                                                                className="text-xs px-2 py-1 h-7 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
                                                            >
                                                                <HiChatBubbleLeftRight className="w-3 h-3 mr-1"/>
                                                                Chat
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                        {/* Show deals without conversations */}
                                        {campaign.deals.filter(deal => !deal.conversation).length > 0 && (
                                            <div className="mt-6">
                                                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                                    <HiUsers className="w-4 h-4"/>
                                                    Start new deal conversations
                                                    ({campaign.deals.filter(deal => !deal.conversation).length})
                                                </h4>
                                                <div className="space-y-2">
                                                    {campaign.deals
                                                        .filter(deal => !deal.conversation)
                                                        .slice(0, 6) // Limit to 6 to avoid clutter
                                                        .map((deal) => (
                                                            <div key={deal.id}
                                                                 className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                                                                <div className="flex items-center gap-2">
                                                                    {deal.influencer.profile_image ? (
                                                                        <img
                                                                            src={getFullImageUrl(deal.influencer.profile_image)}
                                                                            alt={deal.influencer.full_name}
                                                                            className="w-6 h-6 rounded-full object-cover"
                                                                            onError={(e) => {
                                                                                const target = e.target as HTMLImageElement;
                                                                                target.style.display = 'none';
                                                                                target.nextElementSibling?.classList.remove('hidden');
                                                                            }}
                                                                        />
                                                                    ) : null}
                                                                    <div
                                                                        className={`w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-xs ${deal.influencer.profile_image ? 'hidden' : ''}`}>
                                                                        {deal.influencer.full_name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-sm font-medium text-gray-900 truncate">{deal.influencer.full_name}</p>
                                                                        <p className="text-xs text-gray-600">@{deal.influencer.username}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge
                                                                        className={'text-xs ' + (dealStatusColors[deal.status as keyof typeof dealStatusColors] || 'bg-gray-100 text-gray-800')}
                                                                    >
                                                                        {deal.status_display}
                                                                    </Badge>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            const url = `/brand/messages?deal=${deal.id}`;
                                                                            window.open(url, '_blank');
                                                                        }}
                                                                        className="text-xs px-2 py-1 h-7"
                                                                    >
                                                                        Start Chat
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                                {campaign.deals.filter(deal => !deal.conversation).length > 6 && (
                                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                                        +{campaign.deals.filter(deal => !deal.conversation).length - 6} more
                                                        deals
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div
                                            className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                            <HiChatBubbleLeftRight className="w-10 h-10 text-green-600"/>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-3">No deals yet</h3>
                                        <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                                            Once you invite influencers to this campaign, you can start deal-specific
                                            conversations with them here.
                                        </p>
                                        <Button
                                            onClick={() => router.push('/brand/influencers')}
                                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                                        >
                                            <HiMagnifyingGlass className="w-5 h-5 mr-2"/>
                                            Find Influencers
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Analytics Tab */}
                    <TabsContent value="analytics" className="space-y-4">
                        <Card className="border-0 shadow-md bg-white/90 backdrop-blur-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    <HiStar className="w-4 h-4 text-amber-600"/>
                                    Campaign Analytics
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12">
                                    <div
                                        className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                        <HiStar className="w-10 h-10 text-amber-600"/>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">Analytics Coming Soon</h3>
                                    <p className="text-sm text-gray-600 max-w-md mx-auto">Get detailed insights into
                                        your campaign performance, reach, engagement, and ROI metrics.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
