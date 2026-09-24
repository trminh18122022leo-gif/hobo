import prisma from '@/lib/db';

export interface ConfidenceFactors {
  hasDeadline: boolean;
  hasRequirements: boolean;
  hasBenefits: boolean;
  hasApplicationSteps: boolean;
  hasFaq: boolean;
  hasCanonicalUrl: boolean;
  hasFundingValue: boolean;
  sourceTrustScore: number; // 0-100
  isFromOfficialDomain: boolean;
  crossSourceCount?: number; // Unique sources mentioning similar opportunity
  llmConfidence?: number; // 0-100 score from LLM extraction
}

/**
 * Checks if a domain is an accredited education, government, or high-trust institution
 */
export function isOfficialDomain(url: string): boolean {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return (
      hostname.endsWith('.edu.vn') ||
      hostname.endsWith('.gov.vn') ||
      hostname.endsWith('.ac.vn') ||
      hostname.endsWith('.edu') ||
      hostname.endsWith('.ac.uk') ||
      hostname.endsWith('.org')
    );
  } catch {
    return false;
  }
}

/**
 * Multi-factor confidence score algorithm (0 - 100)
 * Evaluates completeness, institutional authority, cross-source confirmation, and LLM rating.
 */
export function calculateConfidence(factors: ConfidenceFactors): number {
  let score = 0;

  // 1. Data Completeness (Max 35 points)
  if (factors.hasDeadline) score += 10;
  if (factors.hasRequirements) score += 7;
  if (factors.hasBenefits) score += 6;
  if (factors.hasApplicationSteps) score += 5;
  if (factors.hasFundingValue) score += 4;
  if (factors.hasFaq) score += 3;

  // 2. Source Reliability & Official Authority (Max 35 points)
  const normalizedTrust = Math.min(Math.max(factors.sourceTrustScore, 0), 100);
  score += (normalizedTrust / 100) * 20;

  if (factors.isFromOfficialDomain) {
    score += 15; // Direct accreditation bonus
  }

  // 3. Cross-Source Multi-Confirmation (Max 15 points)
  if (factors.crossSourceCount && factors.crossSourceCount > 1) {
    score += Math.min(factors.crossSourceCount * 5, 15);
  } else {
    score += 5; // Base single source verified
  }

  // 4. LLM Structural Confidence (Max 15 points)
  if (factors.llmConfidence) {
    score += (Math.min(factors.llmConfidence, 100) / 100) * 15;
  } else {
    score += 10; // Default baseline
  }

  return Math.min(Math.max(Math.round(score), 10), 100);
}

/**
 * Checks how many independent sources feature a similar scholarship
 */
export async function findCrossSourceMatches(
  title: string,
  organization: string
): Promise<number> {
  try {
    const keywords = title.split(/\s+/).filter(w => w.length > 3).slice(0, 3);
    if (keywords.length === 0) return 1;

    const similar = await prisma.opportunity.findMany({
      where: {
        OR: [
          ...keywords.map(kw => ({ title: { contains: kw } })),
          { organization: { contains: organization } },
        ],
      },
      select: { sourceId: true },
      take: 20,
    });

    const uniqueSources = new Set(similar.map(s => s.sourceId));
    return Math.max(uniqueSources.size, 1);
  } catch {
    return 1;
  }
}
