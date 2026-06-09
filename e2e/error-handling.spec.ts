import { test, expect } from '@playwright/test'
import { clearAppStorage, loginUser, registerUser } from './helpers/auth'
import { VALID_STEP_1 } from './helpers/registration'

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppStorage(page)
  })

  test('registration shows error for short password', async ({ page }) => {
    await page.goto('/#tasks')
    await page.getByTestId('login-form').waitFor({ state: 'visible' })
    await page.getByTestId('go-to-register').click()

    await page.getByTestId('register-first-name').fill('Test')
    await page.getByTestId('register-last-name').fill('User')
    await page.getByTestId('register-email').fill('short@test.com')
    await page.getByTestId('register-phone').fill(VALID_STEP_1.phone)
    await page.getByTestId('register-next').click()

    await page.getByTestId('register-password').fill('short')
    await page.getByTestId('register-confirm-password').fill('short')
    await page.getByTestId('register-next').click()

    await expect(page.getByTestId('register-error-password')).toContainText(
      'Password must be at least 8 characters.',
    )
  })

  test('registration shows error for invalid email', async ({ page }) => {
    await page.goto('/#tasks')
    await page.getByTestId('login-form').waitFor({ state: 'visible' })
    await page.getByTestId('go-to-register').click()

    await page.getByTestId('register-first-name').fill('Test')
    await page.getByTestId('register-last-name').fill('User')
    await page.getByTestId('register-email').fill('not-an-email')
    await page.getByTestId('register-phone').fill(VALID_STEP_1.phone)
    await page.getByTestId('register-next').click()

    await expect(page.getByTestId('register-error-email')).toContainText(
      'Please enter a valid email address',
    )
  })

  test('registration shows error for empty name', async ({ page }) => {
    await page.goto('/#tasks')
    await page.getByTestId('login-form').waitFor({ state: 'visible' })
    await page.getByTestId('go-to-register').click()

    await page.getByTestId('register-first-name').fill('')
    await page.getByTestId('register-last-name').fill('User')
    await page.getByTestId('register-email').fill('valid@test.com')
    await page.getByTestId('register-phone').fill(VALID_STEP_1.phone)
    await page.getByTestId('register-next').click()

    await expect(page.getByTestId('register-error-first-name')).toContainText(
      'First name is required.',
    )
  })

  test('login shows error for empty credentials', async ({ page }) => {
    await page.goto('/#tasks')
    await page.getByTestId('login-form').waitFor({ state: 'visible' })
    await page.getByTestId('login-submit').click()

    await expect(page.getByTestId('login-error')).toContainText('required')
  })
})
