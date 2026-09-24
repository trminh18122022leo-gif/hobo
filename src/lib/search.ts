import MiniSearch from 'minisearch';
import prisma from '@/lib/db';
import { FIELD_TAXONOMY, OpportunityCard } from '@/types';

export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  let result = str.toLowerCase();
  result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  result = result.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  result = result.replace(/đ/g, 'd');
  return result;
}

let miniSearch = new MiniSearch({
  fields: ['title', 'organization', 'summary', 'titleNoAccent', 'orgNoAccent', 'summaryNoAccent', 'fieldNames'],
  storeFields: [
    'id', 'slug', 'kind', 'title', 'organization', 'summary', 'deadline',
    'fundingType', 'fundingValueVnd', 'studyLocation', 'fieldCodes',
    'degreeLevel', 'rankScore', 'confidence', 'lastVerifiedAt',
    'canonicalUrl', 'applyStart', 'organizationType', 'status', 'firstSeenAt'
  ],
  searchOptions: {
    fuzzy: 0.2,
    prefix: true,
    boost: { title: 3, titleNoAccent: 3, organization: 2, orgNoAccent: 2 }
  }
});

let allDocuments: any[] = [];
let isInitialized = false;
let initPromise: Promise<void> | null = null;

export async function initSearchIndex(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const opps = await prisma.opportunity.findMany({
        where: { status: 'published' }
      });

      const taxonomy: Record<string, string> = {};
      if (typeof FIELD_TAXONOMY !== 'undefined' && Array.isArray(FIELD_TAXONOMY)) {
        FIELD_TAXONOMY.forEach((entry) => {
          taxonomy[entry.code] = entry.name;
        });
      }

      const documents = opps.map((opp) => {
        let fieldCodes: string[] = [];
        let degreeLevel: string[] = [];
        try {
          fieldCodes = opp.fieldCodes ? JSON.parse(opp.fieldCodes) : [];
        } catch {
          fieldCodes = [];
        }
        try {
          degreeLevel = opp.degreeLevel ? JSON.parse(opp.degreeLevel) : [];
        } catch {
          degreeLevel = [];
        }

        const fieldNames = fieldCodes.map((code: string) => taxonomy[code] || code).join(' ');

        return {
          id: opp.id,
          slug: opp.slug,
          kind: opp.kind,
          title: opp.title,
          organization: opp.organization,
          summary: opp.summary,
          deadline: opp.deadline ? opp.deadline.toISOString() : null,
          fundingType: opp.fundingType,
          fundingValueVnd: opp.fundingValueVnd,
          studyLocation: opp.studyLocation,
          rankScore: opp.rankScore,
          confidence: opp.confidence,
          lastVerifiedAt: opp.lastVerifiedAt.toISOString(),
          canonicalUrl: opp.canonicalUrl,
          applyStart: opp.applyStart ? opp.applyStart.toISOString() : null,
          organizationType: opp.organizationType,
          status: opp.status,
          firstSeenAt: opp.firstSeenAt.toISOString(),
          titleNoAccent: removeVietnameseTones(opp.title || ''),
          orgNoAccent: removeVietnameseTones(opp.organization || ''),
          summaryNoAccent: removeVietnameseTones(opp.summary || ''),
          fieldNames,
          fieldCodes,
          degreeLevel,
        };
      });

      miniSearch.removeAll();
      miniSearch.addAll(documents);
      allDocuments = documents;
      isInitialized = true;
    } catch (error) {
      console.error('Failed to init search index:', error);
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

export async function refreshSearchIndex(): Promise<void> {
  isInitialized = false;
  return initSearchIndex();
}

export interface SearchQueryInput {
  q?: string;
  kind?: string | string[];
  fieldCodes?: string | string[];
  degreeLevel?: string | string[];
  studyLocation?: string;
  fundingType?: string | string[];
  page?: number;
  limit?: number;
  sort?: 'relevance' | 'deadline' | 'rank' | 'newest';
}

export async function searchOpportunities(query: SearchQueryInput) {
  const startTime = Date.now();
  await initSearchIndex();

  const q = query.q ? removeVietnameseTones(query.q.trim()) : '';

  // Chuẩn hoá mảng lọc
  const toArray = (val: string | string[] | undefined): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return val.includes(',') ? val.split(',') : [val];
  };

  const kinds = toArray(query.kind).map((k) => k.toLowerCase());
  const fieldCodes = toArray(query.fieldCodes);
  const degreeLevels = toArray(query.degreeLevel).map((d) => d.toLowerCase());
  const fundingTypes = toArray(query.fundingType).map((f) => f.toLowerCase());

  let rawResults = q
    ? miniSearch.search(q).map((result) => {
        return { ...result, ...allDocuments.find((d) => d.id === result.id) };
      })
    : allDocuments.map((d) => ({ ...d, score: 1 }));

  let filtered = rawResults.filter((doc: any) => {
    if (kinds.length > 0) {
      // Hỗ trợ cả lọc theo SCHOLARSHIP/ADMISSION chung hoặc loại chi tiết
      const docKind = (doc.kind || '').toLowerCase();
      const matchesKind = kinds.some((k) => {
        if (k === 'scholarship') return docKind.includes('scholarship');
        if (k === 'admission') return docKind.includes('undergraduate') || docKind.includes('graduate');
        if (k === 'internship') return docKind.includes('internship');
        return docKind === k;
      });
      if (!matchesKind) return false;
    }

    if (query.studyLocation && doc.studyLocation !== query.studyLocation) {
      return false;
    }

    if (fieldCodes.length > 0) {
      const hasOverlap = fieldCodes.some((code: string) => doc.fieldCodes?.includes(code));
      if (!hasOverlap) return false;
    }

    if (degreeLevels.length > 0) {
      const hasOverlap = degreeLevels.some((level: string) =>
        doc.degreeLevel?.map((l: string) => l.toLowerCase()).includes(level)
      );
      if (!hasOverlap) return false;
    }

    if (fundingTypes.length > 0) {
      const docFunding = (doc.fundingType || '').toLowerCase();
      if (!fundingTypes.includes(docFunding)) return false;
    }

    return true;
  });

  // Tính facets
  const facets: Record<string, Record<string, number>> = {
    kind: {},
    studyLocation: {},
    fundingType: {},
    degreeLevel: {},
  };

  allDocuments.forEach((doc: any) => {
    if (doc.kind) {
      facets.kind[doc.kind] = (facets.kind[doc.kind] || 0) + 1;
    }
    if (doc.studyLocation) {
      facets.studyLocation[doc.studyLocation] = (facets.studyLocation[doc.studyLocation] || 0) + 1;
    }
    if (doc.fundingType) {
      facets.fundingType[doc.fundingType] = (facets.fundingType[doc.fundingType] || 0) + 1;
    }
    if (Array.isArray(doc.degreeLevel)) {
      doc.degreeLevel.forEach((lvl: string) => {
        facets.degreeLevel[lvl] = (facets.degreeLevel[lvl] || 0) + 1;
      });
    }
  });

  const sort = query.sort || 'relevance';
  filtered.sort((a: any, b: any) => {
    if (sort === 'relevance') {
      return (b.score || 0) - (a.score || 0);
    } else if (sort === 'deadline') {
      const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return dateA - dateB;
    } else if (sort === 'rank') {
      return (b.rankScore || 0) - (a.rankScore || 0);
    } else if (sort === 'newest') {
      const dateA = a.firstSeenAt ? new Date(a.firstSeenAt).getTime() : 0;
      const dateB = b.firstSeenAt ? new Date(b.firstSeenAt).getTime() : 0;
      return dateB - dateA;
    }
    return 0;
  });

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const startIndex = (page - 1) * limit;
  const paginatedData = filtered.slice(startIndex, startIndex + limit);

  const now = Date.now();
  const enhancedData: OpportunityCard[] = paginatedData.map((doc: any) => {
    let daysUntilDeadline = null;
    if (doc.deadline) {
      const diffTime = new Date(doc.deadline).getTime() - now;
      daysUntilDeadline = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return {
      id: doc.id,
      slug: doc.slug,
      kind: doc.kind,
      title: doc.title,
      organization: doc.organization,
      organizationType: doc.organizationType,
      summary: doc.summary,
      deadline: doc.deadline,
      applyStart: doc.applyStart,
      fundingType: doc.fundingType,
      fundingValueVnd: doc.fundingValueVnd,
      studyLocation: doc.studyLocation,
      fieldCodes: doc.fieldCodes || [],
      degreeLevel: doc.degreeLevel || [],
      rankScore: doc.rankScore,
      confidence: doc.confidence,
      lastVerifiedAt: doc.lastVerifiedAt,
      daysUntilDeadline,
      canonicalUrl: doc.canonicalUrl,
      status: doc.status,
    };
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);

  return {
    items: enhancedData,
    data: enhancedData, // Backward compatible
    facets,
    total,
    page,
    totalPages,
    limit,
    queryTime: Date.now() - startTime,
  };
}
