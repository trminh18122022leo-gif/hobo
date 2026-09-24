import { NextRequest, NextResponse } from 'next/server';
import { runCrawlCycle } from '@/lib/crawler/scheduler';
import { getAuthUser } from '@/lib/security/auth';
import { logAudit, getClientInfo } from '@/lib/security/audit';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const crawlSecret = process.env.CRAWL_API_SECRET || 'hb-crawl-internal-secret-token-2026';

    let isAuthorized = false;
    let executorId = 'automated-scheduler';

    if (authHeader && authHeader === `Bearer ${crawlSecret}`) {
      isAuthorized = true;
    } else {
      const user = await getAuthUser(request);
      if (user && user.role.toLowerCase() === 'admin') {
        isAuthorized = true;
        executorId = user.id;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Không có quyền kích hoạt crawler' }, { status: 403 });
    }

    const summary = await runCrawlCycle();

    const clientInfo = getClientInfo(request);
    await logAudit({
      userId: executorId === 'automated-scheduler' ? undefined : executorId,
      action: 'crawl_triggered',
      resource: 'crawler',
      details: { ...clientInfo, summary },
    });

    return NextResponse.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Trigger crawl error:', error);
    return NextResponse.json({ success: false, error: 'Đã xảy ra lỗi hệ thống khi quét dữ liệu' }, { status: 500 });
  }
}
