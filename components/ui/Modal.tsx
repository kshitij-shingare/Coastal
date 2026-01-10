'use client'

import { useEffect, useRef, useCallback } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  ariaLabel?: string
}

export default function Modal({ isOpen, onClose, children, title, ariaLabel }: Props) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Focus trap - get all focusable elements
  const getFocusableElements = useCallback(() => {
    if (!modalRef.current) return []
    return modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  }, [])

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      // Focus trap with Tab key
      if (e.key === 'Tab') {
        const focusableElements = getFocusableElements()
        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, getFocusableElements])

  // Focus management - save previous focus and restore on close
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      // Focus the modal or first focusable element
      const focusableElements = getFocusableElements()
      if (focusableElements.length > 0) {
        focusableElements[0].focus()
      } else {
        modalRef.current?.focus()
      }
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    } else {
      // Restore focus and scroll
      previousActiveElement.current?.focus()
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, getFocusableElements])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title}
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
        className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4 focus:outline-none"
      >
        {title && (
          <h2 id="modal-title" className="text-xl font-bold mb-4">
            {title}
          </h2>
        )}
        {/* Close button for accessibility */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--info-blue)]"
          aria-label="Close modal"
        >
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        {children}
      </div>
    </div>
  )
}
