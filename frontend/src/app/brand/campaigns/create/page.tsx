"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner, CardSkeletonLoader } from "@/components/ui/loading-spinner";
import { InlineLoader } from "@/components/ui/inline-loader";
import { toast } from "@/lib/toast";
import { api } from "@/lib/api";
import { 
  HiPlus,
  HiMinus,
  HiUsers,
  HiMagnifyingGlass,
  HiCheck,
  HiX,
  HiEye,
  HiHeart,
  HiChevronLeft,
  HiChevronRight,
  HiCalendarDays,
  HiCurrencyDollar,
  HiGift,
  HiPhoto,
  HiVideoCamera,
  HiSpeakerWave,
  HiGlobeAsiaAustralia,
  HiDevicePhoneMobile
} from "react-icons/hi2";

interface Influencer {
  id: number;
  name: string;
  username: string;
  followers: number;
  engagement_rate: number;
  avg_rating: number;
  rate_per_post: number;
  platforms: string[];
  profile_image?: string;
  location: string;
  industry: string;
}

interface CampaignData {
  title: string;
  description: string;
  objectives: string;
  deal_type: 'cash' | 'product' | 'hybrid';
  cash_amount: number;
  product_value: number;
  product_name: string;
  product_description: string;
  product_quantity: number;
  platforms_required: string[];
  content_requirements: string;
  content_count: number;
  special_instructions: string;
  application_deadline: string;
  content_creation_start: string;
  content_creation_end: string;
  submission_deadline: string;
  campaign_start_date: string;
  campaign_end_date: string;
  target_audience_age_min: number;
  target_audience_age_max: number;
  target_audience_gender: string;
  target_audience_location: string;
  selected_influencers: number[];
}

const platforms = [
  { id: 'instagram', name: 'Instagram', icon: HiPhoto },
  { id: 'youtube', name: 'YouTube', icon: HiVideoCamera },
  { id: 'tiktok', name: 'TikTok', icon: HiSpeakerWave },
  { id: 'twitter', name: 'Twitter', icon: HiGlobeAsiaAustralia },
  { id: 'linkedin', name: 'LinkedIn', icon: HiDevicePhoneMobile },
];

const contentTypes = [
  'Instagram Post',
  'Instagram Story',
  'Instagram Reel',
  'YouTube Video',
  'YouTube Shorts',
  'TikTok Video',
  'Twitter Post',
  'LinkedIn Post',
  'Blog Post',
  'Product Review',
  'Unboxing Video',
  'Tutorial',
  'Live Stream'
];

