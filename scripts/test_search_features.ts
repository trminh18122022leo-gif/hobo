import { searchOpportunities } from '../src/lib/search';
import prisma from '../src/lib/db';

async function test() {
  const sourcesCount = await prisma.source.count();
  const totalOpps = await prisma.opportunity.count();
  console.log('Total Sources in DB:', sourcesCount);
  console.log('Total Opportunities in DB:', totalOpps);

  const internshipRes = await searchOpportunities({ kind: 'internship' });
  console.log('Internship search results count:', internshipRes.total);
  if (internshipRes.items.length > 0) {
    console.log('Sample internship:', internshipRes.items[0].title);
  }

  const freeFeeRes = await searchOpportunities({ q: 'miễn phí' });
  console.log('Free fee search results count:', freeFeeRes.total);

  const daadRes = await searchOpportunities({ q: 'DAAD' });
  console.log('DAAD search results count:', daadRes.total);

  await prisma.$disconnect();
}

test().catch(console.error);
