import { test, expect } from '@playwright/test'
import { clearAppStorage, loginUser, registerUser, logoutUser } from './helpers/auth'

test.describe('Task Management — Complete User Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppStorage(page)
    await page.waitForLoadState('networkidle') // Ensure all network requests have settled
  })

  test('login rejects invalid credentials', async ({ page }) => {
    // First, ensure we are logged out to test login rejection
    await page.goto('/#tasks')
    await page.getByTestId('login-email').fill('wrong@example.com')
    await page.getByTestId('login-password').fill('wrongpassword')
    await page.getByTestId('login-submit').click()
    await expect(page.getByTestId('login-error')).toContainText(
      'Invalid email or password',
    )
  })
})
