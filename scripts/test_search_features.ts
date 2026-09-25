import { searchOpportunities, refreshSearchIndex } from '../src/lib/search';
import prisma from '../src/lib/db';

async function test() {
  await refreshSearchIndex();

  const melb = await searchOpportunities({ q: 'Melbourne' });
  console.log('Melbourne search count:', melb.total);
  if (melb.items.length > 0) {
    console.log('Title:', melb.items[0].title);
    console.log('Location:', melb.items[0].studyLocation);
    console.log('Funding:', melb.items[0].fundingValueVnd);
  }

  const deakin = await searchOpportunities({ q: 'Deakin' });
  console.log('Deakin search count:', deakin.total);

  const destAus = await searchOpportunities({ q: 'Destination Australia' });
  console.log('Destination Australia count:', destAus.total);

  const rtp = await searchOpportunities({ q: 'RTP' });
  console.log('RTP Research count:', rtp.total);

  await prisma.$disconnect();
}

test().catch(console.error);
