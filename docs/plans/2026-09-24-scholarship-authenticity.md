# Scholarship Authenticity Enhancement — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Xây dựng hệ thống crawler thông minh đảm bảo dữ liệu học bổng luôn đúng, đủ, mới nhất từ tất cả các trường đại học và tổ chức — với pipeline xác thực đa tầng.

**Architecture:** LLM-powered extraction pipeline với confidence scoring, dead-link detection, cross-source verification, và external scheduled crawling. Dữ liệu được validate qua 3 tầng: (1) Cấu trúc — Zod schema, (2) Nội dung — LLM fact-check, (3) Nguồn — URL alive + hash diff monitoring.

**Tech Stack:** Next.js 15, Prisma/SQLite, Cheerio + Google Gemini API (LLM extraction), Upstash QStash (external scheduler), Zod, MiniSearch

---

## Task 1: Fix Critical & High Security Issues (Ưu tiên #1)

**Files:**
- Create: `src/app/api/health/route.ts`
- Modify: `src/middleware.ts`
- Modify: `src/lib/auth/session.ts:6`
- Modify: `src/lib/security/auth.ts:6`
- Modify: `src/app/api/auth/magic-link/route.ts:49`
- Modify: `k8s/deployment.yaml:50,58`
- Modify: `Dockerfile:57`

**Step 1: Create health endpoint**

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: 'error', db: 'unreachable' }, { status: 503 });
  }
}
```

**Step 2: Fix JWT fallback — hard fail if missing**

```typescript
// src/lib/auth/session.ts L6 — REPLACE
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('FATAL: JWT_SECRET environment variable is required');
const secretKey = new TextEncoder().encode(JWT_SECRET);
```

```typescript
// src/lib/security/auth.ts L6 — SAME PATTERN
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('FATAL: JWT_SECRET environment variable is required');
```

**Step 3: Fix middleware admin bypass**

```typescript
// src/middleware.ts — enhanced admin check
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('access-token')?.value;
    if (!token) return NextResponse.redirect(new URL('/dang-nhap', request.url));

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      if (payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/dang-nhap', request.url));
    }
  }
  return NextResponse.next();
}
```

**Step 4: Fix magic link token leak**

```typescript
// src/app/api/auth/magic-link/route.ts L49 — REPLACE
if (process.env.NODE_ENV !== 'production') {
  console.log(`[DEV] Magic link: ${verifyUrl}`);
}
// DO NOT include devPreviewUrl in HTTP response
```

**Step 5: Fix K8s probes + Dockerfile**

```yaml
# k8s/deployment.yaml — REPLACE probe paths
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
```

```dockerfile
# Dockerfile — REPLACE HEALTHCHECK
HEALTHCHECK CMD wget -qO- http://localhost:3000/api/health || exit 1
```

**Step 6: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS with 0 errors

**Step 7: Commit**

```bash
git add -A
git commit -m "fix(security): resolve 5 critical/high vulnerabilities"
```

---

## Task 2: Upgrade HTML Sanitization + SSRF Guard

**Files:**
- Modify: `src/lib/security/sanitize.ts`
- Create: `src/lib/crawler/url-validator.ts`
- Modify: `src/lib/crawler/fetcher.ts`

**Step 1: Install sanitize-html**

Run: `npm install sanitize-html && npm install -D @types/sanitize-html`

**Step 2: Replace regex sanitizer**

```typescript
// src/lib/security/sanitize.ts — replace sanitizeHtml function
import sanitize from 'sanitize-html';

export function sanitizeHtml(input: string): string {
  return sanitize(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'recursiveEscape',
  });
}
```

**Step 3: Create SSRF URL validator**

```typescript
// src/lib/crawler/url-validator.ts
const BLOCKED_RANGES = [
  /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
  /^127\./, /^169\.254\./, /^0\./,
];

export function isUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    if (BLOCKED_RANGES.some(r => r.test(parsed.hostname))) return false;
    if (parsed.hostname === 'localhost') return false;
    return true;
  } catch { return false; }
}
```

**Step 4: Apply SSRF guard to fetcher L73**

```typescript
import { isUrlSafe } from './url-validator';
// Inside fetchSource, before fetch():
if (!isUrlSafe(source.baseUrl)) {
  throw new Error(`SSRF blocked: unsafe URL ${source.baseUrl}`);
}
```

**Step 5: Commit**

```bash
git commit -m "fix(security): upgrade sanitizer, add SSRF guard"
```

---

## Task 3: Crawler v2 — Real Prisma + LLM-Powered Extraction

**Files:**
- Modify: `src/lib/crawler/scheduler.ts` (replace mock prisma)
- Create: `src/lib/crawler/llm-extractor.ts`
- Create: `src/lib/crawler/extractor-schema.ts`

**Step 1: Create structured extraction schema**

```typescript
// src/lib/crawler/extractor-schema.ts
import { z } from 'zod';

