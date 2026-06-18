import { BasePage } from '../base/BasePage'
import { type Page } from '@playwright/test'

export class RegisterPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async fillStep1(data: { firstName: string; lastName: string; email: string; phone: string }) {
    await this.assertVisible('multi-step-register')
    await this.fill('register-first-name', data.firstName)
    await this.fill('register-last-name', data.lastName)
    await this.fill('register-email', data.email)
    await this.fill('register-phone', data.phone)
    await this.click('register-next')
    await this.assertVisible('register-step-panel-2')
  }

  async fillStep2(password: string) {
    await this.fill('register-password', password)
    await this.fill('register-confirm-password', password)
    await this.click('register-next')
    await this.assertVisible('register-step-panel-3')
  }

  async fillStep3(acceptTerms = true) {
    if (acceptTerms) await this.locator('register-terms').check()
    await this.click('register-submit')
  }

  async register(user: { name: string; email: string; password: string; phone?: string }) {
    const [firstName, ...rest] = user.name.split(' ')
    const lastName = rest.join(' ') || 'User'
    await this.fillStep1({
      firstName,
      lastName,
      email: user.email,
      phone: user.phone || '5551234567',
    })
    await this.fillStep2(user.password)
    await this.fillStep3(true)
  }
}
