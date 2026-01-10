'use client'

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[300] focus:px-4 focus:py-2 focus:bg-[var(--info-blue)] focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
    >
      Skip to main content
    </a>
  )
}
