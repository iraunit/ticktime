import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, createMockDeal } from '@/test/utils'
import { DealCard } from '../deal-card'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

describe('DealCard', () => {
  const mockDeal = createMockDeal()

  it('renders deal information correctly', () => {
    render(<DealCard deal={mockDeal} />)
    
    expect(screen.getByText('Test Campaign')).toBeInTheDocument()
    expect(screen.getByText('TestBrand')).toBeInTheDocument()
    expect(screen.getByText('$500.00')).toBeInTheDocument()
    expect(screen.getByText('Paid')).toBeInTheDocument()
    expect(screen.getByText('Invited')).toBeInTheDocument()
  })

  it('shows correct status badge color', () => {
    const acceptedDeal = createMockDeal({ status: 'accepted' })
    render(<DealCard deal={acceptedDeal} />)
    
    const statusBadge = screen.getByText('Accepted')
    expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('navigates to deal details on click', async () => {
    const user = userEvent.setup()
    render(<DealCard deal={mockDeal} />)
    
    await user.click(screen.getByRole('article'))
    
    expect(mockPush).toHaveBeenCalledWith('/deals/1')
  })

  it('shows barter deal correctly', () => {
    const barterDeal = createMockDeal({
      campaign: {
        ...mockDeal.campaign,
        deal_type: 'barter',
        cash_amount: 0,
        product_value: 300
      }
    })
    
    render(<DealCard deal={barterDeal} />)
    
    expect(screen.getByText('Barter')).toBeInTheDocument()
    expect(screen.getByText('$300.00')).toBeInTheDocument()
  })

  it('shows hybrid deal correctly', () => {
    const hybridDeal = createMockDeal({
      campaign: {
        ...mockDeal.campaign,
        deal_type: 'hybrid',
        cash_amount: 200,
        product_value: 100
      }
    })
    
    render(<DealCard deal={hybridDeal} />)
    
    expect(screen.getByText('Hybrid')).toBeInTheDocument()
    expect(screen.getByText('$300.00')).toBeInTheDocument()
  })

  it('shows deadline warning for urgent deals', () => {
    const urgentDeal = createMockDeal({
      campaign: {
        ...mockDeal.campaign,
        application_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 1 day from now
      }
    })
    
    render(<DealCard deal={urgentDeal} />)
    
    expect(screen.getByText(/1 day left/i)).toBeInTheDocument()
  })
})