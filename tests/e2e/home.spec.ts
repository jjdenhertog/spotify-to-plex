import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should load the home page successfully', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Basic checks
    await expect(page).toHaveTitle(/Vibe Kanban|Spotify to Plex/i)
    
    // Check that the page is interactive
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('should have working navigation', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('domcontentloaded')
    
    // Check for common navigation elements
    const navigation = page.locator('nav, header, [role="navigation"]')
    if (await navigation.count() > 0) {
      await expect(navigation.first()).toBeVisible()
    }
  })

  test('should be responsive', async ({ page }) => {
    await page.goto('/')
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForLoadState('networkidle')
    
    const body = page.locator('body')
    await expect(body).toBeVisible()
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(1000) // Allow time for responsive changes
    
    await expect(body).toBeVisible()
  })
})