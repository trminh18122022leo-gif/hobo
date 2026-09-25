import prisma from '@/lib/db';
import { syncExpiredOpportunities } from '@/lib/expiration-sync';
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
    // 1. Tự động đồng bộ và loại bỏ các mục đã quá hạn
    await syncExpiredOpportunities();

    const now = new Date();

    // 2. TIER 1: Hard filter từ database - BẮT BUỘC CÒN HẠN & ĐANG PHÁT HÀNH
    const opportunities = await prisma.opportunity.findMany({
      where: {
        status: 'published',
        OR: [{ deadline: { gte: now } }, { deadline: null }],
      },
      orderBy: [{ rankScore: 'desc' }, { deadline: 'asc' }],
      take: 200,
    });

    const results: RecommendationResult[] = [];

    // TIER 2: Soft scoring đa biến
    for (const opp of opportunities) {
      // Bỏ qua nếu có deadline nhưng đã qua thời điểm hiện tại
      if (opp.deadline && new Date(opp.deadline) < now) {
        continue;
      }

      let softScore = 0;

      // 1. Độ trùng khớp ngành học (40%)
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
      softScore += 0.40 * (fieldOverlap > 0 ? fieldOverlap : 0.3); // Điểm nền tối thiểu

      // 2. Headroom GPA (18%)
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
        softScore += 0.18 * (0.5 + 0.5 * headroom);
      } else {
        // Vẫn cho cơ hội nếu cách không quá 0.3
        if (minGpa - userGpa <= 0.3) {
          softScore += 0.05;
        } else {
          continue; // Vượt quá chênh lệch cho phép
        }
      }

      // 3. Sức mạnh hồ sơ ngoại khóa / công trình (12%)
      const evidenceCount =
        (profile.projects?.length || 0) +
        (profile.publications?.length || 0) +
        (profile.achievements?.length || 0);
      const evidenceStrength = Math.min(evidenceCount / 6, 1.0);
      softScore += 0.12 * evidenceStrength;

      // 4. Chứng chỉ ngoại ngữ (10%)
      let langScore = 0.5;
      if (profile.languageCerts && profile.languageCerts.length > 0) {
        langScore = 1.0;
      }
      softScore += 0.10 * langScore;

      // 5. Địa điểm ưu tiên (6%)
      let locationScore = 0.5;
      if (
        profile.preferredRegions &&
        profile.preferredRegions.some((r) => opp.studyLocation?.includes(r))
      ) {
        locationScore = 1.0;
      }
      softScore += 0.06 * locationScore;

      // 6. ĐẨY LÊN ĐỀ XUẤT: Smart Urgency & Recency Boost (Lên đến +0.25)
      // Ưu tiên đặc biệt các học bổng/tuyển sinh còn hạn mới nhất trong 15-90 ngày tới
      if (opp.deadline) {
        const daysUntil = Math.ceil((new Date(opp.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil > 0 && daysUntil <= 60) {
          // Cửa sổ vàng: Đang mở và sắp đóng trong 15-60 ngày tới -> Đẩy mạnh lên đầu
          softScore += 0.20;
        } else if (daysUntil > 60 && daysUntil <= 120) {
          softScore += 0.12;
        } else if (daysUntil > 120) {
          softScore += 0.06;
        }
      } else {
        softScore += 0.08;
      }

      // Thưởng điểm cho cơ hội vừa được xác thực trong 14 ngày qua
      if (opp.lastVerifiedAt && (now.getTime() - new Date(opp.lastVerifiedAt).getTime()) < 14 * 24 * 60 * 60 * 1000) {
        softScore += 0.08;
      }

      // Thưởng điểm học bổng toàn phần danh giá
      if (opp.fundingType === 'full') {
        softScore += 0.08;
      }

      // Phân loại danh mục chiến lược (B.8)
      // Thử sức (Reach) | Phù hợp (Match) | Chắc chắn (Safety)
      let category: 'reach' | 'match' | 'safety' = 'match';
      if (softScore >= 0.85) {
        category = 'safety';
      } else if (softScore <= 0.65 || (opp.rankScore && opp.rankScore > 92)) {
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

    // Sắp xếp: Điểm softScore cao nhất (gồm điểm hồ sơ + điểm ưu tiên hạn chót mới) lên đầu
    results.sort((a, b) => b.softScore - a.softScore);
    return results.slice(0, limit);
  } catch (error) {
    console.error('Error in getRecommendations:', error);
    return [];
  }
}

/**
 * Lấy danh sách các cơ hội được đề xuất hàng đầu (Dành cho trang chủ / Khách vãng lai / Gợi ý nổi bật)
 * - Tự động loại bỏ mục hết hạn
 * - Ưu tiên các chương trình có hạn nộp trong "khung vàng" (15 - 90 ngày tới)
 * - Ưu tiên chương trình có uy tín/rankScore cao và mới xác thực
 */
export async function getTopRecommendedOpportunities(limit: number = 6): Promise<OpportunityCard[]> {
  try {
    await syncExpiredOpportunities();
    const now = new Date();

    const opportunities = await prisma.opportunity.findMany({
      where: {
        status: 'published',
        OR: [{ deadline: { gte: now } }, { deadline: null }],
      },
      orderBy: [
        { rankScore: 'desc' },
        { deadline: 'asc' },
      ],
      take: 60,
    });

    const scored = opportunities.map((opp) => {
      let priorityScore = opp.rankScore || 50;

      if (opp.deadline) {
        const days = Math.ceil((new Date(opp.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (days >= 15 && days <= 60) {
          priorityScore += 30; // Golden Window
        } else if (days > 60 && days <= 120) {
          priorityScore += 20;
        } else if (days > 0 && days < 15) {
          priorityScore += 10;
        }
      }

      if (opp.fundingType === 'full') {
        priorityScore += 15;
      }

      if (opp.lastVerifiedAt && (now.getTime() - new Date(opp.lastVerifiedAt).getTime()) < 14 * 24 * 60 * 60 * 1000) {
        priorityScore += 10;
      }

      const oppFields: string[] = opp.fieldCodes ? JSON.parse(opp.fieldCodes) : [];
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

      return { oppCard, priorityScore };
    });

    scored.sort((a, b) => b.priorityScore - a.priorityScore);
    return scored.slice(0, limit).map((s) => s.oppCard);
  } catch (error) {
    console.error('Error in getTopRecommendedOpportunities:', error);
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
