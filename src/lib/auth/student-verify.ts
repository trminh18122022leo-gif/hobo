import prisma from '@/lib/db';

export interface StudentDomainMatch {
  isStudent: boolean;
  domain: string;
  universityName?: string;
  sourceId?: number;
  badgeLabel?: string;
}

// Well-known Vietnamese university domain mappings for fast lookup
const KNOWN_UNIVERSITY_DOMAINS: Record<string, string> = {
  'hust.edu.vn': 'Đại học Bách khoa Hà Nội',
  'vnu.edu.vn': 'Đại học Quốc gia Hà Nội',
  'vnuhcm.edu.vn': 'Đại học Quốc gia TP.HCM',
  'hcmut.edu.vn': 'Trường ĐH Bách Khoa - ĐHQG TP.HCM',
  'neu.edu.vn': 'Đại học Kinh tế Quốc dân',
  'ftu.edu.vn': 'Đại học Ngoại thương',
  'fpt.edu.vn': 'Đại học FPT',
  'hmu.edu.vn': 'Đại học Y Hà Nội',
  'hnue.edu.vn': 'Đại học Sư phạm Hà Nội',
  'dut.udn.vn': 'Trường ĐH Bách khoa - ĐH Đà Nẵng',
  'udn.vn': 'Đại học Đà Nẵng',
  'hueuni.edu.vn': 'Đại học Huế',
  'ctu.edu.vn': 'Đại học Cần Thơ',
  'uit.edu.vn': 'Trường ĐH Công nghệ Thông tin - ĐHQG TP.HCM',
  'ussh.edu.vn': 'Trường ĐH Khoa học Xã hội và Nhân văn',
  'uel.edu.vn': 'Trường ĐH Kinh tế - Luật - ĐHQG TP.HCM',
  'hanu.edu.vn': 'Đại học Hà Nội',
  'tlu.edu.vn': 'Đại học Thủy lợi',
  'hau.edu.vn': 'Đại học Kiến trúc Hà Nội',
  'dav.edu.vn': 'Học viện Ngoại giao',
  'ba.edu.vn': 'Học viện Ngân hàng',
  'hvtc.edu.vn': 'Học viện Tài chính',
  'ptit.edu.vn': 'Học viện Công nghệ Bưu chính Viễn thông',
  'rmit.edu.vn': 'Đại học RMIT Việt Nam',
  'vinuni.edu.vn': 'Đại học VinUni',
  'buv.edu.vn': 'Đại học Anh Quốc Việt Nam (BUV)',
};

/**
 * Check if an email belongs to an educational institution (.edu.vn or .edu)
 * and match it against registered university sources in database
 */
export async function checkStudentEmail(email: string): Promise<StudentDomainMatch> {
  if (!email || !email.includes('@')) {
    return { isStudent: false, domain: '' };
  }

  const domain = email.split('@')[1].toLowerCase().trim();

  // Check if it matches an educational domain pattern
  const isEdu = domain.endsWith('.edu.vn') || domain.endsWith('.edu');
  if (!isEdu) {
    return { isStudent: false, domain };
  }

  // 1. First check known domains dictionary
  let universityName = KNOWN_UNIVERSITY_DOMAINS[domain];

  // Also check subdomains, e.g. "sis.hust.edu.vn" -> "hust.edu.vn"
  if (!universityName) {
    for (const [knownDomain, name] of Object.entries(KNOWN_UNIVERSITY_DOMAINS)) {
      if (domain.endsWith('.' + knownDomain)) {
        universityName = name;
        break;
      }
    }
  }

  // 2. Query database Source table to link official sourceId if available
  let sourceId: number | undefined;
  try {
    const sources = await prisma.source.findMany({
      where: {
        OR: [
          { baseUrl: { contains: domain } },
          ...(universityName ? [{ name: { contains: universityName } }] : []),
        ],
      },
      select: { id: true, name: true, baseUrl: true },
      take: 1,
    });

    if (sources.length > 0) {
      sourceId = sources[0].id;
      if (!universityName) {
        universityName = sources[0].name;
      }
    }
  } catch (error) {
    console.error('Error querying source for student domain:', error);
  }

  // Default fallback name if not specifically recognized
  if (!universityName) {
    universityName = 'Trường Đại học / Học viện';
  }

  return {
    isStudent: true,
    domain,
    universityName,
    sourceId,
    badgeLabel: `Sinh viên ${universityName}`,
  };
}
