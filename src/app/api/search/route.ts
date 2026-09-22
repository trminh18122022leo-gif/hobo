import { NextRequest, NextResponse } from 'next/server';
import { searchOpportunities } from '@/lib/search';
import { searchQuerySchema } from '@/lib/security/sanitize';

export async function GET(request: NextRequest) {
  try {
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
