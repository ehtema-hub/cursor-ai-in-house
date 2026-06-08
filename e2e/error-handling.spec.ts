import { test, expect } from '@playwright/test'
import { clearAppStorage, registerUser } from './helpers/auth'

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppStorage(page)
  })

  test('registration shows error for short password', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('go-to-register').click()
    await page.getByTestId('register-name').fill('Test User')
    await page.getByTestId('register-email').fill('short@test.com')
    await page.getByTestId('register-password').fill('short')
    await page.getByTestId('register-submit').click()

    await expect(page.getByTestId('register-error')).toContainText('8 characters')
    await expect(page.getByTestId('register-form')).toBeVisible()
  })

  test('registration shows error for invalid email', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('go-to-register').click()
    await page.getByTestId('register-name').fill('Test User')
    await page.getByTestId('register-email').fill('not-an-email')
    await page.getByTestId('register-password').fill('ValidPass123!')
    await page.getByTestId('register-submit').click()

    await expect(page.getByTestId('register-error')).toContainText('valid email')
  })

  test('registration shows error for empty name', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('go-to-register').click()
    await page.getByTestId('register-name').fill('')
    await page.getByTestId('register-email').fill('valid@test.com')
    await page.getByTestId('register-password').fill('ValidPass123!')
    await page.getByTestId('register-submit').click()

    await expect(page.getByTestId('register-error')).toContainText('required')
  })

  test('login shows error for empty credentials', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('login-submit').click()

    await expect(page.getByTestId('login-error')).toContainText('required')
  })

  test('create task shows error for missing title', async ({ page }) => {
    await registerUser(page)
    await page.getByTestId('new-task-button').click()
    await page.getByTestId('task-due-date-input').fill('2026-12-31')
    await page.getByTestId('submit-create-task').click()

    await expect(page.getByTestId('create-task-error')).toContainText('title is required')
    await expect(page.getByTestId('create-task-modal')).toBeVisible()
  })

  test('create task shows error for missing due date', async ({ page }) => {
    await registerUser(page)
    await page.getByTestId('new-task-button').click()
    await page.getByTestId('task-title-input').fill('Task without date')
    await page.getByTestId('submit-create-task').click()

    await expect(page.getByTestId('create-task-error')).toContainText('Due date is required')
  })

  test('cancel create task closes modal without creating', async ({ page }) => {
    await registerUser(page)
    const countBefore = await page.locator('[data-testid^="task-card-"]').count()

    await page.getByTestId('new-task-button').click()
    await page.getByTestId('task-title-input').fill('Cancelled Task')
    await page.getByTestId('cancel-create-task').click()

    await expect(page.getByTestId('create-task-modal')).toBeHidden()
    await expect(page.locator('[data-testid^="task-card-"]')).toHaveCount(countBefore)
  })
})
