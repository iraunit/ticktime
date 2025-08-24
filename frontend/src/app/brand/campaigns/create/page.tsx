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
import { GlobalLoader } from "@/components/ui/global-loader";
import { InlineLoader } from "@/components/ui/global-loader";
import { toast } from "@/lib/toast";
import { api } from "@/lib/api";
import { 
  HiPlus,
  HiMinus,
  HiUsers,
  HiMagnifyingGlass,
  HiCheck,
  HiXMark,
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
  const [formErrors, setFormErrors] = useState<string[]>([]);
  
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
    target_audience_location: ''
  });

  const steps = [
    { id: 1, title: 'Campaign Details', description: 'Basic campaign information' },
    { id: 2, title: 'Deal Structure', description: 'Compensation and deliverables' },
    { id: 3, title: 'Timeline', description: 'Important dates and deadlines' },
    { id: 4, title: 'Review & Launch', description: 'Final review and submission' }
  ];

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

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return campaignData.title && campaignData.description && campaignData.objectives;
      case 2:
        return campaignData.platforms_required.length > 0 && campaignData.content_requirements;
      case 3:
        return campaignData.application_deadline && campaignData.campaign_start_date && campaignData.campaign_end_date;
      default:
        return true;
    }
  };

  const getStepValidationMessage = (step: number) => {
    switch (step) {
      case 1:
        const missingFields = [];
        if (!campaignData.title) missingFields.push('Campaign Title');
        if (!campaignData.description) missingFields.push('Campaign Description');
        if (!campaignData.objectives) missingFields.push('Campaign Objectives');
        return missingFields.length > 0 ? `Please fill in: ${missingFields.join(', ')}` : null;
      case 2:
        const missingFields2 = [];
        if (campaignData.platforms_required.length === 0) missingFields2.push('Required Platforms');
        if (!campaignData.content_requirements) missingFields2.push('Content Requirements');
        
        // Check deal type specific requirements
        if (campaignData.deal_type === 'cash' && (!campaignData.cash_amount || campaignData.cash_amount <= 0)) {
          missingFields2.push('Cash Amount (must be greater than 0)');
        } else if (campaignData.deal_type === 'product' && (!campaignData.product_name || !campaignData.product_value)) {
          missingFields2.push('Product Name and Value');
        } else if (campaignData.deal_type === 'hybrid') {
          const hasCash = campaignData.cash_amount && campaignData.cash_amount > 0;
          const hasProduct = campaignData.product_name && campaignData.product_value;
          if (!hasCash && !hasProduct) {
            missingFields2.push('Either Cash Amount or Product Details');
          }
        }
        
        return missingFields2.length > 0 ? `Please fill in: ${missingFields2.join(', ')}` : null;
      case 3:
        const missingFields3 = [];
        if (!campaignData.application_deadline) missingFields3.push('Application Deadline');
        if (!campaignData.campaign_start_date) missingFields3.push('Campaign Start Date');
        if (!campaignData.campaign_end_date) missingFields3.push('Campaign End Date');
        return missingFields3.length > 0 ? `Please fill in: ${missingFields3.join(', ')}` : null;
      default:
        return null;
    }
  };

  const handleNext = () => {
    const validationErrors = validateStepData(currentStep);
    
    if (validationErrors.length === 0) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      setFormErrors([]); // Clear any previous errors
    } else {
      setFormErrors(validationErrors);
      // Show each error as a separate toast
      validationErrors.forEach(error => {
        toast.error(error);
      });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    // Run frontend validation first
    const validationErrors = validateStepData(1).concat(
      validateStepData(2),
      validateStepData(3)
    );
    
    if (validationErrors.length > 0) {
      setFormErrors(validationErrors);
      validationErrors.forEach(error => {
        toast.error(error);
      });
      return;
    }
    
    setIsSubmitting(true);
    setFormErrors([]); // Clear previous errors
    
    try {
      const response = await api.post('/brands/campaigns/', {
        ...campaignData
      });
      
      toast.success('Campaign created successfully!');
      router.push(`/brand/campaigns/${response.data.campaign.id}`);
    } catch (error: any) {
      console.error('Failed to create campaign:', error);
      
      // Handle different types of errors
      if (error.response?.data?.errors) {
        // Field-specific validation errors
        const errorMessages = [];
        Object.entries(error.response.data.errors).forEach(([field, messages]) => {
          if (field === 'non_field_errors') {
            // Handle non-field errors (general validation errors)
            if (Array.isArray(messages)) {
              errorMessages.push(...messages);
            } else {
              errorMessages.push(messages);
            }
          } else {
            // Handle field-specific errors
            if (Array.isArray(messages)) {
              errorMessages.push(`${field}: ${messages.join(', ')}`);
            } else {
              errorMessages.push(`${field}: ${messages}`);
            }
          }
        });
        
        if (errorMessages.length > 0) {
          setFormErrors(errorMessages);
          // Show each error as a separate toast
          errorMessages.forEach(errorMsg => {
            toast.error(errorMsg);
          });
        } else {
          toast.error(error.response?.data?.message || 'Failed to create campaign.');
        }
      } else if (error.response?.data?.message) {
        // General error message from backend
        setFormErrors([error.response.data.message]);
        toast.error(error.response.data.message);
      } else if (error.response?.status === 403) {
        const message = 'You do not have permission to create campaigns.';
        setFormErrors([message]);
        toast.error(message);
      } else if (error.response?.status === 404) {
        const message = 'Brand profile not found. Please complete your brand profile first.';
        setFormErrors([message]);
        toast.error(message);
      } else if (error.response?.status === 500) {
        const message = 'Server error. Please try again later.';
        setFormErrors([message]);
        toast.error(message);
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        const message = 'Network error. Please check your connection and try again.';
        setFormErrors([message]);
        toast.error(message);
      } else {
        const message = 'Failed to create campaign. Please try again.';
        setFormErrors([message]);
        toast.error(message);
      }
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

  const isFieldRequired = (fieldName: string) => {
    switch (fieldName) {
      case 'title':
      case 'description':
      case 'objectives':
      case 'deal_type':
      case 'platforms_required':
      case 'content_requirements':
      case 'application_deadline':
      case 'campaign_start_date':
      case 'campaign_end_date':
        return true;
      default:
        return false;
    }
  };

  const getFieldError = (fieldName: string) => {
    if (!isFieldRequired(fieldName)) return null;
    
    const value = campaignData[fieldName as keyof typeof campaignData];
    if (fieldName === 'platforms_required') {
      return Array.isArray(value) && value.length === 0 ? 'Required' : null;
    }
    return !value ? 'Required' : null;
  };

  const getDateValidationError = (fieldName: string) => {
    if (fieldName === 'campaign_start_date' && campaignData.campaign_start_date && campaignData.campaign_end_date) {
      const startDate = new Date(campaignData.campaign_start_date);
      const endDate = new Date(campaignData.campaign_end_date);
      if (startDate >= endDate) {
        return 'Start date must be before end date';
      }
    }
    
    if (fieldName === 'campaign_end_date' && campaignData.campaign_start_date && campaignData.campaign_end_date) {
      const startDate = new Date(campaignData.campaign_start_date);
      const endDate = new Date(campaignData.campaign_end_date);
      if (startDate >= endDate) {
        return 'End date must be after start date';
      }
    }
    
    if (fieldName === 'application_deadline' && campaignData.application_deadline && campaignData.campaign_start_date) {
      const deadline = new Date(campaignData.application_deadline);
      const startDate = new Date(campaignData.campaign_start_date);
      if (deadline >= startDate) {
        return 'Deadline must be before campaign start';
      }
    }
    
    return null;
  };

  // Frontend validation functions
  const validateDates = () => {
    const errors: string[] = [];
    
    if (campaignData.campaign_start_date && campaignData.campaign_end_date) {
      const startDate = new Date(campaignData.campaign_start_date);
      const endDate = new Date(campaignData.campaign_end_date);
      
      if (startDate >= endDate) {
        errors.push('Campaign end date must be after start date.');
      }
    }
    
    if (campaignData.application_deadline && campaignData.campaign_start_date) {
      const deadline = new Date(campaignData.application_deadline);
      const startDate = new Date(campaignData.campaign_start_date);
      
      if (deadline >= startDate) {
        errors.push('Application deadline must be before campaign start date.');
      }
    }
    
    return errors;
  };

  const validateDealType = () => {
    const errors: string[] = [];
    
    if (campaignData.deal_type === 'cash') {
      if (!campaignData.cash_amount || campaignData.cash_amount <= 0) {
        errors.push('Cash amount is required and must be greater than 0 for cash deals.');
      }
    } else if (campaignData.deal_type === 'product') {
      if (!campaignData.product_name || !campaignData.product_value) {
        errors.push('Product name and value are required for product deals.');
      }
    } else if (campaignData.deal_type === 'hybrid') {
      const hasCash = campaignData.cash_amount && campaignData.cash_amount > 0;
      const hasProduct = campaignData.product_name && campaignData.product_value;
      if (!hasCash && !hasProduct) {
        errors.push('Either cash amount or product details are required for hybrid deals.');
      }
    }
    
    return errors;
  };

  const validateStepData = (step: number) => {
    const errors: string[] = [];
    
    switch (step) {
      case 1:
        if (!campaignData.title?.trim()) errors.push('Campaign title is required.');
        if (!campaignData.description?.trim()) errors.push('Campaign description is required.');
        if (!campaignData.objectives?.trim()) errors.push('Campaign objectives are required.');
        break;
        
      case 2:
        if (campaignData.platforms_required.length === 0) {
          errors.push('At least one platform is required.');
        }
        if (!campaignData.content_requirements?.trim()) {
          errors.push('Content requirements are required.');
        }
        errors.push(...validateDealType());
        break;
        
      case 3:
        if (!campaignData.application_deadline) {
          errors.push('Application deadline is required.');
        }
        if (!campaignData.campaign_start_date) {
          errors.push('Campaign start date is required.');
        }
        if (!campaignData.campaign_end_date) {
          errors.push('Campaign end date is required.');
        }
        errors.push(...validateDates());
        break;
    }
    
    return errors;
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
            {/* Error Display */}
            {formErrors.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {formErrors.map((error, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
                        className={`w-full ${getFieldError('title') ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                      />
                      {getFieldError('title') && (
                        <p className="mt-1 text-sm text-red-600">{getFieldError('title')}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Campaign Description *
                      </label>
                      <Textarea
                        placeholder="Describe your campaign, brand, and what you're looking for"
                        value={campaignData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className={`w-full h-32 ${getFieldError('description') ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                      />
                      {getFieldError('description') && (
                        <p className="mt-1 text-sm text-red-600">{getFieldError('description')}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Campaign Objectives *
                      </label>
                      <Textarea
                        placeholder="What are your goals? (e.g., brand awareness, sales, engagement)"
                        value={campaignData.objectives}
                        onChange={(e) => handleInputChange('objectives', e.target.value)}
                        className={`w-full h-24 ${getFieldError('objectives') ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                      />
                      {getFieldError('objectives') && (
                        <p className="mt-1 text-sm text-red-600">{getFieldError('objectives')}</p>
                      )}
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
                        className={`w-full ${getFieldError('application_deadline') || getDateValidationError('application_deadline') ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                      />
                      {(getFieldError('application_deadline') || getDateValidationError('application_deadline')) && (
                        <p className="mt-1 text-sm text-red-600">
                          {getFieldError('application_deadline') || getDateValidationError('application_deadline')}
                        </p>
                      )}
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
                        className={`w-full ${getFieldError('campaign_start_date') || getDateValidationError('campaign_start_date') ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                      />
                      {(getFieldError('campaign_start_date') || getDateValidationError('campaign_start_date')) && (
                        <p className="mt-1 text-sm text-red-600">
                          {getFieldError('campaign_start_date') || getDateValidationError('campaign_start_date')}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Campaign End Date *
                      </label>
                      <Input
                        type="date"
                        value={campaignData.campaign_end_date}
                        onChange={(e) => handleInputChange('campaign_end_date', e.target.value)}
                        className={`w-full ${getFieldError('campaign_end_date') || getDateValidationError('campaign_end_date') ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                      />
                      {(getFieldError('campaign_end_date') || getDateValidationError('campaign_end_date')) && (
                        <p className="mt-1 text-sm text-red-600">
                          {getFieldError('campaign_end_date') || getDateValidationError('campaign_end_date')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review & Launch */}
            {currentStep === 4 && (
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

                    {/* Next Steps */}
                    <Card className="border border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-lg">Next Steps</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 mb-2">After Campaign Creation</h4>
                          <p className="text-sm text-blue-700 mb-3">
                            Once your campaign is created, you can:
                          </p>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Search and invite influencers from the Influencers page</li>
                            <li>• Add influencers to your campaign</li>
                            <li>• Manage applications and collaborations</li>
                          </ul>
                        </div>
                        
                        <div className="text-center">
                          <Button
                            onClick={() => router.push('/brand/influencers')}
                            variant="outline"
                            className="w-full"
                          >
                            Go to Influencer Search
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">Ready to Launch?</h4>
                    <p className="text-sm text-yellow-700">
                      Once you create this campaign, you'll be able to search and invite influencers from the Influencers page. 
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

              {currentStep < 4 ? (
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
                      <InlineLoader className="mr-2" />
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