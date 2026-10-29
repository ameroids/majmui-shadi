import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)
const SESSION_KEY = 'majmui_shaadi_session_v2'

// Cookie helpers (365 days expiration)
function setCookie(name, value, days = 365) {
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString()
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
  } catch (e) {}
}

function getCookie(name) {
  try {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match ? decodeURIComponent(match[2]) : null
  } catch (e) {
    return null
  }
}

function deleteCookie(name) {
  try {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`
  } catch (e) {}
}

function getStoredUser() {
  // 1. Check localStorage
  let raw = null
  try {
    raw = localStorage.getItem(SESSION_KEY)
  } catch (e) {}

  // 2. Check Cookie
  if (!raw) {
    raw = getCookie(SESSION_KEY)
  }

  // 3. Fallback from legacy sessionStorage
  if (!raw) {
    try {
      raw = sessionStorage.getItem('majmui_shaadi_session_v1')
    } catch (e) {}
  }

  if (raw) {
    try {
      return JSON.parse(raw)
    } catch (e) {
      return null
    }
  }
  return null
}

function saveStoredUser(userData) {
  const json = JSON.stringify(userData)
  try {
    localStorage.setItem(SESSION_KEY, json)
  } catch (e) {}
  setCookie(SESSION_KEY, json)
}

function clearStoredUser() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch (e) {}
  try {
    sessionStorage.removeItem('majmui_shaadi_session_v1')
  } catch (e) {}
  deleteCookie(SESSION_KEY)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const cachedUser = getStoredUser()
    if (cachedUser) {
      setUser(cachedUser)
      saveStoredUser(cachedUser)

      // Silently refresh latest user data from DB
      if (cachedUser.id) {
        import('../lib/supabaseClient').then(({ supabase }) => {
          supabase.from('users').select('*').eq('id', cachedUser.id).single().then(({ data }) => {
            if (data) {
              const updatedUser = { ...cachedUser, ...data }
              saveStoredUser(updatedUser)
              setUser(updatedUser)
            }
          }).catch(console.error)
        })
      }
    }
    setReady(true)
  }, [])

  const login = (userData) => {
    saveStoredUser(userData)
    setUser(userData)
  }

  const logout = () => {
    clearStoredUser()
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
