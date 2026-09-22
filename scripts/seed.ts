process.env.DATABASE_URL = 'file:./prisma/dev.db';

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function removeVietnameseTones(str: string): string {
  if (!str) return '';
  let result = str.toLowerCase();
  result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  result = result.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  result = result.replace(/đ/g, 'd');
  return result;
}

function cleanSlug(text: string): string {
  const withoutTones = removeVietnameseTones(text);
  return withoutTones
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  console.log('Bắt đầu làm mới và seed dữ liệu chuẩn sạch...');

  // Xóa các cơ hội cũ để tránh trùng lặp hoặc slug hỏng
  await prisma.historicalBenchmark.deleteMany({});
  await prisma.opportunityVersion.deleteMany({});
  await prisma.applicationTracker.deleteMany({});
  await prisma.opportunity.deleteMany({});
  console.log('Đã dọn dẹp các bản ghi cũ.');

  // 1. Tạo tài khoản Admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hocbong.vn';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Quản trị viên Hệ thống',
      passwordHash: hashedPassword,
      role: 'admin',
    },
  });
  console.log('Tài khoản admin: ' + admin.email);

  // 2. Tạo Sources
  const sourceList = [
    { name: 'Đại học Bách khoa Hà Nội', url: 'https://hust.edu.vn', tier: 'A', trust: 0.98 },
    { name: 'Đại học Quốc gia Hà Nội', url: 'https://vnu.edu.vn', tier: 'A', trust: 0.98 },
    { name: 'Đại học Ngoại thương', url: 'https://ftu.edu.vn', tier: 'A', trust: 0.95 },
    { name: 'Đại học Kinh tế Quốc dân', url: 'https://neu.edu.vn', tier: 'A', trust: 0.95 },
    { name: 'Đại học Quốc gia TP.HCM', url: 'https://vnuhcm.edu.vn', tier: 'A', trust: 0.98 },
    { name: 'Đại học Bách khoa TP.HCM', url: 'https://hcmut.edu.vn', tier: 'A', trust: 0.95 },
    { name: 'Đại học Y Hà Nội', url: 'https://hmu.edu.vn', tier: 'A', trust: 0.95 },
    { name: 'Đại học FPT', url: 'https://fpt.edu.vn', tier: 'B', trust: 0.90 },
    { name: 'Đại học RMIT Việt Nam', url: 'https://rmit.edu.vn', tier: 'B', trust: 0.92 },
    { name: 'Đại học Fulbright Việt Nam', url: 'https://fulbright.edu.vn', tier: 'B', trust: 0.92 },
    { name: 'Đại học VinUni', url: 'https://vinuni.edu.vn', tier: 'B', trust: 0.92 },
    { name: 'Đại sứ quán Anh (Chevening)', url: 'https://chevening.org', tier: 'A', trust: 0.99 },
    { name: 'Đại sứ quán Mỹ (Fulbright)', url: 'https://usembassy.gov', tier: 'A', trust: 0.99 },
    { name: 'Cơ quan Trao đổi Hàn Quốc (GKS)', url: 'https://studyinkorea.go.kr', tier: 'A', trust: 0.98 },
    { name: 'Chính phủ Nhật Bản (MEXT)', url: 'https://mext.go.jp', tier: 'A', trust: 0.98 },
    { name: 'Quỹ Học bổng VinGroup', url: 'https://vinuni.edu.vn/vingroup-scholarship', tier: 'A', trust: 0.95 },
    { name: 'Tập đoàn Viettel', url: 'https://viettel.vn', tier: 'B', trust: 0.90 },
    { name: 'Tập đoàn Samsung Việt Nam', url: 'https://samsung.com/vn', tier: 'B', trust: 0.90 },
    { name: 'Đại học Đà Nẵng', url: 'https://udn.vn', tier: 'B', trust: 0.88 },
    { name: 'Đại học Cần Thơ', url: 'https://ctu.edu.vn', tier: 'B', trust: 0.88 },
  ];

  const sources = [];
  for (const s of sourceList) {
    const src = await prisma.source.upsert({
      where: { baseUrl: s.url },
      update: {},
      create: {
        name: s.name,
        baseUrl: s.url,
        kind: s.name.includes('Đại học') ? 'university' : s.name.includes('sứ quán') ? 'embassy' : 'company',
        tier: s.tier,
        trustScore: s.trust,
        isActive: true,
      },
    });
    sources.push(src);
  }
  console.log(`Đã tạo ${sources.length} sources.`);

  // 3. Tạo Templates lộ trình
  const templates = [
    { documentType: 'ielts', leadWeeks: 10, defaultPrompt: 'Đăng ký thi và ôn luyện nước rút IELTS/TOEFL.' },
    { documentType: 'recommendation_letter', leadWeeks: 6, defaultPrompt: 'Liên hệ người hướng dẫn xin thư giới thiệu.' },
    { documentType: 'essay', leadWeeks: 4, defaultPrompt: 'Hoàn thiện bản nháp bài luận cá nhân SOP.' },
    { documentType: 'transcript', leadWeeks: 3, defaultPrompt: 'Dịch thuật công chứng bảng điểm học tập.' },
  ];
  for (const t of templates) {
    await prisma.documentPrepTemplate.upsert({
      where: { documentType: t.documentType },
      update: t,
      create: t,
    });
  }

  // 4. Danh sách các cơ hội thực tế
  const oppSeedData = [
    {
      title: 'Học bổng Toàn phần Chevening Vương quốc Anh 2026-2027',
      org: 'Đại sứ quán Anh (Chevening)',
      kind: 'scholarship_foreign',
      fundingType: 'full',
      fundingValueVnd: 850000000,
      studyLocation: 'Vương quốc Anh',
      degreeLevel: ['master'],
      fieldCodes: ['7340101', '7480201', '7310101'],
      deadline: '2026-11-05T23:59:59Z',
      summary: 'Chevening là chương trình học bổng toàn phần danh giá nhất của Chính phủ Anh dành cho các nhà lãnh đạo tương lai theo học thạc sĩ 1 năm tại bất kỳ trường đại học nào của Vương quốc Anh.',
      requirements: { gpa_min: 3.2, ielts: 6.5, work_experience_years: 2, leadership_evidence: 'Bắt buộc' },
      requiredDocuments: [
        { name: 'Bảng điểm cử nhân dịch công chứng', format_hint: 'PDF dưới 5MB', evidence_quote: 'Bảng điểm chính thức đại học dịch sang tiếng Anh.' },
        { name: '02 Thư giới thiệu học thuật & công việc', format_hint: 'PDF có chữ ký và email người giới thiệu', evidence_quote: '02 thư giới thiệu bằng tiếng Anh.' },
        { name: '04 Bài luận Chevening (Lãnh đạo, Mạng lưới, Kế hoạch học tập, Nghề nghiệp)', format_hint: 'Mỗi bài tối đa 500 từ', evidence_quote: 'Bốn bài luận trả lời các câu hỏi chủ đề bắt buộc.' },
      ],
      applicationSteps: [
        { order: 1, title: 'Nộp hồ sơ trực tuyến trên cổng Chevening OAS', description: 'Điền thông tin và nộp 4 bài luận trước hạn chót tháng 11.', evidence_quote: 'Hạn cuối ngày 05/11.' },
        { order: 2, title: 'Vòng phỏng vấn tại Đại sứ quán Anh Hà Nội / Tổng lãnh sự quán TP.HCM', description: 'Phỏng vấn bằng tiếng Anh với hội đồng tuyển sinh.', evidence_quote: 'Dự kiến tháng 3-4/2027.' },
        { order: 3, title: 'Công bố kết quả và nhận visa du học', description: 'Nhận thư mời học không điều kiện từ trường đại học Anh.', evidence_quote: 'Tháng 6/2027.' },
      ],
      timelineMilestones: [
        { label: 'Mở cổng nộp hồ sơ OAS', date: '2026-08-05T00:00:00Z', is_estimated: false, evidence_quote: 'Cổng mở đầu tháng 8.' },
        { label: 'Hạn chót nộp đơn chính thức', date: '2026-11-05T12:00:00Z', is_estimated: false, evidence_quote: 'Hạn chót trưa ngày 05/11 giờ GMT.' },
        { label: 'Thông báo danh sách phỏng vấn', date: '2027-02-15T00:00:00Z', is_estimated: true, evidence_quote: 'Thông báo qua email.' },
        { label: 'Công bố trúng tuyển', date: '2027-06-10T00:00:00Z', is_estimated: true, evidence_quote: 'Kết quả cuối cùng.' },
      ],
      benefits: [
        { label: 'Toàn bộ học phí thạc sĩ 1 năm', value: '100% học phí', evidence_quote: 'Chi trả toàn bộ học phí khóa học.' },
        { label: 'Sinh hoạt phí hàng tháng', value: 'Khoảng £1,300 - £1,600/tháng', evidence_quote: 'Đủ trang trải chi phí sinh hoạt tại Anh.' },
        { label: 'Vé máy bay khứ hồi Việt Nam - Anh', value: 'Vé hạng phổ thông 2 chiều', evidence_quote: 'Cấp vé bay khứ hồi.' },
        { label: 'Lệ phí visa và phụ phí y tế NHS', value: '100% chi phí', evidence_quote: 'Miễn phí visa và bảo hiểm y tế.' },
      ],
      faq: [
        { question: 'Có cần có chứng chỉ IELTS khi nộp đơn không?', answer: 'Từ kỳ tuyển sinh 2026, Chevening không yêu cầu chứng chỉ tiếng Anh ở thời điểm nộp đơn, nhưng thí sinh phải đáp ứng yêu cầu của trường đại học trước tháng 7.', evidence_quote: 'English language requirement lifted by Chevening.' },
        { question: 'Cam kết trở về Việt Nam sau khi tốt nghiệp thế nào?', answer: 'Ứng viên nhận học bổng phải cam kết trở về Việt Nam ít nhất 2 năm sau khi hoàn thành khóa học tại Anh.', evidence_quote: 'Return to country of citizenship for a minimum of two years.' },
      ],
    },
    {
      title: 'Tuyển sinh Đại học Chính quy năm 2026 - Đại học Bách khoa Hà Nội',
      org: 'Đại học Bách khoa Hà Nội',
      kind: 'undergraduate',
      fundingType: 'tuition',
      fundingValueVnd: 35000000,
      studyLocation: 'Hà Nội',
      degreeLevel: ['bachelor'],
      fieldCodes: ['7480201', '7480101', '7520216', '7520103'],
      deadline: '2026-07-20T23:59:59Z',
      summary: 'Trường Đại học Bách khoa Hà Nội tuyển sinh đại học chính quy với 3 phương thức: Xét tuyển tài năng (XTTN), Xét tuyển dựa trên kết quả thi Đánh giá tư duy (ĐGTD), và Xét tuyển điểm thi tốt nghiệp THPT.',
      requirements: { gpa_min: 3.2, dgtd_score_min: 50, special_criteria: 'Xét tuyển theo chỉ tiêu từng ngành và tổ hợp xét tuyển.' },
      requiredDocuments: [
        { name: 'Bản sao học bạ THPT có công chứng', format_hint: 'PDF bản scan rõ nét', evidence_quote: 'Bản sao học bạ 6 học kỳ THPT.' },
        { name: 'Chứng nhận kết quả thi Đánh giá tư duy (ĐGTD)', format_hint: 'Tra cứu trực tuyến trên hệ thống trường', evidence_quote: 'Điểm bài thi tư duy năm 2026.' },
      ],
      applicationSteps: [
        { order: 1, title: 'Đăng ký hồ sơ xét tuyển trên cổng tuyển sinh Bách khoa', description: 'Thí sinh đăng ký nguyện vọng và tải minh chứng.', evidence_quote: 'Mở từ tháng 4.' },
        { order: 2, title: 'Xác nhận nhập học trực tuyến trên cổng Bộ GD&ĐT', description: 'Thí sinh trúng tuyển xác nhận nhập học chính thức.', evidence_quote: 'Trước 17h00 ngày 20/08.' },
      ],
      timelineMilestones: [
        { label: 'Mở đăng ký xét tuyển tài năng', date: '2026-04-01T00:00:00Z', is_estimated: false, evidence_quote: 'Theo kế hoạch tuyển sinh.' },
        { label: 'Hạn đăng ký xét tuyển đợt 1', date: '2026-07-20T17:00:00Z', is_estimated: false, evidence_quote: 'Đóng cổng nộp nguyện vọng.' },
        { label: 'Công bố điểm chuẩn trúng tuyển', date: '2026-08-15T00:00:00Z', is_estimated: true, evidence_quote: 'Công bố cùng lịch Bộ GD&ĐT.' },
      ],
      benefits: [
        { label: 'Học bổng khuyến khích học tập tài năng', value: '100% - 150% học phí', evidence_quote: 'Dành cho thủ khoa và thí sinh xuất sắc.' },
        { label: 'Hỗ trợ ký túc xá sinh viên', value: 'Ưu tiên phòng ký túc xá chất lượng cao', evidence_quote: 'Dành cho sinh viên ngoại tỉnh.' },
      ],
      faq: [
        { question: 'Có thể sử dụng cả điểm thi ĐGTD và điểm thi tốt nghiệp THPT không?', answer: 'Có, thí sinh có thể đăng ký nhiều phương thức xét tuyển khác nhau để tối đa hóa cơ hội trúng tuyển.', evidence_quote: 'Các phương thức xét tuyển độc lập với nhau.' },
      ],
      benchmarks: [
        { year: 2023, benchmarkScore: 28.29, applicantCount: 3200, quota: 300 },
        { year: 2024, benchmarkScore: 28.65, applicantCount: 3600, quota: 320 },
        { year: 2025, benchmarkScore: 28.92, applicantCount: 4100, quota: 320 },
      ],
    },
    {
      title: 'Học bổng Chính phủ Hàn Quốc Global Korea Scholarship (GKS) 2026',
      org: 'Cơ quan Trao đổi Hàn Quốc (GKS)',
      kind: 'scholarship_foreign',
      fundingType: 'full',
      fundingValueVnd: 720000000,
      studyLocation: 'Hàn Quốc',
      degreeLevel: ['master', 'phd'],
      fieldCodes: ['7480201', '7220210', '7340101'],
      deadline: '2026-09-30T23:59:59Z',
      summary: 'Học bổng GKS của Chính phủ Hàn Quốc mang đến cơ hội học tập toàn diện tại các đại học hàng đầu xứ sở kim chi với 100% học phí, sinh hoạt phí và 1 năm học tiếng Hàn miễn phí.',
      requirements: { gpa_min: 3.2, age_limit: 40, top_percentage_min: 80 },
      requiredDocuments: [
        { name: 'Đơn đăng ký GKS mẫu chính thức', format_hint: 'Bản gốc tiếng Anh', evidence_quote: 'Mẫu Form 1-8 theo quy định của NIIED.' },
        { name: 'Kế hoạch học tập và Bài tự giới thiệu', format_hint: 'Viết bằng tiếng Anh hoặc tiếng Hàn', evidence_quote: 'Study Plan & Personal Statement.' },
      ],
      applicationSteps: [
        { order: 1, title: 'Nộp hồ sơ qua Đại sứ quán Hàn Quốc tại Hà Nội', description: 'Vòng sơ loại hồ sơ Embassy Track.', evidence_quote: 'Hạn cuối tháng 9.' },
        { order: 2, title: 'Phỏng vấn tại Đại sứ quán', description: 'Phỏng vấn ứng viên đạt sơ tuyển.', evidence_quote: 'Dự kiến tháng 10.' },
        { order: 3, title: 'Xét duyệt vòng 2 bởi NIIED Hàn Quốc', description: 'Hội đồng xét tuyển quốc gia phê duyệt.', evidence_quote: 'Tháng 11.' },
      ],
      timelineMilestones: [
        { label: 'Công bố thông báo tuyển sinh', date: '2026-08-10T00:00:00Z', is_estimated: false, evidence_quote: 'Đăng tải trên website ĐSQ.' },
        { label: 'Hạn chót nhận hồ sơ giấy tại ĐSQ', date: '2026-09-30T17:00:00Z', is_estimated: false, evidence_quote: 'Không nhận hồ sơ gửi muộn.' },
      ],
      benefits: [
        { label: 'Học phí 100% toàn khóa học', value: '100% học phí', evidence_quote: 'Miễn phí khóa học tiếng và chuyên ngành.' },
        { label: 'Sinh hoạt phí hàng tháng', value: '1,000,000 KRW/tháng (~18 triệu VND)', evidence_quote: 'Cấp đều đặn mỗi tháng.' },
        { label: 'Bảo hiểm y tế quốc tế', value: 'Trọn gói', evidence_quote: 'Bảo hiểm sinh viên tại Hàn Quốc.' },
      ],
      faq: [
        { question: 'Chưa biết tiếng Hàn có nộp được không?', answer: 'Có, học bổng đài thọ 1 năm học tiếng Hàn chuyên sâu trước khi vào học khóa chuyên ngành.', evidence_quote: '1 year Korean language training included.' },
      ],
    },
    {
      title: 'Học bổng Tài năng Khoa học Công nghệ VinGroup 2026',
      org: 'Quỹ Học bổng VinGroup',
      kind: 'scholarship_corporate',
      fundingType: 'full',
      fundingValueVnd: 500000000,
      studyLocation: 'Hà Nội',
      degreeLevel: ['master', 'phd'],
      fieldCodes: ['7480101', '7480201', '7520216'],
      deadline: '2026-10-25T23:59:59Z',
      summary: 'Chương trình Học bổng Đào tạo Thạc sĩ, Tiến sĩ Khoa học Công nghệ do Tập đoàn Vingroup tài trợ nhằm đào tạo nguồn nhân lực tinh hoa cho Việt Nam.',
      requirements: { gpa_min: 3.2, ielts: 6.5, research_interest: 'AI, Khoa học dữ liệu, Tự động hóa' },
      requiredDocuments: [
        { name: 'Đề cương nghiên cứu khoa học (Research Proposal)', format_hint: 'PDF tiếng Anh từ 3-5 trang', evidence_quote: 'Đề cương nghiên cứu chi tiết.' },
      ],
      applicationSteps: [
        { order: 1, title: 'Nộp hồ sơ trực tuyến', description: 'Đăng ký trên website VinGroup Scholarship.', evidence_quote: 'Đến hết ngày 25/10.' },
        { order: 2, title: 'Hội đồng chuyên môn phỏng vấn', description: 'Các giáo sư đầu ngành phỏng vấn đánh giá năng lực nghiên cứu.', evidence_quote: 'Tháng 11.' },
      ],
      timelineMilestones: [
        { label: 'Mở nhận hồ sơ', date: '2026-06-01T00:00:00Z', is_estimated: false, evidence_quote: 'Mở đơn thường niên.' },
        { label: 'Hạn cuối nộp hồ sơ', date: '2026-10-25T23:59:59Z', is_estimated: false, evidence_quote: 'Đóng đơn lúc 23:59.' },
      ],
      benefits: [
        { label: '100% học phí và sinh hoạt phí', value: 'Lên tới 500 triệu đồng', evidence_quote: 'Toàn phần chi phí học tập và nghiên cứu.' },
      ],
      faq: [
        { question: 'Có ràng buộc làm việc tại VinGroup sau tốt nghiệp không?', answer: 'Ứng viên cam kết đóng góp cho các cơ sở nghiên cứu hoặc trường đại học tại Việt Nam tối thiểu 3 năm.', evidence_quote: 'Cam kết làm việc tại các trường ĐH hoặc viện nghiên cứu VN.' },
      ],
    },
    {
      title: 'Học bổng Thủ khoa & Xuất sắc Đại học Ngoại thương 2026',
      org: 'Đại học Ngoại thương',
      kind: 'scholarship_domestic',
      fundingType: 'full',
      fundingValueVnd: 60000000,
      studyLocation: 'Hà Nội',
      degreeLevel: ['bachelor'],
      fieldCodes: ['7340120', '7340101', '7340201'],
      deadline: '2026-08-30T23:59:59Z',
      summary: 'Đại học Ngoại thương trao các suất học bổng danh giá dành cho tân sinh viên thủ khoa, á khoa và sinh viên đạt giải quốc gia/quốc tế trong kỳ tuyển sinh đại học 2026.',
      requirements: { gpa_min: 3.5, ielts: 7.0, national_prize: 'Khuyến khích đạt giải HSG Quốc gia' },
      requiredDocuments: [
        { name: 'Giấy chứng nhận kết quả thi và giải thưởng quốc gia', format_hint: 'Bản scan có công chứng', evidence_quote: 'Chứng nhận giải HSG quốc gia.' },
      ],
      applicationSteps: [
        { order: 1, title: 'Nộp đơn xét học bổng khi làm thủ tục nhập học', description: 'Đăng ký tại phòng Quản lý đào tạo FTU.', evidence_quote: 'Khi nhập học.' },
      ],
      timelineMilestones: [
        { label: 'Hạn chót xét duyệt', date: '2026-08-30T17:00:00Z', is_estimated: false, evidence_quote: 'Hạn xét duyệt đợt 1.' },
      ],
      benefits: [
        { label: 'Học bổng toàn phần 100% học phí', value: '100% học phí năm thứ nhất', evidence_quote: 'Miễn phí học phí năm học đầu tiên.' },
      ],
      faq: [
        { question: 'Học bổng có được duy trì cho các năm sau không?', answer: 'Có, nếu sinh viên duy trì điểm GPA từ 3.2 trở lên và điểm rèn luyện loại Xuất sắc.', evidence_quote: 'Xét duy trì hàng năm.' },
      ],
      benchmarks: [
        { year: 2023, benchmarkScore: 28.1, applicantCount: 2800, quota: 250 },
        { year: 2024, benchmarkScore: 28.4, applicantCount: 3100, quota: 250 },
        { year: 2025, benchmarkScore: 28.7, applicantCount: 3400, quota: 250 },
      ],
    },
  ];

  // Bổ sung thêm các cơ hội đại học & học bổng phong phú để đủ 50+ mục
  const kindsPool = ['undergraduate', 'graduate', 'scholarship_domestic', 'scholarship_foreign', 'scholarship_corporate'];
  const locationsPool = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Nhật Bản', 'Hàn Quốc', 'Úc', 'Mỹ'];

  let count = 0;
  for (const item of oppSeedData) {
    count++;
    const slug = cleanSlug(item.title);
    const src = sources.find((s) => s.name === item.org) || sources[0];

    const opp = await prisma.opportunity.upsert({
      where: { slug },
      update: {},
      create: {
        title: item.title,
        slug,
        organization: item.org,
        kind: item.kind,
        status: 'published',
        summary: item.summary,
        requirements: JSON.stringify(item.requirements),
        fundingType: item.fundingType,
        fundingValueVnd: item.fundingValueVnd,
        studyLocation: item.studyLocation,
        deadline: new Date(item.deadline),
        fieldCodes: JSON.stringify(item.fieldCodes),
        degreeLevel: JSON.stringify(item.degreeLevel),
        rankScore: 92 + count,
        confidence: 0.98,
        canonicalUrl: src.baseUrl,
        sourceId: src.id,
        requiredDocuments: JSON.stringify(item.requiredDocuments),
        applicationSteps: JSON.stringify(item.applicationSteps),
        timelineMilestones: JSON.stringify(item.timelineMilestones),
        benefits: JSON.stringify(item.benefits),
        faq: JSON.stringify(item.faq),
        contact: JSON.stringify({ email: 'contact@' + cleanSlug(item.org) + '.vn', phone: '024.3869.0000', office_hours: 'Thứ 2 - Thứ 6' }),
        selectionRounds: item.applicationSteps.length,
      },
    });

    // Thêm benchmark nếu có
    if (item.benchmarks) {
      for (const b of item.benchmarks) {
        await prisma.historicalBenchmark.upsert({
          where: {
            opportunityRef_year: {
              opportunityRef: opp.slug,
              year: b.year,
            },
          },
          update: {},
          create: {
            opportunityRef: opp.slug,
            year: b.year,
            benchmarkScore: b.benchmarkScore,
            applicantCount: b.applicantCount,
            quota: b.quota,
            sourceUrl: src.baseUrl,
          },
        });
      }
    }
  }

  // Thêm 45 cơ hội khác để có tổng cộng 50+ cơ hội chuẩn
  for (let i = 1; i <= 45; i++) {
    const src = sources[i % sources.length];
    const kind = kindsPool[i % kindsPool.length];
    const loc = locationsPool[i % locationsPool.length];
    const isSchol = kind.includes('scholarship');
    const title = `${isSchol ? 'Học bổng Tài năng' : 'Chương trình Tuyển sinh'} ${src.name} Khóa ${2026 + (i % 2)} (Đợt ${i})`;
    const slug = cleanSlug(`${title}-${i}`);
    const deadline = new Date(`2026-10-${String((i % 28) + 1).padStart(2, '0')}T23:59:59Z`);

    const opp = await prisma.opportunity.upsert({
      where: { slug },
      update: {},
      create: {
        title,
        slug,
        organization: src.name,
        kind,
        status: 'published',
        summary: `Chương trình ${title} do ${src.name} tổ chức với mục tiêu tìm kiếm và bồi dưỡng các cá nhân có năng lực học tập và nghiên cứu xuất sắc. Thí sinh được hưởng chính sách tài trợ theo quy chế tuyển sinh chính thức.`,
        requirements: JSON.stringify({
          gpa_min: +(2.8 + (i % 8) * 0.1).toFixed(1),
          ielts: +(6.0 + (i % 3) * 0.5).toFixed(1),
          special_notes: 'Thí sinh nộp hồ sơ trực tuyến theo hướng dẫn của nhà trường.',
        }),
        fundingType: i % 2 === 0 ? 'full' : 'partial',
        fundingValueVnd: 40000000 + i * 10000000,
        studyLocation: loc,
        deadline,
        fieldCodes: JSON.stringify(['7480201', '7340101', '7310101']),
        degreeLevel: JSON.stringify(i % 3 === 0 ? ['master'] : ['bachelor']),
        rankScore: 80 + (i % 18),
        confidence: 0.95,
        canonicalUrl: src.baseUrl,
        sourceId: src.id,
        requiredDocuments: JSON.stringify([
          { name: 'Bảng điểm các năm học gần nhất', format_hint: 'Bản scan màu PDF', evidence_quote: 'Bảng điểm chính thức có xác nhận.' },
          { name: 'Chứng chỉ ngoại ngữ hợp lệ', format_hint: 'IELTS / TOEFL / TOEIC', evidence_quote: 'Chứng chỉ còn thời hạn 2 năm.' },
          { name: 'Sơ yếu lý lịch khoa học & Bài luận nguyện vọng', format_hint: 'PDF tối đa 3 trang', evidence_quote: 'Mô tả kinh nghiệm và mục tiêu học tập.' },
        ]),
        applicationSteps: JSON.stringify([
          { order: 1, title: 'Vòng sơ tuyển hồ sơ năng lực', description: 'Đánh giá điều kiện học lực GPA và ngoại ngữ.', evidence_quote: 'Hội đồng chấm sơ tuyển.' },
          { order: 2, title: 'Vòng phỏng vấn chuyên sâu', description: 'Đánh giá tư duy phản biện và động lực học tập.', evidence_quote: 'Phỏng vấn trực tiếp.' },
        ]),
        timelineMilestones: JSON.stringify([
          { label: 'Mở nhận hồ sơ trực tuyến', date: '2026-03-15T00:00:00Z', is_estimated: false, evidence_quote: 'Mở cổng nộp đơn.' },
          { label: 'Hạn chót nhận hồ sơ', date: deadline.toISOString(), is_estimated: false, evidence_quote: 'Đóng cổng nộp đơn.' },
          { label: 'Công bố kết quả trúng tuyển', date: '2026-11-20T00:00:00Z', is_estimated: true, evidence_quote: 'Thông báo qua email.' },
        ]),
        benefits: JSON.stringify([
          { label: 'Tài trợ học phí', value: i % 2 === 0 ? '100% học phí' : '50% học phí', evidence_quote: 'Theo quyết định cấp học bổng.' },
          { label: 'Hỗ trợ sinh hoạt phí', value: '8.000.000 đ - 12.000.000 đ/tháng', evidence_quote: 'Cấp định kỳ theo kỳ học.' },
        ]),
        faq: JSON.stringify([
          { question: 'Có được nộp hồ sơ nhiều ngành cùng lúc không?', answer: 'Thí sinh được đăng ký tối đa 3 nguyện vọng theo thứ tự ưu tiên.', evidence_quote: 'Quy chế tuyển sinh điều 5.' },
          { question: 'Bao lâu sau khi nộp đơn thì nhận được kết quả?', answer: 'Kết quả sơ loại sẽ được thông báo sau 10 ngày làm việc kể từ ngày hết hạn nộp đơn.', evidence_quote: 'Quy trình xét duyệt chuẩn.' },
        ]),
        contact: JSON.stringify({ email: `tuyensinh@${cleanSlug(src.name)}.edu.vn`, phone: '024.3869.4242', office_hours: 'Giờ hành chính' }),
        selectionRounds: 2,
      },
    });

    // Thêm benchmark lịch sử 3 năm cho các trường lớn
    if (i <= 10) {
      for (const yr of [2023, 2024, 2025]) {
        await prisma.historicalBenchmark.upsert({
          where: {
            opportunityRef_year: {
              opportunityRef: opp.slug,
              year: yr,
            },
          },
          update: {},
          create: {
            opportunityRef: opp.slug,
            year: yr,
            benchmarkScore: +(24.5 + (i % 4) * 0.8 + (yr - 2023) * 0.3).toFixed(2),
            applicantCount: 1200 + yr * 2 + i * 50,
            quota: 180 + i * 10,
            sourceUrl: src.baseUrl,
          },
        });
      }
    }
  }

  const finalCount = await prisma.opportunity.count();
  console.log(`Đã seed thành công ${finalCount} cơ hội học bổng & tuyển sinh với slug chuẩn, không còn bản ghi rác!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
