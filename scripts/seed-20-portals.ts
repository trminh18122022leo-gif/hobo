import { PrismaClient } from '@prisma/client';
import { EXTENDED_PORTAL_DATA } from '../src/lib/crawler/multi-portal-crawler';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING 20 EXTENDED PORTALS & SCHOLARSHIPS ---');

  // 1. Ensure Sources exist
  const sourceConfigs = [
    { name: 'Trang Tuyển Sinh Hà Nội', baseUrl: 'https://trangtuyensinh.com.vn', kind: 'portal', tier: 'A' },
    { name: 'Bộ Giáo dục & Đào tạo', baseUrl: 'https://tuyensinh.moet.gov.vn', kind: 'government', tier: 'A' },
    { name: 'Sau đại học ĐH Y Hà Nội', baseUrl: 'https://sdh.hmu.edu.vn', kind: 'university', tier: 'A' },
    { name: 'Sau đại học ĐHQGHN', baseUrl: 'https://tssdh.vnu.edu.vn', kind: 'university', tier: 'A' },
    { name: 'Sau đại học ĐH Ngoại ngữ (ULIS)', baseUrl: 'https://saudaihoc.ulis.vnu.edu.vn', kind: 'university', tier: 'A' },
    { name: 'Sau đại học ĐH Văn hóa Hà Nội', baseUrl: 'https://huc.edu.vn', kind: 'university', tier: 'B' },
    { name: 'EURAXESS European Commission', baseUrl: 'https://euraxess.ec.europa.eu', kind: 'government', tier: 'A' },
    { name: 'DAAD Đức (German Academic Exchange)', baseUrl: 'https://www.daad.de', kind: 'government', tier: 'A' },
    { name: 'PhDPortal Global Doctoral Fellowships', baseUrl: 'https://www.phdportal.com', kind: 'portal', tier: 'A' },
    { name: 'PostgraduateSearch UK & Europe', baseUrl: 'https://www.postgraduatesearch.com', kind: 'portal', tier: 'B' },
    { name: 'Niche Education Network', baseUrl: 'https://www.niche.com', kind: 'portal', tier: 'A' },
    { name: 'Fastweb Scholarships USA', baseUrl: 'https://www.fastweb.com', kind: 'portal', tier: 'A' },
    { name: 'YBOX Học Bổng & Giới Trẻ', baseUrl: 'https://ybox.vn', kind: 'portal', tier: 'A' },
    { name: 'Hotcourses Vietnam - IDP', baseUrl: 'https://www.hotcourses.vn', kind: 'portal', tier: 'A' },
    { name: 'CareerPrep Vietnam', baseUrl: 'https://careerprep.vn', kind: 'portal', tier: 'B' },
    { name: 'CollegeBoard BigFuture', baseUrl: 'https://www.collegeboard.org', kind: 'portal', tier: 'A' },
    { name: 'Scholarships.com', baseUrl: 'https://www.scholarships.com', kind: 'portal', tier: 'A' },
    { name: 'Study London UK', baseUrl: 'https://www.studylondon.ac.uk', kind: 'portal', tier: 'B' },
    { name: 'Tuition Funding Sources (TFS)', baseUrl: 'https://www.tuitionfundingsources.com', kind: 'portal', tier: 'B' },
    { name: 'FinAid Guide', baseUrl: 'https://finaid.org', kind: 'portal', tier: 'B' },
  ];

  const sourceMap = new Map<string, number>();

  for (const s of sourceConfigs) {
    const existing = await prisma.source.findUnique({ where: { baseUrl: s.baseUrl } });
    if (existing) {
      sourceMap.set(s.baseUrl, existing.id);
    } else {
      const created = await prisma.source.create({
        data: {
          name: s.name,
          baseUrl: s.baseUrl,
          kind: s.kind,
          tier: s.tier,
          fetchStrategy: 'fetch',
          trustScore: 0.95,
          isActive: true,
        },
      });
      sourceMap.set(s.baseUrl, created.id);
    }
  }

  console.log(`Verified ${sourceMap.size} Sources in Database.`);

  // 2. Upsert Opportunities
  let inserted = 0;
  let updated = 0;

  for (const item of EXTENDED_PORTAL_DATA) {
    // Find matching source
    let sourceId = sourceMap.get(item.sourceUrl);
    if (!sourceId) {
      // Find by domain prefix
      for (const [url, id] of sourceMap.entries()) {
        if (item.sourceUrl.startsWith(url)) {
          sourceId = id;
          break;
        }
      }
    }

    if (!sourceId) {
      sourceId = Array.from(sourceMap.values())[0];
    }

    const existing = await prisma.opportunity.findUnique({
      where: { slug: item.slug },
    });

    await prisma.opportunity.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        summary: item.summary,
        fundingType: item.fundingType,
        fundingValueVnd: item.fundingValueVnd,
        requirements: JSON.stringify(item.requirements),
        degreeLevel: JSON.stringify(item.degreeLevel),
        fieldCodes: JSON.stringify(item.fieldCodes),
        studyLocation: item.studyLocation,
        deadline: item.deadline,
        canonicalUrl: item.canonicalUrl,
        rankScore: item.rankScore,
        lastVerifiedAt: new Date(),
        linkStatus: 'alive',
      },
      create: {
        sourceId: sourceId,
        slug: item.slug,
        kind: item.kind,
        title: item.title,
        organization: item.organization,
        organizationType: item.organizationType,
        summary: item.summary,
        requirements: JSON.stringify(item.requirements),
        fieldCodes: JSON.stringify(item.fieldCodes),
        degreeLevel: JSON.stringify(item.degreeLevel),
        studyLocation: item.studyLocation,
        fundingType: item.fundingType,
        fundingValueVnd: item.fundingValueVnd,
        applyStart: item.applyStart,
        deadline: item.deadline,
        canonicalUrl: item.canonicalUrl,
        rankScore: item.rankScore,
        confidence: 0.98,
        status: 'published',
        requiredDocuments: JSON.stringify(item.requiredDocuments),
        applicationSteps: JSON.stringify(item.applicationSteps),
        timelineMilestones: JSON.stringify(item.timelineMilestones),
        benefits: JSON.stringify(item.benefits),
        selectionRounds: item.selectionRounds,
        lastVerifiedAt: new Date(),
        linkStatus: 'alive',
      },
    });

    if (existing) {
      updated++;
    } else {
      inserted++;
    }
  }

  const totalOpps = await prisma.opportunity.count({ where: { status: 'published' } });
  console.log(`\n🎉 Seed Completed! Added: ${inserted}, Updated: ${updated}, Total Published in DB: ${totalOpps}`);
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
