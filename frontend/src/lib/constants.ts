// Industry options for signup
export const INDUSTRY_OPTIONS = [
  { value: 'fashion_beauty', label: 'Fashion & Beauty' },
  { value: 'food_lifestyle', label: 'Food & Lifestyle' },
  { value: 'tech_gaming', label: 'Tech & Gaming' },
  { value: 'fitness_health', label: 'Fitness & Health' },
  { value: 'travel', label: 'Travel' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'education', label: 'Education' },
  { value: 'business_finance', label: 'Business & Finance' },
  { value: 'other', label: 'Other' },
];

// Social media platform options
export const SOCIAL_PLATFORMS = [
  { value: 'instagram', label: 'Instagram', icon: '📷' },
  { value: 'youtube', label: 'YouTube', icon: '📺' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'twitter', label: 'Twitter', icon: '🐦' },
  { value: 'facebook', label: 'Facebook', icon: '👥' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'snapchat', label: 'Snapchat', icon: '👻' },
  { value: 'pinterest', label: 'Pinterest', icon: '📌' },
];

// Deal status options with colors
export const DEAL_STATUS_CONFIG = {
  invited: { label: 'Invited', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
  pending: { label: 'Pending', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  accepted: { label: 'Accepted', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  active: { label: 'Active', color: 'indigo', bgColor: 'bg-indigo-100', textColor: 'text-indigo-800' },
  content_submitted: { label: 'Content Submitted', color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
  under_review: { label: 'Under Review', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
  revision_requested: { label: 'Revision Requested', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
  approved: { label: 'Approved', color: 'emerald', bgColor: 'bg-emerald-100', textColor: 'text-emerald-800' },
  completed: { label: 'Completed', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
  rejected: { label: 'Rejected', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
  cancelled: { label: 'Cancelled', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
  dispute: { label: 'Dispute', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
};

// Deal types
export const DEAL_TYPES = [
  { value: 'paid', label: 'Paid', description: 'Cash payment for content creation' },
  { value: 'barter', label: 'Barter', description: 'Product exchange for content creation' },
  { value: 'hybrid', label: 'Hybrid', description: 'Combination of cash and products' },
];

// Content types
export const CONTENT_TYPES = [
  { value: 'post', label: 'Post', description: 'Regular social media post' },
  { value: 'story', label: 'Story', description: 'Temporary story content' },
  { value: 'reel', label: 'Reel/Video', description: 'Short-form video content' },
  { value: 'live', label: 'Live Stream', description: 'Live streaming content' },
  { value: 'blog', label: 'Blog Post', description: 'Written blog content' },
];

// File upload constraints
export const FILE_UPLOAD_CONFIG = {
  maxSize: 50 * 1024 * 1024, // 50MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  allowedVideoTypes: ['video/mp4', 'video/mov', 'video/avi', 'video/webm'],
  allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

// Notification types
export const NOTIFICATION_TYPES = {
  deal_invitation: { label: 'Deal Invitation', icon: '💼', color: 'blue' },
  deal_update: { label: 'Deal Update', icon: '📝', color: 'green' },
  message: { label: 'New Message', icon: '💬', color: 'purple' },
  payment: { label: 'Payment Update', icon: '💰', color: 'emerald' },
  system: { label: 'System Notification', icon: '⚙️', color: 'gray' },
};

// API endpoints (for reference)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login/',
    SIGNUP: '/auth/signup/',
    LOGOUT: '/auth/logout/',
    GOOGLE: '/auth/google/',
    FORGOT_PASSWORD: '/auth/forgot-password/',
    RESET_PASSWORD: '/auth/reset-password/',
    VERIFY_EMAIL: '/auth/verify-email/',
    REFRESH_TOKEN: '/auth/token/refresh/',
  },
  PROFILE: {
    GET: '/influencers/profile/',
    UPDATE: '/influencers/profile/',
    UPLOAD_DOCUMENT: '/influencers/profile/upload-document/',
    SOCIAL_ACCOUNTS: '/influencers/profile/social-accounts/',
  },
  DEALS: {
    LIST: '/deals/',
    DETAIL: '/deals/:id/',
    ACCEPT: '/deals/:id/accept/',
    REJECT: '/deals/:id/reject/',
    SUBMIT_CONTENT: '/deals/:id/submit-content/',
    MESSAGES: '/deals/:id/messages/',
  },
  DASHBOARD: {
    STATS: '/dashboard/stats/',
    RECENT_DEALS: '/dashboard/recent-deals/',
    NOTIFICATIONS: '/dashboard/notifications/',
  },
  ANALYTICS: {
    COLLABORATIONS: '/analytics/collaborations/',
    EARNINGS: '/analytics/earnings/',
    PERFORMANCE: '/analytics/performance/',
    RATE_BRAND: '/analytics/rate-brand/',
  },
};

// Local storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
};

// Query keys for React Query
export const QUERY_KEYS = {
  USER: ['user'],
  PROFILE: ['profile'],
  SOCIAL_ACCOUNTS: ['socialAccounts'],
  DEALS: ['deals'],
  DEAL: ['deal'],
  DEAL_MESSAGES: ['dealMessages'],
  DASHBOARD_STATS: ['dashboard', 'stats'],
  DASHBOARD_RECENT_DEALS: ['dashboard', 'recentDeals'],
  NOTIFICATIONS: ['notifications'],
  ANALYTICS_COLLABORATIONS: ['analytics', 'collaborations'],
  ANALYTICS_EARNINGS: ['analytics', 'earnings'],
  ANALYTICS_PERFORMANCE: ['analytics', 'performance'],
};