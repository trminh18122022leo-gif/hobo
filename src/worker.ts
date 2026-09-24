import http from 'http';
import { runCrawlCycle, promoteUrgentSources } from './lib/crawler/scheduler';
import { checkOpportunityLinks } from './lib/crawler/link-checker';
import cron from 'node-cron';
import prisma from './lib/db';

const PORT = process.env.PORT || 10000;
const CRAWL_API_SECRET = process.env.CRAWL_API_SECRET || 'hocbong-secret-crawler-token-2026-v2';

let lastCrawlStatus: any = {
  status: 'idle',
  lastRunAt: null,
  summary: null,
};

let lastLinkCheckStatus: any = {
  status: 'idle',
  lastRunAt: null,
  summary: null,
};

// ── 1. HTTP Server for Render Health Check & Webhook Triggers ──
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  // Health Check Endpoint (Render checks this for 200 OK)
  if (url.pathname === '/health' || url.pathname === '/') {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        service: 'hocbong-crawler-worker',
        uptime: process.uptime(),
        database: 'connected',
        timestamp: new Date().toISOString(),
      }));
    } catch (err: any) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'unhealthy',
        service: 'hocbong-crawler-worker',
        database: 'disconnected',
        error: err?.message,
      }));
    }
    return;
  }

  // Worker Status Endpoint
  if (url.pathname === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      crawler: lastCrawlStatus,
      linkChecker: lastLinkCheckStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  // Webhook: Trigger Crawl
  if (url.pathname === '/trigger-crawl' && req.method === 'POST') {
    const auth = req.headers.authorization;
    if (auth !== `Bearer ${CRAWL_API_SECRET}`) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Unauthorized' }));
      return;
    }

    lastCrawlStatus.status = 'running';
    lastCrawlStatus.lastRunAt = new Date().toISOString();

    runCrawlCycle()
      .then((summary) => {
        lastCrawlStatus.status = 'success';
        lastCrawlStatus.summary = summary;
      })
      .catch((err) => {
        lastCrawlStatus.status = 'error';
        lastCrawlStatus.summary = { error: err?.message };
      });

    res.writeHead(202, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Crawl cycle triggered in background.' }));
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

// ── 2. Scheduled Cron Jobs on Render Worker ──
function startCronSchedules() {
  console.log('⏰ Initializing Render Background Worker Cron Jobs...');

  // Run Crawl Cycle every 4 hours: At minute 0 past every 4th hour
  cron.schedule('0 */4 * * *', async () => {
    console.log('🚀 [Worker Cron] Starting scheduled 4-hour crawl cycle...');
    lastCrawlStatus.status = 'running';
    lastCrawlStatus.lastRunAt = new Date().toISOString();
    try {
      const summary = await runCrawlCycle();
      lastCrawlStatus.status = 'success';
      lastCrawlStatus.summary = summary;
      console.log('✅ [Worker Cron] Crawl cycle completed:', summary);
    } catch (err) {
      console.error('❌ [Worker Cron] Crawl cycle failed:', err);
      lastCrawlStatus.status = 'error';
      lastCrawlStatus.summary = { error: String(err) };
    }
  });

  // Run Dead Link Check daily at 02:30 UTC
  cron.schedule('30 2 * * *', async () => {
    console.log('🔍 [Worker Cron] Starting daily dead link checker...');
    lastLinkCheckStatus.status = 'running';
    lastLinkCheckStatus.lastRunAt = new Date().toISOString();
    try {
      const summary = await checkOpportunityLinks(100);
      lastLinkCheckStatus.status = 'success';
      lastLinkCheckStatus.summary = summary;
      console.log('✅ [Worker Cron] Link check completed:', summary);
    } catch (err) {
      console.error('❌ [Worker Cron] Link check failed:', err);
      lastLinkCheckStatus.status = 'error';
      lastLinkCheckStatus.summary = { error: String(err) };
    }
  });

  // Hourly urgent source promotion check
  cron.schedule('0 * * * *', async () => {
    try {
      await promoteUrgentSources();
    } catch (err) {
      console.error('❌ [Worker Cron] promoteUrgentSources failed:', err);
    }
  });

  console.log('✅ [Worker] Cron schedules registered successfully:');
  console.log('   • Crawl Cycle: Every 4 hours (0 */4 * * *)');
  console.log('   • Dead Link Check: Daily at 02:30 (30 2 * * *)');
  console.log('   • Urgent Source Promotion: Hourly (0 * * * *)');
}

server.listen(PORT, () => {
  console.log(`🚀 [Render Worker] HTTP daemon running on port ${PORT}`);
  console.log(`   Health check endpoint: http://localhost:${PORT}/health`);
  startCronSchedules();
});
