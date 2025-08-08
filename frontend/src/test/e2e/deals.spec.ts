import { test, expect } from '@playwright/test'

test.describe('Deals Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'mock-token')
    })

    // Mock deals API
    await page.route('**/api/deals/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            {
              id: 1,
              campaign: {
                title: 'Summer Tech Campaign',
                brand: {
                  name: 'TechBrand',
                  logo: '/api/placeholder/100/100',
                  rating: 4.5
                },
                deal_type: 'paid',
                cash_amount: 500.00,
                product_value: 0.00,
                application_deadline: '2024-12-31T23:59:59Z'
              },
              status: 'invited',
              invited_at: '2024-01-15T10:00:00Z'
            },
            {
              id: 2,
              campaign: {
                title: 'Fashion Week Collaboration',
                brand: {
                  name: 'FashionBrand',
                  logo: '/api/placeholder/100/100',
                  rating: 4.8
                },
                deal_type: 'barter',
                cash_amount: 0.00,
                product_value: 800.00,
                application_deadline: '2024-12-15T23:59:59Z'
              },
              status: 'accepted',
              invited_at: '2024-01-10T10:00:00Z'
            }
          ],
          count: 2
        })
      })
    })

    // Mock deal detail API
    await page.route('**/api/deals/1/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          campaign: {
            title: 'Summer Tech Campaign',
            description: 'Promote our latest tech products for summer',
            brand: {
              name: 'TechBrand',
              logo: '/api/placeholder/100/100',
              rating: 4.5,
              total_collaborations: 150
            },
            deal_type: 'paid',
            cash_amount: 500.00,
            product_value: 0.00,
            content_requirements: {
              platforms: ['instagram', 'youtube'],
              content_types: ['post', 'story'],
              deliverables: 2
            },
            application_deadline: '2024-12-31T23:59:59Z',
            campaign_start_date: '2024-02-01T00:00:00Z',
            campaign_end_date: '2024-02-28T23:59:59Z'
          },
          status: 'invited',
          invited_at: '2024-01-15T10:00:00Z'
        })
      })
    })
  })

  test('should display deals list', async ({ page }) => {
    await page.goto('/deals')
    
    await expect(page.getByText('Summer Tech Campaign')).toBeVisible()
    await expect(page.getByText('TechBrand')).toBeVisible()
    await expect(page.getByText('$500.00')).toBeVisible()
    await expect(page.getByText('Invited')).toBeVisible()
    
    await expect(page.getByText('Fashion Week Collaboration')).toBeVisible()
    await expect(page.getByText('FashionBrand')).toBeVisible()
    await expect(page.getByText('$800.00')).toBeVisible()
    await expect(page.getByText('Accepted')).toBeVisible()
  })

  test('should filter deals by status', async ({ page }) => {
    await page.goto('/deals')
    
    // Click on status filter
    await page.getByRole('button', { name: /filter/i }).click()
    await page.getByText('Invited').click()
    
    // Should only show invited deals
    await expect(page.getByText('Summer Tech Campaign')).toBeVisible()
    await expect(page.getByText('Fashion Week Collaboration')).not.toBeVisible()
  })

  test('should navigate to deal details', async ({ page }) => {
    await page.goto('/deals')
    
    await page.getByText('Summer Tech Campaign').click()
    
    await expect(page).toHaveURL('/deals/1')
    await expect(page.getByRole('heading', { name: /summer tech campaign/i })).toBeVisible()
    await expect(page.getByText('TechBrand')).toBeVisible()
    await expect(page.getByText('Promote our latest tech products')).toBeVisible()
  })

  test('should show deal actions for invited deals', async ({ page }) => {
    await page.goto('/deals/1')
    
    await expect(page.getByRole('button', { name: /accept deal/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /reject deal/i })).toBeVisible()
  })

  test('should accept a deal', async ({ page }) => {
    // Mock accept deal API
    await page.route('**/api/deals/1/accept/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Deal accepted successfully',
          deal_id: 1
        })
      })
    })

    await page.goto('/deals/1')
    
    await page.getByRole('button', { name: /accept deal/i }).click()
    
    // Should show confirmation dialog
    await expect(page.getByText(/are you sure you want to accept/i)).toBeVisible()
    await page.getByRole('button', { name: /confirm/i }).click()
    
    // Should show success message
    await expect(page.getByText(/deal accepted successfully/i)).toBeVisible()
  })

  test('should reject a deal with reason', async ({ page }) => {
    // Mock reject deal API
    await page.route('**/api/deals/1/reject/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Deal rejected successfully',
          deal_id: 1
        })
      })
    })

    await page.goto('/deals/1')
    
    await page.getByRole('button', { name: /reject deal/i }).click()
    
    // Should show rejection dialog
    await expect(page.getByText(/reason for rejection/i)).toBeVisible()
    await page.getByRole('textbox', { name: /reason/i }).fill('Not interested in this campaign')
    await page.getByRole('button', { name: /confirm rejection/i }).click()
    
    // Should show success message
    await expect(page.getByText(/deal rejected successfully/i)).toBeVisible()
  })

  test('should show content submission for accepted deals', async ({ page }) => {
    // Mock accepted deal
    await page.route('**/api/deals/2/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 2,
          campaign: {
            title: 'Fashion Week Collaboration',
            brand: { name: 'FashionBrand' },
            deal_type: 'barter'
          },
          status: 'accepted'
        })
      })
    })

    await page.goto('/deals/2')
    
    await expect(page.getByText(/submit content/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /upload files/i })).toBeVisible()
  })
})

test.describe('Deal Content Submission', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'mock-token')
    })

    // Mock accepted deal
    await page.route('**/api/deals/1/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          campaign: {
            title: 'Test Campaign',
            brand: { name: 'TestBrand' }
          },
          status: 'accepted'
        })
      })
    })
  })

  test('should submit content successfully', async ({ page }) => {
    // Mock content submission API
    await page.route('**/api/deals/1/submit-content/', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Content submitted successfully'
        })
      })
    })

    await page.goto('/deals/1')
    
    // Fill content submission form
    await page.getByRole('combobox', { name: /platform/i }).selectOption('instagram')
    await page.getByRole('combobox', { name: /content type/i }).selectOption('post')
    await page.getByRole('textbox', { name: /caption/i }).fill('Check out this amazing product!')
    
    // Mock file upload
    const fileInput = page.getByRole('button', { name: /upload files/i })
    await fileInput.click()
    
    await page.getByRole('button', { name: /submit content/i }).click()
    
    await expect(page.getByText(/content submitted successfully/i)).toBeVisible()
  })
})