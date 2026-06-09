export const FIELD_LIMITS = {
  firstName: { min: 2, max: 50 },
  lastName: { min: 2, max: 50 },
  password: { min: 8, max: 128 },
  phone: { min: 10, max: 15 },
} as const

export type RegistrationFieldErrors = Partial<
  Record<
    | 'first-name'
    | 'last-name'
    | 'email'
    | 'phone'
    | 'password'
    | 'confirm-password'
    | 'terms',
    string
  >
>

function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}

export function validateStep1(data: {
  firstName: string
  lastName: string
  email: string
  phone: string
}): RegistrationFieldErrors {
  const errors: RegistrationFieldErrors = {}

  if (!data.firstName.trim()) {
    errors['first-name'] = 'First name is required.'
  } else if (data.firstName.trim().length < FIELD_LIMITS.firstName.min) {
    errors['first-name'] = `First name must be at least ${FIELD_LIMITS.firstName.min} characters.`
  } else if (data.firstName.trim().length > FIELD_LIMITS.firstName.max) {
    errors['first-name'] = `First name must be no more than ${FIELD_LIMITS.firstName.max} characters.`
  }

  if (!data.lastName.trim()) {
    errors['last-name'] = 'Last name is required.'
  } else if (data.lastName.trim().length < FIELD_LIMITS.lastName.min) {
    errors['last-name'] = `Last name must be at least ${FIELD_LIMITS.lastName.min} characters.`
  } else if (data.lastName.trim().length > FIELD_LIMITS.lastName.max) {
    errors['last-name'] = `Last name must be no more than ${FIELD_LIMITS.lastName.max} characters.`
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = 'Please enter a valid email address.'
  }

  const phoneDigits = digitsOnly(data.phone)
  if (!data.phone.trim()) {
    errors.phone = 'Phone number is required.'
  } else if (phoneDigits.length < FIELD_LIMITS.phone.min) {
    errors.phone = 'Please enter a valid phone number with 10 digits.'
  }

  return errors
}

export function validateStep2(data: {
  password: string
  confirmPassword: string
}): RegistrationFieldErrors {
  const errors: RegistrationFieldErrors = {}

  if (!data.password) {
    errors.password = 'Password is required.'
  } else if (data.password.length < FIELD_LIMITS.password.min) {
    errors.password = 'Password must be at least 8 characters.'
  }

  if (!data.confirmPassword) {
    errors['confirm-password'] = 'Confirm password is required.'
  } else if (
    data.password &&
    data.confirmPassword &&
    data.password !== data.confirmPassword
  ) {
    errors['confirm-password'] = 'Passwords do not match.'
  }

  return errors
}

export function validateStep3(data: { acceptTerms: boolean }): RegistrationFieldErrors {
  const errors: RegistrationFieldErrors = {}

  if (!data.acceptTerms) {
    errors.terms = 'Please accept the terms and conditions.'
  }

  return errors
}
