import { test } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { DashboardPage } from '../pages/DashboardPage'
import { RegisterPage } from '../pages/RegisterPage'
import { INVALID_USER, TEST_USER } from '../fixtures/test-data'

test.describe('End-to-End Task Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await new LoginPage(page).clearStorage()
  })

  test('complete auth workflow: register → dashboard → logout → login fail', async ({ page }) => {
    const login = new LoginPage(page)
    const register = new RegisterPage(page)
    const dashboard = new DashboardPage(page)
    const email = `e2e-${Date.now()}@example.com`

    await login.open()
    await login.goToRegister()
    await register.register({ ...TEST_USER, email })
    await dashboard.assertLoaded()
    await dashboard.createTask('E2E workflow task')
    await dashboard.logout()

    await login.login(INVALID_USER.email, INVALID_USER.password)
    await login.assertInvalidCredentials()
  })
})
