import { User, Deal, DashboardStats, SocialMediaAccount } from '@/types'

export const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  profile: {
    id: 1,
    phone_number: '+1234567890',
    username: 'testuser',
    industry: 'tech_gaming',
    bio: 'Test bio',
    profile_image: null,
    address: '123 Test St',
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
}

export const mockSocialAccounts: SocialMediaAccount[] = [
  {
    id: 1,
    platform: 'instagram',
    handle: 'testuser',
    profile_url: 'https://instagram.com/testuser',
    followers_count: 10000,
    following_count: 500,
    posts_count: 100,
    engagement_rate: 4.5,
    average_likes: 450,
    average_comments: 25,
    average_shares: 10,
    verified: true,
    is_active: true
  },
  {
    id: 2,
    platform: 'youtube',
    handle: 'testuser',
    profile_url: 'https://youtube.com/@testuser',
    followers_count: 5000,
    following_count: 100,
    posts_count: 50,
    engagement_rate: 6.2,
    average_likes: 310,
    average_comments: 45,
    average_shares: 15,
    verified: false,
    is_active: true
  }
]

export const mockDeals: Deal[] = [
  {
    id: 1,
    campaign: {
      id: 1,
      title: 'Summer Tech Campaign',
      description: 'Promote our latest tech products',
      brand: {
        id: 1,
        name: 'TechBrand',
        logo: '/api/placeholder/100/100',
        rating: 4.5,
        total_collaborations: 150
      },
      deal_type: 'paid',
      cash_amount: 500.00,
      product_value: 200.00,
      content_requirements: {
        platforms: ['instagram', 'youtube'],
        content_types: ['post', 'story'],
        deliverables: 2
      },
      application_deadline: '2024-02-15T23:59:59Z',
      campaign_start_date: '2024-02-20T00:00:00Z',
      campaign_end_date: '2024-03-20T23:59:59Z'
    },
    status: 'invited',
    invited_at: '2024-01-15T10:00:00Z',
    responded_at: null,
    completed_at: null
  },
  {
    id: 2,
    campaign: {
      id: 2,
      title: 'Fashion Week Collaboration',
      description: 'Showcase our new fashion line',
      brand: {
        id: 2,
        name: 'FashionBrand',
        logo: '/api/placeholder/100/100',
        rating: 4.8,
        total_collaborations: 200
      },
      deal_type: 'barter',
      cash_amount: 0.00,
      product_value: 800.00,
      content_requirements: {
        platforms: ['instagram', 'tiktok'],
        content_types: ['post', 'reel'],
        deliverables: 3
      },
      application_deadline: '2024-02-10T23:59:59Z',
      campaign_start_date: '2024-02-15T00:00:00Z',
      campaign_end_date: '2024-03-15T23:59:59Z'
    },
    status: 'accepted',
    invited_at: '2024-01-10T10:00:00Z',
    responded_at: '2024-01-12T14:30:00Z',
    completed_at: null
  }
]

export const mockDashboardStats: DashboardStats = {
  total_invitations: 25,
  active_deals: 3,
  completed_deals: 12,
  total_earnings: 5600.00,
  pending_payments: 800.00,
  this_month_earnings: 1200.00,
  average_deal_value: 466.67,
  completion_rate: 85.7
}