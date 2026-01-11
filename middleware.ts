import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PROTECTED_PATHS = ['/report', '/analytics', '/social-verify']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  const isProtected = PROTECTED_PATHS.some(path => pathname.startsWith(path))
  
  if (!isProtected) {
    return NextResponse.next()
  }

  // Check for NextAuth session token
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/report/:path*', '/social-verify/:path*', '/analytics/:path*'],
}
