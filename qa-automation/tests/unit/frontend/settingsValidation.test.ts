import {
  hasErrors,
  validateAppearance,
  validateNotifications,
  validatePrivacy,
  validateProfile,
} from '@/components/settings/settingsValidation'

describe('settingsValidation', () => {
  it('validateProfile requires full name and email', () => {
    const errors = validateProfile({
      fullName: '',
      email: '',
      phone: '',
      country: '',
    })
    expect(errors.fullName).toBeDefined()
    expect(errors.email).toBeDefined()
    expect(errors.country).toBeDefined()
  })

  it('validates phone format when provided', () => {
    const errors = validateProfile({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '!!!',
      country: 'US',
    })
    expect(errors.phone).toBeDefined()
  })

  it('passes valid profile', () => {
    expect(
      validateProfile({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+1 555 123 4567',
        country: 'US',
      }),
    ).toEqual({})
  })

  it('validateNotifications requires a channel', () => {
    const errors = validateNotifications({
      emailNotifications: false,
      pushNotifications: false,
      frequency: 'daily',
    })
    expect(errors.frequency).toBeDefined()
  })

  it('validateNotifications passes when channel enabled', () => {
    expect(
      validateNotifications({
        emailNotifications: true,
        pushNotifications: false,
        frequency: 'daily',
      }),
    ).toEqual({})
  })

  it('validatePrivacy requires visibility', () => {
    const errors = validatePrivacy({
      profileVisibility: '' as never,
      dataSharing: false,
      twoFactorAuth: false,
    })
    expect(errors.profileVisibility).toBeDefined()
  })

  it('validateAppearance requires theme and font size', () => {
    const errors = validateAppearance({
      theme: '' as never,
      fontSize: '' as never,
      compactMode: false,
    })
    expect(errors.theme).toBeDefined()
    expect(errors.fontSize).toBeDefined()
  })

  it('hasErrors returns true when errors exist', () => {
    expect(hasErrors({ fullName: 'required' })).toBe(true)
    expect(hasErrors({})).toBe(false)
  })
})
