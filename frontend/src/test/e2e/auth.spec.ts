import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display landing page with login options', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /influencerconnect/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible()
  })

  test('should navigate to login page', async ({ page }) => {
    await page.getByRole('link', { name: /sign in/i }).click()
    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  })

  test('should show validation errors on empty login form', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    await expect(page.getByText(/email is required/i)).toBeVisible()
    await expect(page.getByText(/password is required/i)).toBeVisible()
  })

  test('should show email validation error', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('invalid-email')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    await expect(page.getByText(/please enter a valid email/i)).toBeVisible()
  })

  test('should navigate to signup page', async ({ page }) => {
    await page.getByRole('link', { name: /get started/i }).click()
    await expect(page).toHaveURL('/signup')
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible()
  })

  test('should show all signup form fields', async ({ page }) => {
    await page.goto('/signup')
    
    await expect(page.getByLabel(/first name/i)).toBeVisible()
    await expect(page.getByLabel(/last name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/phone number/i)).toBeVisible()
    await expect(page.getByLabel(/username/i)).toBeVisible()
    await expect(page.getByLabel(/industry/i)).toBeVisible()
    await expect(page.getByLabel(/^password$/i)).toBeVisible()
    await expect(page.getByLabel(/confirm password/i)).toBeVisible()
  })

  test('should show password mismatch error', async ({ page }) => {
    await page.goto('/signup')
    
    await page.getByLabel(/^password$/i).fill('password123')
    await page.getByLabel(/confirm password/i).fill('different123')
    await page.getByRole('button', { name: /create account/i }).click()
    
    await expect(page.getByText(/passwords do not match/i)).toBeVisible()
  })

  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: /forgot password/i }).click()
    
    await expect(page).toHaveURL('/forgot-password')
    await expect(page.getByRole('heading', { name: /forgot password/i })).toBeVisible()
  })
})

test.describe('Authenticated User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock successful login
    await page.route('**/api/auth/login/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          user: {
            id: 1,
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            profile: {
              username: 'testuser',
              industry: 'tech_gaming'
            }
          }
        })
      })
    })

    // Mock dashboard stats
    await page.route('**/api/dashboard/stats/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total_invitations: 25,
          active_deals: 3,
          completed_deals: 12,
          total_earnings: 5600.00
        })
      })
    })
  })

  test('should login and redirect to dashboard', async ({ page }) => {
    await page.goto('/login')
    
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText(/welcome back/i)).toBeVisible()
  })

  test('should display dashboard stats', async ({ page }) => {
    await page.goto('/login')
    
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    await expect(page.getByText('Total Invitations')).toBeVisible()
    await expect(page.getByText('25')).toBeVisible()
    await expect(page.getByText('Active Deals')).toBeVisible()
    await expect(page.getByText('3')).toBeVisible()
  })
})