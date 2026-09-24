const fs = require('fs');
const path = require('path');

const csvPath = 'C:\\Users\\Admin\\Documents\\Default Project\\admission_internship_scholarship_websites.csv';
const text = fs.readFileSync(csvPath, 'utf-8');

function parseCSV(text) {
  const p = [];
  let row = [''];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i+1];
    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push('');
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      p.push(row);
      row = [''];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== '') p.push(row);
  return p;
}

function cleanUrl(raw) {
  let u = raw.trim();
  if (!u.startsWith('http')) u = 'https://' + u;
  try {
    const parsed = new URL(u);
    return parsed.origin + (parsed.pathname.length > 1 ? parsed.pathname.replace(/\/$/, '') : '');
  } catch {
    return u.replace(/\/$/, '');
  }
}

const rows = parseCSV(text);
const sources = [];
const seenUrls = new Set();

for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  if (r.length >= 4 && r[2] && r[3]) {
    const country = r[0].trim();
    const category = r[1].trim();
    const name = r[2].trim();
    const rawUrl = r[3].trim();
    const baseUrl = cleanUrl(rawUrl);
    const features = r[4] ? r[4].trim() : '';
    const language = r[5] ? r[5].trim() : '';
    const appFee = r[6] ? r[6].trim() : '';
    const deadlinePattern = r[7] ? r[7].trim() : '';
    const notes = r[8] ? r[8].trim() : '';

    if (seenUrls.has(baseUrl.toLowerCase())) continue;
    seenUrls.add(baseUrl.toLowerCase());

    let kind = 'UNIVERSITY';
    let tier = 'B';

    const catLower = category.toLowerCase();
    const nameLower = name.toLowerCase();
    const urlLower = baseUrl.toLowerCase();

    if (
      urlLower.includes('.gov') ||
      urlLower.includes('moet.gov') ||
      urlLower.includes('dfat.gov') ||
      urlLower.includes('campusfrance') ||
      urlLower.includes('daad') ||
      urlLower.includes('jasso') ||
      urlLower.includes('studyinkorea') ||
      urlLower.includes('csc.edu') ||
      urlLower.includes('nzqa.govt') ||
      nameLower.includes('bộ gd')
    ) {
      kind = 'GOVERNMENT';
      tier = 'A';
    } else if (
      catLower.includes('internship') ||
      catLower.includes('job') ||
      nameLower.includes('topcv') ||
      nameLower.includes('vietnamworks') ||
      nameLower.includes('rikkei')
    ) {
      kind = 'CORPORATE';
      tier = 'B';
    } else if (
      catLower.includes('application processing') ||
      nameLower.includes('common app') ||
      nameLower.includes('ucas') ||
      nameLower.includes('uni-assist') ||
      nameLower.includes('studielink') ||
      nameLower.includes('parcoursup') ||
      nameLower.includes('ouac') ||
      nameLower.includes('hochschulstart')
    ) {
      kind = 'PORTAL';
      tier = 'A';
    } else if (catLower.includes('scholarship')) {
      if (
        nameLower.includes('bộ') ||
        nameLower.includes('chính phủ') ||
        nameLower.includes('government') ||
        nameLower.includes('chevening') ||
        nameLower.includes('australia awards') ||
        nameLower.includes('mext') ||
        nameLower.includes('gks') ||
        nameLower.includes('fulbright')
      ) {
        kind = 'GOVERNMENT';
        tier = 'A';
      } else if (
        nameLower.includes('.com') ||
        nameLower.includes('portal') ||
        nameLower.includes('ybox') ||
        nameLower.includes('fastweb') ||
        nameLower.includes('niche')
      ) {
        kind = 'PORTAL';
        tier = 'B';
      } else {
        kind = 'NGO';
        tier = 'B';
      }
    } else {
      kind = 'UNIVERSITY';
      tier = 'B';
    }

    let fetchStrategy = 'HTML';
    if (baseUrl.includes('.xml') || baseUrl.includes('/feed') || baseUrl.includes('/rss')) {
      fetchStrategy = 'RSS';
    }

    sources.push({
      name,
      baseUrl,
      kind,
      tier,
      fetchStrategy,
      country,
      category,
      features,
      language,
      appFee,
      deadlinePattern,
      notes,
    });
  }
}

