import prisma from '@/lib/db';
import {
  ProfileInput,
  RecommendationResult,
  PortfolioStrategy,
  OpportunityCard,
} from '@/types';

function calculateJaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

export async function getRecommendations(
  profile: ProfileInput,
  limit: number = 30
): Promise<RecommendationResult[]> {
  try {
    const now = new Date();
    const minDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Còn hạn hoặc không có hạn

    // TIER 1: Hard filter từ database
    const opportunities = await prisma.opportunity.findMany({
      where: {
        status: 'published',
        OR: [{ deadline: { gt: minDate } }, { deadline: null }],
      },
      orderBy: { rankScore: 'desc' },
      take: 200,
    });

    const results: RecommendationResult[] = [];

    // TIER 2: Soft scoring đa biến
    for (const opp of opportunities) {
      let softScore = 0;

      // 1. Độ trùng khớp ngành học (45%)
      let oppFields: string[] = [];
      try {
        oppFields = opp.fieldCodes ? JSON.parse(opp.fieldCodes) : [];
      } catch {
        oppFields = [];
      }
      const fieldOverlap = calculateJaccardSimilarity(
        new Set(oppFields),
        new Set(profile.fieldCodes || [])
      );
      softScore += 0.45 * (fieldOverlap > 0 ? fieldOverlap : 0.3); // Điểm nền tối thiểu

      // 2. Headroom GPA (20%)
      let requirements: any = {};
      try {
        requirements = opp.requirements ? JSON.parse(opp.requirements) : {};
      } catch {
        requirements = {};
      }
      const minGpa = Number(requirements.gpa_min || requirements.gpa || 2.5);
      const userGpa = profile.gpa || 3.0;

      if (userGpa >= minGpa) {
        const headroom = Math.min((userGpa - minGpa) / 1.5, 1.0);
        softScore += 0.2 * (0.5 + 0.5 * headroom);
      } else {
        // Vẫn cho cơ hội nếu cách không quá 0.3
        if (minGpa - userGpa <= 0.3) {
          softScore += 0.05;
        } else {
          continue; // Vượt quá chênh lệch cho phép
        }
      }

      // 3. Sức mạnh hồ sơ ngoại khóa / công trình (15%)
      const evidenceCount =
        (profile.projects?.length || 0) +
        (profile.publications?.length || 0) +
        (profile.achievements?.length || 0);
      const evidenceStrength = Math.min(evidenceCount / 6, 1.0);
      softScore += 0.15 * evidenceStrength;

      // 4. Chứng chỉ ngoại ngữ (12%)
      let langScore = 0.5;
      if (profile.languageCerts && profile.languageCerts.length > 0) {
        langScore = 1.0;
      }
      softScore += 0.12 * langScore;

      // 5. Địa điểm ưu tiên (8%)
      let locationScore = 0.5;
      if (
        profile.preferredRegions &&
        profile.preferredRegions.some((r) => opp.studyLocation?.includes(r))
      ) {
        locationScore = 1.0;
      }
      softScore += 0.08 * locationScore;

      // Phân loại danh mục chiến lược (B.8)
      // Thử sức (Reach) | Phù hợp (Match) | Chắc chắn (Safety)
      let category: 'reach' | 'match' | 'safety' = 'match';
      if (softScore >= 0.78) {
        category = 'safety';
      } else if (softScore <= 0.62 || (opp.rankScore && opp.rankScore > 92)) {
        category = 'reach';
      } else {
        category = 'match';
      }

      const oppCard: OpportunityCard = {
        id: opp.id,
        slug: opp.slug,
        kind: opp.kind as any,
        title: opp.title,
        organization: opp.organization,
        organizationType: opp.organizationType,
        summary: opp.summary,
        deadline: opp.deadline ? opp.deadline.toISOString() : null,
        applyStart: opp.applyStart ? opp.applyStart.toISOString() : null,
        fundingType: opp.fundingType,
        fundingValueVnd: opp.fundingValueVnd,
        studyLocation: opp.studyLocation,
        fieldCodes: oppFields,
        degreeLevel: opp.degreeLevel ? JSON.parse(opp.degreeLevel) : [],
        rankScore: opp.rankScore,
        confidence: opp.confidence,
        lastVerifiedAt: opp.lastVerifiedAt.toISOString(),
        daysUntilDeadline: opp.deadline
          ? Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null,
        canonicalUrl: opp.canonicalUrl,
        status: opp.status,
      };

      results.push({
        opportunityId: opp.id,
        opportunity: oppCard,
        hardPass: true,
        softScore: +softScore.toFixed(2),
        category,
      });
    }

    results.sort((a, b) => b.softScore - a.softScore);
    return results.slice(0, limit);
  } catch (error) {
    console.error('Error in getRecommendations:', error);
    return [];
  }
}

/**
 * Tạo danh mục chiến lược cân bằng rủi ro (Tính năng B.8)
 */
export function generatePortfolioStrategy(recommendations: RecommendationResult[]): PortfolioStrategy {
  const reach = recommendations.filter((r) => r.category === 'reach');
  const match = recommendations.filter((r) => r.category === 'match');
  const safety = recommendations.filter((r) => r.category === 'safety');

  return {
    reach,
    match,
    safety,
    recommendedMix: {
      reach: 2,
      match: 3,
      safety: 2,
    },
    summary: `Chiến lược nộp hồ sơ thông minh đề xuất công thức 2-3-2: Nộp 2 chương trình 'Thử sức' để vươn tới học bổng danh giá, 3 chương trình 'Phù hợp' là trọng tâm cơ hội, và 2 chương trình 'Chắc chắn' làm điểm tựa an toàn vững chắc.`,
  };
}
