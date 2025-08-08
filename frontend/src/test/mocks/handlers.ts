import { http, HttpResponse } from 'msw'
import { mockUser, mockDeals, mockDashboardStats, mockSocialAccounts } from './data'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE}/auth/login/`, () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      user: mockUser
    })
  }),

  http.post(`${API_BASE}/auth/signup/`, () => {
    return HttpResponse.json({
      message: 'User created successfully. Please verify your email.',
      user: mockUser
    }, { status: 201 })
  }),

  http.post(`${API_BASE}/auth/logout/`, () => {
    return HttpResponse.json({ message: 'Logged out successfully' })
  }),

  http.get(`${API_BASE}/auth/profile/`, () => {
    return HttpResponse.json(mockUser)
  }),

  http.put(`${API_BASE}/auth/profile/`, () => {
    return HttpResponse.json(mockUser)
  }),

  // Dashboard endpoints
  http.get(`${API_BASE}/dashboard/stats/`, () => {
    return HttpResponse.json(mockDashboardStats)
  }),

  http.get(`${API_BASE}/dashboard/recent-deals/`, () => {
    return HttpResponse.json({
      results: mockDeals.slice(0, 5),
      count: 5
    })
  }),

  http.get(`${API_BASE}/dashboard/notifications/`, () => {
    return HttpResponse.json({
      results: [
        {
          id: 1,
          title: 'New Deal Invitation',
          message: 'You have a new collaboration opportunity from TechBrand',
          type: 'deal_invitation',
          read: false,
          created_at: new Date().toISOString()
        }
      ],
      count: 1
    })
  }),

  // Deals endpoints
  http.get(`${API_BASE}/deals/`, () => {
    return HttpResponse.json({
      results: mockDeals,
      count: mockDeals.length
    })
  }),

  http.get(`${API_BASE}/deals/:id/`, ({ params }) => {
    const deal = mockDeals.find(d => d.id === parseInt(params.id as string))
    if (!deal) {
      return HttpResponse.json({ error: 'Deal not found' }, { status: 404 })
    }
    return HttpResponse.json(deal)
  }),

  http.post(`${API_BASE}/deals/:id/accept/`, ({ params }) => {
    return HttpResponse.json({
      message: 'Deal accepted successfully',
      deal_id: params.id
    })
  }),

  http.post(`${API_BASE}/deals/:id/reject/`, ({ params }) => {
    return HttpResponse.json({
      message: 'Deal rejected successfully',
      deal_id: params.id
    })
  }),

  // Profile endpoints
  http.get(`${API_BASE}/profile/social-accounts/`, () => {
    return HttpResponse.json({
      results: mockSocialAccounts,
      count: mockSocialAccounts.length
    })
  }),

  http.post(`${API_BASE}/profile/social-accounts/`, () => {
    return HttpResponse.json({
      id: Date.now(),
      platform: 'instagram',
      handle: 'newaccount',
      followers_count: 1000,
      engagement_rate: 3.5,
      verified: false
    }, { status: 201 })
  }),

  // Error handlers for testing error states
  http.get(`${API_BASE}/error/500`, () => {
    return HttpResponse.json({ error: 'Internal server error' }, { status: 500 })
  }),

  http.get(`${API_BASE}/error/401`, () => {
    return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }),
]