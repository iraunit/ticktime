import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '@/test/utils'
import { DashboardStats } from '../dashboard-stats'

vi.mock('@/hooks/use-dashboard', () => ({
  useDashboard: () => ({
    stats: {
      total_invitations: 25,
      active_deals: 3,
      completed_deals: 12,
      total_earnings: 5600.00,
      pending_payments: 800.00,
      this_month_earnings: 1200.00,
      average_deal_value: 466.67,
      completion_rate: 85.7
    },
    isLoading: false,
    error: null
  })
}))

describe('DashboardStats', () => {
  it('renders all stat cards', () => {
    render(<DashboardStats />)
    
    expect(screen.getByText('Total Invitations')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    
    expect(screen.getByText('Active Deals')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    
    expect(screen.getByText('Completed Deals')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    
    expect(screen.getByText('Total Earnings')).toBeInTheDocument()
    expect(screen.getByText('$5,600.00')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    vi.mocked(require('@/hooks/use-dashboard').useDashboard).mockReturnValue({
      stats: null,
      isLoading: true,
      error: null
    })

    render(<DashboardStats />)
    
    // Should show skeleton loading states
    expect(screen.getAllByTestId('stat-skeleton')).toHaveLength(4)
  })

  it('shows error state', () => {
    vi.mocked(require('@/hooks/use-dashboard').useDashboard).mockReturnValue({
      stats: null,
      isLoading: false,
      error: 'Failed to load stats'
    })

    render(<DashboardStats />)
    
    expect(screen.getByText(/failed to load stats/i)).toBeInTheDocument()
  })

  it('formats currency values correctly', () => {
    render(<DashboardStats />)
    
    expect(screen.getByText('$5,600.00')).toBeInTheDocument()
    expect(screen.getByText('$800.00')).toBeInTheDocument()
    expect(screen.getByText('$1,200.00')).toBeInTheDocument()
  })
})