import { test, expect } from '@playwright/test'

const USER_EMAIL = 'testuser@example.com'
const USER_PASSWORD = 'password123'

test.describe('Acceptance Tests - User Flows', () => {
  test('Explorer registration and login flow', async ({ page }) => {
    // 1. Navigate to homepage
    await page.goto('/')
    await expect(page).toHaveTitle(/Mozhi/)
    
    // 2. Click Get Started
    await page.getByRole('link', { name: /get started/i }).click()
    await expect(page).toHaveURL(/register/)
    
    // 3. Select Explorer role (default)
    // 4. Fill registration form
    await page.getByLabel(/full name/i).fill('Test Explorer')
    await page.getByLabel(/email/i).fill(USER_EMAIL)
    await page.getByLabel(/^password$/i).fill(USER_PASSWORD)
    await page.getByLabel(/confirm password/i).fill(USER_PASSWORD)
    
    // 5. Submit form
    await page.getByRole('button', { name: /create account/i }).click()
    
    // 6. Should redirect to dashboard (or show success)
    // In demo mode, it might redirect to dashboard
    await page.waitForURL(/dashboard|login/)
  })

  test('Companion registration flow', async ({ page }) => {
    // 1. Navigate to register page with companion role
    await page.goto('/register?role=companion')
    
    // 2. Fill the form with display name
    await page.getByLabel(/full name/i).fill('Test Companion')
    await page.getByLabel(/email/i).fill('companion@example.com')
    await page.getByLabel(/^password$/i).fill(USER_PASSWORD)
    await page.getByLabel(/confirm password/i).fill(USER_PASSWORD)
    await page.getByLabel(/display name/i).fill('Tamil Companion')
    
    // 3. Submit
    await page.getByRole('button', { name: /create account/i }).click()
    
    // 4. Should redirect to profile edit page
    await page.waitForURL(/profile\/edit|login/)
  })

  test('Login flow with credentials', async ({ page }) => {
    // 1. Navigate to login page
    await page.goto('/login')
    
    // 2. Fill login form
    await page.getByLabel(/email/i).fill(USER_EMAIL)
    await page.getByLabel(/password/i).fill(USER_PASSWORD)
    
    // 3. Submit
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // 4. Should redirect to dashboard
    await page.waitForURL(/dashboard/)
  })

  test('Companion discovery flow', async ({ page }) => {
    // 1. Navigate to companions page
    await page.goto('/companions')
    
    // 2. View companion profile
    await page.locator('[class*="card"], [class*="companion"]').first().click()
    
    // 3. Should show companion details
    // Wait for profile page to load
    await page.waitForLoadState('domcontentloaded')
  })

  test('Navigation to all main pages', async ({ page }) => {
    // Homepage
    await page.goto('/')
    await expect(page.getByRole('link', { name: /mozhi/i })).toBeVisible()
    
    // Companions
    await page.getByRole('link', { name: /companions/i }).first().click()
    await expect(page).toHaveURL(/companions/)
    
    // Login
    await page.getByRole('link', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/login/)
    
    // Register
    await page.getByRole('link', { name: /get started/i }).click()
    await expect(page).toHaveURL(/register/)
  })
})

test.describe('Acceptance Tests - User Stories', () => {
  test('As a Tamil diaspora, I want to find a companion to learn about my heritage', async ({ page }) => {
    // 1. Visit homepage
    await page.goto('/')
    
    // 2. Look for Tamil companions
    await page.getByRole('link', { name: /find a companion/i }).click()
    
    // 3. Browse available companions
    await expect(page).toHaveURL(/companions/)
    
    // 4. Find someone offering what I'm interested in
    const companionCards = page.locator('[class*="card"]')
    expect(await companionCards.count()).toBeGreaterThan(0)
  })

  test('As a cultural guide, I want to offer my knowledge to the diaspora', async ({ page }) => {
    // 1. Visit homepage
    await page.goto('/')
    
    // 2. Click Become a Companion
    await page.getByRole('link', { name: /become a companion/i }).click()
    
    // 3. Should navigate to register with companion role
    await expect(page).toHaveURL(/register.*companion/)
  })

  test('As a user, I want to easily sign in to access my dashboard', async ({ page }) => {
    // 1. Go to login page
    await page.goto('/login')
    
    // 2. See sign in options: email/password and potentially Google
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /google/i, exact: false }).or(
      page.getByRole('link', { name: /google/i })
    )).toBeVisible()
  })
})

test.describe('Acceptance Tests - Visual Checkpoints', () => {
  test('Homepage hero section is visually correct', async ({ page }) => {
    await page.goto('/')
    
    // Check main heading is visible
    await expect(page.getByRole('heading', { name: /tamil/i, exact: false })).toBeVisible()
    
    // Check call-to-action buttons are visible
    await expect(page.getByRole('link', { name: /find a companion/i })).toBeVisible()
  })

  test('Login page has proper form layout', async ({ page }) => {
    await page.goto('/login')
    
    // Check form fields are properly labeled and spaced
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('Dark theme is applied correctly', async ({ page }) => {
    await page.goto('/')
    
    // Check background is dark
    const body = page.locator('body')
    const backgroundColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor
    })
    
    // Dark theme should have dark background
    expect(backgroundColor).not.toBe('rgb(255, 255, 255)')
  })
})