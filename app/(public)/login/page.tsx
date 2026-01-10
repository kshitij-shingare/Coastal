'use client'

import { Suspense, useEffect } from 'react'
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

  useEffect(() => {
    if (isLoggedIn) {
      router.push(redirect)
    }
  }, [isLoggedIn, redirect, router])

  const handleLogin = () => {
    login()
    router.push(redirect)
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <Image
            src="/app_logo.png"
            alt="Coastal Hazard AI Logo"
            width={64}
            height={64}
            className="w-16 h-16 mb-3"
          />
          <h1 className="heading-l text-center">Welcome Back</h1>
          <p className="small-text text-center mt-1">
            Sign in to access hazard reporting and analytics
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              placeholder="demo@example.com"
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] focus:outline-none focus:ring-2 focus:ring-[var(--info-blue)]"
              defaultValue="demo@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] focus:outline-none focus:ring-2 focus:ring-[var(--info-blue)]"
              defaultValue="password"
            />
          </div>

          <Button className="w-full" onClick={handleLogin}>
            Sign In (Demo)
          </Button>

          <p className="small-text text-center">
            This is a demo login. Click the button to simulate authentication.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <Suspense fallback={<Loader size="lg" />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
