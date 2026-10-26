import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export const isUUID = (val) =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim())

export const isValidEmail = (val) =>
  typeof val === 'string' &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())

export function sanitizeUser(rawUser) {
  if (!rawUser || typeof rawUser !== 'object') return null

  let id = rawUser.id || rawUser.userId || null
  if (!id && isUUID(rawUser.sub)) {
    id = rawUser.sub
  }

  // Display name: never a UUID
  let name = rawUser.name || rawUser.fullName || rawUser.displayName || null
  if (!name || isUUID(name) || !String(name).trim()) {
    name = 'User'
  } else {
    name = String(name).trim()
  }

  // Email: never a UUID, must look like an email
  let email = rawUser.email || null
  if (!email || isUUID(email) || !isValidEmail(email)) {
    if (isValidEmail(rawUser.sub)) {
      email = String(rawUser.sub).trim()
    } else {
      email = null
    }
  } else {
    email = String(email).trim()
  }

  const role = rawUser.role || 'USER'
  const emailVerified = typeof rawUser.emailVerified === 'boolean' ? rawUser.emailVerified : false

  let provider = rawUser.provider || null
  if (provider) {
    const p = String(provider).toUpperCase()
    if (p.includes('GOOGLE')) provider = 'GOOGLE'
    else if (p.includes('GITHUB')) provider = 'GITHUB'
    else if (p.includes('LOCAL')) provider = 'LOCAL'
  }

  return {
    id,
    name,
    email,
    role,
    emailVerified,
    provider,
  }
}

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken'))
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      if (!stored) return null
      const parsed = JSON.parse(stored)
      const sanitized = sanitizeUser(parsed)
      if (sanitized && JSON.stringify(sanitized) !== stored) {
        localStorage.setItem('user', JSON.stringify(sanitized))
      }
      return sanitized
    } catch {
      return null
    }
  })

  const login = (authResponse) => {
    if (!authResponse) return
    const sanitized = sanitizeUser(authResponse.user)

    if (authResponse.accessToken) {
      localStorage.setItem('accessToken', authResponse.accessToken)
      setAccessToken(authResponse.accessToken)
    }
    if (authResponse.refreshToken) {
      localStorage.setItem('refreshToken', authResponse.refreshToken)
    }
    if (sanitized) {
      localStorage.setItem('user', JSON.stringify(sanitized))
      setUser(sanitized)
    }
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    sessionStorage.removeItem('oauth_provider')
    setAccessToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

