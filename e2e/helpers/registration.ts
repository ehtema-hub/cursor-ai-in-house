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

const USERS_KEY = 'taskflow_users'

/** Seeds a user in localStorage to simulate duplicate-email submission failures. */
export async function seedRegisteredUser(page: Page, data: RegistrationData) {
  await page.evaluate(
    ({ key, user }) => {
      const users = JSON.parse(localStorage.getItem(key) || '[]') as Array<{
        id: string
        name: string
        email: string
        password: string
      }>
      users.push({
        id: 'seed-user',
        name: `${user.firstName} ${user.lastName}`,
        email: user.email.trim().toLowerCase(),
        password: user.password,
      })
      localStorage.setItem(key, JSON.stringify(users))
    },
    { key: USERS_KEY, user: data },
  )
}
