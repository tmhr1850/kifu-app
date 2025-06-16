import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const RATE_LIMIT_WINDOW = 60 * 1000 // 1分
const MAX_REQUESTS = 10 // 1分あたりの最大リクエスト数

const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // CSRFトークンの設定（本番環境では実装が必要）
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

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