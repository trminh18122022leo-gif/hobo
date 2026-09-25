import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import crypto from 'crypto';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/security/audit';

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ WARNING: JWT_SECRET is not defined. Using build/runtime fallback secret.');
      return new TextEncoder().encode('fallback-prod-jwt-secret-replace-in-env-32ch!');
    }
    return new TextEncoder().encode('dev-only-local-secret-do-not-use-in-prod-32ch!');
  }
  return new TextEncoder().encode(secret);
}

const secretKey = getJwtSecretKey();

export interface SessionDevice {
  deviceLabel: string;
  ipPrefix: string;
}

export interface AuthPayload {
  sub: string;
  email: string;
  role: string;
  studentVerified?: boolean;
}

/**
 * Hash raw token using SHA-256 for secure database storage
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a cryptographically secure random token string
 */
export function generateRandomToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Parse User-Agent into a friendly Vietnamese device label
 */
export function parseDeviceLabel(userAgent?: string | null): string {
  if (!userAgent) return 'Thiết bị không xác định';
  
  let browser = 'Trình duyệt';
  if (userAgent.includes('Edg/')) browser = 'Microsoft Edge';
  else if (userAgent.includes('Chrome/')) browser = 'Google Chrome';
  else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) browser = 'Apple Safari';
  else if (userAgent.includes('Firefox/')) browser = 'Mozilla Firefox';
  else if (userAgent.includes('Opera') || userAgent.includes('OPR/')) browser = 'Opera';

  let os = 'Khác';
  if (userAgent.includes('Windows NT 10')) os = 'Windows 10/11';
  else if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('iPhone')) os = 'iPhone (iOS)';
  else if (userAgent.includes('iPad')) os = 'iPad (iPadOS)';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS X')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';

  return `${browser} trên ${os}`;
}

/**
 * Anonymize IP address by /24 prefix (IPv4) or /48 prefix (IPv6)
 */
