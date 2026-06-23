import type { SettingsState } from '@/types/settings'

export const defaultSettings: SettingsState = {
  profile: {
    fullName: 'Jordan Lee',
    email: 'jordan@taskflow.app',
    phone: '+1 (555) 123-4567',
    country: 'US',
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: false,
    frequency: 'daily',
  },
  privacy: {
    profileVisibility: 'friends',
    dataSharing: false,
    twoFactorAuth: true,
  },
  appearance: {
    theme: 'system',
    fontSize: 'medium',
    compactMode: false,
  },
}
