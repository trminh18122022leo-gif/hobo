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
  { name: 'Bộ GD&ĐT', baseUrl: 'https://moet.gov.vn', kind: 'GOVERNMENT', tier: 'A', fetchStrategy: 'HTML' },
  { name: 'ĐHQGHN', baseUrl: 'https://vnu.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML' },
  { name: 'ĐHBKHN', baseUrl: 'https://hust.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML' },
  { name: 'ĐH Bách khoa TP.HCM', baseUrl: 'https://hcmut.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML' },
  { name: 'ĐH FPT', baseUrl: 'https://fpt.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML' },
  { name: 'ĐH Kinh tế Quốc dân', baseUrl: 'https://neu.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML' },
  { name: 'ĐHQG TP.HCM', baseUrl: 'https://vnuhcm.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML' },
  { name: 'ĐH Ngoại thương', baseUrl: 'https://ftu.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML' },
  { name: 'ĐH Y Hà Nội', baseUrl: 'https://hmu.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML' },
  { name: 'ĐH Sư phạm HN', baseUrl: 'https://hnue.edu.vn', kind: 'UNIVERSITY', tier: 'A', fetchStrategy: 'HTML' },

  { name: 'ĐH Đà Nẵng', baseUrl: 'https://udn.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'ĐH Huế', baseUrl: 'https://hueuni.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'ĐH Cần Thơ', baseUrl: 'https://ctu.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'KOICA Vietnam', baseUrl: 'https://www.koica.go.kr', kind: 'GOVERNMENT', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'JICA Vietnam', baseUrl: 'https://www.jica.go.jp', kind: 'GOVERNMENT', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'DAAD Vietnam', baseUrl: 'https://www.daad-vietnam.vn', kind: 'NGO', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'Fulbright Vietnam', baseUrl: 'https://fulbright.edu.vn', kind: 'UNIVERSITY', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'Chevening', baseUrl: 'https://www.chevening.org', kind: 'NGO', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'ADB Scholarships', baseUrl: 'https://www.adb.org', kind: 'NGO', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'KGSP (NIIED)', baseUrl: 'https://www.studyinkorea.go.kr', kind: 'GOVERNMENT', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'Australia Awards', baseUrl: 'https://www.dfat.gov.au', kind: 'GOVERNMENT', tier: 'B', fetchStrategy: 'HTML' },
  { name: 'Eiffel Scholarship', baseUrl: 'https://www.campusfrance.org', kind: 'GOVERNMENT', tier: 'B', fetchStrategy: 'HTML' },

  { name: 'Quỹ Đổi mới Sáng tạo Vingroup', baseUrl: 'https://vinif.org', kind: 'CORPORATE', tier: 'C', fetchStrategy: 'HTML' },
  { name: 'Tập đoàn FPT', baseUrl: 'https://fpt.com.vn', kind: 'CORPORATE', tier: 'C', fetchStrategy: 'HTML' },
  { name: 'Viettel', baseUrl: 'https://viettel.com.vn', kind: 'CORPORATE', tier: 'C', fetchStrategy: 'HTML' },
  { name: 'Samsung Vietnam', baseUrl: 'https://samsung.com/vn', kind: 'CORPORATE', tier: 'C', fetchStrategy: 'HTML' },
  { name: 'Honda Vietnam', baseUrl: 'https://honda.com.vn', kind: 'CORPORATE', tier: 'C', fetchStrategy: 'HTML' },
  { name: 'Toyota Vietnam', baseUrl: 'https://toyotavn.com.vn', kind: 'CORPORATE', tier: 'C', fetchStrategy: 'HTML' },
  { name: 'Scholarship.vn', baseUrl: 'https://scholarship.vn', kind: 'PORTAL', tier: 'C', fetchStrategy: 'HTML' },
  { name: 'Ybox', baseUrl: 'https://ybox.vn', kind: 'PORTAL', tier: 'C', fetchStrategy: 'HTML' },
  { name: 'Kênh Tuyển Sinh', baseUrl: 'https://kenhtuyensinh.vn', kind: 'PORTAL', tier: 'C', fetchStrategy: 'HTML' }
];
