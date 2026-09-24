export type FetchStrategy = 'HTML' | 'API' | 'RSS';
export type SourceTier = 'A' | 'B' | 'C';
export type SourceKind = 'UNIVERSITY' | 'GOVERNMENT' | 'NGO' | 'CORPORATE' | 'PORTAL';

export interface SourceConfig {
  name: string;
  baseUrl: string;
  kind: SourceKind;
  tier: SourceTier;
  fetchStrategy: FetchStrategy;
}

export const INITIAL_SOURCES: SourceConfig[] = [
  // ── Tier A: National & Leading Universities, MOET (Quét 1h/lần) ────────────────
  { name: 'Bộ GD&ĐT', baseUrl: 'https://moet.gov.vn', kind: 'GOVERNMENT', tier: 'A', fetchStrategy: 'HTML' },
  { name: 'ĐHQGHN (VNU)', baseUrl: 'https://vnu.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML' },
  { name: 'ĐHBKHN (HUST)', baseUrl: 'https://hust.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML' },
  { name: 'ĐH Bách khoa TP.HCM', baseUrl: 'https://hcmut.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML' },
  { name: 'ĐHQG TP.HCM (VNU-HCM)', baseUrl: 'https://vnuhcm.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML' },
  { name: 'ĐH Kinh tế Quốc dân (NEU)', baseUrl: 'https://neu.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML' },
  { name: 'ĐH Ngoại thương (FTU)', baseUrl: 'https://ftu.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML' },
  { name: 'ĐH Y Hà Nội (HMU)', baseUrl: 'https://hmu.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML' },
  { name: 'ĐH Y Dược TP.HCM (UMP)', baseUrl: 'https://ump.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML' },
  { name: 'ĐH Sư phạm HN (HNUE)', baseUrl: 'https://hnue.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML' },
  { name: 'VinUni', baseUrl: 'https://vinuni.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML' },
  { name: 'RMIT Vietnam', baseUrl: 'https://rmit.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML' },
  { name: 'Fulbright Vietnam', baseUrl: 'https://fulbright.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML' },
  { name: 'ĐH FPT', baseUrl: 'https://fpt.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML' },

  // ── Tier B: Regional Universities, Specialized Academies & Governments (Quét 6h/lần) ─
  { name: 'ĐH Đà Nẵng (UD)', baseUrl: 'https://udn.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'ĐH Huế', baseUrl: 'https://hueuni.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'ĐH Cần Thơ (CTU)', baseUrl: 'https://ctu.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'ĐH Thái Nguyên (TNU)', baseUrl: 'https://tnu.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'ĐH Vinh', baseUrl: 'https://vinhuni.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'ĐH Quy Nhơn (QNU)', baseUrl: 'https://qnu.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'ĐH Tây Nguyên', baseUrl: 'https://ttn.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'Học viện Ngoại giao (DAV)', baseUrl: 'https://dav.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'Học viện Tài chính (AOF)', baseUrl: 'https://hvtc.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'Học viện Ngân hàng (BA)', baseUrl: 'https://hvnh.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'Học viện Bưu chính Viễn thông (PTIT)', baseUrl: 'https://ptit.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'ĐH Giao thông Vận tải (UTC)', baseUrl: 'https://utc.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'ĐH Xây dựng (HUCE)', baseUrl: 'https://huce.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'ĐH Thương mại (TMU)', baseUrl: 'https://tmu.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'ĐH Kinh tế TP.HCM (UEH)', baseUrl: 'https://ueh.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'ĐH Công nghệ Thông tin ĐHQG-HCM (UIT)', baseUrl: 'https://uit.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'ĐH Quốc tế ĐHQG-HCM (IU)', baseUrl: 'https://hcmiu.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'ĐH Tôn Đức Thắng (TDTU)', baseUrl: 'https://tdtu.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'ĐH Khoa học Tự nhiên ĐHQGHN (HUS)', baseUrl: 'https://hus.vnu.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'ĐH Công nghệ ĐHQGHN (UET)', baseUrl: 'https://uet.vnu.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'ĐH Phenikaa', baseUrl: 'https://phenikaa-uni.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'HUTECH', baseUrl: 'https://hutech.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'UEF', baseUrl: 'https://uef.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'ĐH Hoa Sen (HSU)', baseUrl: 'https://hoasen.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },

  // ── Tier B: Embassy & Government Scholarships (Quét 6h/lần) ─────────────────
  { name: 'KOICA Vietnam', baseUrl: 'https://www.koica.go.kr', kind: 'GOVERNMENT', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'JICA Vietnam', baseUrl: 'https://www.jica.go.jp', kind: 'GOVERNMENT', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'DAAD Vietnam', baseUrl: 'https://www.daad-vietnam.vn', kind: 'NGO', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'Chevening UK', baseUrl: 'https://www.chevening.org', kind: 'NGO', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'ADB Scholarships', baseUrl: 'https://www.adb.org', kind: 'NGO', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'KGSP / GKS (NIIED Korea)', baseUrl: 'https://www.studyinkorea.go.kr', kind: 'GOVERNMENT', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'Australia Awards (AAS)', baseUrl: 'https://www.dfat.gov.au', kind: 'GOVERNMENT', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'Eiffel Scholarship France', baseUrl: 'https://www.campusfrance.org', kind: 'GOVERNMENT', tier: 'B', fetchStrategy: 'HTML' },

  // ── Tier C: Corporate Funds & Scholarship Portals / RSS (Quét 24h/lần) ───────
  { name: 'Quỹ Đổi mới Sáng tạo Vingroup (VinIF)', baseUrl: 'https://vinif.org', kind: 'CORPORATE', tier: 'C', fetchStrategy: 'HTML' },
  { name: 'Quỹ Học bổng Thắp Sáng Niềm Tin', baseUrl: 'https://thapsangniemtin.vn', kind: 'NGO', tier: 'C', fetchStrategy: 'HTML' },
  { name: 'Quỹ Lawrence S. Ting', baseUrl: 'https://lawrencestingfoundation.org', kind: 'NGO', tier: 'C', fetchStrategy: 'HTML' },
  { name: 'Tập đoàn FPT', baseUrl: 'https://fpt.com.vn', kind: 'CORPORATE', tier: 'C', fetchStrategy: 'HTML' },
  { name: 'Viettel', baseUrl: 'https://viettel.com.vn', kind: 'CORPORATE', tier: 'C', fetchStrategy: 'HTML' },
  { name: 'Samsung Vietnam', baseUrl: 'https://samsung.com/vn', kind: 'CORPORATE', tier: 'C', fetchStrategy: 'HTML' },
  { name: 'Honda Vietnam', baseUrl: 'https://honda.com.vn', kind: 'CORPORATE', tier: 'C', fetchStrategy: 'HTML' },
  { name: 'Toyota Vietnam Foundation', baseUrl: 'https://toyotavn.com.vn', kind: 'CORPORATE', tier: 'C', fetchStrategy: 'HTML' },
  { name: 'Scholarship.vn', baseUrl: 'https://scholarship.vn', kind: 'PORTAL', tier: 'C', fetchStrategy: 'HTML' },
  { name: 'Ybox', baseUrl: 'https://ybox.vn', kind: 'PORTAL', tier: 'C', fetchStrategy: 'HTML' },
  { name: 'Kênh Tuyển Sinh', baseUrl: 'https://kenhtuyensinh.vn', kind: 'PORTAL', tier: 'C', fetchStrategy: 'HTML' },
  { name: 'Cổng Thông Tin Học Bổng Quốc Tế (RSS Feed)', baseUrl: 'https://scholarshipdb.net/scholarships.xml', kind: 'PORTAL', tier: 'C', fetchStrategy: 'RSS' },
];
