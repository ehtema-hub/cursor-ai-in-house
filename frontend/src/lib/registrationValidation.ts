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

function validateRequiredName(
  value: string,
  label: string,
  limits: { min: number; max: number },
): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return `${label} is required.`
  if (trimmed.length < limits.min) {
    return `${label} must be at least ${limits.min} characters.`
  }
  if (trimmed.length > limits.max) {
    return `${label} must be no more than ${limits.max} characters.`
  }
  return undefined
}

function validateEmail(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'Please enter a valid email address.'
  }
  return undefined
}

function validatePhone(value: string): string | undefined {
  if (!value.trim()) return 'Phone number is required.'
  if (digitsOnly(value).length < FIELD_LIMITS.phone.min) {
    return 'Please enter a valid phone number with 10 digits.'
  }
  return undefined
}

export function validateStep1(data: {
  firstName: string
  lastName: string
  email: string
  phone: string
}): RegistrationFieldErrors {
  const errors: RegistrationFieldErrors = {}

  const firstNameError = validateRequiredName(
    data.firstName,
    'First name',
    FIELD_LIMITS.firstName,
  )
  if (firstNameError) errors['first-name'] = firstNameError

  const lastNameError = validateRequiredName(
    data.lastName,
    'Last name',
    FIELD_LIMITS.lastName,
  )
  if (lastNameError) errors['last-name'] = lastNameError

  const emailError = validateEmail(data.email)
  if (emailError) errors.email = emailError

  const phoneError = validatePhone(data.phone)
  if (phoneError) errors.phone = phoneError

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
