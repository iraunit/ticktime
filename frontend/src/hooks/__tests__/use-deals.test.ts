import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDeals, useDeal, useDealActions } from '../use-deals'
import * as api from '@/lib/api'
import { createMockDeal } from '@/test/utils'

vi.mock('@/lib/api')

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useDeals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch deals successfully', async () => {
    const mockDeals = [createMockDeal(), createMockDeal({ id: 2 })]
    vi.mocked(api.getDeals).mockResolvedValue({
      results: mockDeals,
      count: 2
    })
    
    const { result } = renderHook(() => useDeals(), {
      wrapper: createWrapper()
    })
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    
    expect(result.current.data?.results).toEqual(mockDeals)
    expect(api.getDeals).toHaveBeenCalledWith({})
  })

  it('should fetch deals with filters', async () => {
    const mockDeals = [createMockDeal()]
    vi.mocked(api.getDeals).mockResolvedValue({
      results: mockDeals,
      count: 1
    })
    
    const filters = { status: 'invited', deal_type: 'paid' }
    
    const { result } = renderHook(() => useDeals(filters), {
      wrapper: createWrapper()
    })
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    
    expect(api.getDeals).toHaveBeenCalledWith(filters)
  })
})

describe('useDeal', () => {
  it('should fetch single deal successfully', async () => {
    const mockDeal = createMockDeal()
    vi.mocked(api.getDeal).mockResolvedValue(mockDeal)
    
    const { result } = renderHook(() => useDeal(1), {
      wrapper: createWrapper()
    })
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    
    expect(result.current.data).toEqual(mockDeal)
    expect(api.getDeal).toHaveBeenCalledWith(1)
  })
})

describe('useDealActions', () => {
  it('should accept deal successfully', async () => {
    vi.mocked(api.acceptDeal).mockResolvedValue({
      message: 'Deal accepted',
      deal_id: 1
    })
    
    const { result } = renderHook(() => useDealActions(), {
      wrapper: createWrapper()
    })
    
    await waitFor(async () => {
      const response = await result.current.acceptDeal.mutateAsync(1)
      expect(response.message).toBe('Deal accepted')
    })
    
    expect(api.acceptDeal).toHaveBeenCalledWith(1)
  })

  it('should reject deal successfully', async () => {
    vi.mocked(api.rejectDeal).mockResolvedValue({
      message: 'Deal rejected',
      deal_id: 1
    })
    
    const { result } = renderHook(() => useDealActions(), {
      wrapper: createWrapper()
    })
    
    const rejectData = { reason: 'Not interested' }
    
    await waitFor(async () => {
      const response = await result.current.rejectDeal.mutateAsync({
        dealId: 1,
        data: rejectData
      })
      expect(response.message).toBe('Deal rejected')
    })
    
    expect(api.rejectDeal).toHaveBeenCalledWith(1, rejectData)
  })
})