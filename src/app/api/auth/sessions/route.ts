import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/security/auth';
import { getUserSessions, revokeSession } from '@/lib/auth/session';
import { logAudit } from '@/lib/security/audit';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/refresh-token=([^;]+)/);
    const currentRefreshToken = match ? match[1] : undefined;

    const sessions = await getUserSessions(user.id, currentRefreshToken);

    return NextResponse.json({
      success: true,
      data: { sessions },
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json({ success: false, error: 'Lỗi tải danh sách phiên đăng nhập' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    let sessionId = request.nextUrl.searchParams.get('id');
    if (!sessionId) {
      try {
        const body = await request.json();
        sessionId = body.sessionId;
      } catch {}
    }

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Thiếu mã phiên đăng nhập cần thu hồi' }, { status: 400 });
    }

    await revokeSession(sessionId, user.id);

    await logAudit({
      userId: user.id,
      action: 'revoke_session',
      resource: 'refresh_token',
      resourceId: sessionId,
      details: { message: `Người dùng đã thu hồi phiên ${sessionId}` },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã thu hồi phiên đăng nhập thành công',
    });
  } catch (error) {
    console.error('Revoke session error:', error);
    return NextResponse.json({ success: false, error: 'Lỗi khi thu hồi phiên đăng nhập' }, { status: 500 });
  }
}
