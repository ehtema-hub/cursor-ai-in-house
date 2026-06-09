import { test, expect } from '@playwright/test'
import { clearAppStorage, loginUser, registerUser } from './helpers/auth'

test.describe('Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppStorage(page)
    await page.goto('/#tasks') // Ensure all responsive tests start on the tasks page
  })

  test.use({ viewport: { width: 375, height: 667 } }) // Mobile viewport

  test('mobile: sidebar opens and closes', async ({ page }) => {
    await loginUser(page) // Login for this specific test
    // Assume sidebar toggle is only visible on mobile
    await page.getByTestId('sidebar-toggle').click()
    await expect(page.getByTestId('dashboard-sidebar')).toBeVisible()
    await page.getByTestId('sidebar-overlay').click()
    await expect(page.getByTestId('dashboard-sidebar')).toBeHidden()
  })

  test('mobile: task cards stack in single column', async ({ page }) => {
    await loginUser(page) // Login for this specific test
    // Verify the task cards layout
    const firstTaskCard = page.getByTestId('task-item-Implement User Authentication')
    await expect(firstTaskCard).toBeVisible()
    const boundingBox = await firstTaskCard.boundingBox()
    expect(boundingBox?.width).toBeCloseTo(page.viewportSize()!.width - 32, -1) // Account for horizontal padding
  })

  test.use({ viewport: { width: 768, height: 1024 } }) // Tablet viewport

  test('tablet: stats grid is visible', async ({ page }) => {
    await loginUser(page) // Login for this specific test
    await expect(page.getByTestId('stats-grid')).toBeVisible()
  })

  test.use({ viewport: { width: 1440, height: 900 } }) // Desktop viewport

  test('desktop: full dashboard layout renders', async ({ page }) => {
    await loginUser(page) // Login for this specific test
    await expect(page.getByTestId('dashboard-sidebar')).toBeVisible()
    await expect(page.getByTestId('main-content')).toBeVisible()
  })

  test('mobile: create task modal is usable', async ({ page }) => {
    await loginUser(page) // Use loginUser for consistency
    await page.getByTestId('new-task-button').click()
    await page.getByTestId('create-task-modal').waitFor({ state: 'visible' }) 

    await page.getByTestId('task-title').fill('Mobile Test Task')
    await page.getByTestId('create-task-submit').click()
    await expect(page.getByTestId('task-item-Mobile Test Task')).toBeVisible()
  })
})
