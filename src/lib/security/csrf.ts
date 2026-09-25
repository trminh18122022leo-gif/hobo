/**
 * Origin and Referer CSRF Verification for state-changing HTTP requests
 * Protects cookie-authenticated POST, PUT, PATCH, DELETE API endpoints.
 */

export function verifyCsrfOrigin(request: Request): boolean {
  // Safe HTTP methods do not mutate state
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(request.method.toUpperCase())) {
    return true;
  }

  // If request contains Authorization Bearer header, it is an API/m2m call not susceptible to browser ambient cookie CSRF
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return true;
  }

  const host = request.headers.get('host');
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // If host is missing (e.g. malformed HTTP/1.0 request)
  if (!host) {
    return false;
  }

  // 1. Verify Origin header if present
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host === host) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // 2. Fallback to Referer header if Origin is omitted
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host === host) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // 3. In non-production, allow requests without Origin/Referer (e.g., Postman, curl, tests)
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  // In production, block state-changing browser requests that omit both Origin and Referer
  return false;
}
