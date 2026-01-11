'use client'

import { Suspense, useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Loader } from '@/components/ui/Loader'
import { useAuth } from '@/hooks/useAuth'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.26c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332A8.997 8.997 0 0 0 9.003 18z" fill="#34A853"/>
      <path d="M3.964 10.712A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.33z" fill="#FBBC05"/>
      <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.002 0A8.997 8.997 0 0 0 .96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
    </svg>
  )
}

function LoginForm() {
  const { isLoggedIn, isLoading: authLoading, login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/home'
  const error = searchParams.get('error')
  
  const [isSigningIn, setIsSigningIn] = useState(false)

  useEffect(() => {
    if (isLoggedIn) {
      router.push(redirect)
    }
  }, [isLoggedIn, redirect, router])

  const handleGoogleSignIn = () => {
    setIsSigningIn(true)
    login()
  }

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'OAuthSignin':
      case 'OAuthCallback':
        return 'Error connecting to Google. Please try again.'
      case 'OAuthCreateAccount':
        return 'Could not create account. Please try again.'
      case 'Callback':
        return 'Authentication failed. Please try again.'
      case 'AccessDenied':
        return 'Access denied. You may not have permission to sign in.'
      default:
        return errorCode ? 'An error occurred. Please try again.' : null
    }
  }

  const errorMessage = getErrorMessage(error)

  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-8 pb-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/app_logo.png"
            alt="Coastal Hazard AI Logo"
            width={64}
            height={64}
            className="w-16 h-16 mb-4"
          />
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Welcome</h1>
          <p className="text-sm text-[var(--text-secondary)] text-center mt-1">
            Sign in to report hazards and access analytics
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 text-center">{errorMessage}</p>
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isSigningIn || authLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {isSigningIn ? (
            <>
              <Loader size="sm" />
              <span className="text-gray-700 font-medium">Signing in...</span>
            </>
          ) : (
            <>
              <GoogleIcon />
              <span className="text-gray-700 font-medium">Continue with Google</span>
            </>
          )}
        </button>

        <div className="mt-6 pt-4 border-t border-[var(--border-soft)]">
          <p className="text-xs text-[var(--text-secondary)] text-center">
            By signing in, you agree to our Terms of Service and Privacy Policy.
            Your reports help keep our coastal communities safe.
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
