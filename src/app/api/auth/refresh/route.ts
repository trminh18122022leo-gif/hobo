import { NextRequest, NextResponse } from 'next/server';
import { rotateSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    // 1. Get refresh token from cookie or request body
    let refreshToken: string | null = null;
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/refresh-token=([^;]+)/);
    if (match) {
      refreshToken = match[1];
    }

    if (!refreshToken) {
      try {
        const body = await request.json();
        refreshToken = body.refreshToken;
      } catch {
        // Body might be empty
      }
    }

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy refresh token', code: 'MISSING_TOKEN' },
        { status: 401 }
      );
    }

    const result = await rotateSession(refreshToken, request);

    if (!result.success) {
      // Clear cookies if token is revoked or reuse detected
      const errRes = NextResponse.json(
        { success: false, error: result.error, code: result.code },
        { status: 401 }
      );
      errRes.cookies.set('access-token', '', { maxAge: 0, path: '/' });
      errRes.cookies.set('auth-token', '', { maxAge: 0, path: '/' });
      errRes.cookies.set('refresh-token', '', { maxAge: 0, path: '/' });
      return errRes;
    }

    const response = NextResponse.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      },
    });

    response.cookies.set('access-token', result.accessToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    response.cookies.set('auth-token', result.accessToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    response.cookies.set('refresh-token', result.refreshToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json({ success: false, error: 'Đã xảy ra lỗi khi làm mới phiên' }, { status: 500 });
  }
}
