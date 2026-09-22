import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import bcryptjs from 'bcryptjs';
import prisma from '@/lib/db';
import { verifyAccessToken, getAuthUser as getSessionAuthUser } from '@/lib/auth/session';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-dev-only-min-32-chars!!';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  studentVerified?: boolean;
}

export async function signToken(payload: { sub: string; email: string; role: string; studentVerified?: boolean }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m') // short-lived 15m as per v2.2 spec
    .sign(secretKey);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

/**
 * Extract authenticated user from request (checks cookies and Bearer header)
 */
export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const sessionUser = await getSessionAuthUser(request);
  if (!sessionUser) return null;

  // Verify that the user still exists in database and is not soft deleted
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, email: true, role: true, status: true, studentVerifiedSourceId: true },
    });

    if (!dbUser || dbUser.status === 'soft_deleted') {
      return null;
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      studentVerified: Boolean(dbUser.studentVerifiedSourceId),
    };
  } catch (error) {
    console.error('Error verifying auth user from DB:', error);
    return null;
  }
}

export async function requireAuth(request: Request): Promise<AuthUser> {
  const user = await getAuthUser(request);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireAdmin(request: Request): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (user.role.toLowerCase() !== 'admin') {
    throw new Error('Forbidden');
  }
  return user;
}
