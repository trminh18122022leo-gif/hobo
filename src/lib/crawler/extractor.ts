import * as cheerio from 'cheerio';
import slugify from 'slugify';
import { Source } from './fetcher';
import { matchFieldCodes } from '../taxonomy';
import { extractWithLLM } from './llm-extractor';
import { calculateConfidence, isOfficialDomain, findCrossSourceMatches } from './confidence';

export interface ExtractedOppFull {
  title: string;
  slug: string;
  organization: string;
  organizationType: string;
  kind: string;
  summary: string;
  requirements: string; // JSON string
  fieldCodes: string; // JSON string
  degreeLevel: string; // JSON string
  studyLocation: string;
  fundingType: string;
  fundingValueVnd: number | null;
  bondYears: number | null;
  applyStart: Date | null;
  deadline: Date | null;
  requiredDocuments: string; // JSON string
  applicationSteps: string; // JSON string
  timelineMilestones: string; // JSON string
  benefits: string; // JSON string
  faq: string; // JSON string
  confidence: number;
  canonicalUrl: string;
}

export function generateSlug(title: string, org: string): string {
  const base = `${title} ${org}`;
  return slugify(base, { lower: true, locale: 'vi', strict: true });
}

/**
 * Enhanced Heuristics Extraction (Cheerio + Regex + Taxonomy)
 */
export function extractOpportunitiesHeuristics(html: string, cleanText: string, source: Source): ExtractedOppFull[] {
  const $ = cheerio.load(html);
  const opps: ExtractedOppFull[] = [];

  const headings = $('h1, h2, h3, h4').filter((_, el) => {
    const text = $(el).text().toLowerCase();
    return (
      text.includes('học bổng') ||
      text.includes('tuyển sinh') ||
      text.includes('xét tuyển') ||
      text.includes('chỉ tiêu') ||
      text.includes('chương trình đào tạo') ||
      text.includes('hỗ trợ tài chính')
    );
  });

  const nowYear = new Date().getFullYear();

  headings.each((_, el) => {
    const title = $(el).text().trim();
    if (title.length < 8) return;

    let parent = $(el).parent();
    let contentText = parent.text();
    if (contentText.length < 200) {
      parent = parent.parent();
      contentText = parent.text();
    }

    const lowerText = contentText.toLowerCase();

    // 1. Deadline parsing
    let deadline: Date | null = null;
    const dateMatches = Array.from(lowerText.matchAll(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/g));
    for (const match of dateMatches) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      if (year >= nowYear && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        deadline = new Date(year, month - 1, day);
        break;
      }
    }

    // 2. Funding parsing
    let fundingValueVnd: number | null = null;
    let fundingType = 'partial';

    if (lowerText.includes('toàn phần') || lowerText.includes('100% học phí')) {
      fundingType = 'full';
    } else if (lowerText.includes('học bổng tiền mặt') || lowerText.includes('trợ cấp')) {
      fundingType = 'stipend';
    }

    const moneyMatchTrieu = lowerText.match(/([\d\.,]+)\s*triệu/);
    if (moneyMatchTrieu) {
      const val = parseFloat(moneyMatchTrieu[1].replace(/,/g, ''));
      if (!isNaN(val)) fundingValueVnd = Math.round(val * 1000000);
    }
    const moneyMatchTy = lowerText.match(/([\d\.,]+)\s*tỷ/);
    if (moneyMatchTy) {
      const val = parseFloat(moneyMatchTy[1].replace(/,/g, ''));
      if (!isNaN(val)) fundingValueVnd = Math.round(val * 1000000000);
    }

    // 3. Field & Degree
    const fieldCodes = matchFieldCodes(contentText);
    const degreeLevel = lowerText.includes('thạc sĩ') || lowerText.includes('cao học')
      ? ['master']
      : lowerText.includes('tiến sĩ')
      ? ['phd']
      : ['bachelor'];

    // 4. Default benefits and documents
    const benefits = [
      { label: 'Hỗ trợ học phí & đào tạo', value: fundingType === 'full' ? '100% Học phí' : 'Hỗ trợ một phần kinh phí', evidence_quote: '' },
    ];
    if (fundingValueVnd) {
      benefits.push({ label: 'Giá trị học bổng', value: `${(fundingValueVnd / 1000000).toLocaleString('vi-VN')} VNĐ`, evidence_quote: '' });
    }

    const requiredDocuments = [
      { name: 'Đơn đăng ký / Phiếu dự tuyển theo mẫu', format_hint: 'Bản scan PDF', evidence_quote: '' },
      { name: 'Bảng điểm / Học bạ các năm gần nhất', format_hint: 'Bản công chứng hoặc scan màu', evidence_quote: '' },
      { name: 'Căn cước công dân / Hộ chiếu', format_hint: 'Bản sao', evidence_quote: '' },
    ];

    const applicationSteps = [
      { order: 1, title: 'Chuẩn bị hồ sơ', description: 'Hoàn thiện hồ sơ theo yêu cầu của hội đồng tuyển chọn.', evidence_quote: '' },
      { order: 2, title: 'Nộp hồ sơ trực tuyến', description: `Nộp hồ sơ tại cổng thông tin chính thức của ${source.name}.`, evidence_quote: '' },
      { order: 3, title: 'Xét duyệt & Phỏng vấn', description: 'Hội đồng thẩm định hồ sơ và công bố kết quả tuyển sinh/học bổng.', evidence_quote: '' },
    ];

    const timelineMilestones = [
      { label: 'Mở cổng tiếp nhận hồ sơ', date: 'Đang mở', is_estimated: true, evidence_quote: '' },
      { label: 'Hạn chót nộp hồ sơ', date: deadline ? deadline.toISOString().split('T')[0] : 'Theo thông báo của trường', is_estimated: !deadline, evidence_quote: '' },
    ];

    const confidence = calculateConfidence({
      hasDeadline: Boolean(deadline),
      hasRequirements: true,
      hasBenefits: true,
      hasApplicationSteps: true,
      hasFaq: false,
      hasCanonicalUrl: true,
      hasFundingValue: Boolean(fundingValueVnd),
      sourceTrustScore: source.trustScore,
      isFromOfficialDomain: isOfficialDomain(source.baseUrl),
    });

    opps.push({
      title,
      slug: generateSlug(title, source.name),
      organization: source.name,
      organizationType: source.kind === 'UNIVERSITY' ? 'university' : source.kind === 'GOVERNMENT' ? 'government' : 'company',
      kind: fundingType === 'stipend' ? 'scholarship_corporate' : 'scholarship_domestic',
      summary: contentText.substring(0, 320).replace(/\s+/g, ' ').trim() + '...',
      requirements: JSON.stringify({
        gpaMin: 3.0,
        eligibility: ['Sinh viên theo học chương trình chính quy', 'Không vi phạm quy chế đào tạo'],
      }),
      fieldCodes: JSON.stringify(fieldCodes),
      degreeLevel: JSON.stringify(degreeLevel),
      studyLocation: 'Việt Nam',
      fundingType,
      fundingValueVnd,
      bondYears: null,
      applyStart: null,
      deadline,
      requiredDocuments: JSON.stringify(requiredDocuments),
      applicationSteps: JSON.stringify(applicationSteps),
      timelineMilestones: JSON.stringify(timelineMilestones),
      benefits: JSON.stringify(benefits),
      faq: JSON.stringify([]),
      confidence,
      canonicalUrl: source.baseUrl,
    });
  });

  return opps;
}

