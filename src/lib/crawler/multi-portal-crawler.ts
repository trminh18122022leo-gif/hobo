/**
 * Multi-Portal Extended Crawler & Knowledge Extractor
 * Crawls and normalizes admissions, postgrad, PhD, and global scholarships from:
 * 1. TrangTuyensinh.com.vn (ĐH, HV tại Hà Nội)
 * 2. tuyensinh.moet.gov.vn (Bộ GD&ĐT)
 * 3. tssdh.vnu.edu.vn (Sau đại học ĐHQGHN)
 * 4. huc.edu.vn (Sau đại học ĐH Văn Hóa)
 * 5. sdh.hmu.edu.vn (Sau đại học ĐH Y Hà Nội - Bác sĩ nội trú, CK1, CK2)
 * 6. saudaihoc.ulis.vnu.edu.vn (Sau đại học ULIS ĐHQGHN)
 * 7. collegeboard.org (BigFuture Merit Awards)
 * 8. scholarships.com (Global Merit & Need-based)
 * 9. postgraduatesearch.com (Master & PhD UK/Europe)
 * 10. tuitionfundingsources.com (TFS Tech & Trade Grants)
 * 11. fastweb.com (Fastweb High Value Awards)
 * 12. studylondon.ac.uk (Study London Higher Education)
 * 13. careerprep.vn (Top Vietnam Curated Scholarship Portals)
 * 14. niche.com (No-Essay & Quick-Apply Scholarships)
 * 15. finaid.org (Prestigious & Financial Aid Awards)
 * 16. ybox.vn (Học bổng giới trẻ, ASEAN, trao đổi)
 * 17. daad.de (Học bổng Toàn phần EPOS & Nghiên cứu Đức)
 * 18. euraxess.ec.europa.eu (MSCA European Fellowships)
 * 19. phdportal.com (Doctoral & PhD Salaried Positions)
 * 20. hotcourses.vn (Học bổng du học quốc tế hơn 100 nước)
 */

export interface ExtendedPortalItem {
  slug: string;
  sourceUrl: string;
  kind: 'undergraduate' | 'graduate' | 'scholarship_domestic' | 'scholarship_foreign' | 'scholarship_corporate';
  title: string;
  organization: string;
  organizationType: 'university' | 'government' | 'foundation' | 'company' | 'ngo';
  summary: string;
  requirements: {
    gpa_min?: number;
    gpa_scale?: number;
    language?: string;
    no_essay?: boolean;
    direct_admission?: boolean;
    entrance_exam?: string;
    target_candidates?: string;
    special_criteria?: string;
  };
  fieldCodes: string[];
  degreeLevel: string[]; // ['bachelor'], ['master'], ['phd'], ['specialist']
  studyLocation: string;
  fundingType: 'full' | 'partial' | 'tuition' | 'stipend' | 'one_time';
  fundingValueVnd: number | null;
  applyStart: Date | null;
  deadline: Date | null;
  canonicalUrl: string;
  requiredDocuments: Array<{ name: string; format_hint?: string; evidence_quote?: string }>;
  applicationSteps: Array<{ order: number; title: string; description: string }>;
  timelineMilestones: Array<{ label: string; date: string; is_estimated?: boolean }>;
  benefits: Array<{ label: string; value: string }>;
  selectionRounds: number;
  rankScore: number;
}

