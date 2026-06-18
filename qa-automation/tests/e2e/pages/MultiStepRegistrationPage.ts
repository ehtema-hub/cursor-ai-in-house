import { type Page, expect, type Locator } from '@playwright/test'
import type {
  RegistrationData,
  RegistrationStep1,
  RegistrationStep2,
  RegistrationStep3,
} from '../helpers/registration'

export class MultiStepRegistrationPage {
  readonly page: Page
  readonly container: Locator
  readonly firstName: Locator
  readonly lastName: Locator
  readonly email: Locator
  readonly phone: Locator
  readonly password: Locator
  readonly confirmPassword: Locator
  readonly company: Locator
  readonly terms: Locator
  readonly nextButton: Locator
  readonly previousButton: Locator
  readonly submitButton: Locator
  readonly successMessage: Locator
  readonly submitError: Locator

  constructor(page: Page) {
    this.page = page
    this.container = page.getByTestId('multi-step-register')
    this.firstName = page.getByTestId('register-first-name')
    this.lastName = page.getByTestId('register-last-name')
    this.email = page.getByTestId('register-email')
    this.phone = page.getByTestId('register-phone')
    this.password = page.getByTestId('register-password')
    this.confirmPassword = page.getByTestId('register-confirm-password')
    this.company = page.getByTestId('register-company')
    this.terms = page.getByTestId('register-terms')
    this.nextButton = page.getByTestId('register-next')
    this.previousButton = page.getByTestId('register-previous')
    this.submitButton = page.getByTestId('register-submit')
    this.successMessage = page.getByTestId('register-success-message')
    this.submitError = page.getByTestId('register-submit-error')
  }

  stepPanel(step: 1 | 2 | 3) {
    return this.page.getByTestId(`register-step-panel-${step}`)
  }

  fieldError(field: string) {
    return this.page.getByTestId(`register-error-${field}`)
  }

  async goto() {
    await this.page.goto('/#tasks')
    await this.page.getByTestId('login-form').waitFor({ state: 'visible' })
    await this.page.getByTestId('go-to-register').click()
    await expect(this.container).toBeVisible()
    await this.expectActiveStep(1)
  }

  async expectActiveStep(step: 1 | 2 | 3) {
    await expect(this.stepPanel(step)).toBeVisible()
  }

  async fillStep1(data: Partial<RegistrationStep1>) {
    if (data.firstName !== undefined) await this.firstName.fill(data.firstName)
    if (data.lastName !== undefined) await this.lastName.fill(data.lastName)
    if (data.email !== undefined) await this.email.fill(data.email)
    if (data.phone !== undefined) await this.phone.fill(data.phone)
  }

  async fillStep2(data: Partial<RegistrationStep2>) {
    if (data.password !== undefined) await this.password.fill(data.password)
    if (data.confirmPassword !== undefined) {
      await this.confirmPassword.fill(data.confirmPassword)
    }
  }

  async fillStep3(data: Partial<RegistrationStep3>) {
    if (data.company !== undefined) await this.company.fill(data.company)
    if (data.acceptTerms !== undefined) {
      await this.terms.setChecked(data.acceptTerms)
    }
  }

  async fillAllSteps(data: RegistrationData) {
    await this.fillStep1(data)
    await this.goNext()
    await this.fillStep2(data)
    await this.goNext()
    await this.fillStep3(data)
  }

  async goNext() {
    await this.nextButton.click()
  }

  async goPrevious() {
    await this.previousButton.click()
  }

  async submit() {
    await this.submitButton.click()
  }

  async completeRegistration(data: RegistrationData) {
    await this.fillAllSteps(data)
    await this.submit()
  }

  async expectFieldValue(locator: Locator, value: string) {
    if (locator === this.terms) {
      if (value === 'true') await expect(this.terms).toBeChecked()
      else await expect(this.terms).not.toBeChecked()
      return
    }
    await expect(locator).toHaveValue(value)
  }

  async expectFieldError(field: string, message: string | RegExp) {
    const error = this.fieldError(field)
    await expect(error).toBeVisible()
    await expect(error).toHaveAttribute('role', 'alert')
    await expect(error).toContainText(message)
  }

  async expectFieldInvalid(fieldTestId: string) {
    await expect(this.page.getByTestId(fieldTestId)).toHaveAttribute('aria-invalid', 'true')
  }

  async expectCannotAdvanceFrom(step: 1 | 2 | 3) {
    await this.goNext()
    await this.expectActiveStep(step)
  }
}
