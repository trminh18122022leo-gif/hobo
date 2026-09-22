import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import OpportunityDetailView from '@/components/OpportunityDetailView';
import { OpportunityDetail } from '@/types';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const opp = await prisma.opportunity.findUnique({
    where: { slug },
    select: { title: true, organization: true, summary: true },
  });

  if (!opp) {
    return { title: 'Không tìm thấy thông tin tuyển sinh | Học Bổng VN' };
  }

  return {
    title: `${opp.title} - ${opp.organization} | Tuyển sinh Việt Nam`,
    description: opp.summary?.slice(0, 160) || 'Thông tin tuyển sinh đại học và sau đại học chi tiết.',
  };
}

export default async function AdmissionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const opp = await prisma.opportunity.findUnique({
    where: { slug },
    include: {
      source: true,
      versions: {
        orderBy: { changedAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!opp) {
    notFound();
  }

  // Dữ liệu điểm chuẩn các năm
  const historicalBenchmarks = await prisma.historicalBenchmark.findMany({
    where: {
      OR: [
        { opportunityRef: slug },
        { opportunityRef: opp.organization },
      ],
    },
    orderBy: { year: 'asc' },
  });

  // Chương trình tuyển sinh tương tự
  const similarOpps = await prisma.opportunity.findMany({
    where: {
      kind: opp.kind,
      id: { not: opp.id },
      status: 'published',
    },
    take: 4,
    select: {
      id: true,
      slug: true,
      title: true,
      organization: true,
      fundingType: true,
      deadline: true,
      studyLocation: true,
    },
  });

  const formattedOpportunity: OpportunityDetail = {
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
    fieldCodes: opp.fieldCodes ? JSON.parse(opp.fieldCodes) : [],
    degreeLevel: opp.degreeLevel ? JSON.parse(opp.degreeLevel) : [],
    rankScore: opp.rankScore,
    confidence: opp.confidence,
    lastVerifiedAt: opp.lastVerifiedAt.toISOString(),
    daysUntilDeadline: opp.deadline
      ? Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null,
    canonicalUrl: opp.canonicalUrl,
    status: opp.status,
    bondYears: opp.bondYears,
    firstSeenAt: opp.firstSeenAt.toISOString(),
    requirements: opp.requirements ? JSON.parse(opp.requirements) : {},
    source: {
      name: opp.source.name,
      baseUrl: opp.source.baseUrl,
      kind: opp.source.kind,
      trustScore: opp.source.trustScore,
    },
    versions: opp.versions.map((v) => ({
      id: v.id,
      diff: typeof v.diff === 'string' ? JSON.parse(v.diff) : v.diff,
      changedAt: v.changedAt.toISOString(),
    })),
    requiredDocuments: opp.requiredDocuments ? JSON.parse(opp.requiredDocuments) : [],
    applicationSteps: opp.applicationSteps ? JSON.parse(opp.applicationSteps) : [],
    timelineMilestones: opp.timelineMilestones ? JSON.parse(opp.timelineMilestones) : [],
    benefits: opp.benefits ? JSON.parse(opp.benefits) : [],
    faq: opp.faq ? JSON.parse(opp.faq) : [],
    contact: opp.contact ? JSON.parse(opp.contact) : null,
    selectionRounds: opp.selectionRounds,
    historicalBenchmarks,
  };

  return (
    <OpportunityDetailView
      opportunity={formattedOpportunity}
      similarOpportunities={similarOpps}
      historicalBenchmarks={historicalBenchmarks}
    />
  );
}
