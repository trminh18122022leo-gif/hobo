import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/security/auth';
import { runCrawlCycle } from '@/lib/crawler/scheduler';
import { logAudit, getClientInfo } from '@/lib/security/audit';

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAdmin(request);

    const summary = await runCrawlCycle();

    const clientInfo = getClientInfo(request);
    await logAudit({ userId: authUser.id, action: 'manual_crawl', resource: 'crawler', details: clientInfo });

    return NextResponse.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('Trigger crawl error:', error);
    if (error.message === 'Not authenticated' || error.message === 'Forbidden') {
       return NextResponse.json({ success: false, error: 'Không có quyền truy cập' }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Đã xảy ra lỗi hệ thống' }, { status: 500 });
  }
}

