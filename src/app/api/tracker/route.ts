import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/security/auth';
import { generatePrepRoadmap } from '@/lib/roadmap';
import { logAudit, getClientInfo } from '@/lib/security/audit';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: authUser.id },
    });

    if (!profile) {
      return NextResponse.json({ success: true, data: [] });
    }

    const items = await prisma.applicationTracker.findMany({
      where: { profileId: profile.id },
      include: {
        opportunity: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const parsedItems = items.map((item) => ({
      ...item,
      checklist: typeof item.checklist === 'string' ? JSON.parse(item.checklist) : item.checklist,
      opportunity: {
        ...item.opportunity,
        fieldCodes: item.opportunity.fieldCodes ? JSON.parse(item.opportunity.fieldCodes) : [],
        degreeLevel: item.opportunity.degreeLevel ? JSON.parse(item.opportunity.degreeLevel) : [],
      },
    }));

    return NextResponse.json({ success: true, data: parsedItems });
  } catch (error) {
    console.error('Get tracker error:', error);
    return NextResponse.json({ success: false, error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Vui lòng đăng nhập để lưu học bổng' }, { status: 401 });
    }

    const body = await request.json();
    const { opportunityId, status = 'interested' } = body;

    // Lấy hoặc tạo profile cho user
    let profile = await prisma.profile.findUnique({
      where: { userId: authUser.id },
    });

    if (!profile) {
      profile = await prisma.profile.create({
        data: { userId: authUser.id },
      });
    }

    // Lấy thông tin cơ hội học bổng để sinh checklist
    const opp = await prisma.opportunity.findUnique({
      where: { id: Number(opportunityId) },
    });

    if (!opp) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy cơ hội' }, { status: 404 });
    }

    let reqDocs = [];
    try {
      reqDocs = opp.requiredDocuments ? JSON.parse(opp.requiredDocuments) : [];
    } catch {
      reqDocs = [];
    }

    const roadmap = generatePrepRoadmap(opp.deadline ? opp.deadline.toISOString() : null, reqDocs);

    const tracker = await prisma.applicationTracker.upsert({
      where: {
        profileId_opportunityId: {
          profileId: profile.id,
          opportunityId: Number(opportunityId),
        },
      },
      update: {
        status,
        updatedAt: new Date(),
      },
      create: {
        profileId: profile.id,
        opportunityId: Number(opportunityId),
        status,
        checklist: JSON.stringify(roadmap),
      },
      include: {
        opportunity: true,
      },
    });

    const clientInfo = getClientInfo(request);
    await logAudit({
      userId: authUser.id,
      action: 'track_opportunity',
      resource: 'tracker',
      resourceId: String(opportunityId),
      details: clientInfo,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...tracker,
        checklist: typeof tracker.checklist === 'string' ? JSON.parse(tracker.checklist) : tracker.checklist,
      },
    });
  } catch (error) {
    console.error('Add tracker error:', error);
    return NextResponse.json({ success: false, error: 'Lỗi khi lưu theo dõi' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: authUser.id },
    });
    if (!profile) {
      return NextResponse.json({ success: false, error: 'Hồ sơ không tồn tại' }, { status: 404 });
    }

    const body = await request.json();
    const { id, status, checklist } = body;

    const dataToUpdate: any = { updatedAt: new Date() };
    if (status) dataToUpdate.status = status;
    if (checklist) dataToUpdate.checklist = JSON.stringify(checklist);

    const updated = await prisma.applicationTracker.update({
      where: { id: Number(id) },
      data: dataToUpdate,
      include: { opportunity: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        checklist: typeof updated.checklist === 'string' ? JSON.parse(updated.checklist) : updated.checklist,
      },
    });
  } catch (error) {
    console.error('Update tracker error:', error);
    return NextResponse.json({ success: false, error: 'Lỗi cập nhật tiến trình' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID' }, { status: 400 });
    }

    await prisma.applicationTracker.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete tracker error:', error);
    return NextResponse.json({ success: false, error: 'Lỗi xóa theo dõi' }, { status: 500 });
  }
}
