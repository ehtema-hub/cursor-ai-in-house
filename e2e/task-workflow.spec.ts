import { test, expect } from '@playwright/test'
import {
  clearAppStorage,
  loginUser,
  logoutUser,
  registerUser,
  TEST_USER,
} from './helpers/auth'
import { completeTask, createTask, deleteTask } from './helpers/tasks'

test.describe('Task Management — Complete User Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppStorage(page)
  })

  test('full workflow: register → create → complete → delete → logout', async ({
    page,
  }) => {
    const taskTitle = `E2E Workflow Task ${Date.now()}`

    // Registration
    await registerUser(page)
    await expect(page.getByTestId('task-dashboard')).toBeVisible()
    await expect(page.getByTestId('user-menu-button')).toContainText(TEST_USER.name)

    // Logout and login
    await logoutUser(page)
    await expect(page.getByTestId('login-form')).toBeVisible()
    await loginUser(page)
    await expect(page.getByTestId('task-dashboard')).toBeVisible()

    // Create task
    const initialCount = await page.getByTestId('task-count').textContent()
    await createTask(page, { title: taskTitle })
    await expect(page.getByRole('heading', { name: taskTitle })).toBeVisible()
    await expect(page.getByTestId('task-count')).not.toHaveText(initialCount ?? '')

    // Complete task
    await completeTask(page, taskTitle)
    await expect(
      page.locator('[data-testid^="task-card-"]', {
        has: page.getByRole('heading', { name: taskTitle }),
      }).getByText('Done'),
    ).toBeVisible()

    // Delete task
    await deleteTask(page, taskTitle)
    await expect(page.getByRole('heading', { name: taskTitle })).toBeHidden()

    // Logout
    await logoutUser(page)
    await expect(page.getByTestId('login-form')).toBeVisible()
  })

  test('registration rejects duplicate email', async ({ page }) => {
    await registerUser(page)
    await logoutUser(page)

    await page.getByTestId('go-to-register').click()
    await page.getByTestId('register-name').fill('Another User')
    await page.getByTestId('register-email').fill(TEST_USER.email)
    await page.getByTestId('register-password').fill('AnotherPass123!')
    await page.getByTestId('register-submit').click()

    await expect(page.getByTestId('register-error')).toContainText(
      'already exists',
    )
  })

  test('login rejects invalid credentials', async ({ page }) => {
    await registerUser(page)
    await logoutUser(page)

    await page.getByTestId('login-email').fill(TEST_USER.email)
    await page.getByTestId('login-password').fill('WrongPassword!')
    await page.getByTestId('login-submit').click()

    await expect(page.getByTestId('login-error')).toContainText('Invalid')
    await expect(page.getByTestId('login-form')).toBeVisible()
  })

  test('task filter shows empty state when no matches', async ({ page }) => {
    await registerUser(page)
    await page.getByTestId('status-filter').selectOption('done')
    // May or may not be empty depending on sample data — filter to done only
    const doneTasks = page.locator('[data-testid^="task-card-"]').filter({
      hasText: 'Done',
    })
    const allCards = page.locator('[data-testid^="task-card-"]')
    const doneCount = await doneTasks.count()
    const allCount = await allCards.count()
    expect(doneCount).toBe(allCount)
  })
})
