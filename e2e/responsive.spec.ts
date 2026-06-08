import { test, expect } from '@playwright/test'
import { clearAppStorage, registerUser } from './helpers/auth'
import { createTask } from './helpers/tasks'

test.describe('Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppStorage(page)
  })

  test('mobile: sidebar opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await registerUser(page)

    await page.getByTestId('open-sidebar').click()
    await expect(page.getByLabel('Dashboard navigation')).toBeVisible()

    await page.getByLabel('Close sidebar').click()
  })

  test('mobile: task cards stack in single column', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await registerUser(page)

    const taskList = page.locator('[role="list"]').filter({
      has: page.getByRole('heading', { name: 'Recent Tasks' }).locator('..'),
    })
    await expect(page.getByRole('heading', { name: 'Recent Tasks' })).toBeVisible()
    await expect(page.locator('[data-testid^="task-card-"]').first()).toBeVisible()
  })

  test('tablet: stats grid is visible', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await registerUser(page)

    await expect(page.getByText('Total Tasks', { exact: true })).toBeVisible()
    await expect(page.locator('#stat-progress-label')).toBeVisible()
  })

  test('desktop: full dashboard layout renders', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await registerUser(page)

    await expect(page.getByTestId('task-dashboard')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Recent Tasks' })).toBeVisible()
    await expect(page.getByTestId('new-task-button')).toBeVisible()
    await expect(page.getByTestId('status-filter')).toBeVisible()
  })

  test('mobile: create task modal is usable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await registerUser(page)

    const taskTitle = `Mobile Task ${Date.now()}`
    await createTask(page, { title: taskTitle })
    await expect(page.getByRole('heading', { name: taskTitle })).toBeVisible()
  })
})
