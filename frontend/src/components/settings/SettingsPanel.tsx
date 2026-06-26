import { useCallback, useId, useState } from 'react'
import { User, Bell, Shield, Palette } from 'lucide-react'
import { defaultSettings } from '@/data/defaultSettings'
import {
  hasErrors,
  validateAppearance,
  validateNotifications,
  validatePrivacy,
  validateProfile,
} from './settingsValidation'
import { ActiveSettingsTab } from './SettingsTabPanels'
import type {
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

interface SettingsPanelProps {
  onThemeChange?: (theme: ThemePreference) => void
  className?: string
}

function validateActiveTab(tab: SettingsTab, draft: SettingsState): object {
  switch (tab) {
    case 'profile':
      return validateProfile(draft.profile)
    case 'notifications':
      return validateNotifications(draft.notifications)
    case 'privacy':
      return validatePrivacy(draft.privacy)
    default:
      return validateAppearance(draft.appearance)
  }
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

    const tabErrors = validateActiveTab(activeTab, draft)

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
            id={`panel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            className="space-y-5"
          >
            <ActiveSettingsTab
              activeTab={activeTab}
              draft={draft}
              profileErrors={profileErrors}
              notificationErrors={notificationErrors}
              privacyErrors={privacyErrors}
              appearanceErrors={appearanceErrors}
              updateDraft={updateDraft}
              onSave={handleSave}
              onCancel={handleCancel}
              isSaving={isSaving}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
