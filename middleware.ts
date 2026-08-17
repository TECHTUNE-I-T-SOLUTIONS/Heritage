import { NextResponse, type NextRequest } from 'next/server'

const SESSION_COOKIE = 'hc_session'

/**
 * Lightweight edge guard. Presence-checks the session cookie so unauthenticated
 * visitors are bounced from dashboards, and signed-in users skip the auth pages.
 * Full verification + role-based redirects happen in each dashboard layout.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value)

  if (pathname.startsWith('/dashboard') && !hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  const AUTH_PAGES = [
    '/login', '/register', '/enroll',
    '/educator/login', '/educator/signup',
    '/admin/login', '/admin/signup',
  ]
  if (hasSession && AUTH_PAGES.includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register',
    '/enroll',
    '/educator/login',
    '/educator/signup',
    '/admin/login',
    '/admin/signup',
  ],
}
