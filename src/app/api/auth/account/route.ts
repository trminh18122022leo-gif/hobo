import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/security/auth';
import { revokeAllSessions } from '@/lib/auth/session';
import { logAudit } from '@/lib/security/audit';

/**
 * DELETE /api/auth/account
 * Feature D.3: Soft delete with 30-day grace period
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const now = new Date();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'soft_deleted',
        softDeletedAt: now,
      },
    });

    // Revoke all active sessions
    await revokeAllSessions(user.id);

    await logAudit({
      userId: user.id,
      action: 'account_soft_deleted',
      resource: 'user',
      resourceId: user.id,
      details: {
        softDeletedAt: now.toISOString(),
        gracePeriodDays: 30,
        notice: 'Tài khoản vào thời gian ân hạn 30 ngày.',
      },
    });

    const response = NextResponse.json({
      success: true,
      message:
        'Tài khoản của bạn đã được chuyển sang trạng thái chờ xóa. Bạn có thời gian ân hạn 30 ngày: bất kỳ lúc nào bạn đăng nhập lại trong 30 ngày này, tài khoản sẽ được khôi phục nguyên vẹn. Sau 30 ngày, toàn bộ dữ liệu sẽ được xóa vĩnh viễn theo quy định bảo mật.',
    });

    // Clear all auth cookies
    response.cookies.set('access-token', '', { maxAge: 0, path: '/' });
    response.cookies.set('auth-token', '', { maxAge: 0, path: '/' });
    response.cookies.set('refresh-token', '', { maxAge: 0, path: '/' });

    return response;
  } catch (error) {
    console.error('Soft delete account error:', error);
    return NextResponse.json({ success: false, error: 'Lỗi khi yêu cầu xóa tài khoản' }, { status: 500 });
  }
}
