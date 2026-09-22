import { NextRequest, NextResponse } from 'next/server';
import { checkStudentEmail } from '@/lib/auth/student-verify';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: true, isStudent: false });
    }

    const result = await checkStudentEmail(email);
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Check domain error:', error);
    return NextResponse.json({ success: true, data: { isStudent: false } });
  }
}
