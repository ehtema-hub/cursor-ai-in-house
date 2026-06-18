import { type Page, type Locator, expect } from '@playwright/test'

/**
 * Base Page Object — shared navigation, waits, and assertions.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path = '/') {
    await this.page.goto(path)
    await this.page.waitForLoadState('domcontentloaded')
  }

  async clearStorage() {
    await this.goto('/')
    await this.page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  }

  protected locator(testId: string): Locator {
    return this.page.getByTestId(testId)
  }

  async assertVisible(testId: string, message?: string) {
    await expect(this.locator(testId), message).toBeVisible()
  }

  async assertText(testId: string, text: string | RegExp) {
    await expect(this.locator(testId)).toContainText(text)
  }

  async fill(testId: string, value: string) {
    await this.locator(testId).fill(value)
  }

  async click(testId: string) {
    await this.locator(testId).click()
  }
}
