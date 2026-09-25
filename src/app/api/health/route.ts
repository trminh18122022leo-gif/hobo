import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.HEALTH_CHECK_SECRET;
  const isAuthorized = secret && authHeader === `Bearer ${secret}`;

  try {
    await prisma.$queryRaw`SELECT 1`;

    if (isAuthorized) {
      return NextResponse.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    }
    // Public: minimal response — no system info leaked
    return NextResponse.json({ status: 'ok' });
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 503 });
  }
}
