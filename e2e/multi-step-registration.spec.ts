import { test, expect } from '@playwright/test'
import { clearAppStorage } from './helpers/auth'
import { MultiStepRegistrationPage } from './pages/MultiStepRegistrationPage'
import {
  FIELD_LIMITS,
  INVALID_FORMATS,
  REGISTRATION_FIELD_IDS,
  VALID_REGISTRATION,
  VALID_STEP_1,
  VALID_STEP_2,
  VALID_STEP_3,
  seedRegisteredUser,
} from './helpers/registration'

const viewports = [
  { label: 'desktop', width: 1280, height: 720 },
  { label: 'mobile', width: 375, height: 667 },
] as const

for (const viewport of viewports) {
  test.describe(`Multi-Step Registration — ${viewport.label}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    let registrationPage: MultiStepRegistrationPage

    test.beforeEach(async ({ page }) => {
      await clearAppStorage(page)
      registrationPage = new MultiStepRegistrationPage(page)
      await registrationPage.goto()
    })

    test('validates required fields on step 1', async () => {
      await registrationPage.expectCannotAdvanceFrom(1)
      await registrationPage.expectFieldError('first-name', /required/i)
      await registrationPage.expectFieldError('last-name', /required/i)
      await registrationPage.expectFieldError('email', /required/i)
      await registrationPage.expectFieldError('phone', /required/i)
    })

    test('validates required fields on step 2', async () => {
      await registrationPage.fillStep1(VALID_STEP_1)
      await registrationPage.goNext()
      await registrationPage.expectActiveStep(2)

      await registrationPage.expectCannotAdvanceFrom(2)
      await registrationPage.expectFieldError('password', /required/i)
      await registrationPage.expectFieldError('confirm-password', /required/i)
    })

    test('validates required fields on step 3', async () => {
      await registrationPage.fillStep1(VALID_STEP_1)
      await registrationPage.goNext()
      await registrationPage.fillStep2(VALID_STEP_2)
      await registrationPage.goNext()
      await registrationPage.expectActiveStep(3)

      await registrationPage.submit()
      await registrationPage.expectActiveStep(3)
      await registrationPage.expectFieldError('terms', /required|accept/i)
    })

    test('validates input formats for email, phone, and password', async () => {
      await registrationPage.fillStep1({
        ...VALID_STEP_1,
        email: INVALID_FORMATS.email,
        phone: INVALID_FORMATS.phone,
      })
      await registrationPage.expectCannotAdvanceFrom(1)
      await registrationPage.expectFieldError('email', /valid email/i)
      await registrationPage.expectFieldError('phone', /valid phone|10 digit/i)

      await registrationPage.fillStep1(VALID_STEP_1)
      await registrationPage.goNext()
      await registrationPage.fillStep2({
        password: INVALID_FORMATS.password,
        confirmPassword: INVALID_FORMATS.password,
      })
      await registrationPage.expectCannotAdvanceFrom(2)
      await registrationPage.expectFieldError('password', /at least 8 characters/i)
    })

    test('validates minimum and maximum length requirements', async () => {
      await registrationPage.fillStep1({
        ...VALID_STEP_1,
        firstName: 'J',
        lastName: 'S',
      })
      await registrationPage.expectCannotAdvanceFrom(1)
      await registrationPage.expectFieldError(
        'first-name',
        new RegExp(`at least ${FIELD_LIMITS.firstName.min}`, 'i'),
      )
      await registrationPage.expectFieldError(
        'last-name',
        new RegExp(`at least ${FIELD_LIMITS.lastName.min}`, 'i'),
      )

      const longName = 'A'.repeat(FIELD_LIMITS.firstName.max + 1)
      await registrationPage.fillStep1({
        ...VALID_STEP_1,
        firstName: longName,
      })
      await registrationPage.expectCannotAdvanceFrom(1)
      await registrationPage.expectFieldError(
        'first-name',
        new RegExp(`no more than ${FIELD_LIMITS.firstName.max}`, 'i'),
      )
    })

    test('allows navigation to the next step when inputs are valid', async () => {
      await registrationPage.fillStep1(VALID_STEP_1)
      await registrationPage.goNext()
      await registrationPage.expectActiveStep(2)

      await registrationPage.fillStep2(VALID_STEP_2)
      await registrationPage.goNext()
      await registrationPage.expectActiveStep(3)
    })

    test('blocks navigation when validation errors exist', async () => {
      await registrationPage.fillStep1({ ...VALID_STEP_1, email: INVALID_FORMATS.email })
      await registrationPage.expectCannotAdvanceFrom(1)
      await expect(registrationPage.fieldError('email')).toBeVisible()
    })

    test('previous button preserves entered data across steps', async () => {
      await registrationPage.fillStep1(VALID_STEP_1)
      await registrationPage.goNext()
      await registrationPage.fillStep2(VALID_STEP_2)
      await registrationPage.goPrevious()

      await registrationPage.expectActiveStep(1)
      await registrationPage.expectFieldValue(registrationPage.firstName, VALID_STEP_1.firstName)
      await registrationPage.expectFieldValue(registrationPage.lastName, VALID_STEP_1.lastName)
      await registrationPage.expectFieldValue(registrationPage.email, VALID_STEP_1.email)
      await registrationPage.expectFieldValue(registrationPage.phone, VALID_STEP_1.phone)

      await registrationPage.goNext()
      await registrationPage.expectActiveStep(2)
      await registrationPage.expectFieldValue(registrationPage.password, VALID_STEP_2.password)
      await registrationPage.expectFieldValue(
        registrationPage.confirmPassword,
        VALID_STEP_2.confirmPassword,
      )
    })

    test('completes registration and reaches success state', async () => {
      await registrationPage.completeRegistration(VALID_REGISTRATION)

      await expect(registrationPage.successMessage).toBeVisible()
      await expect(registrationPage.successMessage).toContainText(/success|welcome|created/i)
      await expect(registrationPage.page.getByTestId('new-task-button')).toBeVisible()
    })

    test('shows submission error when email is already registered', async () => {
      await seedRegisteredUser(registrationPage.page, VALID_REGISTRATION)
      await registrationPage.completeRegistration(VALID_REGISTRATION)

      await expect(registrationPage.submitError).toBeVisible()
      await expect(registrationPage.submitError).toHaveAttribute('role', 'alert')
      await expect(registrationPage.submitError).toContainText(/already exists/i)
    })

    test('shows inline validation messages for invalid inputs', async () => {
      await registrationPage.fillStep1({ ...VALID_STEP_1, email: 'bad-email' })
      await registrationPage.goNext()

      await registrationPage.expectFieldError('email', /valid email/i)
      await registrationPage.expectFieldInvalid('register-email')
    })

    test('displays success message after successful registration', async () => {
      const uniqueUser = {
        ...VALID_REGISTRATION,
        email: `success-${Date.now()}@example.com`,
      }

      await registrationPage.completeRegistration(uniqueUser)

      await expect(registrationPage.successMessage).toBeVisible()
      await expect(registrationPage.successMessage).toContainText(/success|welcome|account created/i)
    })
  })

  test.describe(`Multi-Step Registration Accessibility — ${viewport.label}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    let registrationPage: MultiStepRegistrationPage

    test.beforeEach(async ({ page }) => {
      await clearAppStorage(page)
      registrationPage = new MultiStepRegistrationPage(page)
      await registrationPage.goto()
    })

    test('all form fields have associated labels', async ({ page }) => {
      for (const testId of REGISTRATION_FIELD_IDS) {
        const input = page.getByTestId(testId)
        if (!(await input.isVisible())) continue

        const id = await input.getAttribute('id')
        expect(id, `${testId} should have an id for label association`).toBeTruthy()

        const label = page.locator(`label[for="${id}"]`)
        await expect(label).toBeVisible()
      }
    })

    test('required fields are properly announced', async ({ page }) => {
      const requiredFields = [
        'register-first-name',
        'register-last-name',
        'register-email',
        'register-phone',
      ]

      for (const testId of requiredFields) {
        const field = page.getByTestId(testId)
        const hasRequired =
          (await field.getAttribute('required')) !== null ||
          (await field.getAttribute('aria-required')) === 'true'
        expect(hasRequired, `${testId} should be marked required`).toBe(true)
      }
    })

    test('validation errors use appropriate ARIA attributes', async () => {
      await registrationPage.goNext()
      await registrationPage.expectFieldError('first-name', /required/i)
      await registrationPage.expectFieldInvalid('register-first-name')

      const describedBy = await registrationPage.firstName.getAttribute('aria-describedby')
      expect(describedBy).toBeTruthy()
    })

    test('error messages are announced to screen readers', async () => {
      await registrationPage.fillStep1({ ...VALID_STEP_1, email: INVALID_FORMATS.email })
      await registrationPage.goNext()

      const emailError = registrationPage.fieldError('email')
      await expect(emailError).toHaveAttribute('role', 'alert')
      await expect(emailError).toHaveAttribute('aria-live', 'polite')
    })

    test('supports keyboard-only navigation through all steps', async ({ page }) => {
      await registrationPage.firstName.focus()
      await expect(registrationPage.firstName).toBeFocused()

      await registrationPage.fillStep1(VALID_STEP_1)
      await registrationPage.nextButton.focus()
      await page.keyboard.press('Enter')
      await registrationPage.expectActiveStep(2)

      await registrationPage.fillStep2(VALID_STEP_2)
      await registrationPage.nextButton.focus()
      await page.keyboard.press('Enter')
      await registrationPage.expectActiveStep(3)

      await registrationPage.fillStep3(VALID_STEP_3)
      await registrationPage.previousButton.focus()
      await page.keyboard.press('Enter')
      await registrationPage.expectActiveStep(2)

      await registrationPage.expectFieldValue(registrationPage.password, VALID_STEP_2.password)
    })
  })
}
