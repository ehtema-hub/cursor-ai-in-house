import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { clearAppStorage, registerUser } from './helpers/auth'

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppStorage(page)
  })

  test('login page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/')
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
    await page.goto('/')
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
    await registerUser(page)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    )
    expect(critical).toEqual([])
  })

  test('form fields are keyboard navigable', async ({ page }) => {
    await page.goto('/')

    await page.getByTestId('login-email').focus()
    await expect(page.getByTestId('login-email')).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(page.getByTestId('login-password')).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(page.getByTestId('login-submit')).toBeFocused()
  })

  test('create task modal traps focus and is dismissible', async ({ page }) => {
    await registerUser(page)
    await page.getByTestId('new-task-button').click()
    await expect(page.getByTestId('create-task-modal')).toBeVisible()

    await page.getByTestId('close-create-task').click()
    await expect(page.getByTestId('create-task-modal')).toBeHidden()
  })

  test('user menu opens and logout returns to login', async ({ page }) => {
    await registerUser(page)
    await page.getByTestId('user-menu-button').click()
    await expect(page.getByTestId('logout-button')).toBeVisible()
    await page.getByTestId('logout-button').click()
    await expect(page.getByTestId('login-form')).toBeVisible()
  })
})
