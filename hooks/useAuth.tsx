'use client'

import { useState, useCallback, createContext, useContext, ReactNode, useSyncExternalStore } from 'react'

interface AuthContextType {
  isLoggedIn: boolean
  isLoading: boolean
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const AUTH_KEY = 'coastal_hazard_auth'

function getSnapshot(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(AUTH_KEY) === 'true'
}

function getServerSnapshot(): boolean {
  return false
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const storedAuth = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [isLoggedIn, setIsLoggedIn] = useState(storedAuth)
  const [isLoading] = useState(false)

  const login = useCallback(() => {
    localStorage.setItem(AUTH_KEY, 'true')
    document.cookie = `${AUTH_KEY}=true; path=/; max-age=86400`
    setIsLoggedIn(true)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY)
    document.cookie = `${AUTH_KEY}=; path=/; max-age=0`
    setIsLoggedIn(false)
  }, [])

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
