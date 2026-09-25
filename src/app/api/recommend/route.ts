import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/security/auth';
import { getRecommendations, generatePortfolioStrategy, getTopRecommendedOpportunities } from '@/lib/recommend/engine';
import { ProfileInput } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '6', 10), 1), 30);
    const topOpportunities = await getTopRecommendedOpportunities(limit);

    return NextResponse.json({
      success: true,
      data: {
        recommendations: topOpportunities.map((opp) => ({
          opportunityId: opp.id,
          opportunity: opp,
          hardPass: true,
          softScore: +((opp.rankScore || 80) / 100).toFixed(2),
          category: opp.rankScore >= 90 ? 'reach' : opp.rankScore >= 75 ? 'match' : 'safety',
        })),
        portfolioStrategy: null,
      },
    });
  } catch (error) {
    console.error('GET recommend error:', error);
    return NextResponse.json({ success: false, error: 'Đã xảy ra lỗi hệ thống' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    let formattedProfile: ProfileInput | null = null;

    if (authUser) {
      const profile = await prisma.profile.findUnique({
        where: { userId: authUser.id },
      });

      if (profile) {
        formattedProfile = {
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
      }
    }

    // Nếu không có profile từ DB, kiểm tra xem client có gửi trực tiếp profile trong body không
    if (!formattedProfile) {
      try {
        const body = await request.json();
        const cand = body?.profile || body;
        if (cand && (cand.gpa !== undefined || cand.fieldCodes || cand.degreeLevel)) {
          formattedProfile = {
            gpa: cand.gpa ?? 3.2,
            gpaScale: cand.gpaScale ?? 4.0,
            cpa: cand.cpa,
            degreeLevel: cand.degreeLevel || 'bachelor',
            fieldCodes: Array.isArray(cand.fieldCodes) ? cand.fieldCodes : [],
            languageCerts: Array.isArray(cand.languageCerts) ? cand.languageCerts : [],
            achievements: Array.isArray(cand.achievements) ? cand.achievements : [],
            projects: Array.isArray(cand.projects) ? cand.projects : [],
            publications: Array.isArray(cand.publications) ? cand.publications : [],
            preferredOrgType: Array.isArray(cand.preferredOrgType) ? cand.preferredOrgType : [],
            preferredRegions: Array.isArray(cand.preferredRegions) ? cand.preferredRegions : [],
          };
        }
      } catch {
        // body might be empty or invalid json
      }
    }

    // Nếu vẫn không có profile (khách vãng lai chưa tạo hồ sơ), trả về các cơ hội hàng đầu còn hạn
    if (!formattedProfile) {
      const topOpportunities = await getTopRecommendedOpportunities(8);
      return NextResponse.json({
        success: true,
        isGuestFallback: true,
        data: {
          recommendations: topOpportunities.map((opp) => ({
            opportunityId: opp.id,
            opportunity: opp,
            hardPass: true,
            softScore: +((opp.rankScore || 80) / 100).toFixed(2),
            category: opp.rankScore >= 90 ? 'reach' : opp.rankScore >= 75 ? 'match' : 'safety',
          })),
          portfolioStrategy: null,
        },
      });
    }

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
    return NextResponse.json({ success: false, error: 'Đã xảy ra lỗi hệ thống' }, { status: 500 });
  }
}
