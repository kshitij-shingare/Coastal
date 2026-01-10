import { HTMLAttributes, forwardRef } from 'react'

interface LoaderProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'white'
}

const Loader = forwardRef<HTMLDivElement, LoaderProps>(
  ({ size = 'md', color = 'primary', className = '', ...props }, ref) => {
    const sizes = {
      sm: 'h-4 w-4 border-2',
      md: 'h-6 w-6 border-2',
      lg: 'h-10 w-10 border-3',
    }

    const colors = {
      primary: 'border-info-blue border-t-transparent',
      white: 'border-white border-t-transparent',
    }

    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading"
        className={`inline-block ${className}`}
        {...props}
      >
        <div
          className={`
            ${sizes[size]} ${colors[color]}
            rounded-full animate-spin
          `}
        />
        <span className="sr-only">Loading...</span>
      </div>
    )
  }
)

Loader.displayName = 'Loader'

export { Loader }
export type { LoaderProps }
