import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { generateCSRFToken } from '@/utils/security'

const RATE_LIMIT_WINDOW = 60 * 1000 // 1分
const MAX_REQUESTS = 10 // 1分あたりの最大リクエスト数

const requestCounts = new Map<string, { count: number; resetTime: number }>()
const csrfTokens = new Map<string, { token: string; expires: number }>()

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Enhanced security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  
  // Content Security Policy
  response.headers.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co; " +
    "frame-ancestors 'none';"
  )
  
  // CSRF Protection
  const sessionId = request.cookies.get('session-id')?.value || generateCSRFToken()
  
  // For state-changing methods, validate CSRF token
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const csrfToken = request.headers.get('X-CSRF-Token')
    const storedToken = csrfTokens.get(sessionId)
    
    if (!csrfToken || !storedToken || csrfToken !== storedToken.token || Date.now() > storedToken.expires) {
      // Skip CSRF check for auth endpoints (they have their own security)
      if (!request.nextUrl.pathname.startsWith('/auth/')) {
        return new NextResponse('Invalid CSRF Token', { status: 403 })
      }
    }
  }
  
  // Generate new CSRF token for GET requests
  if (request.method === 'GET') {
    const newToken = generateCSRFToken()
    csrfTokens.set(sessionId, { 
      token: newToken, 
      expires: Date.now() + 3600000 // 1 hour
    })
    response.headers.set('X-CSRF-Token', newToken)
    response.cookies.set('session-id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600
    })
  }

  // 認証関連のエンドポイントに対するレート制限
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    
    const record = requestCounts.get(ip)
    
    if (!record || now > record.resetTime) {
      requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    } else {
      record.count++
      
      if (record.count > MAX_REQUESTS) {
        return new NextResponse('Too Many Requests', {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((record.resetTime - now) / 1000))
          }
        })
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/auth/:path*',
    '/api/:path*',
  ]
}