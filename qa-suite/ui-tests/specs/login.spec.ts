import { test } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { DashboardPage } from '../pages/DashboardPage'
import { RegisterPage } from '../pages/RegisterPage'
import { INVALID_USER, TEST_USER } from '../fixtures/test-data'

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page)
    await login.clearStorage()
  })

  test('rejects invalid credentials with clear error', async ({ page }) => {
    const login = new LoginPage(page)
    await login.open()
    await login.login(INVALID_USER.email, INVALID_USER.password)
    await login.assertInvalidCredentials()
  })

  test('registers and lands on dashboard', async ({ page }) => {
    const login = new LoginPage(page)
    const register = new RegisterPage(page)
    const dashboard = new DashboardPage(page)

    await login.open()
    await login.goToRegister()
    await register.register(TEST_USER)
    await dashboard.assertLoaded()
  })

  test('logs in with valid credentials after registration', async ({ page }) => {
    const login = new LoginPage(page)
    const register = new RegisterPage(page)
    const dashboard = new DashboardPage(page)
    const email = `qa-login-${Date.now()}@example.com`

    await login.open()
    await login.goToRegister()
    await register.register({ ...TEST_USER, email })
    await dashboard.assertLoaded()
    await dashboard.logout()

    await login.login(email, TEST_USER.password)
    await dashboard.assertLoaded()
  })
})
