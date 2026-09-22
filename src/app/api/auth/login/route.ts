import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { comparePassword } from '@/lib/security/auth';
import { loginSchema } from '@/lib/security/sanitize';
import { logAudit } from '@/lib/security/audit';
import { createSession } from '@/lib/auth/session';
import { mergeGuestData } from '@/lib/auth/guest-merge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: {
        studentVerifiedSource: true,
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { success: false, error: 'Email hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    const isValid = await comparePassword(validatedData.password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Email hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    let accountReactivated = false;

    // Feature D.3: 30-Day Grace Period Account Reactivation
    if (user.status === 'soft_deleted') {
      const now = new Date();
      const deletedAt = user.softDeletedAt || now;
      const daysPassed = (now.getTime() - new Date(deletedAt).getTime()) / (1000 * 60 * 60 * 24);

      if (daysPassed > 30) {
        return NextResponse.json(
          {
            success: false,
            error: 'Tài khoản này đã quá thời hạn ân hạn 30 ngày và đã bị đóng vĩnh viễn.',
            code: 'ACCOUNT_PURGED',
          },
          { status: 403 }
        );
      }

      // Restore account
      await prisma.user.update({
        where: { id: user.id },
        data: {
          status: 'active',
          softDeletedAt: null,
          lastLoginAt: new Date(),
        },
      });

      accountReactivated = true;

      await logAudit({
        userId: user.id,
        action: 'account_reactivated',
        resource: 'user',
        resourceId: user.id,
        details: { message: 'Tài khoản được khôi phục tự động trong thời gian ân hạn 30 ngày.' },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    // Merge guest data if passed (Feature D.4)
    let mergeResult = null;
    if (validatedData.guestTrackerItems || validatedData.guestProfile) {
      mergeResult = await mergeGuestData(
        user.id,
        validatedData.guestTrackerItems,
        validatedData.guestProfile
      );
    }

    // Create session (Feature D.2)
    const session = await createSession(
      user.id,
      user.email,
      user.role,
      request,
      Boolean(user.studentVerifiedSourceId)
    );

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          studentVerified: Boolean(user.studentVerifiedSourceId),
          universityName: user.studentVerifiedSource?.name || null,
        },
        reactivated: accountReactivated,
        message: accountReactivated ? 'Chào mừng bạn trở lại! Tài khoản đã được khôi phục thành công.' : undefined,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        mergedItemsCount: mergeResult?.trackerMergedCount || 0,
      },
    });

    response.cookies.set('access-token', session.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    });

    response.cookies.set('auth-token', session.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    });

    response.cookies.set('refresh-token', session.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    await logAudit({
      userId: user.id,
      action: 'login',
      resource: 'user',
      resourceId: user.id,
      details: {
        device: session.sessionId,
        reactivated: accountReactivated,
      },
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    if (error.name === 'ZodError') {
      const issues = error.errors?.map((e: any) => e.message).join(', ') || 'Dữ liệu đầu vào không hợp lệ';
      return NextResponse.json({ success: false, error: issues }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Đã xảy ra lỗi hệ thống khi đăng nhập' }, { status: 500 });
  }
}
