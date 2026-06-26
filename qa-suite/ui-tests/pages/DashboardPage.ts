import { type Page, expect } from '@playwright/test'
import { BasePage } from '../base/BasePage'

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async assertLoaded() {
    await this.page.waitForURL('**/#tasks')
    await this.page.waitForLoadState('networkidle')
    await this.assertVisible('new-task-button', 'Task dashboard should be loaded')
  }

  async openUserMenu() {
    await this.assertVisible('user-menu-button')
    await this.click('user-menu-button')
    await expect(this.locator('logout-button')).toBeVisible()
  }

  async logout() {
    await this.openUserMenu()
    await this.click('logout-button')
    await this.assertVisible('login-form', 'Should return to login after logout')
  }

  async createTask(title: string) {
    await this.click('new-task-button')
    await this.fill('task-title-input', title)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 1)
    const dueDateValue = dueDate.toISOString().split('T')[0]
    await this.fill('task-due-date-input', dueDateValue)
    const createResponse = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/tasks/') && response.request().method() === 'POST',
    )
    await this.click('submit-create-task')
    await createResponse
    await expect(this.page.getByRole('heading', { name: title })).toBeVisible({
      timeout: 15_000,
    })
  }

  async navigateToAnalytics() {
    await this.page.getByRole('link', { name: 'Analytics' }).click()
    await expect(this.page.getByRole('heading', { name: /Analytics Dashboard/i })).toBeVisible()
  }
}
