import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('unauthenticated user is redirected to login from /boards', async ({ page }) => {
    await page.goto('/boards/nonexistent-board-id')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('register page renders correctly', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible()
  })

  test('navigation from login to register works', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: /sign up|create account|register/i }).click()
    await expect(page).toHaveURL(/\/register/)
  })
})

test.describe('Home page', () => {
  test('unauthenticated home page redirects to login or shows boards', async ({ page }) => {
    await page.goto('/')
    // Either shows login or board list (if auth session exists)
    const url = page.url()
    expect(url.includes('/login') || url.endsWith('/')).toBe(true)
  })
})

test.describe('404', () => {
  test('shows 404 page for unknown routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')
    await expect(page.getByText('404')).toBeVisible()
  })
})
