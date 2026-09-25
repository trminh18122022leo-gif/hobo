import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword } from '@/lib/security/auth';
import { registerSchema } from '@/lib/security/sanitize';
import { logAudit } from '@/lib/security/audit';
import { checkStudentEmail } from '@/lib/auth/student-verify';
import { createSession } from '@/lib/auth/session';
import { mergeGuestData } from '@/lib/auth/guest-merge';
import { authLimiter, enforceRateLimit, rateLimitResponse } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const rateCheck = enforceRateLimit(authLimiter, request);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfter);

    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      if (existingUser.status === 'soft_deleted') {
        return NextResponse.json(
          {
            success: false,
            error: 'Tài khoản này đang trong thời gian chờ xóa 30 ngày. Vui lòng chọn "Đăng nhập" để kích hoạt lại tài khoản.',
            code: 'ACCOUNT_SOFT_DELETED',
          },
          { status: 409 }
        );
      }
      return NextResponse.json({ success: false, error: 'Địa chỉ email này đã được đăng ký' }, { status: 409 });
    }

    // Check student domain match (Feature D.1)
    const studentMatch = await checkStudentEmail(validatedData.email);

    const passwordHash = await hashPassword(validatedData.password);

    // Create user in database
    // SECURITY FIX L4: Do NOT auto-verify email without verification OTP/magic link.
    // Record student match source ID as pending verification; emailVerifiedAt remains null until confirmed.
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        passwordHash: passwordHash,
        role: 'user',
        status: 'active',
        studentVerifiedSourceId: studentMatch.isStudent && studentMatch.sourceId ? studentMatch.sourceId : null,
        emailVerifiedAt: null,
      },
    });

    // Automatically merge guest data if present (Feature D.4)
    let mergeResult = null;
    if (validatedData.guestTrackerItems || validatedData.guestProfile) {
      mergeResult = await mergeGuestData(
        user.id,
        validatedData.guestTrackerItems,
        validatedData.guestProfile
      );
    }

    // Create session with Refresh Token and short-lived Access Token (Feature D.2)
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
          universityName: studentMatch.universityName,
          badgeLabel: studentMatch.badgeLabel,
        },
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        mergedItemsCount: mergeResult?.trackerMergedCount || 0,
      },
    });

    // Set secure HTTP-only cookies
    response.cookies.set('access-token', session.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    response.cookies.set('refresh-token', session.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    await logAudit({
      userId: user.id,
      action: 'register',
      resource: 'user',
      resourceId: user.id,
      details: {
        email: user.email,
        studentVerified: studentMatch.isStudent,
        university: studentMatch.universityName,
      },
    });

    return response;
  } catch (error: any) {
    console.error('Register error:', error);
    if (error.name === 'ZodError') {
      const issues = error.errors?.map((e: any) => e.message).join(', ') || 'Dữ liệu đầu vào không hợp lệ';
      return NextResponse.json({ success: false, error: issues }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Đã xảy ra lỗi hệ thống khi đăng ký' }, { status: 500 });
  }
}
