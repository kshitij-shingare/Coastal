'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { BottomNav } from '@/components/layout/BottomNav'
import { Loader } from '@/components/ui/Loader'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoggedIn, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login')
    }
  }, [isLoggedIn, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    )
  }

  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main id="main-content" className="flex-1 pb-20 md:pb-0">
        <div className="container-main py-4 md:py-6 lg:py-8">
          {children}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
