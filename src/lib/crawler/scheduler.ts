import cron from 'node-cron';
import { fetchSource } from './fetcher';
import { extractOpportunities, calculateRankScore } from './extractor';
const prisma = {} as any; // Mock for now

export type CrawlSummary = {
  sourcesChecked: number;
  sourcesChanged: number;
  newRecords: number;
  updatedRecords: number;
  errors: number;
};

export async function runCrawlCycle(): Promise<CrawlSummary> {
  console.log(`[${new Date().toISOString()}] Starting crawl cycle...`);
  const summary: CrawlSummary = { sourcesChecked: 0, sourcesChanged: 0, newRecords: 0, updatedRecords: 0, errors: 0 };

  try {
    const sources = await prisma.source.findMany({ where: { isActive: true } });
    
    for (const source of sources) {
      try {
        const now = new Date();
        const lastFetched = source.lastFetchedAt || new Date(0);
        const hoursSinceFetch = (now.getTime() - lastFetched.getTime()) / (1000 * 60 * 60);

        let shouldFetch = false;
        if (source.tier === 'A' && hoursSinceFetch >= 1) shouldFetch = true;
        if (source.tier === 'B' && hoursSinceFetch >= 6) shouldFetch = true;
        if (source.tier === 'C' && hoursSinceFetch >= 24) shouldFetch = true;

        if (!shouldFetch) continue;

        summary.sourcesChecked++;
        const result = await fetchSource(source);

        if (result) {
            summary.sourcesChanged++;
            const opps = extractOpportunities(result.html, result.cleanText, source);
            
            for (const opp of opps) {
               const rankScore = calculateRankScore(opp, source);
               summary.newRecords++;
            }

            await prisma.source.update({
                where: { id: source.id },
                data: {
                    lastFetchedAt: now,
                    lastChangedAt: now,
                    contentHash: result.contentHash,
                    etag: result.etag,
                    lastModified: result.lastModified,
                    consecutiveFailures: 0
                }
            });
        } else {
            await prisma.source.update({
                where: { id: source.id },
                data: { lastFetchedAt: now, consecutiveFailures: 0 }
            });
        }
        
      } catch (err) {
        summary.errors++;
        console.error(`Error processing source ${source.id}:`, err);
        const nextFailures = source.consecutiveFailures + 1;
        await prisma.source.update({
            where: { id: source.id },
            data: { 
                consecutiveFailures: nextFailures,
                isActive: nextFailures < 10
            }
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await promoteUrgentSources();

  } catch (error) {
    console.error('Critical error in runCrawlCycle:', error);
  }

  console.log(`[${new Date().toISOString()}] Crawl cycle finished:`, summary);
  return summary;
}

export async function promoteUrgentSources(): Promise<void> {
    try {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    } catch (e) {
        console.error('Error promoting sources:', e);
    }
}

export function startCrawlScheduler(): void {
  cron.schedule('*/20 * * * *', () => {
    runCrawlCycle().catch(console.error);
  });
  console.log('Crawl scheduler started (every 20 minutes)');
}
