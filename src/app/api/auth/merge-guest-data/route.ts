import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/security/auth';
import { mergeGuestData } from '@/lib/auth/guest-merge';
import { guestMergeSchema } from '@/lib/security/sanitize';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const body = await request.json();
    const { guestTrackerItems, guestProfile } = guestMergeSchema.parse(body);

    const result = await mergeGuestData(user.id, guestTrackerItems, guestProfile);

    return NextResponse.json({
      success: true,
      data: {
        mergedItemsCount: result.trackerMergedCount,
        profileUpdated: result.profileUpdated,
        message: `Đã đồng bộ ${result.trackerMergedCount} mục lưu trữ và thông tin hồ sơ vào tài khoản.`,
      },
    });
  } catch (error: any) {
    console.error('Merge guest data error:', error);
    return NextResponse.json({ success: false, error: 'Không thể đồng bộ dữ liệu khách' }, { status: 500 });
  }
}
