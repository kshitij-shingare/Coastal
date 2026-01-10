import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { PROTECTED_PATHS } from '@/lib/routes'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  const isProtected = PROTECTED_PATHS.some(path => pathname.startsWith(path))
  
  if (!isProtected) {
    return NextResponse.next()
  }

  const authCookie = request.cookies.get('coastal_hazard_auth')
  const isAuthenticated = authCookie?.value === 'true'

  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/report/:path*', '/social-verify/:path*', '/analytics/:path*'],
}