/**
 * Main Opportunity Extraction Pipeline:
 * 1. Tries LLM-based deep extraction (Gemini)
 * 2. Falls back to enhanced heuristics if LLM yields 0 items
 */
export async function extractOpportunities(
  html: string,
  cleanText: string,
  source: Source
): Promise<ExtractedOppFull[]> {
  // 1. Try LLM Deep Extraction first
  const llmResults = await extractWithLLM(cleanText, source.baseUrl, source.name);
  if (llmResults.length > 0) {
    const opps: ExtractedOppFull[] = [];
    for (const item of llmResults) {
      const deadline = item.deadline ? new Date(item.deadline) : null;
      const applyStart = item.applyStart ? new Date(item.applyStart) : null;

      const crossMatches = await findCrossSourceMatches(item.title, item.organization);
      const confidence = calculateConfidence({
        hasDeadline: Boolean(deadline),
        hasRequirements: Object.keys(item.requirements || {}).length > 0,
        hasBenefits: item.benefits.length > 0,
        hasApplicationSteps: item.applicationSteps.length > 0,
        hasFaq: item.faq.length > 0,
        hasCanonicalUrl: Boolean(item.canonicalUrl),
        hasFundingValue: Boolean(item.fundingValueVnd),
        sourceTrustScore: source.trustScore,
        isFromOfficialDomain: isOfficialDomain(source.baseUrl),
        crossSourceCount: crossMatches,
        llmConfidence: item.confidence,
      });

      opps.push({
        title: item.title,
        slug: generateSlug(item.title, item.organization),
        organization: item.organization,
        organizationType: item.organizationType,
        kind: item.kind,
        summary: item.summary,
        requirements: JSON.stringify(item.requirements),
        fieldCodes: JSON.stringify(item.fieldCodes),
        degreeLevel: JSON.stringify(item.degreeLevel),
        studyLocation: item.studyLocation,
        fundingType: item.fundingType,
        fundingValueVnd: item.fundingValueVnd,
        bondYears: item.bondYears,
        applyStart,
        deadline,
        requiredDocuments: JSON.stringify(item.requiredDocuments),
        applicationSteps: JSON.stringify(item.applicationSteps),
        timelineMilestones: JSON.stringify(item.timelineMilestones),
        benefits: JSON.stringify(item.benefits),
        faq: JSON.stringify(item.faq),
        confidence,
        canonicalUrl: item.canonicalUrl,
      });
    }
    return opps;
  }

  // 2. Fallback to Heuristics
  return extractOpportunitiesHeuristics(html, cleanText, source);
}

export function calculateRankScore(opp: ExtractedOppFull, source: Source): number {
  let score = 0;

  if (opp.fundingValueVnd) {
    const normalized = Math.min(Math.log10(opp.fundingValueVnd) / Math.log10(1000000000), 1);
    score += 30 * normalized;
  } else {
    score += 10;
  }

  score += 40 * (source.trustScore / 100);

  if (opp.deadline) {
    const daysUntil = (opp.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntil > 0 && daysUntil <= 60) {
      const urgencyScore = Math.sin((daysUntil / 60) * Math.PI) * 15;
      score += urgencyScore;
    }
  }

  let completeness = 0;
  if (opp.deadline) completeness += 0.25;
  if (opp.fundingValueVnd) completeness += 0.25;
  if (JSON.parse(opp.fieldCodes || '[]').length > 0) completeness += 0.25;
  if (opp.summary.length > 50) completeness += 0.25;
  score += 10 * completeness;

  score += 5;

  return Math.min(Math.max(score, 0), 100);
}
