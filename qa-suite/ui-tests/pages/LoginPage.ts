import { type Page, expect } from '@playwright/test'
import { BasePage } from '../base/BasePage'

export class LoginPage extends BasePage {
  static readonly PATH = '/#tasks'

  constructor(page: Page) {
    super(page)
  }

  async open() {
    await this.goto(LoginPage.PATH)
    await this.assertVisible('login-form', 'Login form should be visible')
  }

  async login(email: string, password: string) {
    await this.fill('login-email', email)
    await this.fill('login-password', password)
    await this.click('login-submit')
  }

  async expectLoginError(message: string | RegExp) {
    await this.assertText('login-error', message)
  }

  async expectOnLoginScreen() {
    await this.assertVisible('login-form')
  }

  async goToRegister() {
    await this.click('go-to-register')
    await this.assertVisible('multi-step-register')
  }

  async assertInvalidCredentials() {
    await expect(this.locator('login-error')).toContainText('Invalid email or password')
  }
}
