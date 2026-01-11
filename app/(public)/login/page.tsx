'use client'

import { Suspense, useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Loader } from '@/components/ui/Loader'
import { useAuth } from '@/hooks/useAuth'

function LoginForm() {
  const { isLoggedIn, login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/home'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isLoggedIn) {
      router.push(redirect)
    }
  }, [isLoggedIn, redirect, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!email.trim()) {
      setError('Please enter your email')
      return
    }
    
    if (!password.trim()) {
      setError('Please enter your password')
      return
    }

    setIsLoading(true)
    
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    login()
    router.push(redirect)
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-8 pb-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <Image
            src="/app_logo.png"
            alt="Coastal Hazard AI Logo"
            width={56}
            height={56}
            className="w-14 h-14 mb-3"
          />
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Sign In</h1>
          <p className="text-sm text-[var(--text-secondary)] text-center mt-1">
            Access hazard reporting and analytics
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader size="sm" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-[var(--border-soft)]">
          <p className="text-xs text-[var(--text-secondary)] text-center">
            Don&apos;t have an account?{' '}
            <span className="text-[#2563EB] font-medium">Contact admin</span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <Suspense fallback={<Loader size="lg" />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
