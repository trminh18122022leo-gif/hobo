import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/security/auth';
import { revokeAllSessions } from '@/lib/auth/session';
import { logAudit } from '@/lib/security/audit';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    await revokeAllSessions(user.id);

    await logAudit({
      userId: user.id,
      action: 'logout_all_devices',
      resource: 'user',
      resourceId: user.id,
      details: { message: 'Người dùng đã đăng xuất khỏi toàn bộ thiết bị.' },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Đã đăng xuất khỏi tất cả các thiết bị thành công',
    });

    response.cookies.set('access-token', '', { maxAge: 0, path: '/' });
    response.cookies.set('auth-token', '', { maxAge: 0, path: '/' });
    response.cookies.set('refresh-token', '', { maxAge: 0, path: '/' });

    return response;
  } catch (error) {
    console.error('Logout all error:', error);
    return NextResponse.json({ success: false, error: 'Lỗi khi đăng xuất tất cả thiết bị' }, { status: 500 });
  }
}
