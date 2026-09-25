import { NextRequest, NextResponse } from 'next/server';
import { searchOpportunities } from '@/lib/search';
import { searchQuerySchema } from '@/lib/security/sanitize';
import { searchLimiter, enforceRateLimit, rateLimitResponse } from '@/lib/security/rate-limit';

export async function GET(request: NextRequest) {
  try {
    // 1. Rate Limiting Check
    const rateCheck = enforceRateLimit(searchLimiter, request);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.retryAfter);
    }

    const { searchParams } = new URL(request.url);
    const queryObj: Record<string, any> = {};

    searchParams.forEach((val, key) => {
      // Nếu key đã tồn tại thì chuyển thành mảng
      if (queryObj[key]) {
        if (Array.isArray(queryObj[key])) {
          queryObj[key].push(val);
        } else {
          queryObj[key] = [queryObj[key], val];
        }
      } else {
        queryObj[key] = val;
      }
    });

    const validatedQuery = searchQuerySchema.parse(queryObj);
    const searchResult = await searchOpportunities(validatedQuery);

    return NextResponse.json({ success: true, data: searchResult });
  } catch (error: any) {
    console.error('Search error:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Tham số tìm kiếm không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: 'Đã xảy ra lỗi hệ thống' }, { status: 500 });
  }
}
