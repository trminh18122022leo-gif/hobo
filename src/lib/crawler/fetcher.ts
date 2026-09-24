import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { isUrlSafe } from './url-validator';
import { fetchRssSource } from './rss-fetcher';

export interface Source {
  id: string;
  name: string;
  baseUrl: string;
  kind: string;
  tier: string;
  fetchStrategy: string;
  adapterKey: string | null;
  etag: string | null;
  lastModified: string | null;
  contentHash: string | null;
  trustScore: number;
  robotsOk: boolean;
  consecutiveFailures: number;
  lastFetchedAt: Date | null;
  lastChangedAt: Date | null;
  isActive: boolean;
}

export type FetchResult = {
  html: string;
  cleanText: string;
  etag?: string;
  lastModified?: string;
  contentHash: string;
};

export function normalizeHtml(html: string): string {
  const $ = cheerio.load(html);
  
  $('script, style, noscript, iframe').remove();
  
  $('*').each((_, el) => {
    const className = $(el).attr('class') || '';
    if (/(ads|banner|view-count|visitor|clock|session)/i.test(className)) {
      $(el).remove();
    }
  });
  
  let text = $('body').text() || '';
  
  text = text.replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g, '');
  text = text.replace(/\b\d{1,3}(?:[.,]\d{3})+\b/g, '');
  
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

export function computeHash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export async function fetchSource(source: Source): Promise<FetchResult | null> {
  if (!isUrlSafe(source.baseUrl)) {
    throw new Error(`SSRF blocked: Unsafe or forbidden source URL "${source.baseUrl}"`);
  }

  // 1. Dispatch RSS strategy if configured
  if (source.fetchStrategy?.toUpperCase() === 'RSS') {
    return fetchRssSource(source.baseUrl);
  }

  // 2. Default HTTP / HTML strategy
  const headers: Record<string, string> = {
    'User-Agent': process.env.BOT_USER_AGENT || 'HocBongBot/1.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
  };

  if (source.etag) {
    headers['If-None-Match'] = source.etag;
  }
  if (source.lastModified) {
    headers['If-Modified-Since'] = source.lastModified;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const response = await fetch(source.baseUrl, {
      headers,
      signal: controller.signal as any,
    });

    clearTimeout(timeoutId);

    if (response.status === 304) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const cleanText = normalizeHtml(html);
    const contentHash = computeHash(cleanText);

    if (contentHash === source.contentHash) {
      return null;
    }

    return {
      html,
      cleanText,
      etag: response.headers.get('etag') || undefined,
      lastModified: response.headers.get('last-modified') || undefined,
      contentHash,
    };
  } catch (error) {
    console.error(`Error fetching source ${source.name}:`, error);
    throw error;
  }
}
