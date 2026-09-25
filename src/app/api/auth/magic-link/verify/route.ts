import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashToken, createSession } from '@/lib/auth/session';
import { checkStudentEmail } from '@/lib/auth/student-verify';
import { logAudit } from '@/lib/security/audit';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const origin = request.nextUrl.origin || 'http://localhost:3000';

  if (!token) {
    return NextResponse.redirect(`${origin}/dang-nhap?error=missing_token`);
  }

  try {
    const tokenHash = hashToken(token);
    const magicToken = await prisma.magicLinkToken.findUnique({
      where: { tokenHash },
    });

    if (!magicToken || new Date() > magicToken.expiresAt) {
      return NextResponse.redirect(`${origin}/dang-nhap?error=expired_token`);
    }

    // Delete token immediately so it cannot be used again
    await prisma.magicLinkToken.delete({
      where: { id: magicToken.id },
    });

    // Find user or auto-create if new
    let user = await prisma.user.findUnique({
      where: { email: magicToken.email },
    });

    if (!user) {
      const studentMatch = await checkStudentEmail(magicToken.email);
      user = await prisma.user.create({
        data: {
          email: magicToken.email,
          name: magicToken.email.split('@')[0],
          role: 'user',
          status: 'active',
          emailVerifiedAt: new Date(),
          studentVerifiedSourceId: studentMatch.isStudent && studentMatch.sourceId ? studentMatch.sourceId : null,
        },
      });
    } else {
      // If soft deleted, reactivate
      if (user.status === 'soft_deleted') {
        await prisma.user.update({
          where: { id: user.id },
          data: { status: 'active', softDeletedAt: null, lastLoginAt: new Date() },
        });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date(), emailVerifiedAt: user.emailVerifiedAt || new Date() },
        });
      }
    }

    // Create session
    const session = await createSession(
      user.id,
      user.email,
      user.role,
      request,
      Boolean(user.studentVerifiedSourceId)
    );

    await logAudit({
      userId: user.id,
      action: 'login_magic_link',
      resource: 'user',
      resourceId: user.id,
    });

    // Redirect to home with success notice
    const response = NextResponse.redirect(`${origin}/?login=success`);

    response.cookies.set('access-token', session.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    response.cookies.set('refresh-token', session.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Magic link verify error:', error);
    return NextResponse.redirect(`${origin}/dang-nhap?error=system_error`);
  }
}
