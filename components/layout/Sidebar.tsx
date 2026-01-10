'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { AUTH_ROUTES, PUBLIC_ROUTES } from '@/lib/routes'

export function Sidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`flex flex-col bg-[var(--bg-card)] border-r border-[var(--border-soft)] transition-all duration-300 h-screen sticky top-0 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--border-soft)]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Image
              src="/app_logo.png"
              alt="Logo"
              width={28}
              height={28}
              className="w-7 h-7"
            />
            <span className="font-semibold text-[var(--text-primary)]">Dashboard</span>
          </div>
        )}
        {collapsed && (
          <Image
            src="/app_logo.png"
            alt="Logo"
            width={28}
            height={28}
            className="w-7 h-7 mx-auto"
          />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded hover:bg-[var(--bg-muted)] transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={collapsed ? 'M13 5l7 7-7 7M5 5l7 7-7 7' : 'M11 19l-7-7 7-7M19 19l-7-7 7-7'}
            />
          </svg>
        </button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 mb-4">
          {!collapsed && (
            <p className="px-3 mb-2 text-xs font-semibold uppercase text-[var(--text-secondary)]">
              Public
            </p>
          )}
          {PUBLIC_ROUTES.map(route => (
            <SidebarLink
              key={route.path}
              href={route.path}
              label={route.label}
              isActive={pathname === route.path}
              collapsed={collapsed}
            />
          ))}
        </div>

        <div className="px-3">
          {!collapsed && (
            <p className="px-3 mb-2 text-xs font-semibold uppercase text-[var(--text-secondary)]">
              Protected
            </p>
          )}
          {AUTH_ROUTES.map(route => (
            <SidebarLink
              key={route.path}
              href={route.path}
              label={route.label}
              isActive={pathname === route.path}
              collapsed={collapsed}
            />
          ))}
        </div>
      </nav>

      <div className="p-3 border-t border-[var(--border-soft)]">
        <button
          onClick={logout}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded text-sm font-medium text-[var(--alert-red)] hover:bg-red-50 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  )
}

function SidebarLink({ href, label, isActive, collapsed }: { href: string; label: string; isActive: boolean; collapsed: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
        isActive
          ? 'bg-[var(--info-blue)] text-white'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]'
      } ${collapsed ? 'justify-center' : ''}`}
      aria-current={isActive ? 'page' : undefined}
      title={collapsed ? label : undefined}
    >
      <RouteIcon route={href} />
      {!collapsed && label}
    </Link>
  )
}

function RouteIcon({ route }: { route: string }) {
  const icons: Record<string, React.ReactNode> = {
    '/home': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    '/map': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    '/report': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    '/social-verify': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    '/analytics': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  }
  return icons[route] || <span className="w-5 h-5" />
}
