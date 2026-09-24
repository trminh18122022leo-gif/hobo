import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/security/auth';
import { logAudit } from '@/lib/security/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin(request);
    const { id } = await params;
    const oppId = parseInt(id, 10);

    if (isNaN(oppId)) {
      return NextResponse.json({ success: false, error: 'ID không hợp lệ' }, { status: 400 });
    }

    const body = await request.json();
    const action = body.action || 'verify'; // 'verify' | 'archive' | 'reject'
    const note = body.note || '';

    const opp = await prisma.opportunity.findUnique({
      where: { id: oppId },
    });

    if (!opp) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy học bổng' }, { status: 404 });
    }

    let updatedOpp;

    if (action === 'verify') {
      updatedOpp = await prisma.opportunity.update({
        where: { id: oppId },
        data: {
          verifiedBy: adminUser.id,
          verifiedAt: new Date(),
          verifyNote: note || 'Đã thẩm định và xác thực độ chính xác.',
          confidence: 100, // Direct admin sign-off max confidence
          status: 'published',
        },
      });
    } else if (action === 'archive') {
      updatedOpp = await prisma.opportunity.update({
        where: { id: oppId },
        data: {
          verifiedBy: adminUser.id,
          verifiedAt: new Date(),
          verifyNote: note || 'Đã lưu trữ / gỡ bỏ bởi quản trị viên.',
          status: 'archived',
        },
      });
    } else {
      updatedOpp = await prisma.opportunity.update({
        where: { id: oppId },
        data: {
          verifyNote: note,
          status: 'review',
        },
      });
    }

    await logAudit({
      userId: adminUser.id,
      action: `opportunity_${action}`,
      resource: 'opportunity',
      resourceId: String(oppId),
      details: { title: opp.title, note, action },
    });

    return NextResponse.json({
      success: true,
      data: updatedOpp,
      message: action === 'verify' ? 'Đã xác thực thông tin học bổng thành công!' : 'Đã cập nhật trạng thái học bổng.',
    });
  } catch (error: any) {
    console.error('Verify opportunity error:', error);
    if (error.message === 'Forbidden' || error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Yêu cầu quyền Quản trị viên' }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Lỗi khi xác thực học bổng' }, { status: 500 });
  }
}
