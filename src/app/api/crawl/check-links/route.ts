import { NextRequest, NextResponse } from 'next/server';
import { checkOpportunityLinks } from '@/lib/crawler/link-checker';
import { getAuthUser } from '@/lib/security/auth';
import { enforceRateLimit, crawlLimiter, rateLimitResponse } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const rl = enforceRateLimit(crawlLimiter, request);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

    const authHeader = request.headers.get('authorization');
    const crawlSecret = process.env.CRAWL_API_SECRET;
    if (!crawlSecret && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, error: 'Server misconfiguration' }, { status: 500 });
    }
    
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
