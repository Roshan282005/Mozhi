import { test, expect } from '@playwright/test'

test.describe('System Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Mozhi/)
  })

  test('login page loads successfully', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  })

  test('register page loads successfully', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible()
  })

  test('companions page loads successfully', async ({ page }) => {
    await page.goto('/companions')
    await expect(page.getByRole('heading', { name: /companions/i })).toBeVisible()
  })

  test('navigation works correctly', async ({ page }) => {
    await page.goto('/')
    
    // Click on Companions link
    await page.getByRole('link', { name: /companions/i }).first().click()
    
    // Should navigate to companions page
    await expect(page).toHaveURL(/companions/)
  })

  test('pages have correct meta tags', async ({ page }) => {
    await page.goto('/')
    
    const description = await page.meta('description')
    expect(description).toBeTruthy()
  })
})

test.describe('Component Tests', () => {
  test('buttons are clickable', async ({ page }) => {
    await page.goto('/')
    
    const button = page.getByRole('link', { name: /get started/i })
    await expect(button).toBeVisible()
    await expect(button).toBeEnabled()
  })

  test('forms have proper labels', async ({ page }) => {
    await page.goto('/login')
    
    // Check email input has label
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('form validation works', async ({ page }) => {
    await page.goto('/login')
    
    // Submit without filling form
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show validation errors
    await expect(page.getByText(/required/i)).toBeVisible()
  })
})

test.describe('Performance Tests', () => {
  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(3000) // 3 seconds
  })

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    await page.goto('/')
    
    // Wait for initial load
    await page.waitForLoadState('networkidle')
    
    expect(errors.filter(e => !e.includes('Warning'))).toHaveLength(0)
  })
})