'use client'

import { createContext, useContext, ReactNode, useCallback } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'

export interface User {
  id: string
  email: string
  name: string
  role: string
  image?: string | null
}

interface AuthContextType {
  // State
  isLoggedIn: boolean
  isLoading: boolean
  user: User | null
  error: string | null
  
  // Actions
  login: () => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const { data: session, status } = useSession()
  
  const isLoading = status === 'loading'
  const isLoggedIn = status === 'authenticated' && !!session
  
  const user: User | null = session?.user ? {
    id: (session.user as { id?: string }).id || session.user.email || 'unknown',
    email: session.user.email || '',
    name: session.user.name || '',
    role: 'user',
    image: session.user.image,
  } : null

  const login = useCallback(async () => {
    await signIn('google', { callbackUrl: '/home' })
  }, [])

  const logout = useCallback(async () => {
    await signOut({ callbackUrl: '/login' })
  }, [])

  const clearError = useCallback(() => {
    // No-op for NextAuth - errors are handled via URL params
  }, [])

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      isLoading, 
      user, 
      error: null, 
      login, 
      logout, 
      clearError,
    }}>
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
