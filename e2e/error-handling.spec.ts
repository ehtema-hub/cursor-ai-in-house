import { test, expect } from '@playwright/test'
import { clearAppStorage, loginUser, registerUser } from './helpers/auth'

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppStorage(page)
  })

  test('registration shows error for short password', async ({ page }) => {
    await page.goto('/#tasks') // Navigate to tasks page directly
    await page.getByTestId('login-form').waitFor({ state: 'visible' }) 
    await page.getByTestId('go-to-register').click()
    await page.getByTestId('register-name').fill('Test User')
    await page.getByTestId('register-email').fill('short@test.com')
    await page.getByTestId('register-password').fill('short')
    await page.getByTestId('register-submit').click()
    await expect(page.getByTestId('register-error')).toContainText(
      'Password must be at least 8 characters.',
    ) // Updated to 8 characters
  })

  test('registration shows error for invalid email', async ({ page }) => {
    await page.goto('/#tasks') // Navigate to tasks page directly
    await page.getByTestId('login-form').waitFor({ state: 'visible' }) 
    await page.getByTestId('go-to-register').click()
    await page.getByTestId('register-name').fill('Test User')
    await page.getByTestId('register-email').fill('not-an-email')
    await page.getByTestId('register-password').fill('ValidPass123!')
    await page.getByTestId('register-submit').click()
    await expect(page.getByTestId('register-error')).toContainText(
      'Please enter a valid email address',
    )
  })

  test('registration shows error for empty name', async ({ page }) => {
    await page.goto('/#tasks') // Navigate to tasks page directly
    await page.getByTestId('login-form').waitFor({ state: 'visible' }) 
    await page.getByTestId('go-to-register').click()
    await page.getByTestId('register-name').fill('')
    await page.getByTestId('register-email').fill('valid@test.com')
    await page.getByTestId('register-password').fill('ValidPass123!')
    await page.getByTestId('register-submit').click()
    await expect(page.getByTestId('register-error')).toContainText(
      'Full name is required.',
    )
  })

  test('login shows error for empty credentials', async ({ page }) => {
    await page.goto('/#tasks') // Navigate to tasks page directly
    await page.getByTestId('login-form').waitFor({ state: 'visible' }) 
    await page.getByTestId('login-submit').click()

    await expect(page.getByTestId('login-error')).toContainText('required')
  })

  test('create task shows error for missing title', async ({ page }) => {
    await loginUser(page)
    await page.getByTestId('new-task-button').click()
    await page.getByTestId('create-task-modal').waitFor({ state: 'visible' }) // Explicit wait for create task modal

    await page.getByTestId('task-due-date').fill('2026-12-31')
    await page.getByTestId('create-task-submit').click()
    await expect(page.getByTestId('create-task-error')).toContainText(
      'Title is required',
    )
  })

  test('create task shows error for missing due date', async ({ page }) => {
    await loginUser(page)
    await page.getByTestId('new-task-button').click()
    await page.getByTestId('create-task-modal').waitFor({ state: 'visible' }) // Explicit wait for create task modal

    await page.getByTestId('task-title').fill('Test Task')
    await page.getByTestId('create-task-submit').click()
    await expect(page.getByTestId('create-task-error')).toContainText(
      'Due Date is required',
    )
  })

  test('cancel create task closes modal without creating', async ({ page }) => {
    await loginUser(page)
    await page.getByTestId('new-task-button').click()
    await page.getByTestId('create-task-modal').waitFor({ state: 'visible' }) // Explicit wait for create task modal

    await page.getByTestId('task-title').fill('Task to be cancelled')
    await page.getByTestId('close-create-task').click()
    await expect(page.getByTestId('create-task-modal')).toBeHidden()
    await expect(page.locator('text=Task to be cancelled')).not.toBeVisible()
  })
})
