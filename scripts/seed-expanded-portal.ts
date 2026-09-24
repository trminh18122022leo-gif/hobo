import { PrismaClient } from '@prisma/client';
import { crawlTuyensinhso } from '../src/lib/crawler/tuyensinhso-crawler';
import { crawlIdpScholarships } from '../src/lib/crawler/idp-crawler';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Bắt đầu nạp & đồng bộ nguồn Tuyển Sinh Số & IDP Vietnam vào Supabase...');

  // 1. Tạo hoặc cập nhật 2 Nguồn dữ liệu uy tín (Source)
  const sourceTuyensinhso = await prisma.source.upsert({
    where: { baseUrl: 'https://tuyensinhso.vn' },
    update: {
      name: 'Tuyển Sinh Số - Cổng Thông Tin Tuyển Sinh Việt Nam',
      kind: 'portal',
      tier: 'A',
      trustScore: 0.95,
      isActive: true,
      lastFetchedAt: new Date(),
    },
    create: {
      name: 'Tuyển Sinh Số - Cổng Thông Tin Tuyển Sinh Việt Nam',
      baseUrl: 'https://tuyensinhso.vn',
      kind: 'portal',
      tier: 'A',
      trustScore: 0.95,
      isActive: true,
      lastFetchedAt: new Date(),
    },
  });

  const sourceIdp = await prisma.source.upsert({
    where: { baseUrl: 'https://www.idp.com' },
    update: {
      name: 'IDP Vietnam - Cổng Học Bổng Du Học Quốc Tế',
      kind: 'portal',
      tier: 'A',
      trustScore: 0.98,
      isActive: true,
      lastFetchedAt: new Date(),
    },
    create: {
      name: 'IDP Vietnam - Cổng Học Bổng Du Học Quốc Tế',
      baseUrl: 'https://www.idp.com',
      kind: 'portal',
      tier: 'A',
      trustScore: 0.98,
      isActive: true,
      lastFetchedAt: new Date(),
    },
  });

  console.log(`✅ Nguồn Tuyển Sinh Số (ID: ${sourceTuyensinhso.id}) và IDP Vietnam (ID: ${sourceIdp.id}) đã sẵn sàng.`);

  // 2. Cào dữ liệu Tuyển Sinh Số
  console.log('📡 Đang cào dữ liệu từ Tuyển Sinh Số...');
  const tssItems = await crawlTuyensinhso();
  console.log(`📦 Đã thu thập ${tssItems.length} đề án tuyển sinh từ Tuyển Sinh Số.`);

  for (const item of tssItems) {
    await prisma.opportunity.upsert({
      where: { slug: item.slug },
      update: {
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
        deadline: item.deadline,
        canonicalUrl: item.canonicalUrl,
        rankScore: 88,
        confidence: 0.95,
        status: 'published',
        requiredDocuments: JSON.stringify(item.requiredDocuments),
        applicationSteps: JSON.stringify(item.applicationSteps),
        timelineMilestones: JSON.stringify(item.timelineMilestones),
        benefits: JSON.stringify(item.benefits),
        selectionRounds: item.selectionRounds,
        lastVerifiedAt: new Date(),
        linkStatus: 'alive',
      },
      create: {
        sourceId: sourceTuyensinhso.id,
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
        rankScore: 88,
        confidence: 0.95,
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
  }

  // 3. Cào dữ liệu Học Bổng Quốc Tế từ IDP
  console.log('📡 Đang cào dữ liệu từ IDP Vietnam & Nguồn Học Bổng Toàn Phần...');
  const idpItems = await crawlIdpScholarships();
  console.log(`📦 Đã thu thập ${idpItems.length} chương trình học bổng quốc tế từ IDP.`);

  for (const item of idpItems) {
    await prisma.opportunity.upsert({
      where: { slug: item.slug },
      update: {
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
        deadline: item.deadline,
        canonicalUrl: item.canonicalUrl,
        rankScore: 98,
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
      create: {
        sourceId: sourceIdp.id,
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
        rankScore: 98,
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
  }

  const totalOpps = await prisma.opportunity.count();
  console.log(`\n🎉 HOÀN TẤT ĐỒNG BỘ! Tổng cộng có ${totalOpps} cơ hội học bổng & tuyển sinh trong cơ sở dữ liệu Supabase!`);
}

main()
  .catch((e) => {
    console.error('Lỗi seed portal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
