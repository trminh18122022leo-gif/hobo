import { PrismaClient } from '@prisma/client';
import { crawlIscEducationDeep } from '../src/lib/crawler/deep-crawler';

const prisma = new PrismaClient();

async function main() {
  console.log('Synchronizing ISC Education source and deep crawled opportunities...');

  // 1. Upsert ISC Education source
  const source = await prisma.source.upsert({
    where: { baseUrl: 'https://www.isc.education' },
    update: {
      name: 'ISC Education - Cổng Học Bổng Du Học Úc & Quốc Tế',
      kind: 'portal',
      tier: 'A',
      fetchStrategy: 'html',
      isActive: true,
      trustScore: 0.96,
    },
    create: {
      name: 'ISC Education - Cổng Học Bổng Du Học Úc & Quốc Tế',
      baseUrl: 'https://www.isc.education',
      kind: 'portal',
      tier: 'A',
      fetchStrategy: 'html',
      trustScore: 0.96,
      isActive: true,
    },
  });

  console.log(`Source ISC Education ready (ID: ${source.id})`);

  // 2. Run deep crawler
  const items = await crawlIscEducationDeep();
  let createdCount = 0;
  let updatedCount = 0;

  for (const item of items) {
    const existing = await prisma.opportunity.findUnique({
      where: { slug: item.slug },
    });

    if (existing) {
      await prisma.opportunity.update({
        where: { id: existing.id },
        data: {
          title: item.title,
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
          requiredDocuments: JSON.stringify(item.requiredDocuments),
          applicationSteps: JSON.stringify(item.applicationSteps),
          timelineMilestones: JSON.stringify(item.timelineMilestones),
          benefits: JSON.stringify(item.benefits),
          lastVerifiedAt: new Date(),
          linkStatus: 'alive',
        },
      });
      updatedCount++;
      console.log(`Updated deep opportunity: ${item.slug}`);
    } else {
      await prisma.opportunity.create({
        data: {
          sourceId: source.id,
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
          confidence: item.confidence,
          status: item.status,
          requiredDocuments: JSON.stringify(item.requiredDocuments),
          applicationSteps: JSON.stringify(item.applicationSteps),
          timelineMilestones: JSON.stringify(item.timelineMilestones),
          benefits: JSON.stringify(item.benefits),
          selectionRounds: item.selectionRounds,
          lastVerifiedAt: new Date(),
          linkStatus: 'alive',
        },
      });
      createdCount++;
      console.log(`Created deep opportunity: ${item.slug}`);
    }
  }

  const totalSources = await prisma.source.count();
  const totalOpps = await prisma.opportunity.count();

  console.log('\nISC Deep Crawl Sync Complete!');
  console.log(`Opportunities: ${createdCount} created, ${updatedCount} updated.`);
  console.log(`Total Sources in DB: ${totalSources}`);
  console.log(`Total Opportunities in DB: ${totalOpps}`);
}

main()
  .catch((e) => {
    console.error('Error during ISC sync:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