export const ExtractedOpportunitySchema = z.object({
  title: z.string().min(10),
  organization: z.string(),
  summary: z.string().min(50).max(1000),
  requirements: z.object({
    gpaMin: z.number().optional(),
    eligibility: z.array(z.string()),
    documents: z.array(z.string()),
    languageCerts: z.array(z.string()).optional(),
  }),
  fieldCodes: z.array(z.string()),
  degreeLevel: z.array(z.string()),
  studyLocation: z.string(),
  fundingType: z.enum(['FULL', 'PARTIAL', 'TUITION_ONLY', 'STIPEND', 'CASH', 'OTHER']),
  fundingValueVnd: z.number().nullable(),
  applyStart: z.string().nullable(),
  deadline: z.string().nullable(),
  benefits: z.array(z.string()),
  applicationSteps: z.array(z.object({ step: z.number(), description: z.string() })),
  timelineMilestones: z.array(z.object({ date: z.string(), event: z.string() })),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })),
  canonicalUrl: z.string().url(),
  confidence: z.number().min(0).max(100),
});
```

**Step 2: Create LLM extraction module**

```typescript
// src/lib/crawler/llm-extractor.ts
// Uses Gemini 2.0 Flash with structured JSON output
// System prompt in Vietnamese for accurate extraction
// Validates each result against Zod schema
// Falls back gracefully if GEMINI_API_KEY is not set
```

**Step 3: Fix scheduler mock → real Prisma**

```typescript
// src/lib/crawler/scheduler.ts L4 — REPLACE
import prisma from '@/lib/db';
```

**Step 4: Commit**

```bash
git commit -m "feat(crawler): LLM-powered extraction with Zod validation"
```

---

## Task 4: Dead Link Detection + Auto-Archive

**Files:**
- Create: `src/lib/crawler/link-checker.ts`
- Create: `src/app/api/crawl/check-links/route.ts`
- Modify: `prisma/schema.prisma`

**Step 1: Add to Opportunity model**

```prisma
lastLinkCheckAt DateTime?
linkStatus      String    @default("unknown")
linkCheckCount  Int       @default(0)
```

**Step 2: Create link checker** — HEAD requests to all canonicalUrls, auto-archive after 3 consecutive 404s.

**Step 3: Commit**

```bash
git commit -m "feat(crawler): dead link detection with auto-archive"
```

---

## Task 5: Confidence Scoring + Cross-Source Verification

**Files:**
- Create: `src/lib/crawler/confidence.ts`

Multi-factor scoring: data completeness (40pts) + source reliability (30pts) + cross-source verification (15pts) + LLM confidence (15pts). Official `.edu.vn`/`.gov.vn` domains get trust bonus.

---

## Task 6: External Scheduler (Replace node-cron)

**Files:**
- Create: `src/app/api/crawl/trigger/route.ts`
- Create: `.github/workflows/crawl-schedule.yml`
- Modify: `src/lib/crawler/scheduler.ts` (remove node-cron)

GitHub Actions cron every 4 hours → POST `/api/crawl/trigger` with Bearer token auth.

---

## Task 7: Admin Review Dashboard

**Files:**
- Create: `src/app/admin/review/page.tsx`
- Create: `src/app/api/admin/opportunities/[id]/verify/route.ts`

Admin page: unverified opps sorted by confidence ↑, dead link alerts, one-click verify/archive.

---

## Task 8: Expand Sources — RSS + More Universities

Add 20+ new sources: ĐH Thái Nguyên, ĐH Vinh, HUTECH, UEF, Hoa Sen, VinUni, RMIT + RSS feed support for international portals.

---

## Execution Priority

| Phase | Tasks | Time | Priority |
|---|---|---|---|
| **Phase 1** — Security Fix | 1-2 | ~2h | 🔴 CRITICAL |
| **Phase 2** — Crawler Engine | 3-4 | ~4h | 🟠 HIGH |
| **Phase 3** — Verification | 5-7 | ~3h | 🟡 MEDIUM |
| **Phase 4** — Expansion | 8 | ~2h | 🟢 NORMAL |
