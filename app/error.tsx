'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console in development
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-main)]">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-[var(--alert-red)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Error Message */}
        <h1 className="heading-l mb-2">Something went wrong</h1>
        <p className="text-[var(--text-secondary)] mb-6">
          We encountered an unexpected error. Please try again or contact support if the problem persists.
        </p>

        {/* Error Details (Development only) */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-6 p-3 bg-red-50 rounded-lg text-left">
            <p className="text-xs font-mono text-red-700 break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset}>
            Try Again
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.location.href = '/home'}
          >
            Go to Home
          </Button>
        </div>

        {/* Support Info */}
        <p className="mt-8 text-xs text-[var(--text-secondary)]">
          If this issue continues, please contact support at{' '}
          <a
            href="mailto:support@coastalhazard.ai"
            className="text-[var(--info-blue)] hover:underline"
          >
            support@coastalhazard.ai
          </a>
        </p>
      </div>
    </div>
  )
}
