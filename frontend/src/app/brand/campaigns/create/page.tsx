"use client";

import {useEffect, useState} from "react";
import "./campaign-form.css";
import {useRouter} from "next/navigation";
import {Card, CardContent} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";

import {Checkbox} from "@/components/ui/checkbox";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


import {InlineLoader} from "@/components/ui/global-loader";
import {DatePicker} from "@/components/ui/date-picker";
import {toast} from "@/lib/toast";
import {api} from "@/lib/api";
import {
    HiArrowRight,
    HiCalendarDays,
    HiCheck,
    HiChevronLeft,
    HiChevronRight,
    HiClock,
    HiCog6Tooth,
    HiCurrencyDollar,
    HiDocumentText,
    HiExclamationTriangle,
    HiEye,
    HiGift,
    HiLightBulb,
    HiPlus,
    HiSparkles,
    HiUsers,
    HiXMark
} from "react-icons/hi2";
import {FaInstagram, FaLinkedin, FaTiktok, FaTwitter, FaYoutube} from "react-icons/fa";

interface CampaignData {
    title: string;
    description: string;
    objectives: string;
    deal_type: 'cash' | 'product' | 'hybrid';
    cash_amount: number;
    products: Array<{ name: string; description?: string; value?: number; quantity?: number; variants?: any }>;
    platforms_required: string[];
    content_requirements: string;

    special_instructions: string;
    application_deadline: string;
    submission_deadline: string;
    campaign_live_date: string;
    target_influencers: number;
    industry: string;
    execution_mode: 'manual' | 'manual_managed' | 'fully_managed';
    application_deadline_visible_to_influencers: boolean;
    target_audience_age_min: number;
    target_audience_age_max: number;
    target_audience_gender: string;
    target_audience_location: string;
    barter_submission_after_days?: number;
}

// Real platform icons with brand colors
const platformConfig = {
    youtube: {
        icon: FaYoutube,
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
        gradient: "from-red-500 to-red-600"
    },
    instagram: {
        icon: FaInstagram,
        color: "text-pink-600",
        bg: "bg-pink-50",
        border: "border-pink-200",
        gradient: "from-pink-500 to-purple-500"
    },
    tiktok: {
        icon: FaTiktok,
        color: "text-gray-800",
        bg: "bg-gray-50",
        border: "border-gray-200",
        gradient: "from-gray-800 to-gray-900"
    },
    twitter: {
        icon: FaTwitter,
        color: "text-blue-500",
        bg: "bg-blue-50",
        border: "border-blue-200",
        gradient: "from-blue-400 to-blue-500"
    },
    linkedin: {
        icon: FaLinkedin,
        color: "text-blue-700",
        bg: "bg-blue-50",
        border: "border-blue-200",
        gradient: "from-blue-700 to-blue-800"
    },
} as const;

// Human-friendly display names for platforms
const platformDisplayNames: Record<string, string> = {
    youtube: 'YouTube',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    twitter: 'Twitter',
    linkedin: 'LinkedIn',
};


// Convert platformConfig to platforms array for mapping
const platforms = Object.entries(platformConfig).map(([id, config]) => ({
    id,
    name: platformDisplayNames[id as keyof typeof platformDisplayNames] || id.charAt(0).toUpperCase() + id.slice(1),
    icon: config.icon,
    color: config.color,
    bg: config.bg,
    border: config.border,
    gradient: config.gradient
}));

