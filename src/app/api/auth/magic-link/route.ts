import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { magicLinkRequestSchema } from '@/lib/security/sanitize';
import { generateRandomToken, hashToken } from '@/lib/auth/session';
import { emailRouter } from '@/lib/email/router';
import { logAudit } from '@/lib/security/audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = magicLinkRequestSchema.parse(body);

    // Clean up expired magic link tokens for this email
    await prisma.magicLinkToken.deleteMany({
      where: {
        OR: [
          { email },
          { expiresAt: { lt: new Date() } },
        ],
      },
    });

    const rawToken = generateRandomToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.magicLinkToken.create({
      data: {
        email,
        tokenHash,
        expiresAt,
      },
    });

    // Determine host origin for link
    const origin = request.nextUrl.origin || 'http://localhost:3000';
    await emailRouter.sendMagicLink(email, rawToken, origin);

    await logAudit({
      action: 'magic_link_requested',
      resource: 'auth',
      details: { email },
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AUTH-DEV] Magic link token generated for ${email}: ${origin}/api/auth/magic-link/verify?token=${rawToken}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Liên kết đăng nhập bảo mật đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư (hiệu lực 15 phút).',
    });
  } catch (error: any) {
    console.error('Magic link request error:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ success: false, error: 'Email không hợp lệ' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Không thể gửi email đăng nhập lúc này' }, { status: 500 });
  }
}
