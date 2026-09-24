import { PrismaClient } from '@prisma/client';
import { INITIAL_SOURCES } from '../src/lib/crawler/sources';

const prisma = new PrismaClient();

async function main() {
  console.log(`Starting synchronization of ${INITIAL_SOURCES.length} sources to Database...`);

  let createdSources = 0;
  let updatedSources = 0;

  for (const src of INITIAL_SOURCES) {
    const kindMap: Record<string, string> = {
      UNIVERSITY: 'university',
      GOVERNMENT: 'embassy',
      NGO: 'fund',
      CORPORATE: 'company',
      PORTAL: 'portal',
    };

    const dbKind = kindMap[src.kind] || 'portal';

    const existing = await prisma.source.findUnique({
      where: { baseUrl: src.baseUrl },
    });

    if (existing) {
      await prisma.source.update({
        where: { id: existing.id },
        data: {
          name: src.name,
          kind: dbKind,
          tier: src.tier,
          fetchStrategy: src.fetchStrategy.toLowerCase(),
          isActive: true,
        },
      });
      updatedSources++;
    } else {
      await prisma.source.create({
        data: {
          name: src.name,
          baseUrl: src.baseUrl,
          kind: dbKind,
          tier: src.tier,
          fetchStrategy: src.fetchStrategy.toLowerCase(),
          trustScore: src.tier === 'A' ? 0.95 : src.tier === 'B' ? 0.85 : 0.75,
          isActive: true,
        },
      });
      createdSources++;
    }
  }

  console.log(`Sources synchronized: ${createdSources} created, ${updatedSources} updated.`);

  // ── Seed Real Representative Opportunities for Internships, Graduate & Admissions ──
  console.log('Seeding representative opportunities across new categories...');

  // Get key sources from DB
  const getSource = async (baseUrlKeyword: string, fallbackName: string) => {
    let s = await prisma.source.findFirst({
      where: { baseUrl: { contains: baseUrlKeyword } },
    });
    if (!s) {
      s = await prisma.source.findFirst({
        where: { name: { contains: fallbackName } },
      });
    }
    if (!s) {
      s = await prisma.source.findFirst();
    }
    return s!;
  };

  const moetSource = await getSource('tuyensinh.moet.gov.vn', 'Bộ GD&ĐT');
  const topcvSource = await getSource('topcv.vn', 'TopCV');
  const vietnamworksSource = await getSource('vietnamworks.com', 'VietnamWorks');
  const yboxSource = await getSource('ybox.vn', 'Ybox');
  const rikkeiSource = await getSource('rikkeisoft.com', 'Rikkei');
  const daadSource = await getSource('daad', 'DAAD');
  const campusFranceSource = await getSource('campusfrance', 'Campus France');
  const ucasSource = await getSource('ucas.com', 'UCAS');
  const commonAppSource = await getSource('commonapp.org', 'Common App');
  const nusSource = await getSource('nus.edu.sg', 'NUS');

  const newOpportunities = [
    // ── INTERNSHIPS (Thực tập sinh & Việc làm) ───────────────────────
    {
      sourceId: topcvSource.id,
      slug: 'topcv-chuong-trinh-thuc-tap-sinh-tai-nang-fintech-ai-2026',
      kind: 'internship',
      title: 'Chương trình Thực tập sinh Tài năng Công nghệ & FinTech 2026',
      organization: 'TopCV Vietnam & Đối tác Ngân hàng Số',
      organizationType: 'company',
      summary: 'Tuyển dụng 50 thực tập sinh Full-stack, AI Engineer và Data Analyst. Trợ cấp lương từ 8.000.000đ - 12.000.000đ/tháng, cơ hội ký hợp đồng chính thức sau 3 tháng.',
      requirements: JSON.stringify({
        gpa_min: 2.8,
        language: 'Giao tiếp tiếng Anh hoặc TOEIC 650+',
        degree_allowed: ['Năm 3, năm 4 hoặc mới tốt nghiệp Đại học'],
        no_essay: true,
      }),
      fieldCodes: JSON.stringify(['IT', 'ECON', 'DATA']),
      degreeLevel: JSON.stringify(['bachelor']),
      studyLocation: 'Hà Nội',
      fundingType: 'stipend',
      fundingValueVnd: 36000000, // 12tr x 3 tháng
      deadline: new Date('2026-06-30T23:59:59Z'),
      canonicalUrl: 'https://www.topcv.vn/viec-lam/thuc-tap-sinh-tai-nang',
      rankScore: 92,
      confidence: 0.95,
      status: 'published',
      requiredDocuments: JSON.stringify([
        { name: 'CV tiếng Anh hoặc tiếng Việt', format_hint: 'PDF dưới 5MB' },
        { name: 'Bảng điểm các kỳ gần nhất', format_hint: 'Bản chụp hoặc PDF' },
      ]),
      applicationSteps: JSON.stringify([
        { order: 1, title: 'Nộp hồ sơ online', description: 'Ứng tuyển trực tuyến qua TopCV, miễn 100% lệ phí' },
        { order: 2, title: 'Làm bài kiểm tra kỹ thuật (Online Assessment)', description: '45 phút trắc nghiệm & coding bài tập' },
        { order: 3, title: 'Phỏng vấn chuyên môn & Văn hóa doanh nghiệp', description: 'Phỏng vấn 1-1 với Trưởng nhóm' },
      ]),
      benefits: JSON.stringify([
        { label: 'Trợ cấp hàng tháng', value: '8.000.000 - 12.000.000 VNĐ / tháng' },
        { label: 'Lệ phí nộp đơn', value: 'Hoàn toàn Miễn phí (Free)' },
        { label: 'Cơ hội lên chính thức', value: '100% ứng viên đạt KPI được offer hợp đồng Full-time' },
      ]),
    },
    {
      sourceId: rikkeiSource.id,
      slug: 'rikkei-ioc-internship-cloud-ai-developer-2026',
      kind: 'internship',
      title: 'Rikkei IOC - Khóa Thực Tập Sinh Đào Tạo Chuyên Sâu Cloud & AI Engineer',
      organization: 'Rikkeisoft - Viện Đào Tạo Rikkei IOC',
      organizationType: 'company',
      summary: 'Khóa huấn luyện và thực chiến dự án Nhật Bản - Mỹ. Tài trợ 100% học phí đào tạo + Trợ cấp 5.000.000đ - 9.000.000đ/tháng.',
      requirements: JSON.stringify({
        language: 'Ưu tiên biết tiếng Nhật N4/N3 hoặc tiếng Anh',
        degree_allowed: ['Sinh viên ngành CNTT, Điện tử Viễn thông, Toán tin'],
        no_essay: true,
      }),
      fieldCodes: JSON.stringify(['IT', 'ENGINEERING']),
      degreeLevel: JSON.stringify(['bachelor']),
      studyLocation: 'Hà Nội',
      fundingType: 'full',
      fundingValueVnd: 25000000,
      deadline: new Date('2026-05-15T23:59:59Z'),
      canonicalUrl: 'https://rikkeisoft.com/careers/internship-2026',
      rankScore: 89,
      confidence: 0.94,
      status: 'published',
      requiredDocuments: JSON.stringify([
        { name: 'Sơ yếu lý lịch / CV', format_hint: 'File PDF đính kèm GitHub / Portfolio' },
      ]),
      applicationSteps: JSON.stringify([
        { order: 1, title: 'Nộp CV trực tuyến', description: 'Nộp qua cổng thông tin Rikkei' },
        { order: 2, title: 'Test thuật toán & Tư duy', description: 'Kiểm tra OOP, cấu trúc dữ liệu' },
        { order: 3, title: 'Gia nhập dự án', description: 'Thực tập trực tiếp tại văn phòng Hà Nội / Đà Nẵng' },
      ]),
      benefits: JSON.stringify([
        { label: 'Hỗ trợ thực tập', value: '5 - 9 triệu/tháng + Phụ cấp ăn trưa' },
        { label: 'Lệ phí xét tuyển', value: 'Miễn phí' },
      ]),
    },
    {
      sourceId: vietnamworksSource.id,
      slug: 'vietnamworks-management-trainee-fast-track-fmcg-2026',
      kind: 'internship',
      title: 'Chương trình Quản trị viên Tập sự (Management Trainee) 2026',
      organization: 'VietnamWorks in Tech & Multi-National Corps',
      organizationType: 'company',
      summary: 'Lộ trình đào tạo quản lý cấp tốc trong 24 tháng cho sinh viên xuất sắc. Mức lương khởi điểm 18 - 25 triệu VNĐ/tháng, luân chuyển phòng ban quốc tế.',
      requirements: JSON.stringify({
        gpa_min: 3.2,
        language: 'IELTS 6.5+ hoặc tương đương',
        degree_allowed: ['Cử nhân hoặc Thạc sĩ dưới 2 năm kinh nghiệm'],
      }),
      fieldCodes: JSON.stringify(['ECON', 'BUSINESS', 'MARKETING']),
      degreeLevel: JSON.stringify(['bachelor', 'master']),
      studyLocation: 'TP. Hồ Chí Minh',
      fundingType: 'stipend',
      fundingValueVnd: 60000000,
      deadline: new Date('2026-04-30T23:59:59Z'),
      canonicalUrl: 'https://www.vietnamworks.com/management-trainee-2026',
      rankScore: 95,
      confidence: 0.98,
      status: 'published',
      requiredDocuments: JSON.stringify([
        { name: 'Curriculum Vitae (CV) bằng tiếng Anh', format_hint: 'PDF tiêu chuẩn' },
        { name: 'Bảng điểm Đại học có xác nhận GPA', format_hint: 'Bản scan có dấu' },
      ]),
      applicationSteps: JSON.stringify([
        { order: 1, title: 'Online Application', description: 'Nộp đơn xét duyệt lý lịch ban đầu' },
        { order: 2, title: 'Aptitude Test & Video Interview', description: 'Kiểm tra logic numerical & verbal' },
        { order: 3, title: 'Assessment Center & Phỏng vấn Ban Giám Đốc', description: 'Giải case study tình huống thực tế' },
      ]),
      benefits: JSON.stringify([
        { label: 'Lương & Đãi ngộ', value: '18 - 25 triệu đồng/tháng + Bảo hiểm toàn diện' },
        { label: 'Phí tham dự', value: '100% Free' },
      ]),
    },

    // ── POSTGRADUATE & PHD ───────────────────────────────────────────
    {
      sourceId: daadSource.id,
      slug: 'daad-research-grants-doctoral-programmes-in-germany-2026',
      kind: 'scholarship_foreign',
      title: 'Học bổng Toàn phần Tiến sĩ & Nghiên cứu sinh DAAD (Đức) 2026 - 2027',
      organization: 'Cơ quan Trao đổi Hàn lâm Đức (DAAD)',
      organizationType: 'government',
      summary: 'Tài trợ toàn phần làm nghiên cứu sinh Tiến sĩ (PhD) tại các trường Đại học và Viện nghiên cứu Max Planck, Fraunhofer tại CHLB Đức. Trợ cấp 1.300 EUR/tháng.',
      requirements: JSON.stringify({
        gpa_min: 3.2,
        language: 'Tiếng Anh IELTS 6.5+ hoặc Tiếng Đức B2/C1',
        degree_allowed: ['Đã có bằng Thạc sĩ hoặc Cử nhân xuất sắc'],
      }),
      fieldCodes: JSON.stringify(['STEM', 'MED', 'TECH', 'NATURAL_SCIENCE']),
      degreeLevel: JSON.stringify(['phd']),
      studyLocation: 'Đức (Germany)',
      fundingType: 'full',
      fundingValueVnd: 1200000000,
      deadline: new Date('2026-10-31T23:59:59Z'),
      canonicalUrl: 'https://www.daad.de/en/find-funding/scholarship-database/',
      rankScore: 98,
      confidence: 0.99,
      status: 'published',
      requiredDocuments: JSON.stringify([
        { name: 'Đề cương nghiên cứu (Research Proposal 5-10 trang)', format_hint: 'PDF tiếng Anh/Đức' },
        { name: 'Thư đồng ý hướng dẫn của Giáo sư Đức (Invitation letter)', format_hint: 'Có chữ ký của GS' },
        { name: '2 Thư giới thiệu học thuật', format_hint: 'Từ Phó giáo sư / Giáo sư' },
      ]),
      applicationSteps: JSON.stringify([
        { order: 1, title: 'Tìm kiếm Giáo sư hướng dẫn tại Đức', description: 'Liên hệ qua cổng DAAD / Research-in-Germany' },
        { order: 2, title: 'Nộp hồ sơ qua cổng DAAD Portal', description: 'Miễn 100% lệ phí xét duyệt hồ sơ' },
        { order: 3, title: 'Hội đồng xét tuyển DAAD thẩm định', description: 'Phỏng vấn chuyên môn nếu cần' },
      ]),
      benefits: JSON.stringify([
        { label: 'Trợ cấp sinh hoạt', value: '1.300 EUR / tháng (khoảng 35 triệu VNĐ)' },
        { label: 'Bảo hiểm y tế & Đi lại', value: 'Được đài thọ trọn gói + Vé máy bay khứ hồi' },
        { label: 'Lệ phí nộp hồ sơ', value: 'Hoàn toàn Miễn phí (Free)' },
      ]),
    },

    // ── CENTRAL ADMISSION PORTALS ────────────────────────────────────
    {
      sourceId: commonAppSource.id,
      slug: 'common-app-us-college-admissions-scholarships-2026',
      kind: 'scholarship_foreign',
      title: 'Hệ thống Đăng ký Tuyển sinh & Hỗ trợ Tài chính Đại học Hoa Kỳ (Common App 2026)',
      organization: 'Common Application Inc. (Hoa Kỳ)',
      organizationType: 'foundation',
      summary: 'Cổng nộp hồ sơ chung cho hơn 1.000 trường đại học hàng đầu Mỹ (Harvard, MIT, Stanford, Yale, v.v.). Hỗ trợ xin miễn lệ phí nộp đơn (Fee Waiver) và học bổng Need-blind/Merit-based.',
      requirements: JSON.stringify({
        language: 'IELTS 7.0+ / TOEFL iBT 90+ / Duolingo 120+',
        degree_allowed: ['Học sinh lớp 12 hoặc đã tốt nghiệp THPT'],
      }),
      fieldCodes: JSON.stringify(['MULTI', 'STEM', 'BUSINESS']),
      degreeLevel: JSON.stringify(['bachelor']),
      studyLocation: 'Hoa Kỳ (USA)',
      fundingType: 'full',
      fundingValueVnd: 2500000000,
      deadline: new Date('2026-11-01T23:59:59Z'),
      canonicalUrl: 'https://www.commonapp.org',
      rankScore: 97,
      confidence: 0.99,
      status: 'published',
      requiredDocuments: JSON.stringify([
        { name: 'Common App Personal Essay (650 từ)', format_hint: 'Bài luận chính' },
        { name: 'Bảng điểm THPT (High School Transcript)', format_hint: 'Kèm xác nhận trường' },
        { name: 'Recommendation Letters (2-3 thư)', format_hint: 'Từ giáo viên & cố vấn' },
      ]),
      applicationSteps: JSON.stringify([
        { order: 1, title: 'Tạo tài khoản sinh viên', description: 'Đăng ký tại commonapp.org' },
        { order: 2, title: 'Chọn danh sách trường (My Colleges)', description: 'Tối đa 20 trường đại học Mỹ' },
        { order: 3, title: 'Nộp đơn & Xin Fee Waiver', description: 'Học sinh Việt Nam có hoàn cảnh khó khăn được miễn phí nộp đơn' },
      ]),
      benefits: JSON.stringify([
        { label: 'Mức học bổng tối đa', value: 'Lên đến 100% học phí + ăn ở (Full-ride)' },
        { label: 'Lệ phí nộp', value: 'Thường $50-$90/trường, có thể xin Miễn Phí (Fee Waiver)' },
      ]),
    },
    {
      sourceId: campusFranceSource.id,
      slug: 'campus-france-etudes-en-france-eiffel-scholarship-2026',
      kind: 'scholarship_foreign',
      title: 'Tuyển sinh Đại học & Học bổng Xuất sắc Eiffel Pháp (Campus France 2026)',
      organization: 'Campus France & Bộ Ngoại giao Pháp',
      organizationType: 'government',
      summary: 'Quy trình Études en France chính thức ứng tuyển vào các trường Đại học Công lập Pháp (miễn học phí tới 95%) cùng Học bổng Eiffel danh giá.',
      requirements: JSON.stringify({
        gpa_min: 3.0,
        language: 'DELF B2 / TCF 400+ (tiếng Pháp) hoặc IELTS 6.5+ (chương trình tiếng Anh)',
      }),
      fieldCodes: JSON.stringify(['ENGINEERING', 'ECON', 'LAW', 'SCIENCE']),
      degreeLevel: JSON.stringify(['bachelor', 'master', 'phd']),
      studyLocation: 'Pháp (France)',
      fundingType: 'full',
      fundingValueVnd: 850000000,
      deadline: new Date('2026-12-15T23:59:59Z'),
      canonicalUrl: 'https://www.vietnam.campusfrance.org',
      rankScore: 94,
      confidence: 0.96,
      status: 'published',
      requiredDocuments: JSON.stringify([
        { name: 'Bằng tốt nghiệp & Bảng điểm dịch thuật công chứng tiếng Pháp/Anh', format_hint: 'PDF scan' },
        { name: 'Chứng chỉ ngoại ngữ (DELF/DALF hoặc IELTS)', format_hint: 'Bản gốc scan' },
        { name: 'Thư động lực (Lettre de motivation)', format_hint: '1 trang A4' },
      ]),
      applicationSteps: JSON.stringify([
        { order: 1, title: 'Khai báo hồ sơ trực tuyến', description: 'Tại cổng pastel.diplomatie.gouv.fr' },
        { order: 2, title: 'Phỏng vấn chuyên môn với Campus France Vietnam', description: 'Đánh giá năng lực và động lực học tập' },
        { order: 3, title: 'Nhận thư mời nhập học & Xin thị thực du học', description: 'Xác nhận trường công lập' },
      ]),
      benefits: JSON.stringify([
        { label: 'Trợ cấp Eiffel', value: '1.181 EUR - 1.700 EUR / tháng' },
        { label: 'Học phí tại Pháp', value: 'Chính phủ Pháp trợ cấp gần 95% học phí tại các trường công' },
      ]),
    },
  ];

  for (const opp of newOpportunities) {
    const existing = await prisma.opportunity.findUnique({
      where: { slug: opp.slug },
    });

    if (existing) {
      await prisma.opportunity.update({
        where: { id: existing.id },
        data: opp,
      });
      console.log(`Updated opportunity: ${opp.slug}`);
    } else {
      await prisma.opportunity.create({
        data: opp,
      });
      console.log(`Created opportunity: ${opp.slug}`);
    }
  }

  const finalSourceCount = await prisma.source.count();
  const finalOppCount = await prisma.opportunity.count();
  console.log(`\nSynchronization Complete!`);
  console.log(`Total Sources in DB: ${finalSourceCount}`);
  console.log(`Total Opportunities in DB: ${finalOppCount}`);
}

main()
  .catch((e) => {
    console.error('Error during sync:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
