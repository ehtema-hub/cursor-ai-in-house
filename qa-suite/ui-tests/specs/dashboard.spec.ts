import { test } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { DashboardPage } from '../pages/DashboardPage'
import { RegisterPage } from '../pages/RegisterPage'
import { TEST_USER } from '../fixtures/test-data'

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page)
    const register = new RegisterPage(page)
    const dashboard = new DashboardPage(page)

    await login.clearStorage()
    await login.open()
    await login.goToRegister()
    const email = `dash-${Date.now()}@example.com`
    await register.register({ ...TEST_USER, email })
    await dashboard.assertLoaded()
  })

  test('displays task dashboard with new task action', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.assertLoaded()
  })

  test('creates a new task from dashboard', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    const taskTitle = `QA Task ${Date.now()}`
    await dashboard.createTask(taskTitle)
  })

  test('navigates to analytics from dashboard menu', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.navigateToAnalytics()
  })

  test('logs out and returns to login', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    const login = new LoginPage(page)
    await dashboard.logout()
    await login.expectOnLoginScreen()
  })
})
