// User and Profile types
export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    is_verified: boolean;
}

export interface UserProfile {
    id: number;
    user: number;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    country_code: string;
    phone_number: string;
    phone_verified: boolean;
    email_verified: boolean;
    country?: string;
    state?: string;
    city?: string;
    zipcode?: string;
    address_line1?: string;
    address_line2?: string;
    profile_image?: string;
    created_at: string;
    updated_at: string;
}

export interface InfluencerProfile {
    id: number;
    user: User;
    user_profile: UserProfile;
    username: string;
    industry: string;
    categories?: string[];
    bio: string;
    aadhar_number?: string;
    aadhar_document?: string;
    is_verified: boolean;
    collaboration_types?: ('cash' | 'barter' | 'hybrid')[];
    minimum_collaboration_amount?: number;
    email_verified?: boolean;
    phone_verified?: boolean;
    created_at: string;
    updated_at: string;
}

// Social Media types
export interface SocialMediaAccount {
    id: number;
    platform: string;
    handle: string;
    profile_url?: string;
    followers_count: number;
    following_count?: number;
    posts_count?: number;
    engagement_rate: number;
    average_likes?: number;
    average_comments?: number;
    average_shares?: number;
    verified: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// Deal and Campaign types
export interface Brand {
    id: number;
    name: string;
    logo?: string;
    description: string;
    website?: string;
    industry: string;
    contact_email: string;
    rating?: number;
    total_collaborations?: number;
}

export interface BrandUser {
    id: number;
    user: User;
    user_profile: UserProfile;
    brand: Brand;
    role: 'owner' | 'admin' | 'manager' | 'editor' | 'viewer';
    is_active: boolean;
    joined_at?: string;
    last_activity: string;
}

export interface Product {
    name: string;
    description?: string;
    value: number;
    quantity: number;
    variants?: any;
}

export interface Campaign {
    id: number;
    brand: Brand;
    title: string;
    description: string;
    objectives?: string;
    deal_type: 'cash' | 'product' | 'hybrid';
    deal_type_display?: string;
    cash_amount: string | number;
    product_value?: number;
    products?: Product[];
    total_value: number;
    content_requirements: string;
    platforms_required?: string[];
    special_instructions?: string;
    application_deadline: string;
    product_delivery_date?: string;
    submission_deadline?: string;
    barter_submission_after_days?: number;
    campaign_live_date?: string;
    application_deadline_visible_to_influencers?: boolean;
    payment_schedule?: string;
    shipping_details?: string;
    custom_terms?: string;
    allows_negotiation?: boolean;
    target_influencers?: number;
    industry?: string;
    industry_key?: string;
    industry_name?: string;
    execution_mode?: string;
    is_expired?: boolean;
    days_until_deadline?: number;
    created_at: string;
}

export interface Deal {
    id: number;
    campaign: Campaign;
    influencer: number;
    status: DealStatus;
    invited_at: string;
    responded_at?: string;
    completed_at?: string;
    rejection_reason?: string;
    total_value: number;
    payment_status?: 'pending' | 'processing' | 'completed' | 'failed';
    // Rating fields
    brand_rating?: number;
    brand_review?: string;
    influencer_rating?: number;
    influencer_review?: string;
    // Barter deal specific fields
    shipping_address?: {
        address_line1: string;
        address_line2?: string;
        city: string;
        state: string;
        country: string;
        zipcode: string;
        country_code?: string;
        phone_number?: string;
        full_phone_number?: string;
    };
    tracking_number?: string;
    tracking_url?: string;
    shipped_at?: string;
    delivered_at?: string;
    address_requested_at?: string;
    address_provided_at?: string;
    shortlisted_at?: string;
    notes?: string;
}

export type DealStatus =
    | 'invited'
    | 'pending'
    | 'accepted'
    | 'shortlisted'
    | 'address_requested'
    | 'address_provided'
    | 'product_shipped'
    | 'product_delivered'
    | 'active'
    | 'content_submitted'
    | 'under_review'
    | 'revision_requested'
    | 'approved'
    | 'completed'
    | 'rejected'
    | 'cancelled'
    | 'dispute';

// Content Submission types
export interface ContentSubmission {
    id: number;
    deal: number;
    platform: string;
    content_type: string;
    file_url?: string;
    file_upload?: string | null;
    caption?: string;
    submitted_at: string;
    approved?: boolean;
    feedback?: string;
    revision_count: number;
}

// Messaging types
export interface Message {
    id: number;
    conversation: number;
    sender: 'influencer' | 'brand';
    message: string;
    file_url?: string;
    file_name?: string;
    sent_at: string;
    read_at?: string;
}

export interface Conversation {
    id: number;
    deal: {
        id: number;
        status: string;
        campaign_title?: string;
    } | number;
    deal_title?: string;
    brand_name?: string;
    influencer_name?: string;
    influencer_username?: string;
    influencer_avatar?: string;
    influencer_id?: number;
    last_message?: Message;
    unread_count: number;
    messages_count?: number;
    created_at: string;
    updated_at: string;
}

// Dashboard types
export interface DashboardStats {
    total_invitations: number;
    active_deals: number;
    completed_deals: number;
    total_earnings: number;
    pending_payments: number;
    this_month_earnings: number;
    collaboration_rate: number;
    average_deal_value: number;
}

export interface Notification {
    id: number;
    type: 'deal_invitation' | 'deal_update' | 'message' | 'payment' | 'system';
    title: string;
    message: string;
    read: boolean;
    created_at: string;
    action_url?: string;
}

// Analytics types
export interface CollaborationHistory {
    id: number;
    brand: Brand;
    campaign_title: string;
    deal_type: string;
    total_value: number;
    platforms: string[];
    status: DealStatus;
    completed_at?: string;
    rating?: number;
    review?: string;
}

export interface EarningsData {
    total_earnings: number;
    monthly_earnings: Array<{
        month: string;
        amount: number;
    }>;
    earnings_by_platform: Array<{
        platform: string;
        amount: number;
        percentage: number;
    }>;
    top_brands: Array<{
        brand: Brand;
        total_amount: number;
        collaboration_count: number;
    }>;
}


// Form types
export interface LoginForm {
    email: string;
    password: string;
    remember_me?: boolean;
}

export interface SignupForm {
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    username: string;
    industry: string;
}

export interface ProfileUpdateForm {
    first_name: string;
    last_name: string;
    gender?: string;
    country_code: string;
    phone_number: string;
    country?: string;
    state?: string;
    city?: string;
    zipcode?: string;
    address_line1?: string;
    address_line2?: string;
    bio?: string;
    industry: string;
    categories?: string[];
    collaboration_types?: ('cash' | 'barter' | 'hybrid')[];
    minimum_collaboration_amount?: number;
    profile_image?: File;
}

export interface SocialAccountForm {
    platform: string;
    handle: string;
    profile_url?: string;
    followers_count: number;
    engagement_rate: number;
}

// API Response types
export interface ApiResponse<T> {
    status: 'success' | 'error';
    data?: T;
    message?: string;
    errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
    count: number;
    next?: string;
    previous?: string;
    results: T[];
}