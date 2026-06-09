import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ThemePreference } from '@/types/settings'

interface ThemeContextValue {
  themePreference: ThemePreference
  isDarkMode: boolean
  setThemePreference: (theme: ThemePreference) => void
  toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getStoredTheme(): ThemePreference {
  const stored = localStorage.getItem('theme')
  if (stored === 'dark' || stored === 'light' || stored === 'system') {
    return stored
  }
  return 'system'
}

function resolveDarkMode(theme: ThemePreference): boolean {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themePreference, setThemePreferenceState] =
    useState<ThemePreference>(getStoredTheme)
  const [isDarkMode, setIsDarkMode] = useState(() =>
    resolveDarkMode(getStoredTheme()),
  )

  useEffect(() => {
    setIsDarkMode(resolveDarkMode(themePreference))
    localStorage.setItem('theme', themePreference)
    document.documentElement.classList.toggle(
      'dark',
      resolveDarkMode(themePreference),
    )
  }, [themePreference])

  useEffect(() => {
    if (themePreference !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const dark = resolveDarkMode('system')
      setIsDarkMode(dark)
      document.documentElement.classList.toggle('dark', dark)
    }

    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [themePreference])

  const setThemePreference = useCallback((theme: ThemePreference) => {
    setThemePreferenceState(theme)
  }, [])

  const toggleDarkMode = useCallback(() => {
    setThemePreferenceState((prev) => {
      const currentlyDark = resolveDarkMode(prev)
      return currentlyDark ? 'light' : 'dark'
    })
  }, [])

  const value = useMemo(
    () => ({
      themePreference,
      isDarkMode,
      setThemePreference,
      toggleDarkMode,
    }),
    [themePreference, isDarkMode, setThemePreference, toggleDarkMode],
  )

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
