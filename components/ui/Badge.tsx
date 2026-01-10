import { HTMLAttributes, forwardRef } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'alert' | 'warning' | 'safe' | 'info' | 'neutral'
  size?: 'sm' | 'md'
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'neutral', size = 'md', className = '', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center font-medium rounded-full'

    const variants = {
      alert: 'bg-red-100 text-alert-red',
      warning: 'bg-amber-100 text-warning-orange',
      safe: 'bg-green-100 text-safe-green',
      info: 'bg-blue-100 text-info-blue',
      neutral: 'bg-bg-muted text-text-secondary',
    }

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    }

    return (
      <span
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        role="status"
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }
export type { BadgeProps }
