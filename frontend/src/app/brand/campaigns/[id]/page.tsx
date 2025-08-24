"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  HiPencilSquare,
  HiEye,
  HiTrash,
  HiArrowLeft,
  HiCalendarDays,
  HiUsers,
  HiBanknotes,
  HiCheckCircle,
  HiClock,
  HiExclamationTriangle,
  HiXMark,
  HiPlus,
  HiMinus,
  HiChatBubbleLeftRight,
  HiUserGroup,
  HiDocumentText,
  HiCheck,
  HiXCircle,
  HiPaperAirplane,
  HiEyeSlash,
  HiStar,
  HiCurrencyDollar,
  HiShoppingBag,
  HiChatBubbleOvalLeft,
  HiPhone,
  HiEnvelope,
  HiGlobeAlt,
  HiHeart,
  HiBookmark
} from "react-icons/hi2";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { GlobalLoader } from "@/components/ui/global-loader";

interface Campaign {
  id: number;
  title: string;
  description: string;
  objectives: string;
  deal_type: string;
  deal_type_display: string;
  cash_amount: number;
  product_value: number;
  total_value: number;
  product_name: string;
  product_description: string;
  product_quantity: number;
  platforms_required: string[];
  content_requirements: string | { description: string };
  content_count: number;
  special_instructions: string;
  application_deadline: string;
  content_creation_start: string;
  content_creation_end: string;
  submission_deadline: string;
  campaign_start_date: string;
  campaign_end_date: string;
  is_active: boolean;
  is_expired: boolean;
  days_until_deadline: number;
  created_at: string;
  brand_name: string;
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
  profile_picture?: string;
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

const platforms = [
  { id: 'instagram', name: 'Instagram' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'twitter', name: 'Twitter' },
  { id: 'linkedin', name: 'LinkedIn' },
];

const dealStatusColors = {
  invited: 'bg-blue-100 text-blue-800',
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  active: 'bg-purple-100 text-purple-800',
  content_submitted: 'bg-indigo-100 text-indigo-800',
  under_review: 'bg-orange-100 text-orange-800',
  revision_requested: 'bg-red-100 text-red-800',
  approved: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-gray-100 text-gray-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  dispute: 'bg-red-100 text-red-800',
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
    setIsEditing(true);
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
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/brands/campaigns/${campaignId}/`);
      toast.success('Campaign deleted successfully!');
      router.push('/brand/campaigns');
    } catch (error: any) {
      console.error('Failed to delete campaign:', error);
      toast.error('Failed to delete campaign.');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
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
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'invited': return <HiPaperAirplane className="w-4 h-4" />;
      case 'pending': return <HiClock className="w-4 h-4" />;
      case 'accepted': return <HiCheck className="w-4 h-4" />;
      case 'active': return <HiUsers className="w-4 h-4" />;
      case 'content_submitted': return <HiDocumentText className="w-4 h-4" />;
      case 'under_review': return <HiEye className="w-4 h-4" />;
      case 'revision_requested': return <HiExclamationTriangle className="w-4 h-4" />;
      case 'approved': return <HiCheckCircle className="w-4 h-4" />;
      case 'completed': return <HiCheckCircle className="w-4 h-4" />;
      case 'rejected': return <HiXCircle className="w-4 h-4" />;
      case 'cancelled': return <HiXMark className="w-4 h-4" />;
      case 'dispute': return <HiExclamationTriangle className="w-4 h-4" />;
      default: return <HiClock className="w-4 h-4" />;
    }
  };

  const getLastAction = (deal: Deal) => {
    if (deal.completed_at) return `Completed on ${formatDate(deal.completed_at)}`;
    if (deal.accepted_at) return `Accepted on ${formatDate(deal.accepted_at)}`;
    if (deal.responded_at) return `Responded on ${formatDate(deal.responded_at)}`;
    return `Invited on ${formatDate(deal.invited_at)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlobalLoader />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign Not Found</h2>
          <p className="text-gray-600 mb-6">The campaign you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => router.push('/brand/campaigns')}>
            <HiArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        {/* Header */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 rounded-xl -m-2"></div>
          
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/brand/campaigns')}
                className="flex items-center gap-2"
              >
                <HiArrowLeft className="w-4 h-4" />
                Back
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-1">
                  {isEditing ? 'Edit Campaign' : campaign.title}
                </h1>
                <p className="text-sm text-gray-600">
                  {isEditing ? 'Update campaign details' : 'Campaign details and management'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge 
                variant="default"
                className={`text-xs ${
                  campaign.is_active && !campaign.is_expired ? 'bg-green-100 text-green-800' :
                  campaign.is_expired ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {campaign.is_active && !campaign.is_expired ? 'Active' :
                 campaign.is_expired ? 'Expired' : 'Inactive'}
              </Badge>
              
              {!isEditing ? (
                <>
                  <Button 
                    variant="outline"
                    onClick={handleEdit}
                    className="flex items-center gap-2"
                  >
                    <HiPencilSquare className="w-4 h-4" />
                    Edit
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline"
                        className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <HiTrash className="w-4 h-4" />
                        Delete
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Campaign</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p>Are you sure you want to delete "{campaign.title}"? This action cannot be undone.</p>
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
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Campaign Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 mb-1">Total Invited</p>
                  <p className="text-2xl font-bold text-blue-800">{campaign.total_invited || 0}</p>
                </div>
                <HiUserGroup className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600 mb-1">Accepted</p>
                  <p className="text-2xl font-bold text-green-800">{campaign.total_accepted || 0}</p>
                </div>
                <HiCheck className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-600 mb-1">Completed</p>
                  <p className="text-2xl font-bold text-purple-800">{campaign.total_completed || 0}</p>
                </div>
                <HiCheckCircle className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-600 mb-1">Rejected</p>
                  <p className="text-2xl font-bold text-red-800">{campaign.total_rejected || 0}</p>
                </div>
                <HiXCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="influencers">Influencers ({campaign.deals?.length || 0})</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Campaign Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Details</CardTitle>
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
                          <h3 className="text-lg font-semibold text-gray-900">{campaign.title}</h3>
                          <p className="text-gray-600 mt-2">{campaign.description}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Objectives</h4>
                          <p className="text-gray-600">{campaign.objectives}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Deal Structure */}
                <Card>
                  <CardHeader>
                    <CardTitle>Deal Structure</CardTitle>
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
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash Payment</SelectItem>
                              <SelectItem value="product">Product Only</SelectItem>
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
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Product Name
                              </label>
                              <Input
                                value={editData.product_name || ''}
                                onChange={(e) => handleInputChange('product_name', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Product Value (INR)
                              </label>
                              <Input
                                type="number"
                                value={editData.product_value || ''}
                                onChange={(e) => handleInputChange('product_value', parseFloat(e.target.value))}
                              />
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Deal Type</p>
                              <p className="text-lg font-bold text-blue-600">{campaign.deal_type_display}</p>
                            </div>
                            <HiCheckCircle className="w-8 h-8 text-blue-500" />
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Total Value</p>
                              <p className="text-lg font-bold text-green-600">{formatCurrency(campaign.total_value)}</p>
                            </div>
                            <HiBanknotes className="w-8 h-8 text-green-500" />
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Content Count</p>
                              <p className="text-lg font-bold text-purple-600">{campaign.content_count}</p>
                            </div>
                            <HiUsers className="w-8 h-8 text-purple-500" />
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Status</p>
                              <p className="text-lg font-bold text-orange-600">
                                {campaign.is_active && !campaign.is_expired ? 'Active' :
                                 campaign.is_expired ? 'Expired' : 'Inactive'}
                              </p>
                            </div>
                            <HiClock className="w-8 h-8 text-orange-500" />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Requirements */}
                <Card>
                  <CardHeader>
                    <CardTitle>Requirements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Required Platforms *
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {platforms.map((platform) => (
                              <button
                                key={platform.id}
                                onClick={() => handlePlatformToggle(platform.id)}
                                className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                                  Array.isArray(editData.platforms_required) && editData.platforms_required.includes(platform.id)
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <span className="text-sm font-medium">{platform.name}</span>
                              </button>
                            ))}
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
                            {Array.isArray(campaign.platforms_required) 
                              ? campaign.platforms_required.map((platform) => (
                                  <Badge key={platform} variant="outline">
                                    {platform}
                                  </Badge>
                                ))
                              : <span className="text-sm text-gray-500">No platforms specified</span>
                            }
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Content Requirements</h4>
                          <p className="text-gray-600">
                            {typeof campaign.content_requirements === 'string' 
                              ? campaign.content_requirements 
                              : campaign.content_requirements?.description || 'No content requirements specified'}
                          </p>
                        </div>
                        
                        {campaign.special_instructions && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Special Instructions</h4>
                            <p className="text-gray-600">{campaign.special_instructions}</p>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle>Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Application Deadline *
                          </label>
                          <Input
                            type="datetime-local"
                            value={editData.application_deadline || ''}
                            onChange={(e) => handleInputChange('application_deadline', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Campaign Start Date *
                          </label>
                          <Input
                            type="date"
                            value={editData.campaign_start_date || ''}
                            onChange={(e) => handleInputChange('campaign_start_date', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Campaign End Date *
                          </label>
                          <Input
                            type="date"
                            value={editData.campaign_end_date || ''}
                            onChange={(e) => handleInputChange('campaign_end_date', e.target.value)}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <HiCalendarDays className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-500">Application Deadline:</span>
                          <span className="font-medium">{formatDate(campaign.application_deadline)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <HiCalendarDays className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-500">Campaign Start:</span>
                          <span className="font-medium">{formatDate(campaign.campaign_start_date)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <HiCalendarDays className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-500">Campaign End:</span>
                          <span className="font-medium">{formatDate(campaign.campaign_end_date)}</span>
                        </div>
                        
                        {campaign.days_until_deadline !== null && (
                          <div className="flex items-center gap-2 text-sm">
                            <HiClock className="w-4 h-4 text-gray-500" />
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
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Created:</span>
                      <span className="font-medium">{formatDate(campaign.created_at)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Brand:</span>
                      <span className="font-medium">{campaign.brand_name}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status:</span>
                      <Badge 
                        variant="default"
                        className={`text-xs ${
                          campaign.is_active && !campaign.is_expired ? 'bg-green-100 text-green-800' :
                          campaign.is_expired ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {campaign.is_active && !campaign.is_expired ? 'Active' :
                         campaign.is_expired ? 'Expired' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Influencers Tab */}
          <TabsContent value="influencers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HiUserGroup className="w-5 h-5" />
                  Influencer Deals ({campaign.deals?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {campaign.deals && campaign.deals.length > 0 ? (
                  <div className="space-y-4">
                    {campaign.deals.map((deal) => (
                      <div key={deal.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                              {deal.influencer.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{deal.influencer.full_name}</h3>
                              <p className="text-sm text-gray-600">@{deal.influencer.username}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">{formatFollowers(deal.influencer.followers_count)} followers</span>
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-xs text-gray-500">{deal.influencer.engagement_rate}% engagement</span>
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-xs text-gray-500">{deal.influencer.rating}★</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="default"
                              className={`text-xs ${dealStatusColors[deal.status as keyof typeof dealStatusColors] || 'bg-gray-100 text-gray-800'}`}
                            >
                              {getStatusIcon(deal.status)}
                              {deal.status_display}
                            </Badge>
                            {deal.unread_count && deal.unread_count > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {deal.unread_count} new
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Last Action</p>
                            <p className="text-sm font-medium text-gray-900">{getLastAction(deal)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Payment Status</p>
                            <p className="text-sm font-medium text-gray-900">{deal.payment_status}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Brand Rating</p>
                            <p className="text-sm font-medium text-gray-900">
                              {deal.brand_rating ? `${deal.brand_rating}★` : 'Not rated'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Influencer Rating</p>
                            <p className="text-sm font-medium text-gray-900">
                              {deal.influencer_rating ? `${deal.influencer_rating}★` : 'Not rated'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/brand/deals/${deal.id}`)}
                          >
                            <HiEye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                          {deal.conversation && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/brand/messages?deal=${deal.id}`)}
                            >
                              <HiChatBubbleLeftRight className="w-4 h-4 mr-1" />
                              Messages
                              {deal.unread_count && deal.unread_count > 0 && (
                                <Badge variant="destructive" className="ml-1 text-xs">
                                  {deal.unread_count}
                                </Badge>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <HiUserGroup className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No influencers invited yet</h3>
                    <p className="text-gray-600 mb-4">Start by inviting influencers to your campaign.</p>
                    <Button 
                      onClick={() => router.push('/brand/influencers')}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                    >
                      <HiPlus className="w-4 h-4 mr-2" />
                      Find Influencers
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HiChatBubbleLeftRight className="w-5 h-5" />
                  Recent Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                {campaign.deals && campaign.deals.some(deal => deal.last_message) ? (
                  <div className="space-y-4">
                    {campaign.deals
                      .filter(deal => deal.last_message)
                      .sort((a, b) => new Date(b.last_message!.created_at).getTime() - new Date(a.last_message!.created_at).getTime())
                      .slice(0, 5)
                      .map((deal) => (
                        <div key={deal.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {deal.influencer.full_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{deal.influencer.full_name}</h4>
                                <p className="text-sm text-gray-600">@{deal.influencer.username}</p>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">{formatDate(deal.last_message!.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                            {deal.last_message!.content}
                          </p>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/brand/messages?conversation=${String(deal.conversation?.id || '')}`)}
                            >
                              <HiChatBubbleLeftRight className="w-4 h-4 mr-1" />
                              View Conversation
                            </Button>
                            {deal.unread_count && deal.unread_count > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {deal.unread_count} unread
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <HiChatBubbleLeftRight className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
                    <p className="text-gray-600">Start conversations with your invited influencers.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HiStar className="w-5 h-5" />
                  Campaign Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <HiStar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Coming Soon</h3>
                  <p className="text-gray-600">Detailed campaign performance metrics and analytics will be available here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
