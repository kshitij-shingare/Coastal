'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useSession, signIn, signOut, SessionProvider } from 'next-auth/react'

interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

interface AuthContextType {
  isLoggedIn: boolean
  isLoading: boolean
  user: User | null
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

function AuthContextProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  
  const isLoading = status === 'loading'
  const isLoggedIn = status === 'authenticated' && !!session?.user
  const user = session?.user ? {
    id: session.user.id || session.user.email || '',
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  } : null

  const login = () => {
    signIn('google', { callbackUrl: '/home' })
  }

  const logout = () => {
    signOut({ callbackUrl: '/home' })
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <SessionProvider>
      <AuthContextProvider>
        {children}
      </AuthContextProvider>
    </SessionProvider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
