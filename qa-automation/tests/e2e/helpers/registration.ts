import { type Page } from '@playwright/test'

export type RegistrationStep1 = {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export type RegistrationStep2 = {
  password: string
  confirmPassword: string
}

export type RegistrationStep3 = {
  company?: string
  acceptTerms: boolean
}

export type RegistrationData = RegistrationStep1 & RegistrationStep2 & RegistrationStep3

export const FIELD_LIMITS = {
  firstName: { min: 2, max: 50 },
  lastName: { min: 2, max: 50 },
  password: { min: 8, max: 128 },
  phone: { min: 10, max: 15 },
} as const

export const VALID_STEP_1: RegistrationStep1 = {
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane.smith@example.com',
  phone: '5551234567',
}

export const VALID_STEP_2: RegistrationStep2 = {
  password: 'SecurePass123!',
  confirmPassword: 'SecurePass123!',
}

export const VALID_STEP_3: RegistrationStep3 = {
  company: 'Acme Corp',
  acceptTerms: true,
}

export const VALID_REGISTRATION: RegistrationData = {
  ...VALID_STEP_1,
  ...VALID_STEP_2,
  ...VALID_STEP_3,
}

export const INVALID_FORMATS = {
  email: 'not-an-email',
  phone: '123',
  password: 'short',
} as const

export const REGISTRATION_FIELD_IDS = [
  'register-first-name',
  'register-last-name',
  'register-email',
  'register-phone',
  'register-password',
  'register-confirm-password',
  'register-company',
  'register-terms',
] as const

/** Seeds a user via the backend API to simulate duplicate-email submission failures. */
export async function seedRegisteredUser(page: Page, data: RegistrationData) {
  const name = `${data.firstName} ${data.lastName}`.trim()
  const response = await page.request.post('/api/auth/register', {
    data: {
      name,
      email: data.email,
      password: data.password,
    },
  })
  if (!response.ok() && response.status() !== 409) {
    throw new Error(`Failed to seed user: ${response.status()} ${await response.text()}`)
  }
}
