import { useCallback, useId, useState } from 'react'
import { User, Bell, Shield, Palette } from 'lucide-react'
import {
  TextInput,
  Select,
  Toggle,
  RadioGroup,
  TabActions,
} from './FormControls'
import { defaultSettings } from '@/data/defaultSettings'
import {
  hasErrors,
  validateAppearance,
  validateNotifications,
  validatePrivacy,
  validateProfile,
} from './settingsValidation'
import type {
  AppearanceSettings,
  NotificationSettings,
  PrivacySettings,
  SettingsState,
  SettingsTab,
  ThemePreference,
} from '@/types/settings'

const TABS: { id: SettingsTab; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
]

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

interface SettingsPanelProps {
  onThemeChange?: (theme: ThemePreference) => void
  className?: string
}

export function SettingsPanel({ onThemeChange, className = '' }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [saved, setSaved] = useState<SettingsState>(defaultSettings)
  const [draft, setDraft] = useState<SettingsState>(defaultSettings)
  const [errors, setErrors] = useState<Partial<Record<SettingsTab, object>>>({})
  const [isSaving, setIsSaving] = useState(false)
  const tabListId = useId()

  const updateDraft = useCallback(
    <K extends keyof SettingsState>(section: K, values: Partial<SettingsState[K]>) => {
      setDraft((prev) => ({
        ...prev,
        [section]: { ...prev[section], ...values },
      }))
      setErrors((prev) => ({ ...prev, [section]: undefined }))
    },
    [],
  )

  const handleCancel = () => {
    setDraft((prev) => ({ ...prev, [activeTab]: saved[activeTab] }))
    setErrors((prev) => ({ ...prev, [activeTab]: undefined }))
  }

  const handleSave = async () => {
    setIsSaving(true)

    let tabErrors: object = {}
    if (activeTab === 'profile') {
      tabErrors = validateProfile(draft.profile)
    } else if (activeTab === 'notifications') {
      tabErrors = validateNotifications(draft.notifications)
    } else if (activeTab === 'privacy') {
      tabErrors = validatePrivacy(draft.privacy)
    } else {
      tabErrors = validateAppearance(draft.appearance)
    }

    if (hasErrors(tabErrors)) {
      setErrors((prev) => ({ ...prev, [activeTab]: tabErrors }))
      setIsSaving(false)
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 400))

    setSaved((prev) => ({ ...prev, [activeTab]: draft[activeTab] }))
    setErrors((prev) => ({ ...prev, [activeTab]: undefined }))

    if (activeTab === 'appearance') {
      onThemeChange?.(draft.appearance.theme)
    }

    setIsSaving(false)
  }

  const profileErrors = (errors.profile ?? {}) as ReturnType<typeof validateProfile>
  const notificationErrors = (errors.notifications ?? {}) as ReturnType<
    typeof validateNotifications
  >
  const privacyErrors = (errors.privacy ?? {}) as ReturnType<typeof validatePrivacy>
  const appearanceErrors = (errors.appearance ?? {}) as ReturnType<
    typeof validateAppearance
  >

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900 ${className}`}
    >
      <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your account preferences and application settings.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row">
        <nav
          aria-label="Settings sections"
          className="border-b border-gray-200 lg:w-56 lg:shrink-0 lg:border-b-0 lg:border-r dark:border-gray-700"
        >
          <div
            role="tablist"
            aria-orientation="vertical"
            id={tabListId}
            className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-visible lg:p-4"
          >
            {TABS.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`tab-${id}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveTab(id)}
                  className={`flex shrink-0 items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 lg:w-full ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                  }`}
                >
                  <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              )
            })}
          </div>
        </nav>

        <div className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <section
            role="tabpanel"
            id="panel-profile"
            aria-labelledby="tab-profile"
            hidden={activeTab !== 'profile'}
            className="space-y-5"
          >
            {activeTab === 'profile' && (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Profile
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Update your personal information.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <TextInput
                      label="Full Name"
                      value={draft.profile.fullName}
                      onChange={(event) =>
                        updateDraft('profile', { fullName: event.target.value })
                      }
                      error={profileErrors.fullName}
                      placeholder="Enter your full name"
                      autoComplete="name"
                    />
                  </div>
                  <TextInput
                    label="Email"
                    type="email"
                    value={draft.profile.email}
                    onChange={(event) =>
                      updateDraft('profile', { email: event.target.value })
                    }
                    error={profileErrors.email}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                  <TextInput
                    label="Phone Number"
                    type="tel"
                    value={draft.profile.phone}
                    onChange={(event) =>
                      updateDraft('profile', { phone: event.target.value })
                    }
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

                <TabActions
                  onSave={handleSave}
                  onCancel={handleCancel}
                  isSaving={isSaving}
                />
              </>
            )}
          </section>

          <section
            role="tabpanel"
            id="panel-notifications"
            aria-labelledby="tab-notifications"
            hidden={activeTab !== 'notifications'}
            className="space-y-5"
          >
            {activeTab === 'notifications' && (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Notifications
                  </h3>
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

                <TabActions
                  onSave={handleSave}
                  onCancel={handleCancel}
                  isSaving={isSaving}
                />
              </>
            )}
          </section>

          <section
            role="tabpanel"
            id="panel-privacy"
            aria-labelledby="tab-privacy"
            hidden={activeTab !== 'privacy'}
            className="space-y-5"
          >
            {activeTab === 'privacy' && (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Privacy
                  </h3>
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
                    onChange={(checked) =>
                      updateDraft('privacy', { dataSharing: checked })
                    }
                  />
                  <Toggle
                    label="Two-Factor Authentication"
                    description="Add an extra layer of security to your account."
                    checked={draft.privacy.twoFactorAuth}
                    onChange={(checked) =>
                      updateDraft('privacy', { twoFactorAuth: checked })
                    }
                  />
                </div>

                <TabActions
                  onSave={handleSave}
                  onCancel={handleCancel}
                  isSaving={isSaving}
                />
              </>
            )}
          </section>

          <section
            role="tabpanel"
            id="panel-appearance"
            aria-labelledby="tab-appearance"
            hidden={activeTab !== 'appearance'}
            className="space-y-5"
          >
            {activeTab === 'appearance' && (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Appearance
                  </h3>
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
                      updateDraft('appearance', {
                        theme: value as AppearanceSettings['theme'],
                      })
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
                    onChange={(checked) =>
                      updateDraft('appearance', { compactMode: checked })
                    }
                  />
                </div>

                <TabActions
                  onSave={handleSave}
                  onCancel={handleCancel}
                  isSaving={isSaving}
                />
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
