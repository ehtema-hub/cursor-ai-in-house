import { expect, type Page } from '@playwright/test'

export const TEST_USER = {
  name: 'E2E Test User',
  email: 'e2e.test@taskflow.app',
  password: 'TestPass123!',
}

export async function clearAppStorage(page: Page) {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

export async function registerUser(page: Page, user = TEST_USER) {
  await page.goto('/')
  await page.getByTestId('go-to-register').click()
  await page.getByTestId('register-name').fill(user.name)
  await page.getByTestId('register-email').fill(user.email)
  await page.getByTestId('register-password').fill(user.password)
  await page.getByTestId('register-submit').click()
  await page.getByTestId('task-dashboard').waitFor({ state: 'visible' })
}

export async function loginUser(page: Page, user = TEST_USER) {
  await page.goto('/')
  await page.getByTestId('login-email').fill(user.email)
  await page.getByTestId('login-password').fill(user.password)
  await page.getByTestId('login-submit').click()
  await page.getByTestId('task-dashboard').waitFor({ state: 'visible' })
}

export async function logoutUser(page: Page) {
  await page.getByTestId('user-menu-button').click()
  await expect(page.getByTestId('logout-button')).toBeVisible()
  await page.getByTestId('logout-button').click()
  await page.getByTestId('login-form').waitFor({ state: 'visible' })
}
