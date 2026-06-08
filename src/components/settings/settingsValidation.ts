import type {
  AppearanceSettings,
  NotificationSettings,
  PrivacySettings,
  ProfileSettings,
  SettingsErrors,
} from '@/types/settings'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^[+]?[\d\s()-]{7,}$/

export function validateProfile(
  profile: ProfileSettings,
): SettingsErrors<ProfileSettings> {
  const errors: SettingsErrors<ProfileSettings> = {}

  if (!profile.fullName.trim()) {
    errors.fullName = 'Full name is required.'
  } else if (profile.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.'
  }

  if (!profile.email.trim()) {
    errors.email = 'Email address is required.'
  } else if (!EMAIL_PATTERN.test(profile.email)) {
    errors.email = 'Please enter a valid email address.'
  }

  if (profile.phone.trim() && !PHONE_PATTERN.test(profile.phone)) {
    errors.phone = 'Please enter a valid phone number.'
  }

  if (!profile.country) {
    errors.country = 'Please select a country.'
  }

  return errors
}

export function validateNotifications(
  settings: NotificationSettings,
): SettingsErrors<NotificationSettings> {
  const errors: SettingsErrors<NotificationSettings> = {}

  if (!settings.emailNotifications && !settings.pushNotifications) {
    errors.frequency =
      'Enable at least one notification channel or adjust frequency.'
  }

  return errors
}

export function validatePrivacy(
  settings: PrivacySettings,
): SettingsErrors<PrivacySettings> {
  const errors: SettingsErrors<PrivacySettings> = {}

  if (!settings.profileVisibility) {
    errors.profileVisibility = 'Please select a visibility option.'
  }

  return errors
}

export function validateAppearance(
  settings: AppearanceSettings,
): SettingsErrors<AppearanceSettings> {
  const errors: SettingsErrors<AppearanceSettings> = {}

  if (!settings.theme) {
    errors.theme = 'Please select a theme preference.'
  }

  if (!settings.fontSize) {
    errors.fontSize = 'Please select a font size.'
  }

  return errors
}

export function hasErrors<T extends object>(errors: SettingsErrors<T>): boolean {
  return Object.keys(errors).length > 0
}
