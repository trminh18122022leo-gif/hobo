import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashToken } from '@/lib/auth/session';
import { getAuthUser } from '@/lib/security/auth';
import { logAudit } from '@/lib/security/audit';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    // Read refresh token to revoke it specifically
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/refresh-token=([^;]+)/);
    if (match) {
      const rawToken = match[1];
      const tokenHash = hashToken(rawToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { isRevoked: true },
      });
    }

    if (user) {
      await logAudit({
        userId: user.id,
        action: 'logout',
        resource: 'user',
        resourceId: user.id,
      });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Đăng xuất thành công',
    });

    // Clear all auth cookies
    response.cookies.set('access-token', '', { maxAge: 0, path: '/' });
    response.cookies.set('auth-token', '', { maxAge: 0, path: '/' });
    response.cookies.set('refresh-token', '', { maxAge: 0, path: '/' });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    const response = NextResponse.json({ success: true });
    response.cookies.set('access-token', '', { maxAge: 0, path: '/' });
    response.cookies.set('auth-token', '', { maxAge: 0, path: '/' });
    response.cookies.set('refresh-token', '', { maxAge: 0, path: '/' });
    return response;
  }
}
