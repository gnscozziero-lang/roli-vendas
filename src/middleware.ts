import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/auth'

const COOKIE_NAME = 'vendas_auth'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/login')) {
    return NextResponse.next()
  }

  const secret = process.env.AUTH_SECRET || ''
  const cookie = req.cookies.get(COOKIE_NAME)?.value

  const valid = cookie && secret ? await verifySessionToken(cookie, secret) : false

  if (!valid) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
