// User and Profile types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_verified: boolean;
}

export interface InfluencerProfile {
  id: number;
  user: User;
  phone_number: string;
  username: string;
  industry: string;
  bio: string;
  profile_image?: string;
  address: string;
  aadhar_number?: string;
  aadhar_document?: string;
  is_verified: boolean;
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
  rating?: number;
  total_collaborations?: number;
}

export interface Campaign {
  id: number;
  brand: Brand;
  title: string;
  description: string;
  deal_type: 'paid' | 'barter' | 'hybrid';
  cash_amount: number;
  product_value: number;
  content_requirements: {
    platforms: string[];
    content_types: string[];
    post_count: number;
    story_count?: number;
    reel_count?: number;
    special_instructions?: string;
  };
  application_deadline: string;
  campaign_start_date: string;
  campaign_end_date: string;
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
}

export type DealStatus = 
  | 'invited'
  | 'pending'
  | 'accepted'
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
  deal: number;
  last_message?: Message;
  unread_count: number;
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

export interface PerformanceMetrics {
  total_collaborations: number;
  total_brands: number;
  average_deal_value: number;
  collaboration_completion_rate: number;
  average_rating: number;
  top_performing_platform: string;
  growth_metrics: {
    deals_growth: number;
    earnings_growth: number;
    follower_growth: number;
  };
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
  confirm_password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  username: string;
  industry: string;
}

export interface ProfileUpdateForm {
  first_name: string;
  last_name: string;
  phone_number: string;
  bio: string;
  address: string;
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