export default function CreateCampaignPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<string[]>([]);
    const [industries, setIndustries] = useState<Array<{ id: number; key: string; name: string }>>([]);
    const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

    // Campaign form data
    const [campaignData, setCampaignData] = useState<CampaignData>({
        title: '',
        description: '',
        objectives: '',
        deal_type: 'cash',
        cash_amount: 0,
        products: [],
        platforms_required: [],
        content_requirements: '',

        special_instructions: '',
        application_deadline: '',
        submission_deadline: '',
        campaign_live_date: '',
        target_influencers: 1,
        industry: '',
        execution_mode: 'manual',
        application_deadline_visible_to_influencers: true,
        target_audience_age_min: 18,
        target_audience_age_max: 65,
        target_audience_gender: 'all',
        target_audience_location: '',
        barter_submission_after_days: undefined,
    });

    const steps = [
        {id: 1, title: 'Campaign Details', description: 'Basic campaign information'},
        {id: 2, title: 'Deal Structure', description: 'Compensation and deliverables'},
        {id: 3, title: 'Timeline', description: 'Important dates and deadlines'},
        {id: 4, title: 'Review & Launch', description: 'Final review and submission'}
    ];

    const handleInputChange = (field: string, value: any) => {
        // Clean industry field to prevent malformed object representations
        if (field === 'industry' && typeof value === 'string') {
            let cleanValue = value.toString().trim();

            // Clean up malformed object representations
            if (cleanValue.includes("'industry_category':") || cleanValue.includes("<Category:")) {
                const categoryMatch = cleanValue.match(/<Category:\s*([^>]+)>/);
                if (categoryMatch) {
                    cleanValue = categoryMatch[1].trim();
                } else {
                    cleanValue = '';
                }
            }

            // Ensure it's <= 50 chars
            cleanValue = cleanValue.slice(0, 50);
            value = cleanValue;
        }

        setCampaignData(prev => ({...prev, [field]: value}));
    };

    const handlePlatformToggle = (platform: string) => {
        setCampaignData(prev => ({
            ...prev,
            platforms_required: prev.platforms_required.includes(platform)
                ? prev.platforms_required.filter(p => p !== platform)
                : [...prev.platforms_required, platform]
        }));
    };

    const handleIndustryToggle = (industryKey: string) => {
        setSelectedIndustries(prev => {
            const exists = prev.includes(industryKey);
            const next = exists ? prev.filter(k => k !== industryKey) : [...prev, industryKey];
            // Keep legacy single field in sync with the first selected as primary - ensure it's clean
            const cleanValue = (next[0] || '').toString().slice(0, 50);
            handleInputChange('industry', cleanValue);
            return next;
        });
    };

    const validateStep = (step: number) => {
        switch (step) {
            case 1:
                return campaignData.title && campaignData.description && campaignData.objectives;
            case 2:
                return campaignData.platforms_required.length > 0 && campaignData.content_requirements;
            case 3:
                return campaignData.application_deadline && campaignData.campaign_live_date;
            default:
                return true;
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
            // Resolve industry to a primitive (number id or string key <= 50 chars)
            const resolveIndustryValue = () => {
                let raw = (selectedIndustries[0] ?? campaignData.industry ?? '').toString().trim();

                // Clean up malformed object representations like "{'industry_category': <Category: fashion>}"
                if (raw.includes("'industry_category':") || raw.includes("<Category:")) {
                    // Extract category name from malformed string
                    const categoryMatch = raw.match(/<Category:\s*([^>]+)>/);
                    if (categoryMatch) {
                        raw = categoryMatch[1].trim();
                    } else {
                        raw = '';
                    }
                }

                // Ensure it's a clean string <= 50 chars
                const key = raw.slice(0, 50);

                // Try to find matching industry by key
                const match = industries.find((c) => c.key === key);
                if (match && typeof match.id === 'number') return match.id;

                // Try to parse as number
                const maybeNum = Number(key);
                if (Number.isInteger(maybeNum)) return maybeNum;

                // Return cleaned key or empty string
                return key || '';
            };
            const primaryId = resolveIndustryValue();
            const payload = {
                ...campaignData,
                // Backend serializer accepts category id; avoids varchar(50) overflow
                industry: primaryId,
                content_requirements: campaignData.content_requirements,
            };

            let response;
            if (isEditing && editingCampaignId) {
                response = await api.patch(`/brands/campaigns/${editingCampaignId}/`, payload);
                toast.success('Campaign updated successfully!');
                router.push(`/brand/campaigns/${editingCampaignId}`);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                response = await api.post('/campaigns/create/', payload);
                toast.success('Campaign created successfully!');
                // Redirect to influencer search with selected industry pre-filtered
                const ind = selectedIndustries[0] || campaignData.industry;
                router.push(`/brand/influencers${ind ? `?industry=${encodeURIComponent(ind)}` : ''}`);
            }
        } catch (error: any) {
            // Helper: always convert backend payload or ApiError into flat string messages
            const normalizeErrorMessages = (err: any): string[] => {
                const messages: string[] = [];
                if (!err) return messages;

                // ApiError from our interceptor
                if (typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
                    if (err.message) messages.push(err.message);
                }

                // Axios error with response
                const data = err?.response?.data || err?.data || err;
                const dig = (payload: any, prefix?: string) => {
                    if (!payload) return;
                    if (typeof payload === 'string') {
                        messages.push(prefix ? `${prefix}: ${payload}` : payload);
                        return;
                    }
                    if (Array.isArray(payload)) {
                        payload.forEach((item) => dig(item, prefix));
                        return;
                    }
                    if (typeof payload === 'object') {
                        if (typeof payload.message === 'string') messages.push(payload.message);
                        if (payload.errors && typeof payload.errors === 'object') {
                            Object.entries(payload.errors).forEach(([field, detail]) => dig(detail, field));
                        }
                        if (payload.details && typeof payload.details === 'object') {
                            Object.entries(payload.details).forEach(([field, detail]) => dig(detail, field));
                        }
                    }
                };
                dig(data);

                return messages.filter(Boolean);
            };

            let errorMessages: string[] = normalizeErrorMessages(error);

            // Also read normalized field errors from our API interceptor shape
            const fieldErrors = (error && typeof error === 'object' && 'details' in error && (error as any).details?.field_errors)
                ? (error as any).details.field_errors as Record<string, string[]>
                : undefined;
            if (fieldErrors) {
                Object.entries(fieldErrors).forEach(([field, msgs]) => {
                    (msgs || []).forEach((m) => errorMessages.push(`${field}: ${m}`));
                });
            }

            // Sensible fallbacks
            if ((error as any)?.code === 'NETWORK_ERROR' || (error as any)?.message?.includes?.('Network')) {
                errorMessages = ['Network error. Please check your connection and try again.'];
            }

            // Handle specific error types
            if ((error as any)?.response?.status === 403) {
                errorMessages = ['You do not have permission to perform this action.'];
            } else if (errorMessages.length === 0) {
                errorMessages = [isEditing ? 'Failed to update campaign. Please try again.' : 'Failed to create campaign. Please try again.'];
            }

            setFormErrors(errorMessages);

            // Force show toasts even if extraction failed
            if (errorMessages.length === 0) {
                toast.error(isEditing ? 'Campaign update failed. Please check the form and try again.' : 'Campaign creation failed. Please check the form and try again.');
            } else {
                errorMessages.forEach((msg) => toast.error(msg));
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
            case 'industry':
            case 'deal_type':
            case 'platforms_required':
            case 'content_requirements':
            case 'application_deadline':
            case 'campaign_live_date':
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
        if (fieldName === 'application_deadline' && campaignData.application_deadline && campaignData.campaign_live_date) {
            const deadline = new Date(campaignData.application_deadline);
            const liveDate = new Date(campaignData.campaign_live_date);
            if (deadline >= liveDate) {
                return 'Deadline must be before campaign live date';
            }
        }

        if (fieldName === 'campaign_live_date') {
            if (campaignData.campaign_live_date) {
                const liveDate = new Date(campaignData.campaign_live_date);
                const today = new Date();
                const minDate = new Date();
                minDate.setDate(today.getDate() + 15);

                if (liveDate < minDate) {
                    return 'Must be at least 15 days from today';
                }
            }
        }

        return null;
    };

    // Frontend validation functions
    const validateDates = () => {
        const errors: string[] = [];

        if (campaignData.application_deadline && campaignData.campaign_live_date) {
            const deadline = new Date(campaignData.application_deadline);
            const liveDate = new Date(campaignData.campaign_live_date);

            if (deadline >= liveDate) {
                errors.push('Application deadline must be before campaign live date.');
            }
        }

        // Validate campaign live date is at least 15 days from today
        if (campaignData.campaign_live_date) {
            const liveDate = new Date(campaignData.campaign_live_date);
            const today = new Date();
            const minDate = new Date();
            minDate.setDate(today.getDate() + 14);

            if (liveDate < minDate) {
                errors.push('Campaign live date must be at least 15 days from today.');
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
            // Check if products array exists and has valid entries
            const validProducts = campaignData.products?.filter(p => p.name && p.name.trim().length > 0) || [];
            if (validProducts.length === 0) {
                errors.push('At least one barter item is required for barter deals.');
            }
        } else if (campaignData.deal_type === 'hybrid') {
            const hasCash = campaignData.cash_amount && campaignData.cash_amount > 0;
            const validProducts = campaignData.products?.filter(p => p.name && p.name.trim().length > 0) || [];
            const hasProducts = validProducts.length > 0;
            if (!hasCash && !hasProducts) {
                errors.push('Either cash amount or at least one barter item is required for hybrid deals.');
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
                if (!(selectedIndustries[0] || campaignData.industry)?.trim()) errors.push('Industry is required.');
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
                if (!campaignData.campaign_live_date) {
                    errors.push('Campaign live date is required.');
                }
                errors.push(...validateDates());
                break;
        }

        return errors;
    };

    useEffect(() => {
        const today = new Date();
        const addDays = (d: number) => {
            const nd = new Date(today);
            nd.setDate(nd.getDate() + d);
            return nd.toISOString().slice(0, 10);
        };
        setCampaignData(prev => ({
            ...prev,
            application_deadline: addDays(7),
            campaign_live_date: addDays(15),
            submission_deadline: addDays(7)
        }));
        api.get('/common/industries/').then(res => setIndustries(res.data.industries || [])).catch(() => {
        });
    }, []);

    // Check for edit mode and load campaign data
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const editCampaignId = urlParams.get('edit');

        if (editCampaignId) {
            setIsEditing(true);
            setEditingCampaignId(editCampaignId);

            // Fetch campaign data for editing
            const fetchCampaignData = async () => {
                try {
                    const response = await api.get(`/brands/campaigns/${editCampaignId}/`);
                    const campaign = response.data.campaign;

                    // Map campaign data to form structure
                    setCampaignData({
                        title: campaign.title || '',
                        description: campaign.description || '',
                        objectives: campaign.objectives || '',
                        deal_type: campaign.deal_type || 'cash',
                        cash_amount: campaign.cash_amount || 0,
                        products: campaign.products || [],
                        platforms_required: campaign.platforms_required || [],
                        content_requirements: typeof campaign.content_requirements === 'string'
                            ? campaign.content_requirements
                            : campaign.content_requirements?.description || '',
                        special_instructions: campaign.special_instructions || '',
                        application_deadline: campaign.application_deadline ? campaign.application_deadline.split('T')[0] : '',
                        submission_deadline: campaign.submission_deadline ? campaign.submission_deadline.split('T')[0] : '',
                        campaign_live_date: campaign.campaign_live_date ? campaign.campaign_live_date.split('T')[0] : '',
                        target_influencers: campaign.target_influencers || 1,
                        // Always store a primitive value: prefer key; fallback to cleaned id; last resort empty string
                        industry: (() => {
                            let val = (campaign.industry_key || (campaign.industry?.toString?.() || '')).toString().trim();

                            // Clean malformed object representations
                            if (val.includes("'industry_category':") || val.includes("<Category:")) {
                                const categoryMatch = val.match(/<Category:\s*([^>]+)>/);
                                if (categoryMatch) {
                                    val = categoryMatch[1].trim();
                                } else {
                                    val = '';
                                }
                            }

                            return val.slice(0, 50);
                        })(),
                        execution_mode: campaign.execution_mode || 'manual',
                        application_deadline_visible_to_influencers: campaign.application_deadline_visible_to_influencers !== false,
                        target_audience_age_min: 18,
                        target_audience_age_max: 65,
                        target_audience_gender: 'all',
                        target_audience_location: '',
                        barter_submission_after_days: campaign.barter_submission_after_days || undefined,
                    });

                    // Set selected industries if available (prefer key, else clean and coerce to string)
                    if (campaign.industry_key || campaign.industry) {
                        let val = (campaign.industry_key || String(campaign.industry)).toString().trim();

                        // Clean malformed object representations
                        if (val.includes("'industry_category':") || val.includes("<Category:")) {
                            const categoryMatch = val.match(/<Category:\s*([^>]+)>/);
                            if (categoryMatch) {
                                val = categoryMatch[1].trim();
                            } else {
                                val = '';
                            }
                        }

                        if (val) {
                            setSelectedIndustries([val.slice(0, 50)]);
                        }
                    }

                } catch (error: any) {
                    console.error('Failed to fetch campaign data:', error);
                    toast.error('Failed to load campaign data for editing.');
                    router.push('/brand/campaigns');
                }
            };

            fetchCampaignData();
        }
    }, [router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div className="container mx-auto px-4 py-4 max-w-6xl">
                {/* Modern Header */}
                <div className="relative mb-6 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl"></div>
                    <div
                        className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full -mr-16 -mt-16"></div>
                    <div
                        className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/20 to-indigo-400/20 rounded-full -ml-12 -mb-12"></div>

                    <div className="relative p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div
                                className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                                <HiSparkles className="w-5 h-5 text-white"/>
                            </div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                {isEditing ? 'Edit Campaign' : 'Create New Campaign'}
                            </h1>
                        </div>
                        <p className="text-gray-600 max-w-2xl">
                            {isEditing
                                ? 'Update your campaign details and settings to better attract the right creators for your brand.'
                                : 'Launch your next influencer marketing campaign with our streamlined creation process. Connect with creators and build authentic partnerships.'
                            }
                        </p>
                    </div>
                </div>

                {/* Modern Progress Steps */}
                <div className="mb-6">
                    <div className="relative">
                        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200"></div>
                        <div
                            className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                            style={{width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`}}></div>

                        <div className="relative flex justify-between">
                            {steps.map((step, index) => {
                                const isActive = currentStep === step.id;
                                const isCompleted = currentStep > step.id;
                                const stepIcons = [HiLightBulb, HiCurrencyDollar, HiClock, HiCheck];
                                const StepIcon = stepIcons[index] || HiCheck;

                                return (
                                    <div key={step.id} className="flex flex-col items-center">
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                                isCompleted
                                                    ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg'
                                                    : isActive
                                                        ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg scale-110'
                                                        : 'bg-white border-2 border-gray-200 text-gray-400'
                                            }`}>
                                            {isCompleted ? (
                                                <HiCheck className="w-5 h-5"/>
                                            ) : (
                                                <StepIcon className="w-5 h-5"/>
                                            )}
                                        </div>
                                        <div className="mt-3 text-center max-w-24">
                                            <p className={`text-sm font-medium ${
                                                isActive ? 'text-indigo-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                                            }`}>{step.title}</p>
                                            <p className="text-xs text-gray-400 mt-1">{step.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Modern Step Content */}
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                    <div
                        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                    <CardContent className="p-6">
                        {/* Error Display */}
                        {formErrors.length > 0 && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <h4 className="text-sm font-medium text-red-800 mb-2">Please fix the following
                                    errors:</h4>
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
                            <div className="space-y-4">
                                <div className="text-center mb-4">
                                    <div
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-full mb-4">
                                        <HiLightBulb className="w-4 h-4 text-indigo-600"/>
                                        <span
                                            className="text-sm font-medium text-indigo-700">Campaign Information</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Tell us about your
                                        campaign</h3>
                                    <p className="text-gray-600">Let's start with the basics to create an compelling
                                        campaign that attracts the right creators.</p>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                                            Campaign Title *
                                        </label>
                                        <Input
                                            placeholder="e.g., Summer Fashion Collection Launch"
                                            value={campaignData.title}
                                            onChange={(e) => handleInputChange('title', e.target.value)}
                                            className={`h-12 text-base border-2 transition-all duration-200 ${getFieldError('title') ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-indigo-400 focus:ring-indigo-100'}`}
                                        />
                                        {getFieldError('title') && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <HiXMark className="w-4 h-4"/>
                                                {getFieldError('title')}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500">Choose a clear, engaging title that
                                            creators will find appealing</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                                            Campaign Description *
                                        </label>
                                        <Textarea
                                            placeholder="Tell creators about your brand, campaign goals, and what makes this collaboration exciting..."
                                            value={campaignData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            className={`h-28 text-base border-2 transition-all duration-200 resize-none ${getFieldError('description') ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-purple-400 focus:ring-purple-100'}`}
                                        />
                                        {getFieldError('description') && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <HiXMark className="w-4 h-4"/>
                                                {getFieldError('description')}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500">Describe your brand, campaign vision, and
                                            what creators can expect</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                            <div className="w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
                                            Campaign Objectives *
                                        </label>
                                        <Textarea
                                            placeholder="e.g., Increase brand awareness, drive website traffic, boost sales, build community engagement..."
                                            value={campaignData.objectives}
                                            onChange={(e) => handleInputChange('objectives', e.target.value)}
                                            className={`h-24 text-base border-2 transition-all duration-200 resize-none ${getFieldError('objectives') ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-pink-400 focus:ring-pink-100'}`}
                                        />
                                        {getFieldError('objectives') && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <HiXMark className="w-4 h-4"/>
                                                {getFieldError('objectives')}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500">What do you want to achieve with this
                                            campaign?</p>
                                    </div>

                                    <div
                                        className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <HiUsers className="w-5 h-5 text-indigo-600"/>
                                            Target Audience
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">Age Range</label>
                                                <div className="flex items-center gap-3">
                                                    <Input
                                                        type="number"
                                                        placeholder="18"
                                                        value={campaignData.target_audience_age_min}
                                                        onChange={(e) => handleInputChange('target_audience_age_min', parseInt(e.target.value))}
                                                        className="border-gray-300 focus:border-indigo-400 focus:ring-indigo-100"
                                                    />
                                                    <span className="text-gray-500 font-medium">to</span>
                                                    <Input
                                                        type="number"
                                                        placeholder="65"
                                                        value={campaignData.target_audience_age_max}
                                                        onChange={(e) => handleInputChange('target_audience_age_max', parseInt(e.target.value))}
                                                        className="border-gray-300 focus:border-indigo-400 focus:ring-indigo-100"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">Gender</label>
                                                <Select value={campaignData.target_audience_gender}
                                                        onValueChange={(value) => handleInputChange('target_audience_gender', value)}>
                                                    <SelectTrigger
                                                        className="border-gray-300 focus:border-indigo-400 focus:ring-indigo-100">
                                                        <SelectValue/>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Genders</SelectItem>
                                                        <SelectItem value="male">Male</SelectItem>
                                                        <SelectItem value="female">Female</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">Location</label>
                                                <Input
                                                    placeholder="e.g., India, Mumbai, Global"
                                                    value={campaignData.target_audience_location}
                                                    onChange={(e) => handleInputChange('target_audience_location', e.target.value)}
                                                    className="border-gray-300 focus:border-indigo-400 focus:ring-indigo-100"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Industries */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                            Industries
                                        </label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                            {industries.map((ind) => {
                                                const isActive = selectedIndustries.includes(ind.key);
                                                return (
                                                    <button
                                                        key={ind.key}
                                                        onClick={() => handleIndustryToggle(ind.key)}
                                                        className={`px-3 py-2 rounded-full text-sm border-2 transition-all text-left ${
                                                            isActive
                                                                ? 'border-transparent text-white shadow-md bg-gradient-to-br from-emerald-500 to-green-600'
                                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                                        }`}
                                                        aria-pressed={isActive}
                                                    >
                                                        {ind.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {getFieldError('industry') && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <HiXMark className="w-4 h-4"/>
                                                {getFieldError('industry')}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500">Select one or more industries. The first
                                            selected will be used as the primary.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Deal Structure */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                {/* Section Header */}
                                <div className="text-center">
                                    <div
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-full mb-3">
                                        <HiCurrencyDollar className="w-4 h-4 text-indigo-600"/>
                                        <span className="text-sm font-medium text-indigo-700">Deal Structure & Requirements</span>
                                    </div>
                                    <p className="text-gray-600">Choose compensation, platforms and the content
                                        expectations.</p>
                                </div>

                                {/* Compensation Type */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-semibold text-gray-800">Compensation
                                        Type</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {[
                                            {
                                                id: 'cash',
                                                label: 'Cash Payment',
                                                icon: HiCurrencyDollar,
                                                gradient: 'from-green-500 to-emerald-600'
                                            },
                                            {
                                                id: 'product',
                                                label: 'Barter',
                                                icon: HiGift,
                                                gradient: 'from-amber-500 to-orange-600'
                                            },
                                            {
                                                id: 'hybrid',
                                                label: 'Cash + Barter',
                                                icon: HiPlus,
                                                gradient: 'from-indigo-500 to-pink-600'
                                            }
                                        ].map((type) => {
                                            const isActive = campaignData.deal_type === type.id;
                                            return (
                                                <button
                                                    key={type.id}
                                                    onClick={() => handleInputChange('deal_type', type.id)}
                                                    className={`relative p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                                                        isActive
                                                            ? `border-transparent text-white shadow-md bg-gradient-to-br ${type.gradient}`
                                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                                    }`}
                                                    aria-pressed={isActive}
                                                >
                                                    <div
                                                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                                            isActive ? 'bg-white/20 text-white' : 'bg-gray-50 text-gray-600'
                                                        }`}>
                                                        <type.icon className="w-5 h-5"/>
                                                    </div>
                                                    <div>
                                                        <p className={`font-semibold ${isActive ? 'text-white' : 'text-gray-800'}`}>{type.label}</p>
                                                        {isActive && (
                                                            <p className="text-xs opacity-90">Selected</p>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Compensation Details */}
                                {(campaignData.deal_type === 'cash' || campaignData.deal_type === 'hybrid') && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Cash Amount
                                                (INR)</label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    placeholder="Enter amount"
                                                    value={campaignData.cash_amount}
                                                    onChange={(e) => handleInputChange('cash_amount', parseFloat(e.target.value))}
                                                    className="h-12 text-base pr-28"
                                                />
                                                <div
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-sm px-2 py-1 rounded-md bg-gray-100 text-gray-700">
                                                    {formatCurrency(Number(campaignData.cash_amount || 0))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {(campaignData.deal_type === 'product' || campaignData.deal_type === 'hybrid') && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-gray-900">Barter Products</h4>
                                            <Button size="sm" variant="outline"
                                                    onClick={() => handleInputChange('products', [...campaignData.products, {
                                                        name: '',
                                                        description: '',
                                                        value: 0,
                                                        quantity: 1
                                                    }])}>
                                                <HiPlus className="w-4 h-4 mr-1"/> Add Product
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            {campaignData.products.length === 0 ? (
                                                <div
                                                    className="border-2 border-dashed border-amber-300 bg-amber-50 rounded-lg p-6 text-center">
                                                    <HiGift className="w-8 h-8 text-amber-500 mx-auto mb-2"/>
                                                    <p className="text-sm text-amber-700 font-medium mb-2">No barter
                                                        items added yet</p>
                                                    <p className="text-xs text-amber-600">Click "Add Product" to add
                                                        barter items for this campaign</p>
                                                </div>
                                            ) : (
                                                campaignData.products.map((p, idx) => (
                                                    <div key={idx}
                                                         className="grid grid-cols-1 md:grid-cols-4 gap-2 border p-3 rounded-lg bg-white">
                                                        <div className="md:col-span-2">
                                                            <label
                                                                className="block text-sm font-medium text-gray-700 mb-1">Name
                                                                *</label>
                                                            <Input
                                                                value={p.name}
                                                                onChange={(e) => {
                                                                    const next = [...campaignData.products];
                                                                    next[idx] = {...next[idx], name: e.target.value};
                                                                    handleInputChange('products', next);
                                                                }}
                                                                placeholder="Product name"
                                                                className={!p.name?.trim() ? 'border-red-300 focus:border-red-500' : ''}
                                                            />
                                                            {!p.name?.trim() && (
                                                                <p className="text-xs text-red-600 mt-1">Product name is
                                                                    required</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label
                                                                className="block text-sm font-medium text-gray-700 mb-1">Value
                                                                (INR)</label>
                                                            <Input type="number" value={p.value || 0} onChange={(e) => {
                                                                const next = [...campaignData.products];
                                                                next[idx] = {
                                                                    ...next[idx],
                                                                    value: parseFloat(e.target.value)
                                                                };
                                                                handleInputChange('products', next);
                                                            }} placeholder="0"/>
                                                        </div>
                                                        <div>
                                                            <label
                                                                className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                                            <Input type="number" value={p.quantity || 1} min={1}
                                                                   onChange={(e) => {
                                                                       const next = [...campaignData.products];
                                                                       next[idx] = {
                                                                           ...next[idx],
                                                                           quantity: parseInt(e.target.value)
                                                                       };
                                                                       handleInputChange('products', next);
                                                                   }}/>
                                                        </div>
                                                        <div className="md:col-span-4">
                                                            <label
                                                                className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                            <Textarea value={p.description || ''} onChange={(e) => {
                                                                const next = [...campaignData.products];
                                                                next[idx] = {...next[idx], description: e.target.value};
                                                                handleInputChange('products', next);
                                                            }} className="h-16" placeholder="Brief description"/>
                                                        </div>
                                                        <div className="md:col-span-4 flex justify-end">
                                                            <Button variant="ghost" size="sm" onClick={() => {
                                                                const next = campaignData.products.filter((_, i) => i !== idx);
                                                                handleInputChange('products', next);
                                                            }} className="text-red-600">
                                                                <HiXMark className="w-4 h-4 mr-1"/> Remove
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Platform Selection */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-semibold text-gray-800">Required Platforms
                                        *</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                        {platforms.map((platform) => {
                                            const isSelected = campaignData.platforms_required.includes(platform.id);
                                            return (
                                                <button
                                                    key={platform.id}
                                                    onClick={() => handlePlatformToggle(platform.id)}
                                                    className={`relative p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all overflow-hidden ${
                                                        isSelected
                                                            ? `border-transparent text-white shadow-md bg-gradient-to-br ${platform.gradient}`
                                                            : `border-gray-200 ${platform.bg} hover:border-gray-300`
                                                    }`}
                                                    aria-pressed={isSelected}
                                                >
                                                    <div
                                                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${isSelected ? 'bg-white/20' : 'bg-white'}`}>
                                                        <platform.icon
                                                            className={`w-5 h-5 ${isSelected ? 'text-white' : platform.color}`}/>
                                                    </div>
                                                    <span
                                                        className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-gray-800'}`}>{platform.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Content Requirements */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Content
                                            Requirements *</label>
                                        <Textarea
                                            placeholder="Describe the type of content, style, messaging, hashtags, etc."
                                            value={campaignData.content_requirements}
                                            onChange={(e) => handleInputChange('content_requirements', e.target.value)}
                                            className="h-24"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Be as specific as possible to help
                                            creators deliver exactly what you want.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Special
                                            Instructions</label>
                                        <Textarea
                                            placeholder="Any additional guidelines or requirements"
                                            value={campaignData.special_instructions}
                                            onChange={(e) => handleInputChange('special_instructions', e.target.value)}
                                            className="h-24"
                                        />
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                            <HiExclamationTriangle className="w-3 h-3"/>
                                            <span>Optional: add disclaimers, brand safety rules or review notes.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Timeline */}
                        {currentStep === 3 && (
                            <div className="space-y-6 campaign-form-step">
                                <div className="text-center mb-6">
                                    <div
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-full mb-4">
                                        <HiCalendarDays className="w-4 h-4 text-blue-600"/>
                                        <span className="text-sm font-medium text-blue-700">Campaign Timeline</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Set Your Campaign
                                        Schedule</h3>
                                    <p className="text-gray-600">Define key dates and deadlines for your campaign
                                        execution.</p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 timeline-grid">
                                    {/* Primary Timeline */}
                                    <div className="space-y-6">
                                        <div
                                            className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 timeline-card">
                                            <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                                                <HiClock className="w-5 h-5"/>
                                                Key Dates
                                            </h4>

                                            <div className="space-y-4">
                                                <div>
                                                    <label
                                                        className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                        Application Deadline *
                                                    </label>
                                                    <DatePicker
                                                        value={campaignData.application_deadline}
                                                        onChange={(date) => handleInputChange('application_deadline', date)}
                                                        placeholder="Select application deadline"
                                                        error={!!(getFieldError('application_deadline') || getDateValidationError('application_deadline'))}
                                                    />
                                                    {(getFieldError('application_deadline') || getDateValidationError('application_deadline')) && (
                                                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                                            <HiXMark className="w-4 h-4"/>
                                                            {getFieldError('application_deadline') || getDateValidationError('application_deadline')}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-500 mt-1">When should influencers
                                                        apply by?</p>
                                                </div>

                                                <div>
                                                    <label
                                                        className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                        Campaign Live Date *
                                                    </label>
                                                    <DatePicker
                                                        value={campaignData.campaign_live_date}
                                                        onChange={(date) => handleInputChange('campaign_live_date', date)}
                                                        placeholder="Select campaign live date"
                                                        min={(() => {
                                                            const today = new Date();
                                                            today.setDate(today.getDate() + 15);
                                                            return today.toISOString().split('T')[0];
                                                        })()}
                                                        error={!!(getFieldError('campaign_live_date') || getDateValidationError('campaign_live_date'))}
                                                    />
                                                    {(getFieldError('campaign_live_date') || getDateValidationError('campaign_live_date')) && (
                                                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                                            <HiXMark className="w-4 h-4"/>
                                                            {getFieldError('campaign_live_date') || getDateValidationError('campaign_live_date')}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-500 mt-1">When should the campaign
                                                        content go live? (Minimum 15 days from today)</p>
                                                </div>

                                                {(campaignData.deal_type === 'product' || campaignData.deal_type === 'hybrid') && (
                                                    <div>
                                                        <label
                                                            className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                                                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                            Content Submission (Barter)
                                                        </label>
                                                        <Select
                                                            value={(campaignData.barter_submission_after_days || '').toString()}
                                                            onValueChange={(v) => handleInputChange('barter_submission_after_days', parseInt(v))}
                                                        >
                                                            <SelectTrigger
                                                                className="h-12 text-base border-2 border-purple-200 focus:border-purple-400 focus:ring-purple-100">
                                                                <SelectValue
                                                                    placeholder="Select days after product receipt"/>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="3">3 days after receiving
                                                                    product</SelectItem>
                                                                <SelectItem value="5">5 days after receiving
                                                                    product</SelectItem>
                                                                <SelectItem value="7">7 days after receiving
                                                                    product</SelectItem>
                                                                <SelectItem value="10">10 days after receiving
                                                                    product</SelectItem>
                                                                <SelectItem value="14">14 days after receiving
                                                                    product</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <p className="text-xs text-gray-500 mt-1">How many days after
                                                            receiving the product should content be submitted?</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Campaign Settings */}
                                    <div className="space-y-6">
                                        <div
                                            className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200 timeline-card">
                                            <h4 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
                                                <HiCog6Tooth className="w-5 h-5"/>
                                                Campaign Settings
                                            </h4>

                                            <div className="space-y-4">
                                                <div>
                                                    <label
                                                        className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                                                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                        Execution Mode
                                                    </label>
                                                    <Select value={campaignData.execution_mode}
                                                            onValueChange={(v) => handleInputChange('execution_mode', v)}>
                                                        <SelectTrigger
                                                            className="h-12 text-base border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-100">
                                                            <SelectValue/>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="manual">
                                                                <div className="flex flex-col">
                                                                    <span
                                                                        className="font-medium">Manual Selection</span>
                                                                    <span className="text-xs text-gray-500">You'll manually review and select influencers</span>
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="manual_managed">
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">Manual + Managed by Us</span>
                                                                    <span className="text-xs text-gray-500">You select influencers, we handle coordination</span>
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="fully_managed">
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">Managed by Us Fully</span>
                                                                    <span className="text-xs text-gray-500">We handle influencer selection and coordination</span>
                                                                </div>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <p className="text-xs text-gray-500 mt-1">How would you like to
                                                        manage influencer selection?</p>
                                                </div>

                                                <div>
                                                    <label
                                                        className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                        Number of Influencers Needed
                                                    </label>
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            max="50"
                                                            value={campaignData.target_influencers}
                                                            onChange={(e) => handleInputChange('target_influencers', parseInt(e.target.value))}
                                                            className="h-12 text-base border-2 border-red-200 focus:border-red-400 focus:ring-red-100"
                                                        />
                                                        <HiUsers
                                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"/>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">How many influencers do
                                                        you want to collaborate with?</p>
                                                </div>

                                                <div className="bg-white/50 rounded-lg p-4 border border-orange-200">
                                                    <label className="flex items-start gap-3 text-sm text-gray-700">
                                                        <Checkbox
                                                            checked={campaignData.application_deadline_visible_to_influencers}
                                                            onCheckedChange={(v) => handleInputChange('application_deadline_visible_to_influencers', Boolean(v))}
                                                            className="mt-0.5"
                                                        />
                                                        <div>
                                                            <span className="font-medium">Show application deadline to influencers</span>
                                                            <p className="text-xs text-gray-500 mt-1">When enabled,
                                                                influencers will see the deadline in campaign
                                                                details</p>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timeline Preview */}
                                        <div
                                            className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200 timeline-card">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <HiEye className="w-5 h-5"/>
                                                Timeline Preview
                                            </h4>

                                            <div className="space-y-3">
                                                <div
                                                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 timeline-preview-item">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                        <span className="text-sm font-medium text-gray-700">Application Deadline</span>
                                                    </div>
                                                    <span className="text-sm text-gray-600">
                            {campaignData.application_deadline ? new Date(campaignData.application_deadline).toLocaleDateString() : 'Not set'}
                          </span>
                                                </div>

                                                <div
                                                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 timeline-preview-item">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                        <span className="text-sm font-medium text-gray-700">Campaign Live Date</span>
                                                    </div>
                                                    <span className="text-sm text-gray-600">
                            {campaignData.campaign_live_date ? new Date(campaignData.campaign_live_date).toLocaleDateString() : 'Not set'}
                          </span>
                                                </div>

                                                <div
                                                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 timeline-preview-item">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                                        <span className="text-sm font-medium text-gray-700">Influencers Needed</span>
                                                    </div>
                                                    <span
                                                        className="text-sm text-gray-600">{campaignData.target_influencers}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Review & Launch */}
                        {currentStep === 4 && (
                            <div className="space-y-8 campaign-form-step">
                                {/* Header Section */}
                                <div className="text-center mb-8">
                                    <div
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full mb-4">
                                        <HiCheck className="w-4 h-4 text-green-600"/>
                                        <span className="text-sm font-medium text-green-700">Final Review</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Review Your Campaign</h3>
                                    <p className="text-gray-600 max-w-2xl mx-auto">Please review all the details below
                                        before launching your campaign. Once created, you'll be able to start inviting
                                        influencers.</p>
                                </div>

                                {/* Campaign Overview */}
                                <div
                                    className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200 mb-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div
                                            className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                                            <HiSparkles className="w-5 h-5 text-white"/>
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-gray-900">{campaignData.title || 'Untitled Campaign'}</h4>
                                            <p className="text-sm text-gray-600">Campaign Overview</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <HiUsers className="w-4 h-4 text-blue-500"/>
                                                <span
                                                    className="text-sm font-medium text-gray-700">Target Influencers</span>
                                            </div>
                                            <p className="text-2xl font-bold text-gray-900">{campaignData.target_influencers}</p>
                                        </div>

                                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <HiCalendarDays className="w-4 h-4 text-green-500"/>
                                                <span className="text-sm font-medium text-gray-700">Live Date</span>
                                            </div>
                                            <p className="text-lg font-semibold text-gray-900">
                                                {campaignData.campaign_live_date ? new Date(campaignData.campaign_live_date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                }) : 'Not set'}
                                            </p>
                                        </div>

                                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <HiCurrencyDollar className="w-4 h-4 text-purple-500"/>
                                                <span className="text-sm font-medium text-gray-700">Deal Type</span>
                                            </div>
                                            <p className="text-lg font-semibold text-gray-900">
                                                {campaignData.deal_type === 'cash' && 'Cash'}
                                                {campaignData.deal_type === 'product' && 'Barter'}
                                                {campaignData.deal_type === 'hybrid' && 'Cash + Barter'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Review Sections */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Campaign Details */}
                                    <div className="space-y-6">
                                        <div
                                            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                                                <h4 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                                                    <HiLightBulb className="w-5 h-5"/>
                                                    Campaign Details
                                                </h4>
                                            </div>
                                            <div className="p-6 space-y-4">
                                                <div
                                                    className="flex items-start justify-between py-3 border-b border-gray-100 last:border-b-0">
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-700">Campaign Title</span>
                                                        <p className="text-sm text-gray-500 mt-1">The name of your
                                                            campaign</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-semibold text-gray-900">{campaignData.title || 'Not set'}</p>
                                                    </div>
                                                </div>

                                                <div
                                                    className="flex items-start justify-between py-3 border-b border-gray-100 last:border-b-0">
                                                    <div>
                                                        <span
                                                            className="text-sm font-medium text-gray-700">Platforms</span>
                                                        <p className="text-sm text-gray-500 mt-1">Where content will be
                                                            published</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex gap-2 flex-wrap justify-end">
                                                            {campaignData.platforms_required.map(pid => {
                                                                const meta = platforms.find(p => p.id === pid);
                                                                if (!meta) return null;
                                                                const Icon = meta.icon as any;
                                                                return (
                                                                    <span key={pid}
                                                                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${meta.border} ${meta.bg}`}>
                                    <Icon className={`w-3.5 h-3.5 ${meta.color}`}/>
                                    <span>{meta.name}</span>
                                  </span>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div
                                                    className="flex items-start justify-between py-3 border-b border-gray-100 last:border-b-0">
                                                    <div>
                                                        <span
                                                            className="text-sm font-medium text-gray-700">Industry</span>
                                                        <p className="text-sm text-gray-500 mt-1">Primary industry for
                                                            this campaign</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex gap-2 flex-wrap justify-end">
                                                            {(selectedIndustries.length ? selectedIndustries : [campaignData.industry]).filter(Boolean).map((key) => (
                                                                <span key={key}
                                                                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                  {industries.find(i => i.key === key)?.name || key}
                                </span>
                                                            ))}
                                                            {(!selectedIndustries.length && !campaignData.industry) && (
                                                                <span
                                                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">Not selected</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timeline Details */}
                                        <div
                                            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                                                <h4 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                                                    <HiClock className="w-5 h-5"/>
                                                    Timeline
                                                </h4>
                                            </div>
                                            <div className="p-6 space-y-4">
                                                <div
                                                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                        <span className="text-sm font-medium text-gray-700">Application Deadline</span>
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-900">
                            {campaignData.application_deadline ? new Date(campaignData.application_deadline).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            }) : 'Not set'}
                          </span>
                                                </div>

                                                <div
                                                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                        <span className="text-sm font-medium text-gray-700">Campaign Live Date</span>
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-900">
                            {campaignData.campaign_live_date ? new Date(campaignData.campaign_live_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            }) : 'Not set'}
                          </span>
                                                </div>

                                                <div className="flex items-center justify-between py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                                        <span className="text-sm font-medium text-gray-700">Execution Mode</span>
                                                    </div>
                                                    <span
                                                        className="text-sm font-semibold text-gray-900 capitalize">{campaignData.execution_mode}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Next Steps & Actions */}
                                    <div className="space-y-6">
                                        {/* Quick Actions */}
                                        <div
                                            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                                                <h4 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
                                                    <HiArrowRight className="w-5 h-5"/>
                                                    Next Steps
                                                </h4>
                                            </div>
                                            <div className="p-6 space-y-4">
                                                <div
                                                    className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                                                    <h5 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                                        <HiUsers className="w-4 h-4"/>
                                                        Find Influencers
                                                    </h5>
                                                    <p className="text-sm text-blue-700 mb-3">
                                                        After creating your campaign, you can:
                                                    </p>
                                                    <ul className="text-sm text-blue-700 space-y-2">
                                                        <li className="flex items-start gap-2">
                                                            <div
                                                                className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                                            <span>Search and filter influencers by category, platform, and engagement</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <div
                                                                className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                                            <span>Send personalized invitations to selected creators</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <div
                                                                className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                                            <span>Track applications and manage collaborations</span>
                                                        </li>
                                                    </ul>
                                                </div>

                                                <div className="flex gap-3">
                                                    <Button
                                                        onClick={() => window.open('/brand/influencers', '_blank', 'noopener,noreferrer')}
                                                        variant="outline"
                                                        className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                                                    >
                                                        <HiUsers className="w-4 h-4 mr-2"/>
                                                        Browse Influencers
                                                    </Button>
                                                    <Button
                                                        onClick={() => window.open('/brand/campaigns', '_blank', 'noopener,noreferrer')}
                                                        variant="outline"
                                                        className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
                                                    >
                                                        <HiEye className="w-4 h-4 mr-2"/>
                                                        View Campaigns
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Campaign Stats Preview (Highlighted) */}
                                        <div
                                            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-gray-200">
                                                <h4 className="text-lg font-semibold text-orange-900 flex items-center gap-2">
                                                    <HiCog6Tooth className="w-5 h-5"/>
                                                    Campaign Settings
                                                </h4>
                                            </div>
                                            <div className="p-6 space-y-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {/* Deal Type - gradient highlight */}
                                                    <div className={`rounded-lg p-4 text-white bg-gradient-to-br ${
                                                        campaignData.deal_type === 'cash'
                                                            ? 'from-green-500 to-emerald-600'
                                                            : campaignData.deal_type === 'product'
                                                                ? 'from-amber-500 to-orange-600'
                                                                : 'from-indigo-500 to-pink-600'
                                                    }`}>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <HiCurrencyDollar className="w-4 h-4"/>
                                                                <p className="text-xs opacity-90">Deal Type</p>
                                                            </div>
                                                        </div>
                                                        <p className="mt-2 text-lg font-semibold">
                                                            {campaignData.deal_type === 'cash' && 'Cash'}
                                                            {campaignData.deal_type === 'product' && 'Barter'}
                                                            {campaignData.deal_type === 'hybrid' && 'Cash + Barter'}
                                                        </p>
                                                    </div>

                                                    {/* Influencers - bold number */}
                                                    <div
                                                        className="rounded-lg p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <HiUsers className="w-4 h-4"/>
                                                                <p className="text-xs opacity-90">Influencers</p>
                                                            </div>
                                                        </div>
                                                        <p className="mt-2 text-2xl font-bold">{campaignData.target_influencers}</p>
                                                    </div>
                                                </div>

                                                {/* Content Requirements - emphasized */}
                                                <div className="rounded-lg p-4 border border-amber-200 bg-amber-50">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-amber-900">
                                                            <HiDocumentText className="w-4 h-4"/>
                                                            <p className="text-sm font-medium">Content Requirements</p>
                                                        </div>
                                                    </div>
                                                    <p className="mt-2 text-sm text-amber-900/90">
                                                        {campaignData.content_requirements || 'No specific requirements set'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Launch Warning */}
                                <div
                                    className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div
                                            className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <HiExclamationTriangle className="w-4 h-4 text-amber-600"/>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-amber-900 mb-2">Ready to Launch Your
                                                Campaign?</h4>
                                            <p className="text-sm text-amber-700 mb-3">
                                                Please review all the details above carefully. Once you create this
                                                campaign, it will be visible to influencers and you can start the
                                                invitation process.
                                                Make sure all information is accurate before proceeding.
                                            </p>
                                        </div>
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
                                <HiChevronLeft className="w-4 h-4"/>
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
                                    <HiChevronRight className="w-4 h-4"/>
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <InlineLoader className="mr-2"/>
                                            {isEditing ? 'Updating Campaign...' : 'Creating Campaign...'}
                                        </>
                                    ) : (
                                        <>
                                            <HiCheck className="w-4 h-4"/>
                                            {isEditing ? 'Update Campaign' : 'Create Campaign'}
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