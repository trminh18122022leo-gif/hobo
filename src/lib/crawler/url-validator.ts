/**
 * SSRF Prevention Validator
 * Ensures crawler URLs strictly target public internet hosts and secure protocols.
 */

const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./, // AWS / Cloud metadata service
  /^0\./,
  /^\[?::1\]?$/,
  /^\[?fc00:/i,
  /^\[?fe80:/i,
];

export function isUrlSafe(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    const parsed = new URL(url.trim());

    // Only allow HTTP and HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check against forbidden private / link-local / localhost patterns
    for (const pattern of BLOCKED_HOST_PATTERNS) {
      if (pattern.test(hostname)) {
        return false;
      }
    }

    // Must have at least one dot in hostname (e.g. example.com) unless it's a known valid public domain
    if (!hostname.includes('.')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
