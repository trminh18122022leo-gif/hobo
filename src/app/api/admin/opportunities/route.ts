import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/security/auth';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const linkStatus = searchParams.get('linkStatus');
    const unverifiedOnly = searchParams.get('unverifiedOnly') === 'true';
    const q = searchParams.get('q') || '';
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (linkStatus && linkStatus !== 'all') {
      where.linkStatus = linkStatus;
    }

    if (unverifiedOnly) {
      where.verifiedAt = null;
    }

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { organization: { contains: q } },
      ];
    }

    const [total, items] = await prisma.$transaction([
      prisma.opportunity.count({ where }),
      prisma.opportunity.findMany({
        where,
        include: {
          source: {
            select: { name: true, baseUrl: true, tier: true, trustScore: true },
          },
        },
        orderBy: [
          { confidence: 'asc' }, // Prioritize low-confidence items for review
          { lastVerifiedAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
    ]);

    // Stats
    const [totalCount, verifiedCount, deadLinkCount, unverifiedCount] = await prisma.$transaction([
      prisma.opportunity.count(),
      prisma.opportunity.count({ where: { verifiedAt: { not: null } } }),
      prisma.opportunity.count({ where: { linkStatus: 'dead' } }),
      prisma.opportunity.count({ where: { verifiedAt: null } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          totalCount,
          verifiedCount,
          deadLinkCount,
          unverifiedCount,
        },
      },
    });
  } catch (error: any) {
    console.error('Admin opportunities list error:', error);
    if (error.message === 'Forbidden' || error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Yêu cầu quyền Quản trị viên' }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Không thể tải danh sách học bổng' }, { status: 500 });
  }
}
