import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorProvider } from '@/contexts/error-context'
import { LoadingProvider } from '@/contexts/loading-context'

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorProvider>
        <LoadingProvider>
          {children}
        </LoadingProvider>
      </ErrorProvider>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Helper function to create a test query client
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
})

// Mock data generators
export const createMockUser = (overrides = {}) => ({
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
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides
  }
})

export const createMockDeal = (overrides = {}) => ({
  id: 1,
  campaign: {
    id: 1,
    title: 'Test Campaign',
    description: 'Test description',
    brand: {
      id: 1,
      name: 'TestBrand',
      logo: '/test-logo.png',
      rating: 4.5,
      total_collaborations: 100
    },
    deal_type: 'paid',
    cash_amount: 500.00,
    product_value: 0.00,
    content_requirements: {
      platforms: ['instagram'],
      content_types: ['post'],
      deliverables: 1
    },
    application_deadline: '2024-12-31T23:59:59Z',
    campaign_start_date: '2024-01-01T00:00:00Z',
    campaign_end_date: '2024-01-31T23:59:59Z'
  },
  status: 'invited',
  invited_at: '2024-01-01T10:00:00Z',
  responded_at: null,
  completed_at: null,
  ...overrides
})