// Add existing sources from INITIAL_SOURCES that aren't already in CSV
const existingSources = [
  { name: 'ĐH Bách khoa TP.HCM', baseUrl: 'https://hcmut.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Undergraduate Admissions', appFee: 'Free' },
  { name: 'ĐHQG TP.HCM (VNU-HCM)', baseUrl: 'https://vnuhcm.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Undergraduate Admissions', appFee: 'Free' },
  { name: 'ĐH Y Dược TP.HCM (UMP)', baseUrl: 'https://ump.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Undergraduate Admissions', appFee: 'Free' },
  { name: 'ĐH Sư phạm HN (HNUE)', baseUrl: 'https://hnue.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Undergraduate Admissions', appFee: 'Free' },
  { name: 'VinUni', baseUrl: 'https://vinuni.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Scholarships & Admissions', appFee: 'Free' },
  { name: 'IDP Vietnam - Học Bổng Du Học', baseUrl: 'https://www.idp.com', kind: 'PORTAL', tier: 'A', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Scholarships', appFee: 'Free' },
  { name: 'ĐH Đà Nẵng (UD)', baseUrl: 'https://udn.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Undergraduate Admissions', appFee: 'Free' },
  { name: 'ĐH Cần Thơ (CTU)', baseUrl: 'https://ctu.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Undergraduate Admissions', appFee: 'Free' },
  { name: 'ĐH Thái Nguyên (TNU)', baseUrl: 'https://tnu.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Undergraduate Admissions', appFee: 'Free' },
  { name: 'ĐH Vinh', baseUrl: 'https://vinhuni.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Undergraduate Admissions', appFee: 'Free' },
  { name: 'ĐH Quy Nhơn (QNU)', baseUrl: 'https://qnu.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Undergraduate Admissions', appFee: 'Free' },
  { name: 'ĐH Tây Nguyên', baseUrl: 'https://ttn.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Undergraduate Admissions', appFee: 'Free' },
  { name: 'Học viện Ngoại giao (DAV)', baseUrl: 'https://dav.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Undergraduate Admissions', appFee: 'Free' },
  { name: 'Học viện Ngân hàng (BA)', baseUrl: 'https://hvnh.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Undergraduate Admissions', appFee: 'Free' },
  { name: 'ĐH Giao thông Vận tải (UTC)', baseUrl: 'https://utc.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Undergraduate Admissions', appFee: 'Free' },
  { name: 'ĐH Xây dựng (HUCE)', baseUrl: 'https://huce.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Undergraduate Admissions', appFee: 'Free' },
  { name: 'ĐH Thương mại (TMU)', baseUrl: 'https://tmu.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Undergraduate Admissions', appFee: 'Free' },
  { name: 'ĐH Kinh tế TP.HCM (UEH)', baseUrl: 'https://ueh.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Undergraduate Admissions', appFee: 'Free' },
  { name: 'ĐH Công nghệ Thông tin ĐHQG-HCM (UIT)', baseUrl: 'https://uit.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Undergraduate Admissions', appFee: 'Free' },
  { name: 'ĐH Quốc tế ĐHQG-HCM (IU)', baseUrl: 'https://hcmiu.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Undergraduate Admissions', appFee: 'Free' },
  { name: 'ĐH Tôn Đức Thắng (TDTU)', baseUrl: 'https://tdtu.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Undergraduate Admissions', appFee: 'Free' },
  { name: 'ĐH Khoa học Tự nhiên ĐHQGHN (HUS)', baseUrl: 'https://hus.vnu.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Undergraduate Admissions', appFee: 'Free' },
  { name: 'ĐH Công nghệ ĐHQGHN (UET)', baseUrl: 'https://uet.vnu.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Undergraduate Admissions', appFee: 'Free' },
  { name: 'ĐH Phenikaa', baseUrl: 'https://phenikaa-uni.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Undergraduate Admissions', appFee: 'Free' },
  { name: 'HUTECH', baseUrl: 'https://hutech.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Undergraduate Admissions', appFee: 'Free' },
  { name: 'UEF', baseUrl: 'https://uef.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Undergraduate Admissions', appFee: 'Free' },
  { name: 'ĐH Hoa Sen (HSU)', baseUrl: 'https://hoasen.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Undergraduate Admissions', appFee: 'Free' },
  { name: 'KOICA Vietnam', baseUrl: 'https://www.koica.go.kr', kind: 'GOVERNMENT', tier: 'B', fetchStrategy: 'HTML', country: 'South Korea', category: 'Scholarships', appFee: 'Free' },
  { name: 'JICA Vietnam', baseUrl: 'https://www.jica.go.jp', kind: 'GOVERNMENT', tier: 'B', fetchStrategy: 'HTML', country: 'Japan', category: 'Scholarships', appFee: 'Free' },
  { name: 'ADB Scholarships', baseUrl: 'https://www.adb.org', kind: 'NGO', tier: 'B', fetchStrategy: 'HTML', country: 'International', category: 'Scholarships', appFee: 'Free' },
  { name: 'Quỹ Đổi mới Sáng tạo Vingroup (VinIF)', baseUrl: 'https://vinif.org', kind: 'CORPORATE', tier: 'C', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Scholarships', appFee: 'Free' },
  { name: 'Quỹ Học bổng Thắp Sáng Niềm Tin', baseUrl: 'https://thapsangniemtin.vn', kind: 'NGO', tier: 'C', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Scholarships', appFee: 'Free' },
  { name: 'Quỹ Lawrence S. Ting', baseUrl: 'https://lawrencestingfoundation.org', kind: 'NGO', tier: 'C', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Scholarships', appFee: 'Free' },
  { name: 'Tập đoàn FPT', baseUrl: 'https://fpt.com.vn', kind: 'CORPORATE', tier: 'C', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Internship & Jobs', appFee: 'Free' },
  { name: 'Viettel', baseUrl: 'https://viettel.com.vn', kind: 'CORPORATE', tier: 'C', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Internship & Jobs', appFee: 'Free' },
  { name: 'Samsung Vietnam', baseUrl: 'https://samsung.com/vn', kind: 'CORPORATE', tier: 'C', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Internship & Jobs', appFee: 'Free' },
  { name: 'Honda Vietnam', baseUrl: 'https://honda.com.vn', kind: 'CORPORATE', tier: 'C', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Internship & Jobs', appFee: 'Free' },
  { name: 'Toyota Vietnam Foundation', baseUrl: 'https://toyotavn.com.vn', kind: 'CORPORATE', tier: 'C', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Scholarships', appFee: 'Free' },
  { name: 'Scholarship.vn', baseUrl: 'https://scholarship.vn', kind: 'PORTAL', tier: 'C', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Scholarships', appFee: 'Free' },
  { name: 'Kênh Tuyển Sinh', baseUrl: 'https://kenhtuyensinh.vn', kind: 'PORTAL', tier: 'C', fetchStrategy: 'HTML', country: 'Vietnam', category: 'Undergraduate Admissions', appFee: 'Free' },
  { name: 'Cổng Thông Tin Học Bổng Quốc Tế (RSS Feed)', baseUrl: 'https://scholarshipdb.net/scholarships.xml', kind: 'PORTAL', tier: 'C', fetchStrategy: 'RSS', country: 'International', category: 'Scholarships', appFee: 'Free' },
];

for (const ex of existingSources) {
  const clean = cleanUrl(ex.baseUrl);
  if (!seenUrls.has(clean.toLowerCase())) {
    seenUrls.add(clean.toLowerCase());
    sources.push({
      ...ex,
      baseUrl: clean,
      features: 'Cổng thông tin tuyển sinh & học bổng chính thức',
      language: 'Vietnamese',
      deadlinePattern: 'Theo kỳ tuyển sinh hàng năm',
      notes: 'Nguồn được xác thực bởi hệ thống',
    });
  }
}

console.log('Total merged sources:', sources.length);

const fileHeader = `// ════════════════════════════════════════════════════════════
// Danh Mục Nguồn Dữ Liệu Tuyển Sinh, Học Bổng & Việc Làm (150+ Nguồn)
// Tích hợp từ 126 cổng chính thức qua 21 Quốc gia & Bộ GD&ĐT
// ════════════════════════════════════════════════════════════

export type FetchStrategy = 'HTML' | 'API' | 'RSS';
export type SourceTier = 'A' | 'B' | 'C';
export type SourceKind = 'UNIVERSITY' | 'GOVERNMENT' | 'NGO' | 'CORPORATE' | 'PORTAL';

export interface SourceConfig {
  name: string;
  baseUrl: string;
  kind: SourceKind;
  tier: SourceTier;
  fetchStrategy: FetchStrategy;
  country?: string;
  category?: string;
  features?: string;
  language?: string;
  appFee?: string;
  deadlinePattern?: string;
  notes?: string;
}

export const INITIAL_SOURCES: SourceConfig[] = ${JSON.stringify(sources, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '../src/lib/crawler/sources.ts'), fileHeader, 'utf-8');
console.log('Successfully written src/lib/crawler/sources.ts with', sources.length, 'sources!');
