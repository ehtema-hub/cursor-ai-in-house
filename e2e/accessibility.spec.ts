import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { clearAppStorage, registerUser, loginUser, logoutUser } from './helpers/auth'

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppStorage(page)
    await page.waitForLoadState('networkidle') // Ensure all network requests have settled
  })

  test('login page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/#tasks') // Navigate to tasks page directly
    await page.getByTestId('login-form').waitFor({ state: 'visible' }) 
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    )
    expect(critical).toEqual([])
  })

  test('register page has no critical accessibility violations', async ({
    page,
  }) => {
    await page.goto('/#tasks') // Navigate to tasks page directly
    await page.getByTestId('login-form').waitFor({ state: 'visible' }) 
    await page.getByTestId('go-to-register').waitFor({ state: 'visible' })
    await page.getByTestId('go-to-register').click()

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    )
    expect(critical).toEqual([])
  })
})