export function anonymizeIp(ip?: string | null): string {
  if (!ip) return '127.0.0.*';
  const trimmed = ip.trim();
  if (trimmed.includes('.')) {
    const parts = trimmed.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.*`;
    }
  } else if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    return `${parts.slice(0, 3).join(':')}::*`;
  }
  return 'Ẩn danh';
}

/**
 * Extract client metadata (Device + Anonymized IP) from Request headers
 */
export function extractClientMetadata(request: Request): SessionDevice {
  const ua = request.headers.get('user-agent');
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const rawIp = forwarded ? forwarded.split(',')[0].trim() : (realIp || '127.0.0.1');

  return {
    deviceLabel: parseDeviceLabel(ua),
    ipPrefix: anonymizeIp(rawIp),
  };
}

/**
 * Sign JWT Access Token (7 days validity)
 */
export async function signAccessToken(payload: AuthPayload): Promise<string> {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

/**
 * Verify JWT Access Token
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Create a new user session with Refresh Token and Access Token
 */
export async function createSession(
  userId: string,
  userEmail: string,
  userRole: string,
  request: Request,
  studentVerified: boolean = false
) {
  const { deviceLabel, ipPrefix } = extractClientMetadata(request);
  const rawRefreshToken = generateRandomToken(32);
  const tokenHash = hashToken(rawRefreshToken);
  
  // Expiry: 30 days
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const refreshTokenRecord = await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      deviceLabel,
      ipPrefix,
      expiresAt,
    },
  });

  const accessToken = await signAccessToken({
    sub: userId,
    email: userEmail,
    role: userRole,
    studentVerified,
  });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    sessionId: refreshTokenRecord.id,
    expiresAt,
  };
}

/**
 * Rotate session: Consume old refresh token, detect reuse attacks, and issue new tokens
 */
export async function rotateSession(rawRefreshToken: string, request: Request) {
  const tokenHash = hashToken(rawRefreshToken);
  const session = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) {
    return { success: false, error: 'Phiên làm việc không tồn tại hoặc đã hết hạn', code: 'INVALID_SESSION' };
  }

  // Token reuse attack detection:
  // If token is already revoked or replaced by another token, a replay attack is occurring!
  if (session.isRevoked || session.replacedBy) {
    // Revoke ALL active sessions for this compromised user immediately
    await prisma.refreshToken.updateMany({
      where: { userId: session.userId },
      data: { isRevoked: true },
    });

    await logAudit({
      userId: session.userId,
      action: 'token_reuse_detected',
      resource: 'refresh_token',
      resourceId: session.id,
      details: {
        device: session.deviceLabel,
        ip: session.ipPrefix,
        warning: 'Phát hiện tái sử dụng Refresh Token! Toàn bộ phiên làm việc đã bị thu hồi bảo mật.',
      },
    });

    return {
      success: false,
      error: 'Cảnh báo bảo mật: Phiên làm việc đã bị sử dụng lại bất thường. Tất cả phiên đăng nhập đã bị hủy để bảo vệ tài khoản.',
      code: 'TOKEN_REUSE_DETECTED',
    };
  }

  // Check expiration
  if (new Date() > session.expiresAt) {
    return { success: false, error: 'Phiên làm việc đã hết hạn sau 30 ngày', code: 'SESSION_EXPIRED' };
  }

  // Check user status
  if (session.user.status === 'soft_deleted') {
    return { success: false, error: 'Tài khoản đang trong trạng thái chờ xóa', code: 'ACCOUNT_SOFT_DELETED' };
  }

  // Generate new refresh token
  const newRawRefreshToken = generateRandomToken(32);
  const newTokenHash = hashToken(newRawRefreshToken);
  const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const { deviceLabel, ipPrefix } = extractClientMetadata(request);

  // Transactionally revoke old token and create new one
  const [_, newSession] = await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: session.id },
      data: {
        isRevoked: true,
        replacedBy: newTokenHash,
        lastUsedAt: new Date(),
      },
    }),
    prisma.refreshToken.create({
      data: {
        userId: session.userId,
        tokenHash: newTokenHash,
        deviceLabel: deviceLabel || session.deviceLabel,
        ipPrefix: ipPrefix || session.ipPrefix,
        expiresAt: newExpiresAt,
      },
    }),
  ]);

  const newAccessToken = await signAccessToken({
    sub: session.user.id,
    email: session.user.email,
    role: session.user.role,
    studentVerified: Boolean(session.user.studentVerifiedSourceId),
  });

  return {
    success: true,
    accessToken: newAccessToken,
    refreshToken: newRawRefreshToken,
    sessionId: newSession.id,
    expiresAt: newExpiresAt,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      studentVerifiedSourceId: session.user.studentVerifiedSourceId,
    },
  };
}

/**
 * Revoke specific session by token or session ID
 */
export async function revokeSession(sessionId: string, userId: string) {
  return prisma.refreshToken.updateMany({
    where: {
      id: sessionId,
      userId,
    },
    data: {
      isRevoked: true,
    },
  });
}

/**
 * Revoke all sessions for a given user
 */
export async function revokeAllSessions(userId: string) {
  return prisma.refreshToken.updateMany({
    where: { userId },
    data: { isRevoked: true },
  });
}

/**
 * Get active sessions for user (Multi-device view)
 */
export async function getUserSessions(userId: string, currentRefreshToken?: string) {
  const currentHash = currentRefreshToken ? hashToken(currentRefreshToken) : null;

  const sessions = await prisma.refreshToken.findMany({
    where: {
      userId,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastUsedAt: 'desc' },
    select: {
      id: true,
      tokenHash: true,
      deviceLabel: true,
      ipPrefix: true,
      createdAt: true,
      lastUsedAt: true,
      expiresAt: true,
    },
  });

  return sessions.map((s) => ({
    id: s.id,
    deviceLabel: s.deviceLabel || 'Thiết bị không xác định',
    ipPrefix: s.ipPrefix || 'Ẩn danh',
    createdAt: s.createdAt,
    lastUsedAt: s.lastUsedAt,
    expiresAt: s.expiresAt,
    isCurrent: currentHash ? s.tokenHash === currentHash : false,
  }));
}

/**
 * Extract and authenticate user from request (handles cookies & Bearer headers)
 */
export async function getAuthUser(request: Request) {
  let token: string | null = null;

  // 1. Check Bearer Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  // 2. Check cookies (access-token or legacy auth-token)
  const cookieHeader = request.headers.get('cookie') || '';
  if (!token && cookieHeader) {
    const match = cookieHeader.match(/(?:access-token|auth-token)=([^;]+)/);
    if (match) {
      token = match[1];
    }
  }

  if (token) {
    const payload = await verifyAccessToken(token);
    if (payload && payload.sub && payload.email) {
      return {
        id: payload.sub as string,
        email: payload.email as string,
        role: (payload.role as string) || 'user',
        studentVerified: Boolean(payload.studentVerified),
      };
    }
  }

  // 3. Resilient Fallback: If access-token is missing or expired, check valid refresh-token in DB
  if (cookieHeader) {
    const refreshMatch = cookieHeader.match(/refresh-token=([^;]+)/);
    if (refreshMatch) {
      try {
        const rawRefreshToken = refreshMatch[1];
        const tokenHash = hashToken(rawRefreshToken);
        const session = await prisma.refreshToken.findUnique({
          where: { tokenHash },
          include: { user: true },
        });

        if (
          session &&
          !session.isRevoked &&
          new Date() <= session.expiresAt &&
          session.user &&
          session.user.status !== 'soft_deleted'
        ) {
          return {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
            studentVerified: Boolean(session.user.studentVerifiedSourceId),
          };
        }
      } catch (err) {
        console.error('getAuthUser refresh fallback error:', err);
      }
    }
  }

  return null;
}

