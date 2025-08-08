import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '../use-auth'
import * as api from '@/lib/api'

// Mock the API
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

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should login successfully', async () => {
    const mockResponse = {
      access_token: 'token123',
      refresh_token: 'refresh123',
      user: { id: 1, email: 'test@example.com' }
    }
    
    vi.mocked(api.login).mockResolvedValue(mockResponse)
    
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper()
    })
    
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
      remember_me: false
    }
    
    await waitFor(async () => {
      const response = await result.current.login(loginData)
      expect(response).toEqual(mockResponse)
    })
    
    expect(api.login).toHaveBeenCalledWith(loginData)
  })

  it('should signup successfully', async () => {
    const mockResponse = {
      message: 'User created successfully',
      user: { id: 1, email: 'test@example.com' }
    }
    
    vi.mocked(api.signup).mockResolvedValue(mockResponse)
    
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper()
    })
    
    const signupData = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      password_confirm: 'password123',
      phone_number: '+1234567890',
      username: 'johndoe',
      industry: 'tech_gaming'
    }
    
    await waitFor(async () => {
      const response = await result.current.signup(signupData)
      expect(response).toEqual(mockResponse)
    })
    
    expect(api.signup).toHaveBeenCalledWith(signupData)
  })

  it('should handle login error', async () => {
    const mockError = new Error('Invalid credentials')
    vi.mocked(api.login).mockRejectedValue(mockError)
    
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper()
    })
    
    const loginData = {
      email: 'test@example.com',
      password: 'wrongpassword',
      remember_me: false
    }
    
    await waitFor(async () => {
      try {
        await result.current.login(loginData)
      } catch (error) {
        expect(error).toBe(mockError)
      }
    })
  })

  it('should logout successfully', async () => {
    vi.mocked(api.logout).mockResolvedValue({ message: 'Logged out' })
    
    // Set up initial auth state
    localStorage.setItem('access_token', 'token123')
    
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper()
    })
    
    await waitFor(async () => {
      await result.current.logout()
    })
    
    expect(api.logout).toHaveBeenCalled()
    expect(localStorage.getItem('access_token')).toBeNull()
  })
})