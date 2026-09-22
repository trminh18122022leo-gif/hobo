import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/security/auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        studentVerifiedSourceId: true,
        studentVerifiedSource: {
          select: {
            id: true,
            name: true,
            baseUrl: true,
          },
        },
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user || user.status === 'soft_deleted') {
      return NextResponse.json({ success: false, error: 'Tài khoản không tồn tại hoặc đã bị khóa' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          studentVerified: Boolean(user.studentVerifiedSourceId),
          universityName: user.studentVerifiedSource?.name || null,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        },
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    return NextResponse.json({ success: false, error: 'Đã xảy ra lỗi hệ thống' }, { status: 500 });
  }
}
