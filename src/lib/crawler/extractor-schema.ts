import { z } from 'zod';

export const RequiredDocumentSchema = z.object({
  name: z.string(),
  format_hint: z.string().optional().default('Bản scan PDF hoặc công chứng'),
  evidence_quote: z.string().optional().default(''),
});

export const ApplicationStepSchema = z.object({
  order: z.number(),
  title: z.string(),
  description: z.string(),
  evidence_quote: z.string().optional().default(''),
});

export const TimelineMilestoneSchema = z.object({
  label: z.string(),
  date: z.string(),
  is_estimated: z.boolean().optional().default(false),
  evidence_quote: z.string().optional().default(''),
});

export const BenefitSchema = z.object({
  label: z.string(),
  value: z.string(),
  evidence_quote: z.string().optional().default(''),
});

export const FaqSchema = z.object({
  question: z.string(),
  answer: z.string(),
  evidence_quote: z.string().optional().default(''),
});

export const ExtractedOpportunitySchema = z.object({
  title: z.string().min(5),
  organization: z.string().min(2),
  organizationType: z.enum(['university', 'company', 'government', 'ngo', 'foundation']).optional().default('university'),
  kind: z.enum(['undergraduate', 'graduate', 'scholarship_domestic', 'scholarship_foreign', 'scholarship_corporate']).default('scholarship_domestic'),
  summary: z.string().min(20),
  requirements: z.record(z.unknown()).default({}),
  fieldCodes: z.array(z.string()).default([]),
  degreeLevel: z.array(z.string()).default(['bachelor']),
  studyLocation: z.string().default('Vietnam'),
  fundingType: z.enum(['full', 'partial', 'tuition', 'stipend', 'one_time', 'CASH', 'OTHER']).default('partial'),
  fundingValueVnd: z.number().nullable().default(null),
  bondYears: z.number().nullable().default(null),
  applyStart: z.string().nullable().default(null),
  deadline: z.string().nullable().default(null),
  canonicalUrl: z.string().url(),
  requiredDocuments: z.array(RequiredDocumentSchema).default([]),
  applicationSteps: z.array(ApplicationStepSchema).default([]),
  timelineMilestones: z.array(TimelineMilestoneSchema).default([]),
  benefits: z.array(BenefitSchema).default([]),
  faq: z.array(FaqSchema).default([]),
  confidence: z.number().min(0).max(100).default(75),
});

export type ExtractedOpportunity = z.infer<typeof ExtractedOpportunitySchema>;
