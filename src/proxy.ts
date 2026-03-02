import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const authCookie = request.cookies.get('auth_session')
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/dashboard')) {
    if (!authCookie) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (pathname === '/' || pathname === '/ar') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (pathname === '/login') {
    if (authCookie) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/ar', '/login', '/dashboard/:path*'],
}

