// ════════════════════════════════════════════════════════════
// Types for Nền tảng Tuyển sinh & Học bổng Việt Nam (v2.1)
// ════════════════════════════════════════════════════════════

// ── Enums ───────────────────────────────────────────────────

export type SourceKind = 'university' | 'fund' | 'embassy' | 'company' | 'portal';
export type Tier = 'A' | 'B' | 'C';
export type FetchStrategy = 'fetch' | 'playwright' | 'rss' | 'api';

export type OpportunityKind =
  | 'undergraduate'
  | 'graduate'
  | 'scholarship_domestic'
  | 'scholarship_foreign'
  | 'scholarship_corporate'
  | 'internship';

export type FundingType = 'full' | 'partial' | 'tuition' | 'stipend' | 'one_time';
export type OpportunityStatus = 'published' | 'review' | 'archived' | 'expired';
export type UserRole = 'user' | 'admin';

// ── Labels (Vietnamese) ─────────────────────────────────────

export const KIND_LABELS: Record<OpportunityKind, string> = {
  undergraduate: 'Tuyển sinh Đại học',
  graduate: 'Tuyển sinh Sau đại học',
  scholarship_domestic: 'Học bổng trong nước',
  scholarship_foreign: 'Học bổng nước ngoài',
  scholarship_corporate: 'Học bổng doanh nghiệp',
  internship: 'Thực tập sinh & Việc làm',
};

export const FUNDING_LABELS: Record<FundingType, string> = {
  full: 'Toàn phần',
  partial: 'Bán phần',
  tuition: 'Miễn học phí',
  stipend: 'Trợ cấp sinh hoạt',
  one_time: 'Một lần',
};

export const TIER_LABELS: Record<Tier, string> = {
  A: 'Ưu tiên cao',
  B: 'Chuẩn',
  C: 'Phụ',
};

// ── Search Types ────────────────────────────────────────────

export interface SearchQuery {
  q: string;
  kind?: OpportunityKind[];
  fieldCodes?: string[];
  degreeLevel?: string[];
  studyLocation?: string;
  fundingType?: FundingType[];
  deadlineBefore?: string;
  deadlineAfter?: string;
  page?: number;
  limit?: number;
  sort?: 'relevance' | 'deadline' | 'rank' | 'newest';
}

export interface SearchResult {
  items: OpportunityCard[];
  total: number;
  page: number;
  totalPages: number;
  facets: SearchFacets;
  queryTime: number;
}

export interface OpportunityCard {
  id: number;
  slug: string;
  kind: OpportunityKind;
  title: string;
  organization: string;
  organizationType: string | null;
  summary: string | null;
  deadline: string | null;
  applyStart: string | null;
  fundingType: string | null;
  fundingValueVnd: number | null;
  studyLocation: string | null;
  fieldCodes: string[];
  degreeLevel: string[];
  rankScore: number;
  confidence: number | null;
  lastVerifiedAt: string;
  daysUntilDeadline: number | null;
  canonicalUrl: string;
  status: string;
  applicationFee?: string | null;
  deadlinePattern?: string | null;
}

export interface SearchFacets {
  kind: FacetCount[];
  fundingType: FacetCount[];
  studyLocation: FacetCount[];
  degreeLevel: FacetCount[];
}

export interface FacetCount {
  value: string;
  label: string;
  count: number;
}

// ── Bổ sung v2.1: Chi tiết Toàn diện ─────────────────────────

export interface RequiredDocument {
  name: string; // "Bảng điểm dịch công chứng"
  format_hint?: string | null; // "PDF, có công chứng, dưới 5MB"
  evidence_quote?: string | null;
}

export interface ApplicationStep {
  order: number;
  title: string; // "Sơ loại hồ sơ"
  description: string;
  evidence_quote?: string | null;
}

export interface TimelineMilestone {
  label: string; // "Mở đơn" | "Hạn nộp" | "Phỏng vấn dự kiến" | "Công bố kết quả"
  date?: string | null;
  is_estimated?: boolean; // true nếu suy luận từ năm trước
  evidence_quote?: string | null;
}

export interface BenefitItem {
  label: string; // "Học phí", "Sinh hoạt phí", "Vé máy bay"
  value: string; // "100%", "20 triệu đồng/năm", "1 lượt/năm"
  evidence_quote?: string | null;
}

export interface FaqItem {
  question: string;
  answer: string;
  evidence_quote: string; // bắt buộc
}

export interface ContactInfo {
  email?: string | null;
  phone?: string | null;
  office_hours?: string | null;
}

export interface HistoricalBenchmarkEntry {
  id?: number;
  opportunityRef: string;
  year: number;
  benchmarkScore?: number | null;
  applicantCount?: number | null;
  quota?: number | null;
  competitionRatio?: number | null;
  sourceUrl?: string | null;
}

