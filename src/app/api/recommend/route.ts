import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/security/auth';
import { getRecommendations, generatePortfolioStrategy } from '@/lib/recommend/engine';
import { ProfileInput } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    const profile = await prisma.profile.findUnique({
      where: { userId: authUser.id },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng tạo hồ sơ năng lực trước khi nhận gợi ý chiến lược.' },
        { status: 400 }
      );
    }

    const formattedProfile: ProfileInput = {
      gpa: profile.gpa,
      gpaScale: profile.gpaScale,
      cpa: profile.cpa,
      degreeLevel: profile.degreeLevel || 'bachelor',
      fieldCodes: profile.fieldCodes ? JSON.parse(profile.fieldCodes) : [],
      languageCerts: profile.languageCerts ? JSON.parse(profile.languageCerts) : [],
      achievements: profile.achievements ? JSON.parse(profile.achievements) : [],
      projects: profile.projects ? JSON.parse(profile.projects) : [],
      publications: profile.publications ? JSON.parse(profile.publications) : [],
      preferredOrgType: profile.preferredOrgType ? JSON.parse(profile.preferredOrgType) : [],
      preferredRegions: profile.preferredRegions ? JSON.parse(profile.preferredRegions) : [],
    };

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 30000); // 30s timeout

    try {
      const recommendations = await getRecommendations(formattedProfile);
      const portfolioStrategy = generatePortfolioStrategy(recommendations);
      clearTimeout(timeout);

      return NextResponse.json({
        success: true,
        data: {
          recommendations,
          portfolioStrategy,
        },
      });
    } catch (e: any) {
      clearTimeout(timeout);
      if (e.name === 'AbortError' || e.code === 'ABORT_ERR') {
        return NextResponse.json({ success: false, error: 'Quá thời gian xử lý' }, { status: 504 });
      }
      throw e;
    }
  } catch (error: any) {
    console.error('Recommend error:', error);
    if (error.message === 'Not authenticated') {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Đã xảy ra lỗi hệ thống' }, { status: 500 });
  }
}
