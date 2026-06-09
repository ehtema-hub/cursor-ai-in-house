import { test, expect } from '@playwright/test'
import { clearAppStorage, loginUser, registerUser } from './helpers/auth'

test.describe('Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppStorage(page)
    await page.goto('/#tasks') // Ensure all responsive tests start on the tasks page
  })

  test.use({ viewport: { width: 375, height: 667 } }) // Mobile viewport

  // Remaining responsive tests can be added here if they prove stable.
})