export interface ChecklistItem {
  id: string;
  task: string;
  weekNumber: number; // Tuần đếm ngược (vd: 10, 6, 3, 1)
  isCompleted: boolean;
  deadline?: string | null;
}

export interface ApplicationTrackerItem {
  id: number;
  profileId: string;
  opportunityId: number;
  status: 'interested' | 'preparing' | 'submitted' | 'result';
  checklist: ChecklistItem[];
  updatedAt: string;
  opportunity: OpportunityCard;
}

export interface DocumentPrepTemplateItem {
  documentType: string;
  leadWeeks: number;
  defaultPrompt: string;
}

// ── Opportunity Detail ──────────────────────────────────────

export interface OpportunityDetail extends OpportunityCard {
  requirements: Record<string, unknown>;
  bondYears: number | null;
  firstSeenAt: string;
  source: {
    name: string;
    baseUrl: string;
    kind: string;
    trustScore: number;
  };
  versions: VersionEntry[];

  // v2.1 Extended fields
  requiredDocuments: RequiredDocument[];
  applicationSteps: ApplicationStep[];
  timelineMilestones: TimelineMilestone[];
  benefits: BenefitItem[];
  faq: FaqItem[];
  contact: ContactInfo | null;
  selectionRounds: number;
  historicalBenchmarks?: HistoricalBenchmarkEntry[];
}

export interface VersionEntry {
  id: number;
  diff: Record<string, { old: unknown; new: unknown }>;
  changedAt: string;
}

// ── Profile Types ───────────────────────────────────────────

export interface ProfileInput {
  gpa: number | null;
  gpaScale: number;
  cpa: number | null;
  degreeLevel: string;
  fieldCodes: string[];
  languageCerts: LanguageCert[];
  achievements: Achievement[];
  projects: Project[];
  publications: Publication[];
  preferredOrgType: string[];
  preferredRegions: string[];
}

export interface LanguageCert {
  type: string; // IELTS | TOEFL | TOEIC | JLPT | TOPIK | DELF | HSK
  score: string;
  date?: string;
}

export interface Achievement {
  title: string;
  level: string; // national | provincial | school | other
  year: number;
}

export interface Project {
  title: string;
  description: string;
  role: string;
  year: number;
}

export interface Publication {
  title: string;
  journal: string;
  year: number;
  doi?: string;
}

// ── Recommendation & Portfolio Strategy (B.8) ───────────────

export interface RecommendationResult {
  opportunityId: number;
  opportunity: OpportunityCard;
  hardPass: boolean;
  softScore: number;
  gapAnalysis?: GapAnalysis;
  category?: 'reach' | 'match' | 'safety'; // Thử sức | Phù hợp | Chắc chắn
}

export interface PortfolioStrategy {
  reach: RecommendationResult[]; // Thử sức
  match: RecommendationResult[]; // Phù hợp
  safety: RecommendationResult[]; // Chắc chắn
  recommendedMix: {
    reach: number;
    match: number;
    safety: number;
  };
  summary: string;
}

export interface GapAnalysis {
  fitSummary: string;
  met: GapCriterion[];
  missing: GapCriterion[];
  actionItems: ActionItem[];
  confidence: number;
}

export interface GapCriterion {
  criterion: string;
  evidence: string | null;
  howToClose?: string;
}

export interface ActionItem {
  task: string;
  effort: 'thấp' | 'trung bình' | 'cao';
  deadlineHint: string;
}

// ── Auth Types ──────────────────────────────────────────────

export interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// ── API Response ────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ── Admin Types ─────────────────────────────────────────────

export interface DashboardStats {
  totalSources: number;
  activeSources: number;
  totalOpportunities: number;
  publishedOpportunities: number;
  pendingReview: number;
  expiredOpportunities: number;
  crawlSuccessRate: number;
  lastCrawlAt: string | null;
  recentCrawls: CrawlLogEntry[];
}

export interface CrawlLogEntry {
  id: number;
  sourceName: string;
  sourceUrl: string;
  tier: string;
  status: string;
  duration: number | null;
  error: string | null;
  recordsNew: number;
  recordsUpdated: number;
  crawledAt: string;
}

// ── Field Taxonomy ──────────────────────────────────────────

export interface FieldEntry {
  code: string;
  name: string;
  aliases: string[];
}

