import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken, validateCSRFToken } from './validation';

const CSRF_COOKIE_NAME = '__Host-csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

// Methods that should be protected by CSRF
const PROTECTED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

export function setCSRFToken(response: NextResponse): string {
  const token = generateCSRFToken();
  
  // Set secure cookie with __Host- prefix for maximum security
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
  
  return token;
}

export function getCSRFToken(request: NextRequest): string | null {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value || null;
}

export function validateCSRFRequest(request: NextRequest): boolean {
  // Skip CSRF check for safe methods
  if (!PROTECTED_METHODS.includes(request.method)) {
    return true;
  }
  
  // Skip CSRF check for API routes that don't modify state
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/api/auth/callback')) {
    return true; // Auth callbacks are handled by Supabase
  }
  
  const cookieToken = getCSRFToken(request);
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  
  if (!cookieToken || !headerToken) {
    return false;
  }
  
  return validateCSRFToken(headerToken, cookieToken);
}

// Client-side helper to get CSRF token from cookie
export function getClientCSRFToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(cookie => 
    cookie.trim().startsWith(`${CSRF_COOKIE_NAME}=`)
  );
  
  if (!csrfCookie) return null;
  
  return csrfCookie.split('=')[1];
}

// Hook to include CSRF token in fetch requests
export function fetchWithCSRF(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getClientCSRFToken();
  
  if (token && PROTECTED_METHODS.includes(options.method?.toUpperCase() || 'GET')) {
    options.headers = {
      ...options.headers,
      [CSRF_HEADER_NAME]: token,
    };
  }
  
  return fetch(url, options);
}