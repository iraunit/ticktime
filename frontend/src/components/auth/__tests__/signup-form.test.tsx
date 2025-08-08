import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@/test/utils'
import { SignupForm } from '../signup-form'

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    signup: vi.fn().mockResolvedValue({ success: true }),
    isLoading: false,
    error: null
  })
}))

describe('SignupForm', () => {
  it('renders all form fields', () => {
    render(<SignupForm />)
    
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/industry/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('validates password confirmation', async () => {
    const user = userEvent.setup()
    render(<SignupForm />)
    
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'different')
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  it('validates phone number format', async () => {
    const user = userEvent.setup()
    render(<SignupForm />)
    
    await user.type(screen.getByLabelText(/phone number/i), '123')
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid phone number/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const mockSignup = vi.fn().mockResolvedValue({ success: true })
    vi.mocked(require('@/hooks/use-auth').useAuth).mockReturnValue({
      signup: mockSignup,
      isLoading: false,
      error: null
    })

    const user = userEvent.setup()
    render(<SignupForm />)
    
    // Fill out the form
    await user.type(screen.getByLabelText(/first name/i), 'John')
    await user.type(screen.getByLabelText(/last name/i), 'Doe')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone number/i), '+1234567890')
    await user.type(screen.getByLabelText(/username/i), 'johndoe')
    await user.selectOptions(screen.getByLabelText(/industry/i), 'tech_gaming')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    
    await user.click(screen.getByRole('button', { name: /create account/i }))
    
    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone_number: '+1234567890',
        username: 'johndoe',
        industry: 'tech_gaming',
        password: 'password123',
        password_confirm: 'password123'
      })
    })
  })
})