import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/security/auth';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const [
      totalSources,
      activeSources,
      totalOpp,
      publishedOpp,
      reviewOpp,
      expiredOpp,
      recentLogs,
    ] = await Promise.all([
      prisma.source.count(),
      prisma.source.count({ where: { isActive: true } }),
      prisma.opportunity.count(),
      prisma.opportunity.count({ where: { status: 'PUBLISHED' } }),
      prisma.opportunity.count({ where: { status: 'REVIEW' } }),
      prisma.opportunity.count({ where: { status: 'EXPIRED' } }),
      prisma.crawlLog.findMany({ orderBy: { crawledAt: 'desc' }, take: 20 }),
    ]);

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const logsLast24h = await prisma.crawlLog.findMany({
      where: { crawledAt: { gte: last24h } },
      select: { status: true },
    });
    
    const successLogs = logsLast24h.filter(log => log.status === 'SUCCESS').length;
    const crawlSuccessRate = logsLast24h.length > 0 ? (successLogs / logsLast24h.length) * 100 : 0;
    
    const lastCrawlTimestamp = recentLogs.length > 0 ? recentLogs[0].crawledAt : null;

    const stats = {
      sources: { total: totalSources, active: activeSources },
      opportunities: {
        total: totalOpp,
        published: publishedOpp,
        review: reviewOpp,
        expired: expiredOpp,
      },
      recentCrawlLogs: recentLogs,
      crawlSuccessRate,
      lastCrawlTimestamp,
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    if (error.message === 'Not authenticated' || error.message === 'Forbidden') {
       return NextResponse.json({ success: false, error: 'Không có quyền truy cập' }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Đã xảy ra lỗi hệ thống' }, { status: 500 });
  }
}



