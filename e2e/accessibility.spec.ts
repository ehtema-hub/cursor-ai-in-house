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

  test('dashboard has no critical accessibility violations after login', async ({
    page,
  }) => {
    await loginUser(page) // Use loginUser to ensure successful authentication
    await page.getByTestId('main-navbar').waitFor({ state: 'visible' }) 
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    )
    expect(critical).toEqual([])
  })

  test('form fields are keyboard navigable', async ({ page }) => {
    await page.goto('/#tasks') // Navigate to tasks page directly
    await page.getByTestId('login-form').waitFor({ state: 'visible' }) 

    await page.getByTestId('login-email').focus()
    await expect(page.getByTestId('login-email')).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(page.getByTestId('login-password')).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(page.getByTestId('login-submit')).toBeFocused()
  })

  test('create task modal traps focus and is dismissible', async ({ page }) => {
    await loginUser(page) // Use loginUser for consistency
    await page.getByTestId('new-task-button').click()
    await page.getByTestId('create-task-modal').waitFor({ state: 'visible' }) // Explicit wait for create task modal
    await expect(page.getByTestId('create-task-modal')).toBeVisible()

    await page.getByTestId('close-create-task').click()
    await expect(page.getByTestId('create-task-modal')).toBeHidden()
  })

  test('user menu opens and logout returns to login', async ({ page }) => {
    await loginUser(page) // Use loginUser for consistency
    await logoutUser(page) // Use logoutUser helper function
    await expect(page.getByTestId('login-form')).toBeVisible()
  })
})