export default function CreateCampaignPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Campaign form data
  const [campaignData, setCampaignData] = useState<CampaignData>({
    title: '',
    description: '',
    objectives: '',
    deal_type: 'cash',
    cash_amount: 0,
    product_value: 0,
    product_name: '',
    product_description: '',
    product_quantity: 1,
    platforms_required: [],
    content_requirements: '',
    content_count: 1,
    special_instructions: '',
    application_deadline: '',
    content_creation_start: '',
    content_creation_end: '',
    submission_deadline: '',
    campaign_start_date: '',
    campaign_end_date: '',
    target_audience_age_min: 18,
    target_audience_age_max: 65,
    target_audience_gender: 'all',
    target_audience_location: '',
    selected_influencers: []
  });

  // Influencer search and selection
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [selectedInfluencers, setSelectedInfluencers] = useState<Influencer[]>([]);
  const [isLoadingInfluencers, setIsLoadingInfluencers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [influencerFilters, setInfluencerFilters] = useState({
    platform: 'all',
    min_followers: 1000,
    max_followers: 5000000,
    min_engagement: 1,
    max_engagement: 15,
    location: 'all'
  });

  const steps = [
    { id: 1, title: 'Campaign Details', description: 'Basic campaign information' },
    { id: 2, title: 'Deal Structure', description: 'Compensation and deliverables' },
    { id: 3, title: 'Timeline', description: 'Important dates and deadlines' },
    { id: 4, title: 'Select Influencers', description: 'Find and add influencers' },
    { id: 5, title: 'Review & Launch', description: 'Final review and submission' }
  ];

  const fetchInfluencers = async () => {
    setIsLoadingInfluencers(true);
    try {
      const response = await api.get('/api/influencers/search/', {
        params: {
          search: searchTerm || undefined,
          platform: influencerFilters.platform !== 'all' ? influencerFilters.platform : undefined,
          min_followers: influencerFilters.min_followers,
          max_followers: influencerFilters.max_followers,
          min_engagement: influencerFilters.min_engagement,
          max_engagement: influencerFilters.max_engagement,
          location: influencerFilters.location !== 'all' ? influencerFilters.location : undefined,
        }
      });
      setInfluencers(response.data.results || []);
    } catch (error: any) {
      console.error('Failed to fetch influencers:', error);
      toast.error('Failed to load influencers.');
    } finally {
      setIsLoadingInfluencers(false);
    }
  };

  useEffect(() => {
    if (currentStep === 4) {
      const timeoutId = setTimeout(() => {
        fetchInfluencers();
      }, searchTerm ? 500 : 0);
      return () => clearTimeout(timeoutId);
    }
  }, [currentStep, searchTerm, influencerFilters]);

  const handleInputChange = (field: string, value: any) => {
    setCampaignData(prev => ({ ...prev, [field]: value }));
  };

  const handlePlatformToggle = (platform: string) => {
    setCampaignData(prev => ({
      ...prev,
      platforms_required: prev.platforms_required.includes(platform)
        ? prev.platforms_required.filter(p => p !== platform)
        : [...prev.platforms_required, platform]
    }));
  };

  const handleInfluencerSelect = (influencer: Influencer) => {
    const isSelected = selectedInfluencers.some(inf => inf.id === influencer.id);
    if (isSelected) {
      setSelectedInfluencers(prev => prev.filter(inf => inf.id !== influencer.id));
    } else {
      setSelectedInfluencers(prev => [...prev, influencer]);
    }
  };

  const calculateEstimatedCost = () => {
    return selectedInfluencers.reduce((total, inf) => total + inf.rate_per_post, 0);
  };

  const calculateEstimatedReach = () => {
    return selectedInfluencers.reduce((total, inf) => total + inf.followers, 0);
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return campaignData.title && campaignData.description && campaignData.objectives;
      case 2:
        return campaignData.platforms_required.length > 0 && campaignData.content_requirements;
      case 3:
        return campaignData.application_deadline && campaignData.campaign_start_date && campaignData.campaign_end_date;
      case 4:
        return selectedInfluencers.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    } else {
      toast.error('Please fill in all required fields before proceeding.');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await api.post('/api/brands/campaigns/', {
        ...campaignData,
        selected_influencers: selectedInfluencers.map(inf => inf.id)
      });
      
      toast.success('Campaign created successfully!');
      router.push(`/brand/campaigns/${response.data.campaign.id}`);
    } catch (error: any) {
      console.error('Failed to create campaign:', error);
      toast.error(error.response?.data?.message || 'Failed to create campaign.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        {/* Header */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-blue-500/5 rounded-xl -m-2"></div>
          
          <div className="relative p-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-1">
              Create New Campaign
            </h1>
            <p className="text-sm text-gray-600">
              Set up your influencer marketing campaign with our guided workflow.
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    currentStep >= step.id 
                      ? 'bg-blue-500 border-blue-500 text-white' 
                      : 'border-gray-300 text-gray-500'
                  }`}>
                    {currentStep > step.id ? (
                      <HiCheck className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium text-gray-900">{step.title}</p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 transition-colors ${
                    currentStep > step.id ? 'bg-blue-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="shadow-lg border-0 bg-white">
          <CardContent className="p-8">
            {/* Step 1: Campaign Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Information</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Campaign Title *
                      </label>
                      <Input
                        placeholder="Enter a compelling campaign title"
                        value={campaignData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Campaign Description *
                      </label>
                      <Textarea
                        placeholder="Describe your campaign, brand, and what you're looking for"
                        value={campaignData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="w-full h-32"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Campaign Objectives *
                      </label>
                      <Textarea
                        placeholder="What are your goals? (e.g., brand awareness, sales, engagement)"
                        value={campaignData.objectives}
                        onChange={(e) => handleInputChange('objectives', e.target.value)}
                        className="w-full h-24"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Target Age Range
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={campaignData.target_audience_age_min}
                            onChange={(e) => handleInputChange('target_audience_age_min', parseInt(e.target.value))}
                          />
                          <span>to</span>
                          <Input
                            type="number"
                            placeholder="Max"
                            value={campaignData.target_audience_age_max}
                            onChange={(e) => handleInputChange('target_audience_age_max', parseInt(e.target.value))}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Target Gender
                        </label>
                        <Select value={campaignData.target_audience_gender} onValueChange={(value) => handleInputChange('target_audience_gender', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Genders</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Target Location
                        </label>
                        <Input
                          placeholder="e.g., India, Mumbai, Global"
                          value={campaignData.target_audience_location}
                          onChange={(e) => handleInputChange('target_audience_location', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Deal Structure */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Deal Structure & Requirements</h3>
                  
                  {/* Deal Type Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Compensation Type
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: 'cash', label: 'Cash Payment', icon: HiCurrencyDollar },
                        { id: 'product', label: 'Product Only', icon: HiGift },
                        { id: 'hybrid', label: 'Cash + Product', icon: HiPlus }
                      ].map((type) => (
                        <button
                          key={type.id}
                          onClick={() => handleInputChange('deal_type', type.id)}
                          className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                            campaignData.deal_type === type.id
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <type.icon className="w-6 h-6" />
                          <span className="font-medium">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Compensation Details */}
                  {(campaignData.deal_type === 'cash' || campaignData.deal_type === 'hybrid') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cash Amount (INR)
                        </label>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={campaignData.cash_amount}
                          onChange={(e) => handleInputChange('cash_amount', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                  )}

                  {(campaignData.deal_type === 'product' || campaignData.deal_type === 'hybrid') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Name
                        </label>
                        <Input
                          placeholder="Product name"
                          value={campaignData.product_name}
                          onChange={(e) => handleInputChange('product_name', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Value (INR)
                        </label>
                        <Input
                          type="number"
                          placeholder="Product value"
                          value={campaignData.product_value}
                          onChange={(e) => handleInputChange('product_value', parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Description
                        </label>
                        <Textarea
                          placeholder="Describe the product"
                          value={campaignData.product_description}
                          onChange={(e) => handleInputChange('product_description', e.target.value)}
                          className="h-24"
                        />
                      </div>
                    </div>
                  )}

                  {/* Platform Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Required Platforms *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {platforms.map((platform) => (
                        <button
                          key={platform.id}
                          onClick={() => handlePlatformToggle(platform.id)}
                          className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                            campaignData.platforms_required.includes(platform.id)
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <platform.icon className="w-5 h-5" />
                          <span className="text-sm font-medium">{platform.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Content Requirements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content Count
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={campaignData.content_count}
                        onChange={(e) => handleInputChange('content_count', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content Requirements *
                    </label>
                    <Textarea
                      placeholder="Describe the type of content, style, messaging, hashtags, etc."
                      value={campaignData.content_requirements}
                      onChange={(e) => handleInputChange('content_requirements', e.target.value)}
                      className="h-32"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Instructions
                    </label>
                    <Textarea
                      placeholder="Any additional guidelines or requirements"
                      value={campaignData.special_instructions}
                      onChange={(e) => handleInputChange('special_instructions', e.target.value)}
                      className="h-24"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Timeline */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Timeline</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Application Deadline *
                      </label>
                      <Input
                        type="datetime-local"
                        value={campaignData.application_deadline}
                        onChange={(e) => handleInputChange('application_deadline', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content Creation Start
                      </label>
                      <Input
                        type="date"
                        value={campaignData.content_creation_start}
                        onChange={(e) => handleInputChange('content_creation_start', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content Creation End
                      </label>
                      <Input
                        type="date"
                        value={campaignData.content_creation_end}
                        onChange={(e) => handleInputChange('content_creation_end', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content Submission Deadline
                      </label>
                      <Input
                        type="datetime-local"
                        value={campaignData.submission_deadline}
                        onChange={(e) => handleInputChange('submission_deadline', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Campaign Start Date *
                      </label>
                      <Input
                        type="date"
                        value={campaignData.campaign_start_date}
                        onChange={(e) => handleInputChange('campaign_start_date', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Campaign End Date *
                      </label>
                      <Input
                        type="date"
                        value={campaignData.campaign_end_date}
                        onChange={(e) => handleInputChange('campaign_end_date', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Select Influencers */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Find & Select Influencers</h3>
                  
                  {/* Search and Filters */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <div className="relative">
                          <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search influencers by name, username, or niche..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      
                      <Select 
                        value={influencerFilters.platform} 
                        onValueChange={(value) => setInfluencerFilters(prev => ({ ...prev, platform: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Platforms</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                          <SelectItem value="twitter">Twitter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Selected Influencers Summary */}
                  {selectedInfluencers.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <h4 className="font-medium text-blue-900 mb-2">Selected Influencers ({selectedInfluencers.length})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700">Estimated Cost:</span>
                          <span className="font-semibold ml-2">{formatCurrency(calculateEstimatedCost())}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Estimated Reach:</span>
                          <span className="font-semibold ml-2">{formatFollowers(calculateEstimatedReach())}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Avg. Engagement:</span>
                          <span className="font-semibold ml-2">
                            {(selectedInfluencers.reduce((sum, inf) => sum + inf.engagement_rate, 0) / selectedInfluencers.length).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Influencers List */}
                  {isLoadingInfluencers ? (
                    <div className="grid gap-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <CardSkeletonLoader key={i} />
                      ))}
                    </div>
                  ) : influencers.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {influencers.map((influencer) => {
                        const isSelected = selectedInfluencers.some(inf => inf.id === influencer.id);
                        return (
                          <div 
                            key={influencer.id} 
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                              isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleInfluencerSelect(influencer)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold">
                                    {influencer.name.charAt(0)}
                                  </span>
                                </div>
                                
                                <div>
                                  <h4 className="font-semibold text-gray-900">{influencer.name}</h4>
                                  <p className="text-sm text-gray-600">{influencer.username}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {influencer.platforms.slice(0, 3).map((platform) => (
                                      <Badge key={platform} variant="outline" className="text-xs">
                                        {platform}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-6">
                                <div className="text-center">
                                  <p className="text-sm text-gray-500">Followers</p>
                                  <p className="font-semibold">{formatFollowers(influencer.followers)}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm text-gray-500">Engagement</p>
                                  <p className="font-semibold">{influencer.engagement_rate}%</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm text-gray-500">Rate</p>
                                  <p className="font-semibold">{formatCurrency(influencer.rate_per_post)}</p>
                                </div>
                                
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                  isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                                }`}>
                                  {isSelected && <HiCheck className="w-4 h-4 text-white" />}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <LoadingSpinner size="md" text="No influencers found" />
                      <p className="text-gray-500 mt-2">Try adjusting your search criteria.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Review & Launch */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Campaign</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Campaign Summary */}
                    <Card className="border border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-lg">Campaign Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-500">Title:</span>
                          <p className="font-medium">{campaignData.title}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Platforms:</span>
                          <div className="flex gap-1 mt-1">
                            {campaignData.platforms_required.map(platform => (
                              <Badge key={platform} variant="outline">{platform}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Deal Type:</span>
                          <p className="font-medium capitalize">{campaignData.deal_type}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Application Deadline:</span>
                          <p className="font-medium">
                            {new Date(campaignData.application_deadline).toLocaleDateString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Selected Influencers Summary */}
                    <Card className="border border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-lg">Selected Influencers ({selectedInfluencers.length})</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Total Cost:</span>
                            <p className="font-semibold">{formatCurrency(calculateEstimatedCost())}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Total Reach:</span>
                            <p className="font-semibold">{formatFollowers(calculateEstimatedReach())}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {selectedInfluencers.slice(0, 5).map(influencer => (
                            <div key={influencer.id} className="flex items-center justify-between text-sm">
                              <span>{influencer.name}</span>
                              <span className="text-gray-500">{formatFollowers(influencer.followers)}</span>
                            </div>
                          ))}
                          {selectedInfluencers.length > 5 && (
                            <p className="text-xs text-gray-500">
                              +{selectedInfluencers.length - 5} more influencers
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">Ready to Launch?</h4>
                    <p className="text-sm text-yellow-700">
                      Once you create this campaign, invitation emails will be sent to all selected influencers. 
                      Make sure all details are correct before proceeding.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <HiChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  Step {currentStep} of {steps.length}
                </span>
              </div>

              {currentStep < 5 ? (
                <Button
                  onClick={handleNext}
                  disabled={!validateStep(currentStep)}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                >
                  Next
                  <HiChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  {isSubmitting ? (
                    <>
                      <InlineLoader size="sm" />
                      Creating Campaign...
                    </>
                  ) : (
                    <>
                      <HiCheck className="w-4 h-4" />
                      Create Campaign
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 