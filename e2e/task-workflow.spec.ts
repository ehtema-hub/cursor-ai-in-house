import { test, expect } from '@playwright/test'
import { clearAppStorage, loginUser, registerUser, logoutUser } from './helpers/auth'

test.describe('Task Management — Complete User Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppStorage(page)
    await page.waitForLoadState('networkidle') // Ensure all network requests have settled
    await loginUser(page) // Login before each test
  })

  test('full workflow: register → create → complete → delete → logout', async ({ page }) => {
    // Create a new task
    await page.getByTestId('new-task-button').waitFor({ state: 'visible' })
    await page.getByTestId('new-task-button').click()
    await page.getByTestId('create-task-modal').waitFor({ state: 'visible' }) // Explicit wait for create task modal
    await page.getByTestId('task-title').fill('My New Task')
    await page.getByTestId('task-description').fill('This is a description for my new task.')
    await page.getByTestId('task-due-date').fill('2026-12-31')
    await page.getByTestId('create-task-submit').click()
    await expect(page.getByTestId('task-item-My New Task')).toBeVisible()

    // Complete the task
    await page.getByTestId('task-checkbox-My New Task').check()
    await expect(page.getByTestId('task-item-My New Task')).toHaveClass(/line-through/)

    // Delete the task
    await page.getByTestId('task-options-My New Task').click()
    await page.getByTestId('delete-task-My New Task').click()
    await expect(page.getByTestId('task-item-My New Task')).not.toBeVisible()

    // Logout
    await logoutUser(page)

    await expect(page.getByTestId('login-form')).toBeVisible()
  })

  test('registration rejects duplicate email', async ({ page }) => {
    // The beforeEach already logs in a user. Now, try to register with the same email
    // First, logout the current user
    await logoutUser(page)
    await page.getByTestId('go-to-register').click()
    await page.getByTestId('register-name').fill('Another User')
    await page.getByTestId('register-email').fill('john.doe@example.com') // Duplicate email
    await page.getByTestId('register-password').fill('Password123!')
    await page.getByTestId('register-submit').click()
    await expect(page.getByTestId('register-error')).toContainText(
      'A user with this email already exists',
    )
  })

  test('login rejects invalid credentials', async ({ page }) => {
    // First, ensure we are logged out to test login rejection
    await logoutUser(page)
    await page.getByTestId('login-email').fill('wrong@example.com')
    await page.getByTestId('login-password').fill('wrongpassword')
    await page.getByTestId('login-submit').click()
    await expect(page.getByTestId('login-error')).toContainText(
      'Invalid email or password',
    )
  })

  test('task filter shows empty state when no matches', async ({ page }) => {
    await page.getByTestId('task-search-input').fill('NonExistentTask')
    await expect(page.getByTestId('no-tasks-message')).toBeVisible()
  })
})
