import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { AuthProvider } from '@/hooks/useAuth'
import { ToastContainer } from '@/components/ui/Toast'
import { OfflineBanner } from '@/components/ui/OfflineBanner'
import { SkipToContent } from '@/components/ui/SkipToContent'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Coastal Hazard AI',
  description: 'AI-powered coastal hazard monitoring and reporting system for India',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--bg-main)]" suppressHydrationWarning>
        <SkipToContent />
        <OfflineBanner />
        <SessionProvider>
          <AuthProvider>
            {children}
            <ToastContainer />
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
