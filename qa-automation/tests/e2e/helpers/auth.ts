import { TEST_USER } from './test-data'
import { type Page, expect } from '@playwright/test'
import {
  VALID_STEP_1,
  VALID_STEP_2,
  VALID_STEP_3,
} from './registration'

export async function clearAppStorage(page: Page) {
  await page.request.post('http://127.0.0.1:5000/api/test/reset')
  await page.goto('/')
  await page.waitForLoadState('domcontentloaded')
  await page.evaluate(() => localStorage.clear())
  await page.evaluate(() => sessionStorage.clear())
}

async function fillMultiStepRegistration(
  page: Page,
  user: { name: string; email: string; password: string },
) {
  const [firstName, ...rest] = user.name.split(' ')
  const lastName = rest.join(' ') || 'User'

  await page.getByTestId('go-to-register').click()
  await page.getByTestId('multi-step-register').waitFor({ state: 'visible' })

  await page.getByTestId('register-first-name').fill(firstName)
  await page.getByTestId('register-last-name').fill(lastName)
  await page.getByTestId('register-email').fill(user.email)
  await page.getByTestId('register-phone').fill(VALID_STEP_1.phone)
  await page.getByTestId('register-next').click()

  await page.getByTestId('register-step-panel-2').waitFor({ state: 'visible' })
  await page.getByTestId('register-password').fill(user.password)
  await page.getByTestId('register-confirm-password').fill(user.password)
  await page.getByTestId('register-next').click()

  await page.getByTestId('register-step-panel-3').waitFor({ state: 'visible' })
  if (VALID_STEP_3.company) {
    await page.getByTestId('register-company').fill(VALID_STEP_3.company)
  }
  await page.getByTestId('register-terms').check()
  await page.getByTestId('register-submit').click()
}

export async function loginUser(page: Page, user = TEST_USER) {
  await page.goto('/#tasks')
  await page.waitForLoadState('domcontentloaded') // Ensure page is loaded
  await page.getByTestId('login-form').waitFor({ state: 'visible' }) 
  await page.getByTestId('login-email').fill(user.email)
  await page.getByTestId('login-password').fill(user.password)
  await page.getByTestId('login-submit').click()
  await page.waitForURL('**/#tasks') // Wait for URL to change to tasks dashboard
  await page.waitForLoadState('networkidle') // Ensure all network requests are settled
  await page.getByTestId('new-task-button').waitFor({ state: 'visible' }) // Wait for a key interactive element on the dashboard
}

export async function registerUser(page: Page, user = TEST_USER) {
  await page.goto('/#tasks')
  await page.waitForLoadState('domcontentloaded') // Ensure page is loaded
  await page.getByTestId('login-form').waitFor({ state: 'visible' }) 
  await fillMultiStepRegistration(page, user)
  await page.waitForURL('**/#tasks') // Wait for URL to change to tasks dashboard
  await page.waitForLoadState('networkidle') // Ensure all network requests are settled
  await page.getByTestId('new-task-button').waitFor({ state: 'visible' }) // Wait for a key interactive element on the dashboard
}

export async function logoutUser(page: Page) {
  await page.getByTestId('user-menu-button').waitFor({ state: 'visible' }) 
  await page.getByTestId('user-menu-button').click()
  await expect(page.getByTestId('user-menu-item-sign-out')).toBeVisible() // Explicit wait for sign-out button
  await page.getByTestId('user-menu-item-sign-out').click()
  await page.getByTestId('login-form').waitFor({ state: 'visible' }) // Wait for login page to be visible after logout
}
