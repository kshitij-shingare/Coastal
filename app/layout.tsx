import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'
import { ToastContainer } from '@/components/ui/Toast'
import { OfflineBanner } from '@/components/ui/OfflineBanner'
import { DemoBanner } from '@/components/ui/DemoBanner'
import { SkipToContent } from '@/components/ui/SkipToContent'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Coastal Hazard AI',
  description: 'AI-powered coastal hazard monitoring and reporting system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[var(--bg-main)]">
        <SkipToContent />
        <OfflineBanner />
        <DemoBanner />
        <AuthProvider>
          {children}
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  )
}
