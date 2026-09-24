import cron from 'node-cron';
import prisma from '@/lib/db';
import { fetchSource } from './fetcher';
import { extractOpportunities, calculateRankScore } from './extractor';

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
        // Fetch source content
        const sourceData = {
          id: String(source.id),
          name: source.name,
          baseUrl: source.baseUrl,
          kind: source.kind,
          tier: source.tier,
          fetchStrategy: source.fetchStrategy,
          adapterKey: source.adapterKey,
          etag: source.etag,
          lastModified: source.lastModified,
          contentHash: source.contentHash,
          trustScore: source.trustScore * 100,
          robotsOk: source.robotsOk,
          consecutiveFailures: source.consecutiveFailures,
          lastFetchedAt: source.lastFetchedAt,
          lastChangedAt: source.lastChangedAt,
          isActive: source.isActive,
        };

        const result = await fetchSource(sourceData);

        if (result) {
          summary.sourcesChanged++;

          // Upsert raw document
          const rawDoc = await prisma.rawDocument.upsert({
            where: {
              url_contentHash: {
                url: source.baseUrl,
                contentHash: result.contentHash,
              },
            },
            create: {
              sourceId: source.id,
              url: source.baseUrl,
              contentHash: result.contentHash,
              rawHtml: result.html.substring(0, 100000), // Cap raw html size
              cleanText: result.cleanText.substring(0, 50000),
            },
            update: {
              cleanText: result.cleanText.substring(0, 50000),
            },
          });

          // Extract opportunities (async - supports LLM & heuristics)
          const opps = await extractOpportunities(result.html, result.cleanText, sourceData);
          
          for (const opp of opps) {
            const rankScore = calculateRankScore(opp, sourceData);

            const existing = await prisma.opportunity.findUnique({
              where: { slug: opp.slug },
            });

            if (existing) {
              // Record version change if key fields modified
              const hasChanged = 
                existing.summary !== opp.summary ||
                existing.deadline?.getTime() !== opp.deadline?.getTime() ||
                existing.fundingValueVnd !== opp.fundingValueVnd;

              if (hasChanged) {
                await prisma.opportunityVersion.create({
                  data: {
                    opportunityId: existing.id,
                    diff: JSON.stringify({
                      previousDeadline: existing.deadline,
                      newDeadline: opp.deadline,
                      previousFunding: existing.fundingValueVnd,
                      newFunding: opp.fundingValueVnd,
                      confidence: opp.confidence,
                    }),
                  },
                });
              }

              await prisma.opportunity.update({
                where: { id: existing.id },
                data: {
                  summary: opp.summary,
                  fundingType: opp.fundingType,
                  fundingValueVnd: opp.fundingValueVnd ? Math.round(opp.fundingValueVnd) : null,
                  deadline: opp.deadline,
                  applyStart: opp.applyStart,
                  rankScore: rankScore,
                  confidence: opp.confidence,
                  lastVerifiedAt: now,
                  rawDocumentId: rawDoc.id,
                  requiredDocuments: opp.requiredDocuments,
                  applicationSteps: opp.applicationSteps,
                  timelineMilestones: opp.timelineMilestones,
                  benefits: opp.benefits,
                  faq: opp.faq,
                },
              });
              summary.updatedRecords++;
            } else {
              await prisma.opportunity.create({
                data: {
                  sourceId: source.id,
                  rawDocumentId: rawDoc.id,
                  slug: opp.slug,
                  kind: opp.kind,
                  title: opp.title,
                  organization: opp.organization,
                  organizationType: opp.organizationType,
                  summary: opp.summary,
                  requirements: opp.requirements,
                  fieldCodes: opp.fieldCodes,
                  degreeLevel: opp.degreeLevel,
                  studyLocation: opp.studyLocation,
                  fundingType: opp.fundingType,
                  fundingValueVnd: opp.fundingValueVnd ? Math.round(opp.fundingValueVnd) : null,
                  deadline: opp.deadline,
                  applyStart: opp.applyStart,
                  canonicalUrl: opp.canonicalUrl || source.baseUrl,
                  rankScore: rankScore,
                  confidence: opp.confidence,
                  status: 'published',
                  requiredDocuments: opp.requiredDocuments,
                  applicationSteps: opp.applicationSteps,
                  timelineMilestones: opp.timelineMilestones,
                  benefits: opp.benefits,
                  faq: opp.faq,
                },
              });
              summary.newRecords++;
            }
          }

          await prisma.source.update({
            where: { id: source.id },
            data: {
              lastFetchedAt: now,
              lastChangedAt: now,
              contentHash: result.contentHash,
              etag: result.etag,
              lastModified: result.lastModified,
              consecutiveFailures: 0,
            },
          });
        } else {
          await prisma.source.update({
            where: { id: source.id },
            data: { lastFetchedAt: now, consecutiveFailures: 0 },
          });
        }
        
      } catch (err) {
        summary.errors++;
        console.error(`Error processing source ${source.id} (${source.name}):`, err);
        const nextFailures = source.consecutiveFailures + 1;
        await prisma.source.update({
          where: { id: source.id },
          data: { 
            consecutiveFailures: nextFailures,
            isActive: nextFailures < 10,
          },
        });
      }
      
      // Polite rate limit pause between sources
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    await promoteUrgentSources();

  } catch (error) {
    console.error('Critical error in runCrawlCycle:', error);
  }

  console.log(`[${new Date().toISOString()}] Crawl cycle finished:`, summary);
  return summary;
}

/**
 * Promotes sources with deadlines within the next 30 days to Tier A (frequent crawls)
 * and marks past-deadline opportunities as 'expired'.
 */
export async function promoteUrgentSources(): Promise<void> {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // 1. Mark past-deadline opportunities as expired
    const expiredResult = await prisma.opportunity.updateMany({
      where: {
        deadline: { lt: now },
        status: 'published',
      },
      data: {
        status: 'expired',
      },
    });

    if (expiredResult.count > 0) {
      console.log(`[promoteUrgentSources] Marked ${expiredResult.count} opportunities as expired`);
    }

    // 2. Find opportunities nearing deadline in next 30 days
    const urgentOpps = await prisma.opportunity.findMany({
      where: {
        deadline: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
        status: 'published',
      },
      select: { sourceId: true },
      distinct: ['sourceId'],
    });

    const urgentSourceIds = urgentOpps.map(o => o.sourceId);

    // Promote those sources to Tier A so they are checked hourly
    if (urgentSourceIds.length > 0) {
      const updated = await prisma.source.updateMany({
        where: {
          id: { in: urgentSourceIds },
          tier: { not: 'A' },
        },
        data: {
          tier: 'A',
        },
      });

      if (updated.count > 0) {
        console.log(`[promoteUrgentSources] Promoted ${updated.count} sources with upcoming deadlines to Tier A`);
      }
    }
  } catch (e) {
    console.error('Error in promoteUrgentSources:', e);
  }
}

export function startCrawlScheduler(): void {
  cron.schedule('*/20 * * * *', () => {
    runCrawlCycle().catch(console.error);
  });
  console.log('Crawl scheduler started (every 20 minutes)');
}
