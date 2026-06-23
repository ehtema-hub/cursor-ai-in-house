export type SettingsTab = 'profile' | 'notifications' | 'privacy' | 'appearance'

export type ThemePreference = 'light' | 'dark' | 'system'
export type NotificationFrequency = 'immediate' | 'daily' | 'weekly'
export type ProfileVisibility = 'public' | 'friends' | 'private'
export type FontSize = 'small' | 'medium' | 'large'

export interface ProfileSettings {
  fullName: string
  email: string
  phone: string
  country: string
}

export interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  frequency: NotificationFrequency
}

export interface PrivacySettings {
  profileVisibility: ProfileVisibility
  dataSharing: boolean
  twoFactorAuth: boolean
}

export interface AppearanceSettings {
  theme: ThemePreference
  fontSize: FontSize
  compactMode: boolean
}

export interface SettingsState {
  profile: ProfileSettings
  notifications: NotificationSettings
  privacy: PrivacySettings
  appearance: AppearanceSettings
}

export type SettingsErrors<T> = Partial<Record<keyof T, string>>
