import { parseStringPromise } from 'xml2js';
import crypto from 'crypto';
import { isUrlSafe } from './url-validator';
import { FetchResult } from './fetcher';

export interface RssFeedItem {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
  guid?: string;
}

export async function fetchRssSource(baseUrl: string): Promise<FetchResult | null> {
  if (!isUrlSafe(baseUrl)) {
    throw new Error(`SSRF blocked: Unsafe RSS URL "${baseUrl}"`);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HocBongBot/1.0 (RSS Reader)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: controller.signal as any,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`RSS HTTP error: ${response.status}`);
    }

    const xmlText = await response.text();
    const parsed = await parseStringPromise(xmlText, { explicitArray: false });

    // Handle RSS 2.0 (<channel><item>) and Atom (<feed><entry>)
    let items: any[] = [];
    if (parsed?.rss?.channel?.item) {
      items = Array.isArray(parsed.rss.channel.item)
        ? parsed.rss.channel.item
        : [parsed.rss.channel.item];
    } else if (parsed?.feed?.entry) {
      items = Array.isArray(parsed.feed.entry)
        ? parsed.feed.entry
        : [parsed.feed.entry];
    }

    // Convert RSS items into consolidated cleanText and HTML representation for extractor
    let consolidatedHtml = '<div class="rss-feed">';
    let consolidatedText = '';

    for (const item of items) {
      const title = item.title?._ || item.title || '';
      const link = item.link?._ || item.link?.['$']?.href || item.link || '';
      const desc = item.description?._ || item.description || item.summary?._ || item.summary || item.content?._ || item.content || '';
      const date = item.pubDate || item.published || item.updated || '';

      consolidatedHtml += `
        <article class="rss-item">
          <h2>${title}</h2>
          <a href="${link}">${link}</a>
          <time>${date}</time>
          <div class="description">${desc}</div>
        </article>
      `;
      consolidatedText += `${title}\n${desc}\n${date}\n\n`;
    }
    consolidatedHtml += '</div>';

    const contentHash = crypto.createHash('sha256').update(consolidatedText).digest('hex');

    return {
      html: consolidatedHtml,
      cleanText: consolidatedText,
      etag: response.headers.get('etag') || undefined,
      lastModified: response.headers.get('last-modified') || undefined,
      contentHash,
    };
  } catch (error) {
    console.error(`Error fetching RSS feed from ${baseUrl}:`, error);
    throw error;
  }
}
