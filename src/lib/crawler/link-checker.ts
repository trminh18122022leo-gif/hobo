import prisma from '@/lib/db';

/**
 * SSRF guard: only allow http/https URLs pointing to public internet hosts.
 * Blocks file://, ftp://, internal IPs (127.x, 10.x, 172.16-31.x, 192.168.x),
 * and cloud metadata endpoints (169.254.x).
 */
function isValidPublicUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
    // Block localhost variants
    if (host === 'localhost' || host === '0.0.0.0') return false;
    // Block IPv6 loopback
    if (host === '::1' || host === '[::1]') return false;
    // Block private/link-local IPv4 ranges
    const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4) {
      const [, a, b] = ipv4.map(Number);
      if (a === 10) return false;                         // 10.0.0.0/8
      if (a === 127) return false;                        // 127.0.0.0/8
      if (a === 169 && b === 254) return false;           // 169.254.0.0/16 (AWS metadata)
      if (a === 172 && b >= 16 && b <= 31) return false;  // 172.16.0.0/12
      if (a === 192 && b === 168) return false;           // 192.168.0.0/16
    }
    return true;
  } catch {
    return false;
  }
}

export interface LinkCheckSummary {
  totalChecked: number;
  aliveCount: number;
  deadCount: number;
  archivedCount: number;
  errors: number;
}

export async function checkOpportunityLinks(limit: number = 50): Promise<LinkCheckSummary> {
  const summary: LinkCheckSummary = {
    totalChecked: 0,
    aliveCount: 0,
    deadCount: 0,
    archivedCount: 0,
    errors: 0,
  };

  try {
    // Find opportunities that are published, prioritizing those not checked recently
    const opps = await prisma.opportunity.findMany({
      where: {
        status: 'published',
      },
      select: {
        id: true,
        title: true,
        canonicalUrl: true,
        linkCheckCount: true,
      },
      orderBy: [
        { lastLinkCheckAt: 'asc' },
      ],
      take: limit,
    });

    const now = new Date();

    for (const opp of opps) {
      if (!opp.canonicalUrl) continue;

      // SSRF guard: only allow http/https to public internet hosts
      if (!isValidPublicUrl(opp.canonicalUrl)) {
        console.warn(`[link-checker] Skipping suspicious URL: ${opp.canonicalUrl}`);
        continue;
      }

      summary.totalChecked++;

      try {
        const controller = new AbortController();
        const timeoutMs = Number(process.env.LINK_CHECK_TIMEOUT_MS) || 8000;
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        let isAlive = false;
        let isDead = false;

        try {
          const res = await fetch(opp.canonicalUrl, {
            method: 'HEAD',
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HocBongBot/1.0' },
            signal: controller.signal as any,
            redirect: 'follow',
          });

          if (res.ok || res.status === 403 || res.status === 401) {
            // 200-299 is alive; 401/403 means server exists but requires browser/cookie
            isAlive = true;
          } else if (res.status === 404 || res.status === 410) {
            isDead = true;
          }
        } catch (e: any) {
          // If HEAD is rejected with 405 Method Not Allowed, fallback to minimal GET
          try {
            const getController = new AbortController();
            const getTimeout = setTimeout(() => getController.abort(), 8000);
            const getRes = await fetch(opp.canonicalUrl, {
              method: 'GET',
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HocBongBot/1.0' },
              signal: getController.signal as any,
              redirect: 'follow',
            });
            clearTimeout(getTimeout);
            if (getRes.ok || getRes.status === 403 || getRes.status === 401) {
              isAlive = true;
            } else if (getRes.status === 404 || getRes.status === 410) {
              isDead = true;
            }
          } catch {
            // Network unreachable / timeout
          }
        } finally {
          clearTimeout(timeout);
        }

        if (isAlive) {
          summary.aliveCount++;
          await prisma.opportunity.update({
            where: { id: opp.id },
            data: {
              linkStatus: 'alive',
              lastLinkCheckAt: now,
              linkCheckCount: 0, // Reset fail counter
            },
          });
        } else if (isDead) {
          summary.deadCount++;
          const nextCount = opp.linkCheckCount + 1;
          const shouldArchive = nextCount >= 3;

          if (shouldArchive) {
            summary.archivedCount++;
          }

          await prisma.opportunity.update({
            where: { id: opp.id },
            data: {
              linkStatus: 'dead',
              lastLinkCheckAt: now,
              linkCheckCount: nextCount,
              status: shouldArchive ? 'archived' : 'published',
            },
          });
        } else {
          // Unknown / Timeout
          await prisma.opportunity.update({
            where: { id: opp.id },
            data: {
              linkStatus: 'unknown',
              lastLinkCheckAt: now,
            },
          });
        }
      } catch (err) {
        summary.errors++;
        console.error(`Error checking link for opp ${opp.id}:`, err);
      }

      // Small rate limit delay
      await new Promise(r => setTimeout(r, 200));
    }
  } catch (error) {
    console.error('Critical error in checkOpportunityLinks:', error);
  }

  return summary;
}