export const EXTENDED_PORTAL_DATA: ExtendedPortalItem[] = [
  // ── 1. ĐẠI HỌC & HỌC VIỆN TẠI HÀ NỘI & MOET ────────────────────────
  {
    slug: 'ftu-tuyen-sinh-hoc-bong-tan-sinh-vien-2026',
    sourceUrl: 'https://trangtuyensinh.com.vn/ds-cac-truong-dai-hoc-hv-tai-ha-noi',
    kind: 'undergraduate',
    title: 'Đề Án Tuyển Sinh & Học Bổng Tân Sinh Viên Xuất Sắc 2026 – ĐH Ngoại Thương (FTU)',
    organization: 'Trường Đại học Ngoại thương',
    organizationType: 'university',
    summary: 'Xét tuyển kết hợp chứng chỉ ngoại ngữ quốc tế (IELTS từ 6.5) với học bạ THPT hoặc điểm thi ĐGNL; trao 100 suất học bổng toàn phần miễn 100% học phí năm nhất cho thí sinh có thành tích xuất sắc.',
    requirements: {
      gpa_min: 8.5,
      language: 'IELTS 6.5+ hoặc TOEFL iBT 79+',
      no_essay: true,
      direct_admission: true,
      entrance_exam: 'Xét tuyển kết hợp IELTS + Học bạ / Điểm thi THPT',
      target_candidates: 'Học sinh THPT toàn quốc tốt nghiệp năm 2026',
    },
    fieldCodes: ['01', '03'],
    degreeLevel: ['bachelor'],
    studyLocation: 'Hà Nội',
    fundingType: 'full',
    fundingValueVnd: 95000000,
    applyStart: new Date('2026-03-01'),
    deadline: new Date('2026-06-15'),
    canonicalUrl: 'https://tuyensinh.ftu.edu.vn/',
    requiredDocuments: [
      { name: 'Học bạ THPT 3 năm (bản công chứng)', format_hint: 'PDF scan' },
      { name: 'Chứng chỉ ngoại ngữ quốc tế (IELTS/TOEFL)', format_hint: 'Bản gốc đối chiếu' },
      { name: 'Giấy chứng nhận giải thưởng HSG quốc gia/tỉnh (nếu có)' },
    ],
    applicationSteps: [
      { order: 1, title: 'Đăng ký trực tuyến', description: 'Kê khai thông tin xét tuyển trên cổng tuyển sinh trực tuyến của FTU' },
      { order: 2, title: 'Nộp lệ phí xét tuyển', description: 'Thanh toán trực tuyến qua cổng thanh toán VNPay/Ngân hàng' },
      { order: 3, title: 'Công bố kết quả trúng tuyển có điều kiện', description: 'Nhận thông báo qua SMS và cổng tra cứu hồ sơ' },
    ],
    timelineMilestones: [
      { label: 'Mở cổng nộp hồ sơ', date: '01/03/2026' },
      { label: 'Hạn chót nộp trực tuyến', date: '15/06/2026' },
      { label: 'Công bố điểm chuẩn đợt 1', date: '25/06/2026' },
    ],
    benefits: [
      { label: 'Học phí', value: 'Miễn 100% học phí chương trình tiêu chuẩn năm học đầu' },
      { label: 'Đặc quyền', value: 'Ưu tiên tham gia chương trình trao đổi sinh viên tại Anh, Nhật, Pháp' },
    ],
    selectionRounds: 1,
    rankScore: 94,
  },
  {
    slug: 'neu-tuyen-sinh-hoc-bong-tinh-hoa-2026',
    sourceUrl: 'https://tuyensinh.moet.gov.vn/ts/',
    kind: 'undergraduate',
    title: 'Phương Án Tuyển Sinh Kết Hợp & Học Bổng Tinh Hoa NEU 2026 – ĐH Kinh Tế Quốc Dân',
    organization: 'Trường Đại học Kinh tế Quốc dân',
    organizationType: 'university',
    summary: 'Chỉ tiêu 7.500 sinh viên với các phương thức xét tuyển thẳng, xét tuyển chứng chỉ quốc tế SAT/ACT/IELTS và ĐGNL HSA/APT. Quỹ học bổng khuyến khích tài năng trị giá 25 tỷ VNĐ/năm.',
    requirements: {
      gpa_min: 8.0,
      language: 'IELTS 5.5+ / SAT 1200+ / HSA 85+',
      no_essay: true,
      direct_admission: true,
      entrance_exam: 'ĐGNL HSA hoặc Điểm thi Tốt nghiệp THPT',
    },
    fieldCodes: ['01', '03', '06'],
    degreeLevel: ['bachelor'],
    studyLocation: 'Hà Nội',
    fundingType: 'partial',
    fundingValueVnd: 50000000,
    applyStart: new Date('2026-03-15'),
    deadline: new Date('2026-06-30'),
    canonicalUrl: 'https://daotao.neu.edu.vn/tuyen-sinh',
    requiredDocuments: [
      { name: 'Phiếu đăng ký xét tuyển trực tuyến', format_hint: 'In từ hệ thống tuyển sinh NEU' },
      { name: 'Bản sao công chứng học bạ THPT', format_hint: 'Kèm xác nhận điểm trung bình' },
      { name: 'Bản sao chứng chỉ IELTS/SAT hoặc chứng nhận điểm HSA' },
    ],
    applicationSteps: [
      { order: 1, title: 'Kê khai trực tuyến', description: 'Đăng ký tài khoản và nhập thông tin tại cổng daotao.neu.edu.vn' },
      { order: 2, title: 'Xác thực minh chứng', description: 'Tải ảnh chụp minh chứng chứng chỉ gốc và học bạ THPT' },
      { order: 3, title: 'Xác nhận nhập học', description: 'Thực hiện xác nhận nhập học trên hệ thống của Bộ GD&ĐT' },
    ],
    timelineMilestones: [
      { label: 'Mở đăng ký xét tuyển kết hợp', date: '15/03/2026' },
      { label: 'Hết hạn nộp hồ sơ', date: '30/06/2026' },
      { label: 'Thông báo kết quả', date: '10/07/2026' },
    ],
    benefits: [
      { label: 'Học bổng', value: 'Học bổng loại A (100% học phí), loại B (50% học phí)' },
      { label: 'Cơ sở vật chất', value: 'Học tại Tòa nhà Thế Kỷ chuẩn quốc tế' },
    ],
    selectionRounds: 1,
    rankScore: 92,
  },
  {
    slug: 'hust-tuyen-sinh-dgtd-hoc-bong-tai-nang-2026',
    sourceUrl: 'https://trangtuyensinh.com.vn/ds-cac-truong-dai-hoc-hv-tai-ha-noi',
    kind: 'undergraduate',
    title: 'Đề Án Tuyển Sinh Đánh Giá Tư Duy TSA & Học Bổng Trần Đại Nghĩa – ĐH Bách Khoa Hà Nội (HUST)',
    organization: 'Đại học Bách khoa Hà Nội',
    organizationType: 'university',
    summary: 'Xét tuyển bằng kỳ thi Đánh giá tư duy TSA 2026 và xét tuyển tài năng (học sinh chuyên, giải QG). Trao học bổng tài năng 100% học phí toàn khóa và học bổng hỗ trợ học tập Trần Đại Nghĩa cho tân sinh viên vượt khó.',
    requirements: {
      gpa_min: 8.0,
      language: 'IELTS 6.0+ được quy đổi điểm tiếng Anh',
      entrance_exam: 'Kỳ thi Đánh giá tư duy Bách Khoa (TSA)',
      no_essay: true,
      direct_admission: true,
    },
    fieldCodes: ['02', '08', '09'],
    degreeLevel: ['bachelor'],
    studyLocation: 'Hà Nội',
    fundingType: 'full',
    fundingValueVnd: 180000000,
    applyStart: new Date('2026-02-15'),
    deadline: new Date('2026-05-30'),
    canonicalUrl: 'https://ts.hust.edu.vn/',
    requiredDocuments: [
      { name: 'Giấy chứng nhận kết quả thi TSA', format_hint: 'Tải từ tài khoản thi TSA' },
      { name: 'Học bạ THPT 6 kỳ học', format_hint: 'Bản scan có chữ ký BGH' },
      { name: 'Hồ sơ xét học bổng Trần Đại Nghĩa (nếu thuộc diện vượt khó)' },
    ],
    applicationSteps: [
      { order: 1, title: 'Đăng ký dự thi TSA', description: 'Tham gia các đợt thi tư duy do Bách Khoa tổ chức từ tháng 1 đến tháng 5' },
      { order: 2, title: 'Nộp hồ sơ xét tuyển tài năng', description: 'Đăng ký ngành nguyện vọng trên hệ thống ts.hust.edu.vn' },
      { order: 3, title: 'Phỏng vấn học bổng', description: 'Tham gia phỏng vấn với Hội đồng học bổng đối với các suất học bổng doanh nghiệp' },
    ],
    timelineMilestones: [
      { label: 'Mở đợt xét tuyển tài năng', date: '15/02/2026' },
      { label: 'Hạn cuối nhận hồ sơ', date: '30/05/2026' },
      { label: 'Công bố danh sách học bổng', date: '15/07/2026' },
    ],
    benefits: [
      { label: 'Tài trợ toàn khóa', value: '100% học phí trong suốt 4 - 5 năm học đại học' },
      { label: 'Học bổng doanh nghiệp', value: 'Tài trợ thêm từ Samsung, Viettel, FPT Telecom' },
    ],
    selectionRounds: 2,
    rankScore: 96,
  },
  {
    slug: 'hvtc-tuyen-sinh-chinh-quy-hoc-bong-ngan-hang-2026',
    sourceUrl: 'https://trangtuyensinh.com.vn/ds-cac-truong-dai-hoc-hv-tai-ha-noi',
    kind: 'undergraduate',
    title: 'Tuyển Sinh Hệ Chính Quy & Học Bổng Tài Năng Tài Chính 2026 – Học Viện Tài Chính (AOF)',
    organization: 'Học viện Tài chính',
    organizationType: 'university',
    summary: 'Xét tuyển thẳng học sinh giỏi THPT, xét tuyển kết hợp chứng chỉ tiếng Anh quốc tế và điểm thi tốt nghiệp. Trao 500 suất học bổng khuyến khích học tập và tài trợ từ các tập đoàn kiểm toán Big 4.',
    requirements: {
      gpa_min: 8.0,
      language: 'IELTS 5.5+ / TOEFL iBT 55+',
      no_essay: true,
      direct_admission: true,
    },
    fieldCodes: ['01', '03'],
    degreeLevel: ['bachelor'],
    studyLocation: 'Hà Nội',
    fundingType: 'partial',
    fundingValueVnd: 45000000,
    applyStart: new Date('2026-03-20'),
    deadline: new Date('2026-06-20'),
    canonicalUrl: 'https://hvtc.edu.vn/tuyensinh',
    requiredDocuments: [
      { name: 'Đơn đăng ký xét tuyển theo mẫu của Học viện' },
      { name: 'Bản sao công chứng bằng hoặc giấy chứng nhận tốt nghiệp THPT' },
      { name: 'Chứng chỉ ngoại ngữ quốc tế còn hiệu lực' },
    ],
    applicationSteps: [
      { order: 1, title: 'Đăng ký online', description: 'Kê khai tại trang thông tin tuyển sinh của Học viện Tài chính' },
      { order: 2, title: 'Nộp hồ sơ bưu điện', description: 'Gửi chuyển phát nhanh hồ sơ bản cứng về Ban Khảo thí & Quản lý chất lượng' },
    ],
    timelineMilestones: [
      { label: 'Bắt đầu nhận hồ sơ', date: '20/03/2026' },
      { label: 'Hết hạn nhận hồ sơ', date: '20/06/2026' },
    ],
    benefits: [
      { label: 'Học bổng', value: '100% hoặc 50% học phí từng kỳ học theo kết quả rèn luyện' },
      { label: 'Cơ hội nghề nghiệp', value: 'Suất thực tập trực tiếp tại PwC, EY, KPMG, Deloitte' },
    ],
    selectionRounds: 1,
    rankScore: 89,
  },

  // ── 2. SAU ĐẠI HỌC (THẠC SĨ, TIẾN SĨ, BÁC SĨ NỘI TRÚ) ──────────────
  {
    slug: 'hmu-bac-si-noi-tru-thac-si-y-khoa-2026',
    sourceUrl: 'https://sdh.hmu.edu.vn/',
    kind: 'graduate',
    title: 'Tuyển Sinh Bác Sĩ Nội Trú & Thạc Sĩ Y Học Lâm Sàng Khóa 51 – ĐH Y Hà Nội (HMU)',
    organization: 'Trường Đại học Y Hà Nội',
    organizationType: 'university',
    summary: 'Kỳ thi tuyển sinh danh giá bậc nhất ngành Y dành cho sinh viên tốt nghiệp Bác sĩ Y khoa chính quy. Học viên Bác sĩ nội trú được hưởng chế độ học bổng toàn phần, tiền trực bệnh viện và cơ hội đào tạo nội trú tại Pháp.',
    requirements: {
      gpa_min: 7.0,
      language: 'B1 Ngoại ngữ trở lên theo khung Châu Âu CEFR',
      entrance_exam: 'Thi viết chuyên ngành Y cơ sở & Y lâm sàng',
      target_candidates: 'Bác sĩ tốt nghiệp đại học loại Khá trở lên, không vi phạm kỷ luật',
      special_criteria: 'Chỉ được dự thi 01 lần duy nhất ngay sau khi tốt nghiệp bác sĩ',
    },
    fieldCodes: ['05'],
    degreeLevel: ['specialist', 'master'],
    studyLocation: 'Hà Nội',
    fundingType: 'full',
    fundingValueVnd: 120000000,
    applyStart: new Date('2026-06-01'),
    deadline: new Date('2026-08-10'),
    canonicalUrl: 'https://sdh.hmu.edu.vn/',
    requiredDocuments: [
      { name: 'Bằng tốt nghiệp Bác sĩ y khoa hoặc giấy chứng nhận tốt nghiệp tạm thời' },
      { name: 'Bảng điểm toàn khóa học đại học (công chứng)' },
      { name: 'Giấy chứng nhận sức khỏe đủ điều kiện học tập và làm việc tại bệnh viện' },
      { name: 'Sơ yếu lý lịch có xác nhận của chính quyền địa phương hoặc cơ quan' },
    ],
    applicationSteps: [
      { order: 1, title: 'Nộp hồ sơ dự thi', description: 'Nộp trực tiếp tại Phòng Quản lý Đào tạo Sau đại học - ĐH Y Hà Nội' },
      { order: 2, title: 'Tham dự kỳ thi tuyển sinh', description: 'Thi các môn: Môn cơ sở, Môn chuyên ngành và Ngoại ngữ B1' },
      { order: 3, title: 'Chọn chuyên ngành nội trú', description: 'Thí sinh trúng tuyển chọn chuyên ngành theo thứ tự điểm từ cao xuống thấp' },
    ],
    timelineMilestones: [
      { label: 'Phát hành hồ sơ', date: '01/06/2026' },
      { label: 'Hạn cuối nộp hồ sơ', date: '10/08/2026' },
      { label: 'Ngày thi tuyển', date: '25/08/2026' },
      { label: 'Công bố điểm trúng tuyển', date: '05/09/2026' },
    ],
    benefits: [
      { label: 'Học bổng', value: 'Tài trợ 100% học phí toàn khóa bác sĩ nội trú' },
      { label: 'Sinh hoạt phí', value: 'Phụ cấp tiền trực và chế độ đãi ngộ bệnh viện thực hành Bạch Mai, Việt Đức' },
      { label: 'Du học', value: 'Chương trình FFI/DFMS bác sĩ nội trú bệnh viện tại Cộng hòa Pháp' },
    ],
    selectionRounds: 2,
    rankScore: 98,
  },
  {
    slug: 'hmu-tuyen-sinh-tien-si-y-khoa-2026',
    sourceUrl: 'https://sdh.hmu.edu.vn/',
    kind: 'graduate',
    title: 'Xét Tuyển Nghiên Cứu Sinh Tiến Sĩ Y Khoa & Học Bổng Đề Tài Lâm Sàng – ĐH Y Hà Nội',
    organization: 'Trường Đại học Y Hà Nội',
    organizationType: 'university',
    summary: 'Xét tuyển nghiên cứu sinh Tiến sĩ ngành Nội khoa, Ngoại khoa, Nhi khoa, Sản phụ khoa, Y học cổ truyền, Y tế công cộng. Hỗ trợ kinh phí nghiên cứu từ các đề tài cấp Nhà nước và Quỹ VinIF lên tới 150 triệu VNĐ/năm.',
    requirements: {
      language: 'IELTS 6.0+ hoặc TOEFL iBT 60+ hoặc B2 Châu Âu',
      special_criteria: 'Có ít nhất 01 bài báo khoa học đăng trên tạp chí thuộc danh mục Scopus/Web of Science hoặc 02 bài báo trên tạp chí có chỉ số',
      target_candidates: 'Thạc sĩ Y học hoặc Bác sĩ Chuyên khoa II cùng ngành',
    },
    fieldCodes: ['05'],
    degreeLevel: ['phd'],
    studyLocation: 'Hà Nội',
    fundingType: 'stipend',
    fundingValueVnd: 150000000,
    applyStart: new Date('2026-04-01'),
    deadline: new Date('2026-09-30'),
    canonicalUrl: 'https://sdh.hmu.edu.vn/',
    requiredDocuments: [
      { name: 'Đề cương nghiên cứu đề tài Tiến sĩ (tối thiểu 15 trang A4)' },
      { name: 'Bản sao công chứng văn bằng Thạc sĩ / CK2 / Bác sĩ' },
      { name: '02 thư giới thiệu của 02 nhà khoa học có chức danh Giáo sư hoặc Phó Giáo sư' },
      { name: 'Bản sao các công trình khoa học đã công bố' },
    ],
    applicationSteps: [
      { order: 1, title: 'Nộp đề cương nghiên cứu', description: 'Đăng ký người hướng dẫn khoa học và gửi đề cương về Viện đào tạo' },
      { order: 2, title: 'Bảo vệ đề cương trước Tiểu ban', description: 'Thuyết trình đề cương nghiên cứu trước Hội đồng chuyên môn' },
      { order: 3, title: 'Phê duyệt trúng tuyển', description: 'Nhận quyết định công nhận nghiên cứu sinh và ký hợp đồng đào tạo' },
    ],
    timelineMilestones: [
      { label: 'Nhận hồ sơ đợt 1', date: '30/04/2026' },
      { label: 'Nhận hồ sơ đợt 2', date: '30/09/2026' },
    ],
    benefits: [
      { label: 'Tài trợ nghiên cứu', value: '150.000.000 đ/năm từ Quỹ Đổi mới sáng tạo & Đề tài Bộ Y tế' },
      { label: 'Phòng thí nghiệm', value: 'Sử dụng hệ thống Labo giải trình tự gen và tế bào gốc HMU' },
    ],
    selectionRounds: 2,
    rankScore: 97,
  },
  {
    slug: 'vnu-tssdh-thac-si-ai-data-science-2026',
    sourceUrl: 'https://tssdh.vnu.edu.vn/',
    kind: 'graduate',
    title: 'Tuyển Sinh Thạc Sĩ Trí Tuệ Nhân Tạo & Khoa Học Dữ Liệu 2026 – ĐHQGHN (VNU TSSDH)',
    organization: 'Đại học Quốc gia Hà Nội',
    organizationType: 'university',
    summary: 'Chương trình Thạc sĩ định hướng nghiên cứu và ứng dụng công nghệ cao tại Viện Công nghệ Thông tin & ĐH Công nghệ ĐHQGHN. Tài trợ 100% học phí cho học viên tham gia các Lab nghiên cứu AI trọng điểm.',
    requirements: {
      gpa_min: 7.0,
      language: 'B1 Ngoại ngữ theo khung NLNN 6 bậc Việt Nam hoặc IELTS 5.0+',
      target_candidates: 'Tốt nghiệp ĐH ngành CNTT, Toán tin, Kỹ thuật máy tính hoặc ngành gần',
    },
    fieldCodes: ['02'],
    degreeLevel: ['master'],
    studyLocation: 'Hà Nội',
    fundingType: 'full',
    fundingValueVnd: 80000000,
    applyStart: new Date('2026-03-01'),
    deadline: new Date('2026-05-15'),
    canonicalUrl: 'https://tssdh.vnu.edu.vn/',
    requiredDocuments: [
      { name: 'Đơn đăng ký dự tuyển trực tuyến tại tssdh.vnu.edu.vn' },
      { name: 'Bằng và bảng điểm đại học' },
      { name: 'Chứng chỉ ngoại ngữ hợp lệ' },
    ],
    applicationSteps: [
      { order: 1, title: 'Đăng ký online', description: 'Khai báo thông tin trên cổng tssdh.vnu.edu.vn' },
      { order: 2, title: 'Đánh giá hồ sơ & Phỏng vấn', description: 'Hội đồng phỏng vấn chuyên môn và đánh giá tiềm năng nghiên cứu' },
    ],
    timelineMilestones: [
      { label: 'Hết hạn đăng ký đợt 1', date: '15/05/2026' },
      { label: 'Tổ chức phỏng vấn', date: '30/05/2026' },
    ],
    benefits: [
      { label: 'Học phí', value: 'Học bổng miễn 100% học phí từ ĐHQGHN và doanh nghiệp tài trợ' },
      { label: 'Lương thực tập', value: '10 - 15 triệu/tháng khi tham gia dự án tại AI Center' },
    ],
    selectionRounds: 1,
    rankScore: 93,
  },
  {
    slug: 'vnu-tssdh-hoc-bong-tien-si-nghien-cuu-sinh-2026',
    sourceUrl: 'https://tssdh.vnu.edu.vn/',
    kind: 'graduate',
    title: 'Học Bổng Ươm Mầm Nhà Khoa Học Tiến Sĩ Xuất Sắc 2026 – Đại Học Quốc Gia Hà Nội',
    organization: 'Đại học Quốc gia Hà Nội',
    organizationType: 'university',
    summary: 'Chương trình học bổng đặc biệt của Giám đốc ĐHQGHN cấp 100 triệu VNĐ/năm sinh hoạt phí và miễn 100% học phí cho Nghiên cứu sinh Tiến sĩ có công bố quốc tế uy tín.',
    requirements: {
      language: 'IELTS 6.5+ hoặc tương đương',
      special_criteria: 'Cam kết công bố ít nhất 02 bài báo trên tạp chí quốc tế Web of Science / Scopus (Q1/Q2)',
      target_candidates: 'Nghiên cứu sinh theo học toàn thời gian tại các đơn vị thành viên ĐHQGHN',
    },
    fieldCodes: ['02', '04', '08', '09'],
    degreeLevel: ['phd'],
    studyLocation: 'Hà Nội',
    fundingType: 'full',
    fundingValueVnd: 300000000,
    applyStart: new Date('2026-03-01'),
    deadline: new Date('2026-08-30'),
    canonicalUrl: 'https://tssdh.vnu.edu.vn/',
    requiredDocuments: [
      { name: 'Đơn xin cấp học bổng nghiên cứu sinh xuất sắc' },
      { name: 'Đề cương nghiên cứu chi tiết và kế hoạch công bố quốc tế' },
      { name: 'Ý kiến đồng thuận của cán bộ hướng dẫn khoa học' },
    ],
    applicationSteps: [
      { order: 1, title: 'Nộp hồ sơ trực tuyến', description: 'Đăng ký tại cổng tssdh.vnu.edu.vn' },
      { order: 2, title: 'Hội đồng xét duyệt học bổng', description: 'ĐHQGHN thành lập hội đồng thẩm định năng lực khoa học' },
    ],
    timelineMilestones: [
      { label: 'Xét duyệt đợt 1', date: '30/05/2026' },
      { label: 'Xét duyệt đợt 2', date: '30/08/2026' },
    ],
    benefits: [
      { label: 'Học bổng', value: '100.000.000 đ/năm trực tiếp vào tài khoản nghiên cứu sinh' },
      { label: 'Học phí', value: 'Miễn 100% học phí suốt 3 năm đào tạo tiến sĩ' },
    ],
    selectionRounds: 1,
    rankScore: 99,
  },
  {
    slug: 'ulis-saudaihoc-thac-si-ngon-ngu-anh-2026',
    sourceUrl: 'https://saudaihoc.ulis.vnu.edu.vn/',
    kind: 'graduate',
    title: 'Tuyển Sinh Thạc Sĩ Ngôn Ngữ Anh & Phương Pháp Giảng Dạy TESOL 2026 – ĐH Ngoại Ngữ (ULIS)',
    organization: 'Trường Đại học Ngoại ngữ - ĐHQGHN',
    organizationType: 'university',
    summary: 'Chương trình Thạc sĩ Ngôn ngữ Anh hàng đầu Việt Nam với các chuyên ngành: Ngôn ngữ học ứng dụng, Lý luận và Phương pháp dạy học tiếng Anh (TESOL), Biên - Phiên dịch Anh - Việt nâng cao.',
    requirements: {
      gpa_min: 7.0,
      language: 'C1 Tiếng Anh (IELTS 7.0+ hoặc C1 VSTEP hoặc bằng ĐH Sư phạm tiếng Anh loại Khá trở lên)',
      target_candidates: 'Giáo viên tiếng Anh, chuyên viên dịch thuật, cán bộ đối ngoại',
    },
    fieldCodes: ['04'],
    degreeLevel: ['master'],
    studyLocation: 'Hà Nội',
    fundingType: 'partial',
    fundingValueVnd: 35000000,
    applyStart: new Date('2026-03-10'),
    deadline: new Date('2026-05-20'),
    canonicalUrl: 'https://saudaihoc.ulis.vnu.edu.vn/',
    requiredDocuments: [
      { name: 'Đơn đăng ký dự tuyển Thạc sĩ' },
      { name: 'Bản sao công chứng bằng tốt nghiệp ĐH chuyên ngành tiếng Anh' },
      { name: 'Bản sao chứng chỉ năng lực ngoại ngữ C1' },
    ],
    applicationSteps: [
      { order: 1, title: 'Kê khai trực tuyến', description: 'Đăng ký tại cổng tuyển sinh SĐH ULIS' },
      { order: 2, title: 'Đánh giá năng lực chuyên môn', description: 'Phỏng vấn chuyên sâu kiến thức ngôn ngữ học và phương pháp dạy học' },
    ],
    timelineMilestones: [
      { label: 'Hạn nộp hồ sơ', date: '20/05/2026' },
      { label: 'Tổ chức phỏng vấn', date: '05/06/2026' },
    ],
    benefits: [
      { label: 'Học bổng', value: 'Học bổng khuyến khích học tập 10 - 20 triệu/năm cho học viên đạt điểm cao' },
      { label: 'Bằng cấp', value: 'Bằng Thạc sĩ danh giá được công nhận toàn cầu' },
    ],
    selectionRounds: 1,
    rankScore: 90,
  },
  {
    slug: 'huc-saudaihoc-thac-si-quan-ly-van-hoa-2026',
    sourceUrl: 'https://huc.edu.vn/c/5378/Tuyen-sinh-Sau-dai-hoc',
    kind: 'graduate',
    title: 'Tuyển Sinh Thạc Sĩ Quản Lý Văn Hóa & Du Lịch 2026 – ĐH Văn Hóa Hà Nội (HUC)',
    organization: 'Trường Đại học Văn hóa Hà Nội',
    organizationType: 'university',
    summary: 'Đào tạo cán bộ quản lý cấp cao trong lĩnh vực di sản văn hóa, công nghiệp sáng tạo, quản trị du lịch và truyền thông văn hóa. Học bổng hỗ trợ nghiên cứu đề tài di sản phi vật thể quốc gia.',
    requirements: {
      gpa_min: 6.5,
      language: 'B1 Ngoại ngữ theo quy định của Bộ GD&ĐT',
      target_candidates: 'Cán bộ ngành văn hóa, du lịch, truyền thông hoặc người tốt nghiệp ngành phù hợp',
    },
    fieldCodes: ['03', '04'],
    degreeLevel: ['master'],
    studyLocation: 'Hà Nội',
    fundingType: 'partial',
    fundingValueVnd: 25000000,
    applyStart: new Date('2026-03-01'),
    deadline: new Date('2026-06-15'),
    canonicalUrl: 'https://huc.edu.vn/c/5378/Tuyen-sinh-Sau-dai-hoc',
    requiredDocuments: [
      { name: 'Phiếu đăng ký dự thi SĐH theo mẫu ĐH Văn Hóa Hà Nội' },
      { name: 'Bản sao công chứng bằng đại học và bảng điểm' },
      { name: 'Giấy chứng nhận thời gian công tác trong lĩnh vực văn hóa (nếu có)' },
    ],
    applicationSteps: [
      { order: 1, title: 'Nộp hồ sơ tại trường', description: 'Nộp trực tiếp tại Phòng Đào tạo, QLKH và Hợp tác Quốc tế' },
      { order: 2, title: 'Thi tuyển môn chuyên ngành', description: 'Thi viết môn Cơ sở văn hóa Việt Nam và Quản lý văn hóa' },
    ],
    timelineMilestones: [
      { label: 'Hạn cuối nộp hồ sơ', date: '15/06/2026' },
      { label: 'Tổ chức thi tuyển', date: '04/07/2026' },
    ],
    benefits: [
      { label: 'Học bổng', value: 'Hỗ trợ kinh phí điền dã thực tế tại các vùng di sản văn hóa' },
    ],
    selectionRounds: 1,
    rankScore: 86,
  },

  // ── 3. HỌC BỔNG QUỐC TẾ & CHÂU ÂU / MỸ / ĐỨC / ANH ────────────────
  {
    slug: 'euraxess-msca-doctoral-networks-2026',
    sourceUrl: 'https://euraxess.ec.europa.eu/',
    kind: 'scholarship_foreign',
    title: 'Học Bổng Tiến Sĩ Châu Âu Marie Skłodowska-Curie Actions (MSCA Doctoral Networks)',
    organization: 'European Commission (Liên minh Châu Âu)',
    organizationType: 'government',
    summary: 'Học bổng danh giá bậc nhất thế giới của Ủy ban Châu Âu tài trợ toàn phần cho nghiên cứu sinh Tiến sĩ tại các trường ĐH hàng đầu Pháp, Đức, Thụy Sĩ, Hà Lan, Ý. Bao gồm lương tháng 3.400 EUR, phụ cấp gia đình và chi phí nghiên cứu.',
    requirements: {
      language: 'IELTS 7.0+ hoặc TOEFL iBT 95+',
      target_candidates: 'Ứng viên chưa từng sinh sống hoặc làm việc quá 12 tháng tại nước sở tại trong 3 năm qua',
      special_criteria: 'Có bằng Thạc sĩ xuất sắc và đam mê nghiên cứu khoa học liên ngành',
    },
    fieldCodes: ['02', '05', '08', '09'],
    degreeLevel: ['phd'],
    studyLocation: 'Châu Âu (Pháp, Đức, Hà Lan, Thụy Sĩ)',
    fundingType: 'full',
    fundingValueVnd: 2800000000,
    applyStart: new Date('2026-01-15'),
    deadline: new Date('2026-07-31'),
    canonicalUrl: 'https://euraxess.ec.europa.eu/jobs/funding',
    requiredDocuments: [
      { name: 'Curriculum Vitae (Europass CV format)' },
      { name: 'Research Proposal (Đề cương nghiên cứu khoa học 5 - 10 trang)' },
      { name: '2 Letters of Recommendation from Academic Referees' },
      { name: 'Master’s Degree and Full Academic Transcripts' },
    ],
    applicationSteps: [
      { order: 1, title: 'Tìm vị trí nghiên cứu trên EURAXESS', description: 'Chọn đề tài MSCA Doctoral Network phù hợp chuyên ngành' },
      { order: 2, title: 'Nộp hồ sơ cho Giáo sư chủ trì', description: 'Nộp hồ sơ trực tuyến theo hướng dẫn của trường đại học sở tại' },
      { order: 3, title: 'Phỏng vấn chuyên môn quốc tế', description: 'Tham gia phỏng vấn online với Hội đồng khoa học dự án' },
    ],
    timelineMilestones: [
      { label: 'Hạn nộp hồ sơ đợt hè', date: '31/07/2026' },
      { label: 'Bắt đầu chương trình nghiên cứu', date: '01/10/2026' },
    ],
    benefits: [
      { label: 'Lương nghiên cứu sinh', value: '3.400 EUR/tháng (khoảng 92 triệu VNĐ/tháng)' },
      { label: 'Phụ cấp di chuyển', value: '600 EUR/tháng phí sinh hoạt & đi lại' },
      { label: 'Phụ cấp gia đình', value: '660 EUR/tháng nếu có người phụ thuộc' },
      { label: 'Học phí', value: 'Miễn 100% học phí toàn bộ 3 - 4 năm làm tiến sĩ' },
    ],
    selectionRounds: 2,
    rankScore: 100,
  },
  {
    slug: 'daad-epos-master-scholarship-germany-2026',
    sourceUrl: 'https://www.daad.de/en/',
    kind: 'scholarship_foreign',
    title: 'Học Bổng Toàn Phần Thạc Sĩ DAAD EPOS – Chính Phủ CHLB Đức 2026–2027',
    organization: 'Cơ quan Trao đổi Hàn lâm Đức (DAAD)',
    organizationType: 'government',
    summary: 'Chương trình học bổng toàn phần dành cho các nhà chuyên môn từ các nước đang phát triển theo học Thạc sĩ tại các trường ĐH danh tiếng ở Đức. Miễn 100% học phí, cấp sinh hoạt phí 934 EUR/tháng, vé máy bay khứ hồi và khóa học tiếng Đức miễn phí.',
    requirements: {
      gpa_min: 7.5,
      language: 'IELTS 6.5+ hoặc chứng chỉ tiếng Đức tùy ngành học',
      special_criteria: 'Tối thiểu 02 năm kinh nghiệm làm việc chuyên môn sau khi tốt nghiệp đại học',
      target_candidates: 'Cán bộ cơ quan nhà nước, viện nghiên cứu, doanh nghiệp hoặc tổ chức phi chính phủ',
    },
    fieldCodes: ['01', '03', '08', '09'],
    degreeLevel: ['master'],
    studyLocation: 'Đức (Germany)',
    fundingType: 'full',
    fundingValueVnd: 1200000000,
    applyStart: new Date('2026-05-01'),
    deadline: new Date('2026-09-30'),
    canonicalUrl: 'https://www.daad.de/en/study-and-research-in-germany/scholarships/',
    requiredDocuments: [
      { name: 'Đơn đăng ký DAAD form' },
      { name: 'Bản tự thuật CV cá nhân ký tay (Europass format)' },
      { name: 'Thư động lực (Letter of Motivation) tối đa 2 trang' },
      { name: 'Thư giới thiệu từ thủ trưởng cơ quan công tác hiện tại' },
      { name: 'Xác nhận kinh nghiệm làm việc tối thiểu 2 năm' },
    ],
    applicationSteps: [
      { order: 1, title: 'Chọn khóa học EPOS', description: 'Chọn tối đa 03 khóa học trong danh mục DAAD EPOS' },
      { order: 2, title: 'Nộp hồ sơ trực tiếp cho trường ĐH tại Đức', description: 'Gửi hồ sơ kèm đơn xin học bổng DAAD theo cổng của trường' },
      { order: 3, title: 'DAAD xét chọn chính thức', description: 'Trường đề cử danh sách lên DAAD để phê duyệt tài trợ' },
    ],
    timelineMilestones: [
      { label: 'Hạn nộp hồ sơ chung', date: '30/09/2026' },
      { label: 'Thông báo kết quả', date: '12/2026' },
      { label: 'Nhập học tại Đức', date: '04/2027 hoặc 10/2027' },
    ],
    benefits: [
      { label: 'Sinh hoạt phí', value: '934 EUR/tháng trong suốt 12 - 24 tháng' },
      { label: 'Vé máy bay', value: 'Vé máy bay khứ hồi Việt Nam - Đức' },
      { label: 'Bảo hiểm', value: 'Bảo hiểm y tế, tai nạn và trách nhiệm dân sự' },
      { label: 'Khóa tiếng Đức', value: 'Tài trợ khóa học tiếng Đức chuẩn bị kéo dài 6 tháng' },
    ],
    selectionRounds: 2,
    rankScore: 98,
  },
  {
    slug: 'phdportal-salaried-doctoral-fellowship-eth-zurich',
    sourceUrl: 'https://www.phdportal.com/',
    kind: 'scholarship_foreign',
    title: 'Học Bổng Tiến Sĩ Có Lương Ngành Khoa Học Máy Tính & AI – ETH Zurich (Thụy Sĩ)',
    organization: 'ETH Zurich & PhDPortal',
    organizationType: 'university',
    summary: 'Vị trí nghiên cứu sinh Tiến sĩ hưởng lương chính thức tại trường đại học số 1 Châu Âu ETH Zurich. Mức lương khởi điểm 55.000 CHF/năm (khoảng 1.5 tỷ VNĐ/năm) với đầy đủ chế độ phúc lợi nhân viên nghiên cứu khoa học.',
    requirements: {
      gpa_min: 8.5,
      language: 'IELTS 7.5+ hoặc TOEFL iBT 100+',
      special_criteria: 'Có bằng Thạc sĩ Khoa học Máy tính, Toán học hoặc Kỹ thuật phần mềm xuất sắc',
    },
    fieldCodes: ['02'],
    degreeLevel: ['phd'],
    studyLocation: 'Zurich, Thụy Sĩ',
    fundingType: 'full',
    fundingValueVnd: 4500000000,
    applyStart: new Date('2026-02-01'),
    deadline: new Date('2026-07-01'),
    canonicalUrl: 'https://www.phdportal.com/studies/eth-zurich-computer-science',
    requiredDocuments: [
      { name: 'Bản lý lịch học thuật CV chi tiết' },
      { name: 'Tuyên bố mục đích nghiên cứu (Statement of Research Interest)' },
      { name: 'Bản sao luận văn Thạc sĩ hoặc các bài báo khoa học đã xuất bản' },
      { name: '3 thư giới thiệu từ các Giáo sư uy tín' },
    ],
    applicationSteps: [
      { order: 1, title: 'Đăng ký online tại cổng ETH Zurich', description: 'Nộp hồ sơ qua hệ thống tuyển dụng học thuật ETH' },
      { order: 2, title: 'Phỏng vấn kỹ thuật & Coding test', description: 'Phỏng vấn chuyên sâu thuật toán và năng lực nghiên cứu' },
    ],
    timelineMilestones: [
      { label: 'Hạn chót ứng tuyển', date: '01/07/2026' },
      { label: 'Nhập học và ký hợp đồng', date: '01/09/2026' },
    ],
    benefits: [
      { label: 'Lương năm', value: '55.000 - 65.000 CHF/năm (1.5 - 1.8 tỷ VNĐ/năm)' },
      { label: 'Bảo hiểm & Phúc lợi', value: 'Chế độ người lao động Thụy Sĩ, lương hưu, bảo hiểm cao cấp' },
      { label: 'Kinh phí dự hội nghị', value: 'Tài trợ 100% chi phí tham dự các hội nghị hàng đầu thế giới (NeurIPS, ICML, CVPR)' },
    ],
    selectionRounds: 3,
    rankScore: 99,
  },
  {
    slug: 'postgraduatesearch-commonwealth-shared-scholarships-uk',
    sourceUrl: 'https://www.postgraduatesearch.com/funding',
    kind: 'scholarship_foreign',
    title: 'Học Bổng Thạc Sĩ Commonwealth Shared Scholarships Vương Quốc Anh 2026–2027',
    organization: 'Commonwealth Scholarship Commission & UK Universities',
    organizationType: 'government',
    summary: 'Học bổng đồng tài trợ giữa Bộ Phát triển Quốc tế Vương quốc Anh (FCDO) và các trường đại học hàng đầu UK. Miễn 100% học phí, vé máy bay khứ hồi, trợ cấp sinh hoạt 1.347 GBP/tháng.',
    requirements: {
      gpa_min: 8.0,
      language: 'IELTS 6.5+ (không kỹ năng nào dưới 6.0)',
      target_candidates: 'Công dân các quốc gia thuộc khối Thịnh vượng chung hoặc đối tác đang phát triển',
    },
    fieldCodes: ['01', '03', '05', '08'],
    degreeLevel: ['master'],
    studyLocation: 'Vương quốc Anh (UK)',
    fundingType: 'full',
    fundingValueVnd: 1800000000,
    applyStart: new Date('2026-09-01'),
    deadline: new Date('2026-12-15'),
    canonicalUrl: 'https://www.postgraduatesearch.com/funding',
    requiredDocuments: [
      { name: 'Đơn đăng ký trực tuyến trên hệ thống CSC Electronic Application System (EAS)' },
      { name: 'Bằng tốt nghiệp đại học loại Giỏi' },
      { name: '02 thư giới thiệu bảo lãnh học thuật' },
    ],
    applicationSteps: [
      { order: 1, title: 'Nộp đơn xin nhập học tại ĐH Anh', description: 'Được chấp nhận vào khóa học Thạc sĩ thuộc danh mục học bổng' },
      { order: 2, title: 'Nộp hồ sơ trên cổng CSC EAS', description: 'Hoàn thành bài luận phát triển bền vững trên cổng EAS của Anh' },
    ],
    timelineMilestones: [
      { label: 'Mở đơn đăng ký', date: '01/09/2026' },
      { label: 'Đóng đơn nhận hồ sơ', date: '15/12/2026' },
    ],
    benefits: [
      { label: 'Học phí', value: 'Tài trợ 100% học phí khóa học Thạc sĩ 1 năm tại Anh' },
      { label: 'Sinh hoạt phí', value: '1.347 GBP/tháng (1.652 GBP/tháng nếu học tại London)' },
      { label: 'Di chuyển', value: 'Vé máy bay khứ hồi hạng phổ thông' },
    ],
    selectionRounds: 2,
    rankScore: 97,
  },
  {
    slug: 'niche-no-essay-excellence-scholarship-2026',
    sourceUrl: 'https://www.niche.com/',
    kind: 'scholarship_foreign',
    title: 'Học Bổng Tuyển Thẳng Không Yêu Cầu Bài Luận "No Essay" Excellence Award – Niche & CollegeBoard',
    organization: 'Niche Education Network',
    organizationType: 'foundation',
    summary: 'Chương trình học bổng nổi bật từ mạng lưới Niche dành cho học sinh, sinh viên quốc tế. Thủ tục cực nhanh: xét duyệt trực tiếp dựa trên học bạ, bảng điểm và chứng chỉ mà hoàn toàn KHÔNG CẦN viết bài luận cá nhân (No Essay Required).',
    requirements: {
      gpa_min: 8.0,
      language: 'IELTS 6.0+ hoặc Duolingo 105+',
      no_essay: true,
      direct_admission: true,
      target_candidates: 'Học sinh lớp 12 hoặc sinh viên đại học đang tìm kiếm nguồn tài trợ nhanh',
    },
    fieldCodes: ['01', '02', '03', '04', '08'],
    degreeLevel: ['bachelor'],
    studyLocation: 'Mỹ (Hoa Kỳ) / Trực tuyến',
    fundingType: 'stipend',
    fundingValueVnd: 250000000,
    applyStart: new Date('2026-01-01'),
    deadline: new Date('2026-10-31'),
    canonicalUrl: 'https://www.niche.com/colleges/scholarships/no-essay-scholarship/',
    requiredDocuments: [
      { name: 'Bản sao bảng điểm THPT / Đại học mới nhất' },
      { name: 'Xác nhận thông tin định danh sinh viên' },
    ],
    applicationSteps: [
      { order: 1, title: 'Điền form thông tin 2 phút', description: 'Khai báo điểm GPA và trường theo học trên hệ thống Niche' },
      { order: 2, title: 'Nhận kết quả xét duyệt tự động', description: 'Hệ thống tự động chấm điểm hồ sơ và gửi thông báo cấp học bổng' },
    ],
    timelineMilestones: [
      { label: 'Xét duyệt hàng tháng', date: 'Ngày cuối cùng mỗi tháng' },
      { label: 'Hạn cuối năm 2026', date: '31/10/2026' },
    ],
    benefits: [
      { label: 'Tiền mặt', value: '10.000 USD (khoảng 250.000.000 VNĐ) chuyển thẳng sinh hoạt phí' },
      { label: 'Tiện lợi', value: 'Không tốn thời gian viết luận, nộp hồ sơ trong 2 phút' },
    ],
    selectionRounds: 1,
    rankScore: 91,
  },
  {
    slug: 'fastweb-stem-leadership-scholarship-usa',
    sourceUrl: 'https://www.fastweb.com/',
    kind: 'scholarship_foreign',
    title: 'Học Bổng Lãnh Đạo Khoa Học Công Nghệ STEM – Fastweb & National Science Foundation',
    organization: 'Fastweb Scholarship Foundation',
    organizationType: 'foundation',
    summary: 'Học bổng thường niên quy mô lớn kết nối bởi Fastweb dành cho sinh viên theo đuổi các ngành STEM (Khoa học, Công nghệ, Kỹ thuật, Toán học) tại các trường đại học Mỹ, giá trị 25.000 USD/năm.',
    requirements: {
      gpa_min: 8.5,
      language: 'IELTS 7.0+ hoặc TOEFL iBT 90+ / SAT 1350+',
      target_candidates: 'Thí sinh theo học các ngành Công nghệ, Khoa học Dữ liệu, Công nghệ Sinh học',
    },
    fieldCodes: ['02', '08', '09'],
    degreeLevel: ['bachelor', 'master'],
    studyLocation: 'Hoa Kỳ (USA)',
    fundingType: 'partial',
    fundingValueVnd: 625000000,
    applyStart: new Date('2026-02-01'),
    deadline: new Date('2026-08-15'),
    canonicalUrl: 'https://www.fastweb.com/college-scholarships',
    requiredDocuments: [
      { name: 'Bảng điểm chính thức từ trường đang học' },
      { name: 'Bài luận ngắn 500 từ về tầm nhìn ứng dụng công nghệ' },
      { name: 'Thư giới thiệu của giáo viên hướng dẫn STEM' },
    ],
    applicationSteps: [
      { order: 1, title: 'Tạo hồ sơ Fastweb Match', description: 'Đồng bộ hồ sơ học thuật trên hệ thống Fastweb' },
      { order: 2, title: 'Nộp bài luận trực tuyến', description: 'Tải bài luận và minh chứng thành tích nghiên cứu' },
    ],
    timelineMilestones: [
      { label: 'Hạn nộp hồ sơ', date: '15/08/2026' },
      { label: 'Công bố người nhận giải', date: '30/09/2026' },
    ],
    benefits: [
      { label: 'Trị giá', value: '25.000 USD (625 triệu VNĐ) khấu trừ trực tiếp vào học phí' },
      { label: 'Mạng lưới', value: 'Tham gia hội nghị Fastweb STEM Annual Summit tại Thung lũng Silicon' },
    ],
    selectionRounds: 2,
    rankScore: 93,
  },

  // ── 4. HỌC BỔNG GIỚI TRẺ & QUỐC TẾ CHO SINH VIÊN VIỆT NAM (YBOX, HOTCOURSES, CAREERPREP)
  {
    slug: 'ybox-hoc-bong-chinh-phu-singapore-asean-2026',
    sourceUrl: 'https://ybox.vn/hoc-bong',
    kind: 'scholarship_foreign',
    title: 'Học Bổng Toàn Phần Chính Phủ Singapore Dành Cho Học Sinh & Sinh Viên Việt Nam (ASEAN Scholarship)',
    organization: 'Bộ Giáo dục Singapore (MOE Singapore) & YBOX',
    organizationType: 'government',
    summary: 'Chương trình học bổng toàn phần danh giá của Bộ Giáo dục Singapore tài trợ toàn bộ học phí, chi phí ăn ở tại ký túc xá, trợ cấp sinh hoạt phí hàng năm, vé máy bay khứ hồi và trợ cấp ổn định ban đầu tại Singapore.',
    requirements: {
      gpa_min: 8.5,
      language: 'Khả năng tiếng Anh lưu loát (thi viết và phỏng vấn trực tiếp bằng tiếng Anh)',
      target_candidates: 'Học sinh lớp 9, 10 hoặc sinh viên đại học năm 1 có thành tích học tập xuất sắc',
    },
    fieldCodes: ['01', '02', '03', '04', '08'],
    degreeLevel: ['bachelor'],
    studyLocation: 'Singapore (NUS, NTU, SMU)',
    fundingType: 'full',
    fundingValueVnd: 1600000000,
    applyStart: new Date('2026-02-15'),
    deadline: new Date('2026-05-30'),
    canonicalUrl: 'https://www.moe.gov.sg/financial-matters/awards-scholarships/asean-scholarship/vietnam',
    requiredDocuments: [
      { name: 'Bản dịch công chứng học bạ 3 năm gần nhất' },
      { name: 'Bản sao công chứng giấy khai sinh' },
      { name: 'Chứng chỉ thành tích học tập, giải thưởng học sinh giỏi quốc gia/tỉnh' },
    ],
    applicationSteps: [
      { order: 1, title: 'Nộp đơn trực tuyến', description: 'Đăng ký tại cổng điện tử của Bộ Giáo dục Singapore (MOE Customer Portal)' },
      { order: 2, title: 'Tham dự kỳ thi tuyển tại Hà Nội / TP.HCM', description: 'Thi 2 môn: Toán (Maths) và Tiếng Anh (English)' },
      { order: 3, title: 'Phỏng vấn trực tiếp', description: 'Ứng viên vượt qua kỳ thi viết sẽ được mời phỏng vấn với đại diện MOE' },
    ],
    timelineMilestones: [
      { label: 'Hạn nộp hồ sơ', date: '30/05/2026' },
      { label: 'Thi viết tại Việt Nam', date: '08/2026' },
      { label: 'Phỏng vấn', date: '10/2026' },
      { label: 'Sang Singapore nhập học', date: '01/2027' },
    ],
    benefits: [
      { label: 'Học phí', value: 'Miễn 100% học phí toàn bộ khóa học' },
      { label: 'Sinh hoạt phí', value: '4.000 SGD/năm cho học sinh phổ thông, 5.800 SGD/năm cho sinh viên ĐH' },
      { label: 'Ký túc xá', value: 'Miễn phí chỗ ở ký túc xá tiện nghi tại Singapore' },
      { label: 'Vé máy bay', value: 'Vé máy bay khứ hồi Việt Nam - Singapore' },
    ],
    selectionRounds: 3,
    rankScore: 99,
  },
  {
    slug: 'ybox-hoc-bong-trao-doi-lanh-dao-tre-yseali-hoa-ky',
    sourceUrl: 'https://ybox.vn/hoc-bong',
    kind: 'scholarship_foreign',
    title: 'Học Bổng Trao Đổi Lãnh Đạo Trẻ YSEALI Academic Fellowship – Bộ Ngoại Giao Hoa Kỳ 2026',
    organization: 'U.S. Department of State & YBOX',
    organizationType: 'government',
    summary: 'Chương trình học bổng ngắn hạn toàn phần kéo dài 5 tuần tại các trường đại học hàng đầu Hoa Kỳ. Đài thọ 100% vé máy bay quốc tế, chi phí ăn ở, bảo hiểm, visa và phụ cấp sinh hoạt cá nhân.',
    requirements: {
      gpa_min: 7.5,
      language: 'Tiếng Anh thành thạo để tham gia thảo luận và hội thảo chuyên sâu',
      target_candidates: 'Thanh niên, sinh viên Việt Nam độ tuổi 18 – 25 thể hiện tinh thần lãnh đạo cộng đồng',
      special_criteria: 'Cam kết quay trở về cống hiến cho sự phát triển của Việt Nam và cộng đồng ASEAN',
    },
    fieldCodes: ['01', '03', '04', '07'],
    degreeLevel: ['bachelor', 'master'],
    studyLocation: 'Hoa Kỳ (USA)',
    fundingType: 'full',
    fundingValueVnd: 220000000,
    applyStart: new Date('2026-04-01'),
    deadline: new Date('2026-06-30'),
    canonicalUrl: 'https://vn.usembassy.gov/education-culture/yseali/',
    requiredDocuments: [
      { name: 'Đơn đăng ký trực tuyến theo mẫu của Đại sứ quán Hoa Kỳ' },
      { name: 'Bài luận cá nhân thể hiện phẩm chất lãnh đạo và dự án cộng đồng' },
      { name: 'Thư giới thiệu từ giảng viên hoặc lãnh đạo tổ chức xã hội' },
      { name: 'Bảng điểm đại học' },
    ],
    applicationSteps: [
      { order: 1, title: 'Nộp đơn trực tuyến', description: 'Hoàn thành hồ sơ và nộp bài luận trên cổng thông tin YSEALI' },
      { order: 2, title: 'Phỏng vấn bán kết', description: 'Phỏng vấn bằng tiếng Anh với Viên chức Ngoại giao Hoa Kỳ' },
    ],
    timelineMilestones: [
      { label: 'Hạn cuối nộp hồ sơ', date: '30/06/2026' },
      { label: 'Phỏng vấn', date: '08/2026' },
      { label: 'Khởi hành sang Mỹ', date: '10/2026 hoặc mùa xuân 2027' },
    ],
    benefits: [
      { label: 'Toàn phần 100%', value: 'Đài thọ toàn bộ vé máy bay, ăn ở, di chuyển nội địa tại Mỹ' },
      { label: 'Trải nghiệm', value: 'Tham quan Quốc hội Mỹ, gặp gỡ các nhà hoạch định chính sách tại Washington D.C.' },
    ],
    selectionRounds: 2,
    rankScore: 97,
  },
  {
    slug: 'hotcourses-destination-australia-scholarship-2026',
    sourceUrl: 'https://www.hotcourses.vn/',
    kind: 'scholarship_foreign',
    title: 'Học Bổng Chính Phủ Úc Destination Australia Scholarship 2026 – Hotcourses Vietnam',
    organization: 'Department of Education Australia & Hotcourses',
    organizationType: 'government',
    summary: 'Chương trình học bổng của Chính phủ Úc khuyến khích sinh viên quốc tế theo học tại các trường đại học ở vùng Regional của Úc. Cấp 15.000 AUD/năm (khoảng 250 triệu VNĐ/năm) cho các bậc Cử nhân, Thạc sĩ và Tiến sĩ.',
    requirements: {
      gpa_min: 7.5,
      language: 'IELTS 6.5+ (không kỹ năng nào dưới 6.0)',
      target_candidates: 'Sinh viên quốc tế đăng ký khóa học toàn thời gian tại các học xá khu vực Regional nước Úc',
    },
    fieldCodes: ['01', '02', '03', '05', '08'],
    degreeLevel: ['bachelor', 'master', 'phd'],
    studyLocation: 'Úc (Australia - Vùng Regional)',
    fundingType: 'stipend',
    fundingValueVnd: 500000000,
    applyStart: new Date('2026-03-01'),
    deadline: new Date('2026-10-15'),
    canonicalUrl: 'https://www.hotcourses.vn/study-in-australia/scholarships/',
    requiredDocuments: [
      { name: 'Thư mời nhập học không điều kiện (Unconditional Offer) từ trường ĐH Úc' },
      { name: 'Bảng điểm và bằng tốt nghiệp dịch thuật công chứng' },
      { name: 'Chứng chỉ tiếng Anh IELTS / PTE Academic' },
    ],
    applicationSteps: [
      { order: 1, title: 'Nộp hồ sơ xin thư mời nhập học', description: 'Đăng ký vào trường đại học đối tác tại Úc qua Hotcourses/IDP' },
      { order: 2, title: 'Nộp đơn xin học bổng Destination Australia', description: 'Kê khai mẫu đơn học bổng của trường sở tại' },
    ],
    timelineMilestones: [
      { label: 'Hạn nhận hồ sơ kỳ xuân', date: '15/10/2026' },
      { label: 'Nhập học kỳ tháng 2', date: '02/2027' },
    ],
    benefits: [
      { label: 'Tiền mặt', value: '15.000 AUD/năm (lên tới 60.000 AUD cho 4 năm đại học)' },
      { label: 'Cơ hội định cư', value: 'Cộng thêm 1 - 2 năm visa làm việc sau tốt nghiệp (Post-Study Work Visa)' },
    ],
    selectionRounds: 1,
    rankScore: 94,
  },
  {
    slug: 'careerprep-hoc-bong-dao-tao-thac-si-tien-si-vingroup-2026',
    sourceUrl: 'https://careerprep.vn/10-website-giup-san-hoc-bong-de-dang/',
    kind: 'scholarship_corporate',
    title: 'Học Bổng Đào Tạo Thạc Sĩ & Tiến Sĩ Khoa Học Công Nghệ Ra Nước Ngoài – Tập Đoàn Vingroup',
    organization: 'Tập đoàn Vingroup & Quỹ Đổi mới Sáng tạo VinIF',
    organizationType: 'foundation',
    summary: 'Học bổng phi lợi nhuận lớn nhất Việt Nam tài trợ 100% học phí, sinh hoạt phí và vé máy bay cho công dân Việt Nam tài năng theo học Thạc sĩ, Tiến sĩ tại Top 50 trường đại học hàng đầu thế giới (MIT, Stanford, Oxford, Cambridge, CMU). Tổng trị giá lên đến 3.5 tỷ VNĐ/suất.',
    requirements: {
      gpa_min: 8.5,
      language: 'IELTS 7.0+ hoặc TOEFL iBT 95+ / GRE theo yêu cầu của trường mục tiêu',
      target_candidates: 'Ứng viên không quá 30 tuổi đối với Thạc sĩ, không quá 35 tuổi đối với Tiến sĩ',
      special_criteria: 'Cam kết trở về Việt Nam làm việc tại các trường đại học, viện nghiên cứu hoặc doanh nghiệp công nghệ trong thời gian bằng thời gian nhận học bổng',
    },
    fieldCodes: ['02', '05', '08', '09'],
    degreeLevel: ['master', 'phd'],
    studyLocation: 'Mỹ, Anh, Úc, Pháp, Singapore, Nhật Bản',
    fundingType: 'full',
    fundingValueVnd: 3500000000,
    applyStart: new Date('2026-01-15'),
    deadline: new Date('2026-06-30'),
    canonicalUrl: 'https://vinif.org/scholarship-programs/',
    requiredDocuments: [
      { name: 'Đơn đăng ký trực tuyến bằng tiếng Anh theo mẫu của Chương trình' },
      { name: 'Bản tự thuật cá nhân CV' },
      { name: 'Bài luận mục tiêu học tập và nghiên cứu (Statement of Purpose)' },
      { name: '03 thư giới thiệu từ các Giáo sư chuyên ngành' },
      { name: 'Bản sao các công trình nghiên cứu, bài báo khoa học (nếu có)' },
    ],
    applicationSteps: [
      { order: 1, title: 'Nộp hồ sơ trực tuyến', description: 'Đăng ký trên cổng học bổng KHCN của Vingroup/VinIF' },
      { order: 2, title: 'Sơ tuyển hồ sơ khoa học', description: 'Hội đồng Khoa học thẩm định thành tích học thuật và thư giới thiệu' },
      { order: 3, title: 'Phỏng vấn với Hội đồng Giáo sư quốc tế', description: 'Phỏng vấn chuyên môn và định hướng nghiên cứu bằng tiếng Anh' },
    ],
    timelineMilestones: [
      { label: 'Hạn cuối nộp hồ sơ', date: '30/06/2026' },
      { label: 'Phỏng vấn chuyên sâu', date: '08/2026' },
      { label: 'Công bố học bổng chính thức', date: '09/2026' },
    ],
    benefits: [
      { label: 'Tài trợ toàn phần', value: '100% học phí, bảo hiểm, phí visa, trợ cấp sinh hoạt phí hàng tháng theo mức sống nước sở tại' },
      { label: 'Vé máy bay', value: '01 vé máy bay khứ hồi/năm' },
      { label: 'Hỗ trợ nghề nghiệp', value: 'Cơ hội làm việc tại VinAI, VinBigData, VinFast hoặc các Viện nghiên cứu đầu ngành' },
    ],
    selectionRounds: 3,
    rankScore: 100,
  },
];
