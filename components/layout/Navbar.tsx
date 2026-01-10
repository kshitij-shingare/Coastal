'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { PUBLIC_ROUTES, AUTH_ROUTES } from '@/lib/routes'
import { Button } from '@/components/ui/Button'

export function Navbar() {
  const pathname = usePathname()
  const { isLoggedIn, isLoading, logout } = useAuth()

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
            className="w-9 h-9"
          />
          <span className="hidden sm:inline font-semibold text-base md:text-lg text-[var(--text-primary)]">
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

        {/* Auth Buttons */}
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="w-16 h-8 bg-[var(--bg-muted)] rounded animate-pulse" />
          ) : isLoggedIn ? (
            <Button variant="secondary" size="sm" onClick={logout}>
              Logout
            </Button>
          ) : (
            <Link href="/login">
              <Button size="sm">Login</Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
