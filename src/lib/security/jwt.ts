/**
 * Centralized JWT Secret Management
 * Ensures no hardcoded fallback secret can be used in production.
 */

let cachedSecretKey: Uint8Array | null = null;

export function getJwtSecretKey(): Uint8Array {
  if (cachedSecretKey) {
    return cachedSecretKey;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'FATAL SECURITY CONFIGURATION: JWT_SECRET environment variable must be set in production. Refusing to run with fallback secret.'
      );
    }
    // Local development only fallback
    cachedSecretKey = new TextEncoder().encode('dev-only-local-secret-do-not-use-in-prod-32ch!');
    return cachedSecretKey;
  }

  if (secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL SECURITY CONFIGURATION: JWT_SECRET must be at least 32 characters long.');
    }
  }

  cachedSecretKey = new TextEncoder().encode(secret);
  return cachedSecretKey;
}
