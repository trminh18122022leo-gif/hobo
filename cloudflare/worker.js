/**
 * Cloudflare Worker: Scheduled Cron Trigger Dispatcher
 * Nhiệm vụ: Tự động kích hoạt chu trình cào dữ liệu trên Vercel mỗi 4h
 * và kiểm tra link chết hàng ngày hoàn toàn tự động, miễn phí 100,000 req/ngày.
 */

export default {
  // 1. Xử lý Cron định kỳ do Cloudflare tự động kích hoạt
  async scheduled(event, env, ctx) {
    console.log(`[Cloudflare Cron] Fired at ${event.cron} (${new Date().toISOString()})`);

    const appUrl = (env.APP_URL || 'https://your-app.vercel.app').replace(/\/$/, '');
    const secret = env.CRAWL_API_SECRET || 'hocbong-secret-crawler-token-2026-v2';

    ctx.waitUntil(
      (async () => {
        try {
          // Gọi trigger crawl API trên Vercel
          const crawlRes = await fetch(`${appUrl}/api/crawl/trigger`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${secret}`,
              'Content-Type': 'application/json',
              'User-Agent': 'Cloudflare-Worker-Cron/1.0',
            },
          });
          const crawlData = await crawlRes.json();
          console.log('[Cloudflare Cron] Crawl trigger response:', crawlData);

          // Nếu là ca chạy ban đêm (02:30 UTC), kích hoạt kiểm tra link chết
          if (event.cron.includes('30 2') || event.cron.includes('30')) {
            const linkRes = await fetch(`${appUrl}/api/crawl/check-links`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${secret}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Cloudflare-Worker-Cron/1.0',
              },
            });
            const linkData = await linkRes.json();
            console.log('[Cloudflare Cron] Link check response:', linkData);
          }
        } catch (err) {
          console.error('[Cloudflare Cron] Error triggering Vercel API:', err);
        }
      })()
    );
  },

  // 2. HTTP Endpoint (Khi bạn truy cập link Worker trên trình duyệt)
  async fetch(request, env) {
    const appUrl = env.APP_URL || 'Chưa cấu hình APP_URL (Vercel domain)';
    return new Response(
      JSON.stringify(
        {
          status: 'online',
          service: 'Cloudflare Cron Scheduler for HocBong VN',
          targetVercelApp: appUrl,
          endpoints: [
            `${appUrl}/api/crawl/trigger (Mỗi 4 tiếng)`,
            `${appUrl}/api/crawl/check-links (Hàng ngày lúc 02:30 UTC)`,
          ],
          timestamp: new Date().toISOString(),
        },
        null,
        2
      ),
      {
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }
    );
  },
};
