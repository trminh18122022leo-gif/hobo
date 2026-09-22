import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const opportunity = await prisma.opportunity.findUnique({
      where: { slug },
      include: {
        source: true,
        versions: {
          orderBy: { changedAt: 'desc' },
        },
      },
    });

    if (!opportunity) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy cơ hội này' }, { status: 404 });
    }

    const historicalBenchmarks = await prisma.historicalBenchmark.findMany({
      where: {
        OR: [
          { opportunityRef: slug },
          { opportunityRef: opportunity.organization },
        ],
      },
      orderBy: { year: 'asc' },
    });

    const parsedOpportunity = {
      ...opportunity,
      requirements: opportunity.requirements ? JSON.parse(opportunity.requirements as string) : {},
      fieldCodes: opportunity.fieldCodes ? JSON.parse(opportunity.fieldCodes as string) : [],
      degreeLevel: opportunity.degreeLevel ? JSON.parse(opportunity.degreeLevel as string) : [],
      requiredDocuments: opportunity.requiredDocuments ? JSON.parse(opportunity.requiredDocuments as string) : [],
      applicationSteps: opportunity.applicationSteps ? JSON.parse(opportunity.applicationSteps as string) : [],
      timelineMilestones: opportunity.timelineMilestones ? JSON.parse(opportunity.timelineMilestones as string) : [],
      benefits: opportunity.benefits ? JSON.parse(opportunity.benefits as string) : [],
      faq: opportunity.faq ? JSON.parse(opportunity.faq as string) : [],
      contact: opportunity.contact ? JSON.parse(opportunity.contact as string) : null,
      historicalBenchmarks,
    };

    return NextResponse.json({ success: true, data: parsedOpportunity });
  } catch (error) {
    console.error('Get opportunity detail error:', error);
    return NextResponse.json({ success: false, error: 'Đã xảy ra lỗi hệ thống' }, { status: 500 });
  }
}
