import { NextRequest, NextResponse } from 'next/server';
import { checkOpportunityLinks } from '@/lib/crawler/link-checker';
import { getAuthUser } from '@/lib/security/auth';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const crawlSecret = process.env.CRAWL_API_SECRET || 'hb-crawl-internal-secret-token-2026';
    
    // Check authorization: either Bearer token or Admin session
    let isAuthorized = false;

    if (authHeader && authHeader === `Bearer ${crawlSecret}`) {
      isAuthorized = true;
    } else {
      const user = await getAuthUser(request);
      if (user && user.role.toLowerCase() === 'admin') {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const summary = await checkOpportunityLinks(50);
    return NextResponse.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Check links API error:', error);
    return NextResponse.json({ success: false, error: 'Link check failed' }, { status: 500 });
  }
}
