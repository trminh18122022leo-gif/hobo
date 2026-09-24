/**
 * Cloudflare Worker: Scheduled Cron Trigger & Health Ping Dispatcher
 * Nhiệm vụ: Tự động kích hoạt chu trình cào dữ liệu trên Zeabur/Vercel mỗi 4h
 * và kiểm tra link chết hàng ngày mà không bao giờ bị gián đoạn hay "sleep".
 */

export default {
  // 1. Xử lý Cron định kỳ do Cloudflare tự động kích hoạt
  async scheduled(event, env, ctx) {
    console.log(`[Cloudflare Cron] Fired at ${event.cron} (${new Date().toISOString()})`);

    const targetUrl = env.BACKEND_URL || 'https://your-zeabur-app.zeabur.app';
    const secret = env.CRAWL_API_SECRET || 'hocbong-secret-crawler-token-2026-v2';

    ctx.waitUntil(
      (async () => {
        try {
          // Gọi trigger crawl trên Zeabur
          const crawlRes = await fetch(`${targetUrl}/trigger-crawl`, {
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
            const linkRes = await fetch(`${targetUrl}/api/crawl/check-links`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${secret}`,
                'Content-Type': 'application/json',
              },
            });
            console.log('[Cloudflare Cron] Link check status:', linkRes.status);
          }
        } catch (err) {
          console.error('[Cloudflare Cron] Error triggering backend worker:', err);
        }
      })()
    );
  },

  // 2. HTTP Endpoint (Khi truy cập bằng trình duyệt kiểm tra Worker)
  async fetch(request, env) {
    const targetUrl = env.BACKEND_URL || 'Chưa cấu hình BACKEND_URL';
    return new Response(
      JSON.stringify({
        status: 'online',
        role: 'Cloudflare Cron Scheduler for HocBong VN',
        targetBackend: targetUrl,
        timestamp: new Date().toISOString(),
      }, null, 2),
      {
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }
    );
  },
};
