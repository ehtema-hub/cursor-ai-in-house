import {
  TextInput,
  Select,
  Toggle,
  RadioGroup,
  TabActions,
} from './FormControls'
import type {
  AppearanceSettings,
  NotificationSettings,
  PrivacySettings,
  SettingsState,
  SettingsTab,
} from '@/types/settings'
import type {
  validateAppearance,
  validateNotifications,
  validatePrivacy,
  validateProfile,
} from './settingsValidation'

const COUNTRY_OPTIONS = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'IN', label: 'India' },
  { value: 'JP', label: 'Japan' },
]

const FREQUENCY_OPTIONS = [
  { value: 'immediate', label: 'Immediately' },
  { value: 'daily', label: 'Daily digest' },
  { value: 'weekly', label: 'Weekly summary' },
]

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'friends', label: 'Friends only' },
  { value: 'private', label: 'Private' },
]

const FONT_SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
]

const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

interface ActiveSettingsTabProps {
  activeTab: SettingsTab
  draft: SettingsState
  profileErrors: ReturnType<typeof validateProfile>
  notificationErrors: ReturnType<typeof validateNotifications>
  privacyErrors: ReturnType<typeof validatePrivacy>
  appearanceErrors: ReturnType<typeof validateAppearance>
  updateDraft: <K extends keyof SettingsState>(
    section: K,
    values: Partial<SettingsState[K]>,
  ) => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
}

export function ActiveSettingsTab({
  activeTab,
  draft,
  profileErrors,
  notificationErrors,
  privacyErrors,
  appearanceErrors,
  updateDraft,
  onSave,
  onCancel,
  isSaving,
}: ActiveSettingsTabProps) {
  const actions = (
    <TabActions onSave={onSave} onCancel={onCancel} isSaving={isSaving} />
  )

  if (activeTab === 'profile') {
    return (
      <>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Update your personal information.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextInput
              label="Full Name"
              value={draft.profile.fullName}
              onChange={(event) => updateDraft('profile', { fullName: event.target.value })}
              error={profileErrors.fullName}
              placeholder="Enter your full name"
              autoComplete="name"
            />
          </div>
          <TextInput
            label="Email"
            type="email"
            value={draft.profile.email}
            onChange={(event) => updateDraft('profile', { email: event.target.value })}
            error={profileErrors.email}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <TextInput
            label="Phone Number"
            type="tel"
            value={draft.profile.phone}
            onChange={(event) => updateDraft('profile', { phone: event.target.value })}
            error={profileErrors.phone}
            placeholder="+1 (555) 000-0000"
            autoComplete="tel"
          />
          <div className="sm:col-span-2">
            <Select
              label="Country"
              value={draft.profile.country}
              options={COUNTRY_OPTIONS}
              onChange={(value) => updateDraft('profile', { country: value })}
              error={profileErrors.country}
            />
          </div>
        </div>
        {actions}
      </>
    )
  }

  if (activeTab === 'notifications') {
    return (
      <>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Choose how and when you receive updates.
          </p>
        </div>
        <div className="space-y-4">
          <Toggle
            label="Email Notifications"
            description="Receive task updates and reminders via email."
            checked={draft.notifications.emailNotifications}
            onChange={(checked) =>
              updateDraft('notifications', { emailNotifications: checked })
            }
          />
          <Toggle
            label="Push Notifications"
            description="Get real-time alerts on your device."
            checked={draft.notifications.pushNotifications}
            onChange={(checked) =>
              updateDraft('notifications', { pushNotifications: checked })
            }
          />
          <Select
            label="Notification Frequency"
            value={draft.notifications.frequency}
            options={FREQUENCY_OPTIONS}
            onChange={(value) =>
              updateDraft('notifications', {
                frequency: value as NotificationSettings['frequency'],
              })
            }
            error={notificationErrors.frequency}
            hint="How often you receive non-urgent notification digests."
          />
        </div>
        {actions}
      </>
    )
  }

  if (activeTab === 'privacy') {
    return (
      <>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Control your data and account security.
          </p>
        </div>
        <div className="space-y-4">
          <Select
            label="Profile Visibility"
            value={draft.privacy.profileVisibility}
            options={VISIBILITY_OPTIONS}
            onChange={(value) =>
              updateDraft('privacy', {
                profileVisibility: value as PrivacySettings['profileVisibility'],
              })
            }
            error={privacyErrors.profileVisibility}
            hint="Who can view your profile and activity."
          />
          <Toggle
            label="Data Sharing"
            description="Share anonymized usage data to help improve TaskFlow."
            checked={draft.privacy.dataSharing}
            onChange={(checked) => updateDraft('privacy', { dataSharing: checked })}
          />
          <Toggle
            label="Two-Factor Authentication"
            description="Add an extra layer of security to your account."
            checked={draft.privacy.twoFactorAuth}
            onChange={(checked) => updateDraft('privacy', { twoFactorAuth: checked })}
          />
        </div>
        {actions}
      </>
    )
  }

  return (
    <>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Customize how TaskFlow looks and feels.
        </p>
      </div>
      <div className="space-y-6">
        <RadioGroup
          label="Theme"
          name="theme"
          value={draft.appearance.theme}
          options={THEME_OPTIONS}
          onChange={(value) =>
            updateDraft('appearance', { theme: value as AppearanceSettings['theme'] })
          }
          hint="Choose light, dark, or match your system preference."
        />
        {appearanceErrors.theme && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {appearanceErrors.theme}
          </p>
        )}
        <Select
          label="Font Size"
          value={draft.appearance.fontSize}
          options={FONT_SIZE_OPTIONS}
          onChange={(value) =>
            updateDraft('appearance', {
              fontSize: value as AppearanceSettings['fontSize'],
            })
          }
          error={appearanceErrors.fontSize}
        />
        <Toggle
          label="Compact Mode"
          description="Reduce spacing and padding for a denser layout."
          checked={draft.appearance.compactMode}
          onChange={(checked) => updateDraft('appearance', { compactMode: checked })}
        />
      </div>
      {actions}
    </>
  )
}
