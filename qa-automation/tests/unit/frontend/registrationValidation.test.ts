import {
  validateStep1,
  validateStep2,
  validateStep3,
} from '@/lib/registrationValidation'

describe('validateStep1', () => {
  const valid = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    phone: '5551234567',
  }

  it('returns no errors for valid data', () => {
    expect(validateStep1(valid)).toEqual({})
  })

  it('requires first name', () => {
    expect(validateStep1({ ...valid, firstName: '' })['first-name']).toBeDefined()
  })

  it('rejects invalid email', () => {
    expect(validateStep1({ ...valid, email: 'not-an-email' }).email).toBeDefined()
  })

  it('requires at least 10 phone digits', () => {
    expect(validateStep1({ ...valid, phone: '123' }).phone).toBeDefined()
  })
})

describe('validateStep2', () => {
  it('requires matching passwords', () => {
    const errors = validateStep2({
      password: 'password123',
      confirmPassword: 'different',
    })
    expect(errors['confirm-password']).toBe('Passwords do not match.')
  })

  it('requires minimum password length', () => {
    const errors = validateStep2({ password: 'short', confirmPassword: 'short' })
    expect(errors.password).toContain('8 characters')
  })
})

describe('validateStep3', () => {
  it('requires terms acceptance', () => {
    expect(validateStep3({ acceptTerms: false }).terms).toBeDefined()
  })
})
