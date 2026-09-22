import * as cheerio from 'cheerio';
import slugify from 'slugify';
import { Source } from './fetcher';
import { matchFieldCodes } from '../taxonomy';

export interface ExtractedOpp {
  title: string;
  slug: string;
  organization: string;
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
}

export function generateSlug(title: string, org: string): string {
  const base = `${title} ${org}`;
  return slugify(base, { lower: true, locale: 'vi', strict: true });
}

export function extractOpportunities(html: string, cleanText: string, source: Source): ExtractedOpp[] {
  const $ = cheerio.load(html);
  const opps: ExtractedOpp[] = [];
  
  const headings = $('h1, h2, h3, h4').filter((_, el) => {
    const text = $(el).text().toLowerCase();
    return text.includes('học bổng') || text.includes('tuyển sinh') || text.includes('xét tuyển') || text.includes('chỉ tiêu');
  });

  headings.each((_, el) => {
    const title = $(el).text().trim();
    if (title.length < 10) return;

    let parent = $(el).parent();
    let contentText = parent.text();
    if (contentText.length < 200) {
       parent = parent.parent();
       contentText = parent.text();
    }

    const lowerText = contentText.toLowerCase();

    let deadline: Date | null = null;
    const dateMatch = lowerText.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
    if (dateMatch) {
      const day = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10);
      const year = parseInt(dateMatch[3], 10);
      if (year >= new Date().getFullYear()) {
        deadline = new Date(year, month - 1, day);
      }
    }

    let fundingValueVnd: number | null = null;
    const moneyMatchTrieu = lowerText.match(/([\d\.,]+)\s*triệu/);
    if (moneyMatchTrieu) {
      const val = parseFloat(moneyMatchTrieu[1].replace(/,/g, ''));
      if (!isNaN(val)) fundingValueVnd = val * 1000000;
    }
    const moneyMatchTy = lowerText.match(/([\d\.,]+)\s*tỷ/);
    if (moneyMatchTy) {
        const val = parseFloat(moneyMatchTy[1].replace(/,/g, ''));
        if (!isNaN(val)) fundingValueVnd = val * 1000000000;
    }

    const fieldCodes = matchFieldCodes(contentText);

    opps.push({
      title,
      slug: generateSlug(title, source.name),
      organization: source.name,
      summary: contentText.substring(0, 300) + '...',
      requirements: JSON.stringify({}),
      fieldCodes: JSON.stringify(fieldCodes),
      degreeLevel: JSON.stringify([]),
      studyLocation: 'Vietnam',
      fundingType: fundingValueVnd ? 'CASH' : 'OTHER',
      fundingValueVnd,
      bondYears: null,
      applyStart: null,
      deadline
    });
  });

  return opps;
}

export function calculateRankScore(opp: ExtractedOpp, source: Source): number {
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
  if (JSON.parse(opp.fieldCodes).length > 0) completeness += 0.25;
  if (opp.summary.length > 50) completeness += 0.25;
  score += 10 * completeness;

  score += 5;

  return Math.min(Math.max(score, 0), 100);
}
