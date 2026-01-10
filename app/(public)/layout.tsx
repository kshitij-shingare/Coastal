import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { BottomNav } from '@/components/layout/BottomNav'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
