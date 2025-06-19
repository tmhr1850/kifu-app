import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { setCSRFToken, validateCSRFRequest } from '@/utils/security/csrf'

const RATE_LIMIT_WINDOW = 60 * 1000 // 1分
const MAX_REQUESTS = 10 // 1分あたりの最大リクエスト数

const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function middleware(request: NextRequest) {
  // Validate CSRF token for protected methods
  if (!validateCSRFRequest(request)) {
    return new NextResponse('Invalid CSRF token', { status: 403 })
  }

  const response = NextResponse.next()

  // Set CSRF token if not present
  if (!request.cookies.get('__Host-csrf-token')) {
    setCSRFToken(response)
  }

  // Enhanced security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Content Security Policy
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', cspHeader)
  
  // Strict Transport Security (HSTS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
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