import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getSession,
  loginUser,
  logoutUser,
  registerUser,
  type User,
} from '@/lib/auth'

interface AuthContextValue {
  user: User | null
  login: (email: string, password: string) => string | null
  register: (name: string, email: string, password: string) => string | null
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getSession())

  const login = useCallback((email: string, password: string) => {
    const result = loginUser(email, password)
    if (result.error) return result.error
    setUser(result.user ?? null)
    return null
  }, [])

  const register = useCallback((name: string, email: string, password: string) => {
    const result = registerUser(name, email, password)
    if (result.error) return result.error
    setUser(result.user ?? null)
    return null
  }, [])

  const logout = useCallback(() => {
    logoutUser()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, login, register, logout }),
    [user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
