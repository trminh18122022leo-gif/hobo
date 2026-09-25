import { z } from 'zod';
import sanitize from 'sanitize-html';

export const loginSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').max(100),
  guestTrackerItems: z.array(z.any()).optional(),
  guestProfile: z.record(z.unknown()).optional(),
});

export const registerSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z
    .string()
    .min(8, 'Mật khẩu tối thiểu 8 ký tự')
    .max(100)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, 'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường và một chữ số'),
  name: z.string().min(2, 'Họ tên tối thiểu 2 ký tự').max(100),
  guestTrackerItems: z.array(z.any()).optional(),
  guestProfile: z.record(z.unknown()).optional(),
});

export const magicLinkRequestSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  guestTrackerItems: z.array(z.any()).optional(),
  guestProfile: z.record(z.unknown()).optional(),
});

export const guestMergeSchema = z.object({
  guestTrackerItems: z.array(z.any()).optional().default([]),
  guestProfile: z.record(z.unknown()).optional().default({}),
});

export const searchQuerySchema = z.object({
  q: z.string().max(200).optional().default(''),
  kind: z.union([z.string(), z.array(z.string())]).optional(),
  fieldCodes: z.union([z.string(), z.array(z.string())]).optional(),
  degreeLevel: z.union([z.string(), z.array(z.string())]).optional(),
  studyLocation: z.string().optional(),
  fundingType: z.union([z.string(), z.array(z.string())]).optional(),
  subjectCombinations: z.union([z.string(), z.array(z.string())]).optional(),
  admissionMethods: z.union([z.string(), z.array(z.string())]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(['relevance', 'deadline', 'rank', 'newest']).optional().default('relevance'),
});

export const profileInputSchema = z.object({
  gpa: z.number().min(0).max(10).optional().nullable(),
  gpaScale: z.number().optional().default(4.0),
  cpa: z.number().min(0).max(10).optional().nullable(),
  degreeLevel: z.string().optional().nullable(),
  fieldCodes: z.array(z.string()).optional(),
  languageCerts: z.array(z.record(z.unknown())).optional(),
  achievements: z.array(z.record(z.unknown())).optional(),
  projects: z.array(z.record(z.unknown())).optional(),
  publications: z.array(z.record(z.unknown())).optional(),
  preferredOrgType: z.array(z.string()).optional(),
  preferredRegions: z.array(z.string()).optional(),
  dataResidencyPreference: z.enum(['vietnam', 'global']).optional().default('vietnam'),
});

export function sanitizePlainText(input: string, maxLength: number = 5000): string {
  if (!input || typeof input !== 'string') return '';
  const cleaned = sanitize(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });
  const trimmed = cleaned.trim();
  return trimmed.length > maxLength ? trimmed.substring(0, maxLength) : trimmed;
}

export function sanitizeRichText(input: string, maxLength: number = 20000): string {
  if (!input || typeof input !== 'string') return '';
  const cleaned = sanitize(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'ul', 'ol', 'li', 'a', 'blockquote', 'h3', 'h4'],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    disallowedTagsMode: 'discard',
  });
  const trimmed = cleaned.trim();
  return trimmed.length > maxLength ? trimmed.substring(0, maxLength) : trimmed;
}

export function sanitizeHtml(input: string, options?: { richText?: boolean; maxLength?: number }): string {
  if (options?.richText) {
    return sanitizeRichText(input, options.maxLength);
  }
  return sanitizePlainText(input, options?.maxLength);
}