export const FIELD_TAXONOMY: FieldEntry[] = [
  { code: '7480201', name: 'Công nghệ thông tin', aliases: ['CNTT', 'IT', 'Tin học', 'Information Technology'] },
  { code: '7480101', name: 'Khoa học máy tính', aliases: ['KHMT', 'Computer Science', 'CS'] },
  { code: '7480103', name: 'Kỹ thuật phần mềm', aliases: ['KTPM', 'Software Engineering'] },
  { code: '7480104', name: 'Hệ thống thông tin', aliases: ['HTTT', 'Information Systems'] },
  { code: '7480202', name: 'An toàn thông tin', aliases: ['ATTT', 'Cybersecurity', 'Information Security'] },
  { code: '7520216', name: 'Kỹ thuật điều khiển và tự động hoá', aliases: ['Tự động hoá', 'Automation', 'ĐK-TĐH'] },
  { code: '7520103', name: 'Kỹ thuật cơ khí', aliases: ['Cơ khí', 'Mechanical Engineering', 'CK'] },
  { code: '7520201', name: 'Kỹ thuật điện', aliases: ['Điện', 'Electrical Engineering'] },
  { code: '7520207', name: 'Kỹ thuật điện tử - viễn thông', aliases: ['ĐTVT', 'Electronics', 'Telecom'] },
  { code: '7580101', name: 'Kiến trúc', aliases: ['Architecture'] },
  { code: '7580201', name: 'Kỹ thuật xây dựng', aliases: ['Xây dựng', 'Civil Engineering'] },
  { code: '7310101', name: 'Kinh tế', aliases: ['Economics', 'Kinh tế học'] },
  { code: '7310301', name: 'Xã hội học', aliases: ['Sociology'] },
  { code: '7340101', name: 'Quản trị kinh doanh', aliases: ['QTKD', 'Business Administration', 'MBA'] },
  { code: '7340120', name: 'Kinh doanh quốc tế', aliases: ['International Business'] },
  { code: '7340201', name: 'Tài chính - Ngân hàng', aliases: ['Finance', 'Banking', 'TCNH'] },
  { code: '7340301', name: 'Kế toán', aliases: ['Accounting'] },
  { code: '7380101', name: 'Luật', aliases: ['Law', 'Luật học'] },
  { code: '7220201', name: 'Ngôn ngữ Anh', aliases: ['English', 'Tiếng Anh'] },
  { code: '7220204', name: 'Ngôn ngữ Trung Quốc', aliases: ['Chinese', 'Tiếng Trung'] },
  { code: '7220209', name: 'Ngôn ngữ Nhật', aliases: ['Japanese', 'Tiếng Nhật'] },
  { code: '7220210', name: 'Ngôn ngữ Hàn Quốc', aliases: ['Korean', 'Tiếng Hàn'] },
  { code: '7720101', name: 'Y khoa', aliases: ['Medicine', 'Bác sĩ'] },
  { code: '7720201', name: 'Dược học', aliases: ['Pharmacy'] },
  { code: '7720301', name: 'Điều dưỡng', aliases: ['Nursing'] },
  { code: '7440112', name: 'Hoá học', aliases: ['Chemistry'] },
  { code: '7440301', name: 'Khoa học môi trường', aliases: ['Environmental Science'] },
  { code: '7460101', name: 'Toán học', aliases: ['Mathematics', 'Toán'] },
  { code: '7460112', name: 'Thống kê', aliases: ['Statistics'] },
  { code: '7440102', name: 'Vật lý', aliases: ['Physics'] },
  { code: '7620110', name: 'Khoa học cây trồng', aliases: ['Plant Science', 'Nông nghiệp'] },
  { code: '7140231', name: 'Sư phạm Tiếng Anh', aliases: ['English Education', 'TESOL'] },
  { code: '7140202', name: 'Giáo dục Tiểu học', aliases: ['Primary Education'] },
  { code: '7210403', name: 'Thiết kế đồ hoạ', aliases: ['Graphic Design'] },
  { code: '7810103', name: 'Quản trị khách sạn', aliases: ['Hospitality', 'Hotel Management'] },
  { code: '7810101', name: 'Du lịch', aliases: ['Tourism'] },
];

// ── Location list ───────────────────────────────────────────

export const STUDY_LOCATIONS = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Huế', 'Cần Thơ',
  'Hải Phòng', 'Thái Nguyên', 'Vinh', 'Nha Trang', 'Đà Lạt',
  'Hàn Quốc', 'Nhật Bản', 'Úc', 'Mỹ', 'Anh', 'Canada',
  'Đức', 'Pháp', 'Singapore', 'Trung Quốc', 'Đài Loan',
  'New Zealand', 'Hà Lan', 'Thuỵ Điển', 'Phần Lan',
] as const;

export const DEGREE_LEVELS = [
  { value: 'bachelor', label: 'Đại học' },
  { value: 'master', label: 'Thạc sĩ' },
  { value: 'phd', label: 'Tiến sĩ' },
  { value: 'associate', label: 'Cao đẳng' },
  { value: 'continuing', label: 'Liên thông' },
] as const;
