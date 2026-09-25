import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// ── Security Headers ─────────────────────────────────────────────────────────
// Applied to ALL routes (pages + API). Centralized here so no route can miss them.

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

// ── Admin Guard ──────────────────────────────────────────────────────────────

async function checkAdminAccess(request: NextRequest): Promise<NextResponse | null> {
  const token =
    request.cookies.get('access-token')?.value ||
    request.cookies.get('auth-token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/dang-nhap', request.url));
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('FATAL: JWT_SECRET must be set in production');
      }
      return NextResponse.redirect(new URL('/dang-nhap', request.url));
    }

    const secretKey = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secretKey);

    if (!payload || payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  } catch {
    return NextResponse.redirect(new URL('/dang-nhap', request.url));
  }

  return null; // access granted
}

// ── CSRF Gate ────────────────────────────────────────────────────────────────
// Single source of truth for CSRF protection.
// All route handlers import verifyCsrfOrigin from csrf.ts ONLY for non-middleware paths.
// For /api/* routes this gate runs first — handlers do NOT need to re-check.

function checkCsrf(request: NextRequest): NextResponse | null {
  const method = request.method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return null;

  // Bearer token requests (machine-to-machine, mobile apps) are not susceptible to CSRF
  const authHeader = request.headers.get('authorization');
  if (authHeader?.toLowerCase().startsWith('bearer ')) return null;

  const host = request.headers.get('host');
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  if (!host) {
    return NextResponse.json(
      { success: false, error: 'Yêu cầu không hợp lệ.' },
      { status: 403 }
    );
  }

  // 1. Check Origin header (most reliable)
  if (origin) {
    try {
      if (new URL(origin).host === host) return null;
    } catch {
      // fall through to block
    }
    return NextResponse.json(
      { success: false, error: 'Yêu cầu bị từ chối (CSRF: origin mismatch).' },
      { status: 403 }
    );
  }

  // 2. Fallback: Referer header
  if (referer) {
    try {
      if (new URL(referer).host === host) return null;
    } catch {
      // fall through to block
    }
    return NextResponse.json(
      { success: false, error: 'Yêu cầu bị từ chối (CSRF: referer mismatch).' },
      { status: 403 }
    );
  }

  // 3. No Origin or Referer: allow in dev (Postman/curl), block in production
  if (process.env.NODE_ENV !== 'production') return null;

  return NextResponse.json(
    { success: false, error: 'Yêu cầu bị từ chối (CSRF: missing origin).' },
    { status: 403 }
  );
}

// ── Body Size Gate ───────────────────────────────────────────────────────────

function checkBodySize(request: NextRequest): NextResponse | null {
  const method = request.method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH'].includes(method)) return null;

  const contentLength = request.headers.get('content-length');
  if (!contentLength) return null;

  const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES) || 1_048_576; // 1MB default
  if (Number(contentLength) > MAX_BODY_BYTES) {
    return NextResponse.json(
      { success: false, error: 'Request payload quá lớn. Tối đa 1MB.' },
      { status: 413 }
    );
  }

  return null;
}

// ── Main Middleware ──────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin page protection
  if (pathname.startsWith('/admin')) {
    const adminError = await checkAdminAccess(request);
    if (adminError) return applySecurityHeaders(adminError);
  }

  // API gateway security
  if (pathname.startsWith('/api/')) {
    const csrfError = checkCsrf(request);
    if (csrfError) return applySecurityHeaders(csrfError);

    const sizeError = checkBodySize(request);
    if (sizeError) return applySecurityHeaders(sizeError);
  }

  // Apply security headers to all responses (pages + API)
  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
};
