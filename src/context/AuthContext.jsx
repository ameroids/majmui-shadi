import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)
const SESSION_KEY = 'majmui_shaadi_session_v1'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (raw) {
      try {
        setUser(JSON.parse(raw))
      } catch {
        sessionStorage.removeItem(SESSION_KEY)
      }
    }
    setReady(true)
  }, [])

  const login = (userData) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  const value = useMemo(() => ({ user, login, logout, ready }), [user, ready])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
