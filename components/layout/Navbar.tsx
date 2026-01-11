'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { PUBLIC_ROUTES, AUTH_ROUTES } from '@/lib/routes'
import { Button } from '@/components/ui/Button'

function UserMenu({ user, onLogout }: { user: { name?: string | null; email?: string | null; image?: string | null }; onLogout: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayName = user.name || user.email?.split('@')[0] || 'User'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-[var(--bg-muted)] transition-colors"
        aria-label="User menu"
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={displayName}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-xs font-medium">
            {initials}
          </div>
        )}
        <span className="hidden sm:block text-sm font-medium text-[var(--text-primary)] max-w-[120px] truncate">
          {displayName}
        </span>
        <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-lg shadow-lg py-1 z-50">
          <div className="px-4 py-2 border-b border-[var(--border-soft)]">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{displayName}</p>
            {user.email && (
              <p className="text-xs text-[var(--text-secondary)] truncate">{user.email}</p>
            )}
          </div>
          <button
            onClick={() => {
              setIsOpen(false)
              onLogout()
            }}
            className="w-full text-left px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export function Navbar() {
  const pathname = usePathname()
  const { isLoggedIn, isLoading, user, logout } = useAuth()

  // Always show all routes, but auth routes redirect to login if not authenticated
  const allRoutes = [...PUBLIC_ROUTES, ...AUTH_ROUTES]

  const getHref = (path: string, isAuthRoute: boolean) => {
    if (isAuthRoute && !isLoggedIn) {
      return `/login?redirect=${path}`
    }
    return path
  }

  return (
    <header className="sticky top-0 z-50 bg-[var(--bg-card)] border-b border-[var(--border-soft)]">
      <nav className="container-main h-14 md:h-16 flex items-center justify-between">
        {/* Logo */}
        <Link 
          href="/home" 
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Image
            src="/app_logo.png"
            alt="Coastal Hazard AI Logo"
            width={36}
            height={36}
            className="w-8 h-8 sm:w-9 sm:h-9"
          />
          <span className="font-semibold text-sm sm:text-base md:text-lg text-[var(--text-primary)]">
            Coastal Hazard AI
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {allRoutes.map(route => {
            const isAuthRoute = AUTH_ROUTES.some(r => r.path === route.path)
            return (
              <Link
                key={route.path}
                href={getHref(route.path, isAuthRoute)}
                className={`text-sm font-medium transition-colors ${
                  pathname === route.path
                    ? 'text-[var(--info-blue)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                aria-current={pathname === route.path ? 'page' : undefined}
              >
                {route.label}
              </Link>
            )
          })}
        </div>

        {/* Auth Section */}
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="w-16 h-8 bg-[var(--bg-muted)] rounded animate-pulse" />
          ) : isLoggedIn && user ? (
            <UserMenu user={user} onLogout={logout} />
          ) : (
            <Link href="/login">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
