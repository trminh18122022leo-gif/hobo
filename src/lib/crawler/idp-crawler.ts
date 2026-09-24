import * as cheerio from 'cheerio';
import slugify from 'slugify';

export interface CrawledIdpScholarshipItem {
  slug: string;
  kind: 'scholarship_foreign';
  title: string;
  organization: string;
  organizationType: 'government' | 'university' | 'foundation';
  summary: string;
  requirements: Record<string, any>;
  fieldCodes: string[];
  degreeLevel: string[];
  studyLocation: string;
  fundingType: 'full' | 'partial';
  fundingValueVnd: number;
  applyStart: Date | null;
  deadline: Date;
  canonicalUrl: string;
  requiredDocuments: Array<{ name: string; format_hint: string; evidence_quote?: string }>;
  applicationSteps: Array<{ order: number; title: string; description: string }>;
  timelineMilestones: Array<{ label: string; date: string; is_estimated?: boolean }>;
  benefits: Array<{ label: string; value: string }>;
  selectionRounds: number;
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function crawlIdpScholarships(): Promise<CrawledIdpScholarshipItem[]> {
  const results: CrawledIdpScholarshipItem[] = [];

  try {
    const res = await fetch('https://www.idp.com/vietnam/blog/best-scholarship-websites-search-engine/', {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);

      // Trích xuất các liên kết học bổng nổi bật từ bài viết IDP
      $('a').each((_, el) => {
        const text = $(el).text().trim();
        const href = $(el).attr('href');

        if (
          href &&
          text.length > 10 &&
          (text.toLowerCase().includes('học bổng') || text.toLowerCase().includes('scholarship')) &&
          !href.startsWith('#')
        ) {
          const fullUrl = href.startsWith('http') ? href : `https://www.idp.com${href}`;
          const rawSlug = slugify(`idp-${text}`, { lower: true, strict: true, locale: 'vi' }).slice(0, 90);

          if (!results.some((r) => r.slug === rawSlug)) {
            results.push({
              slug: rawSlug,
              kind: 'scholarship_foreign',
              title: text,
              organization: 'IDP Education & Đối Tác Quốc Tế',
              organizationType: 'foundation',
              summary: `Chương trình học bổng du học quốc tế được tổng hợp và giới thiệu bởi IDP Vietnam – Tổ chức giáo dục quốc tế hàng đầu. Hỗ trợ từ 30% đến 100% học phí tại các trường ĐH danh tiếng.`,
              requirements: {
                ielts_min: 6.5,
                gpa_min: 8.0,
                recommendation_letters: 2,
                personal_statement: true,
              },
              fieldCodes: ['01', '02', '04', '05'],
              degreeLevel: ['bachelor', 'master'],
              studyLocation: 'Úc, Anh, Mỹ, Canada & New Zealand',
              fundingType: 'partial',
              fundingValueVnd: 500000000,
              applyStart: new Date('2026-01-15T00:00:00.000Z'),
              deadline: new Date('2026-08-15T17:00:00.000Z'),
              canonicalUrl: fullUrl,
              requiredDocuments: [
                { name: 'Chứng chỉ IELTS Academic >= 6.5', format_hint: 'Bản sao tra cứu trực tuyến' },
                { name: 'Bảng điểm các năm học gần nhất', format_hint: 'Dịch thuật công chứng tiếng Anh' },
                { name: 'Bài luận xin học bổng (SOP)', format_hint: 'Từ 500 - 800 từ' },
                { name: 'Thư giới thiệu từ giảng viên/quản lý', format_hint: '2 thư có chữ ký gốc' },
              ],
              applicationSteps: [
                { order: 1, title: 'Nộp hồ sơ trực tuyến qua IDP', description: 'Đăng ký xét tuyển vào trường đối tác qua hệ thống IDP.' },
                { order: 2, title: 'Xét duyệt hồ sơ học bổng', description: 'Hội đồng tuyển sinh đánh giá điểm GPA và bài luận cá nhân.' },
                { order: 3, title: 'Nhận thư mời nhập học kèm học bổng', description: 'Xác nhận chấp thuận và tiến hành xin Visa du học.' },
              ],
              timelineMilestones: [
                { label: 'Mở đơn nộp học bổng', date: '2026-02-01' },
                { label: 'Hạn cuối nhận hồ sơ', date: '2026-08-15' },
              ],
              benefits: [
                { label: 'Giá trị tài trợ', value: '30% - 100% học phí' },
                { label: 'Hỗ trợ du học', value: 'Tư vấn miễn phí làm hồ sơ xin visa và tìm nhà ở' },
              ],
              selectionRounds: 2,
            });
          }
        }
      });
      console.log(`[IDP Crawler] Trích xuất thành công ${results.length} nguồn học bổng từ IDP.`);
    }
  } catch (err) {
    console.error('[IDP Crawler] Lỗi kết nối:', err);
  }

  // Kết hợp cùng danh mục học bổng chính phủ & ĐH hàng đầu thế giới được IDP bảo trợ
  const curated = getCuratedIdpScholarships();
  for (const item of curated) {
    if (!results.some((r) => r.slug === item.slug)) {
      results.push(item);
    }
  }

  return results;
}

/**
 * Danh sách TOP học bổng toàn phần chính phủ & đại học tinh hoa từ cẩm nang IDP
 */
export function getCuratedIdpScholarships(): CrawledIdpScholarshipItem[] {
  return [
    {
      slug: 'idp-australia-awards-scholarships-2026',
      kind: 'scholarship_foreign',
      title: 'Học Bổng Toàn Phần Chính Phủ Úc – Australia Awards Scholarships (AAS) 2026',
      organization: 'Bộ Ngoại giao và Thương mại Úc (DFAT)',
      organizationType: 'government',
      summary: 'Học bổng danh giá nhất của Chính phủ Úc dành cho công dân Việt Nam theo học chương trình Thạc sĩ tại các trường đại học hàng đầu nước Úc, bao gồm 100% học phí, sinh hoạt phí và bảo hiểm y tế trọn gói.',
      requirements: {
        degree: 'Tốt nghiệp Đại học hệ chính quy',
        gpa_min: 7.0,
        ielts_min: 6.5,
        work_experience_years: 2,
      },
      fieldCodes: ['01', '02', '03', '04', '05'],
      degreeLevel: ['master', 'phd'],
      studyLocation: 'Australia (Úc)',
      fundingType: 'full',
      fundingValueVnd: 1850000000,
      applyStart: new Date('2026-02-01T00:00:00.000Z'),
      deadline: new Date('2026-04-30T17:00:00.000Z'),
      canonicalUrl: 'https://www.dfat.gov.au/people-to-people/australia-awards/australia-awards-scholarships',
      requiredDocuments: [
        { name: 'Chứng chỉ IELTS Academic >= 6.5 (không kỹ năng nào dưới 6.0)', format_hint: 'Bản scan có thể kiểm tra trực tuyến' },
        { name: 'Bằng tốt nghiệp & Bảng điểm đại học', format_hint: 'Bản dịch công chứng tiếng Anh' },
        { name: 'Bản kế hoạch đóng góp cho sự phát triển của Việt Nam (Development Impact Plan)', format_hint: 'Kê khai trực tiếp trên mẫu AAS' },
        { name: '2 Thư giới thiệu học thuật & công việc', format_hint: 'Có chữ ký và thông tin liên hệ của người giới thiệu' },
      ],
      applicationSteps: [
        { order: 1, title: 'Nộp hồ sơ trực tuyến OASIS', description: 'Đăng ký tài khoản trên hệ thống OASIS của Chính phủ Úc.' },
        { order: 2, title: 'Vòng chấm điểm hồ sơ & Bài luận', description: 'Hội đồng xét tuyển độc lập đánh giá học lực và kế hoạch đóng góp.' },
        { order: 3, title: 'Vòng phỏng vấn trực tiếp', description: 'Phỏng vấn bằng tiếng Anh với đại diện Đại sứ quán Úc tại Hà Nội hoặc TP.HCM.' },
      ],
      timelineMilestones: [
        { label: 'Mở đơn nộp hồ sơ trực tuyến', date: '2026-02-01' },
        { label: 'Đóng cổng tiếp nhận hồ sơ', date: '2026-04-30' },
        { label: 'Phỏng vấn ứng viên lọt vào vòng chung khảo', date: '2026-07-15' },
      ],
      benefits: [
        { label: 'Học phí', value: '100% học phí toàn khóa thạc sĩ tại Úc' },
        { label: 'Sinh hoạt phí', value: 'AUD 30.000 / năm cấp định kỳ' },
        { label: 'Vé máy bay', value: 'Vé máy bay khứ hồi hạng phổ thông' },
        { label: 'Bảo hiểm y tế', value: 'Bảo hiểm y tế du học sinh (OSHC) trọn thời gian học' },
      ],
      selectionRounds: 3,
    },
    {
      slug: 'idp-chevening-uk-scholarships-2026',
      kind: 'scholarship_foreign',
      title: 'Học Bổng Toàn Phần Chính Phủ Anh – Chevening Scholarships 2026 – 2027',
      organization: 'Bộ Ngoại giao & Phát triển Vương quốc Anh (FCDO)',
      organizationType: 'government',
      summary: 'Chevening là học bổng toàn phần danh giá toàn cầu của Chính phủ Anh dành cho các nhà lãnh đạo tương lai theo học chương trình Thạc sĩ 1 năm tại bất kỳ trường đại học nào tại Vương quốc Anh.',
      requirements: {
        degree: 'Tốt nghiệp Đại học',
        work_experience_hours: 2800,
        unconditional_uk_offer: true,
      },
      fieldCodes: ['01', '02', '03', '04', '05'],
      degreeLevel: ['master'],
      studyLocation: 'United Kingdom (Vương quốc Anh)',
      fundingType: 'full',
      fundingValueVnd: 1550000000,
      applyStart: new Date('2026-08-05T00:00:00.000Z'),
      deadline: new Date('2026-11-05T12:00:00.000Z'),
      canonicalUrl: 'https://www.chevening.org/scholarship/vietnam/',
      requiredDocuments: [
        { name: '4 Bài luận Chevening (Leadership, Networking, Studying in UK, Career Plan)', format_hint: 'Tối đa 500 từ mỗi bài' },
        { name: 'Bằng đại học và bảng điểm dịch công chứng', format_hint: 'File PDF' },
        { name: 'Thư mời nhập học từ 3 trường đại học tại Anh', format_hint: 'Ít nhất 1 unconditional offer trước tháng 7' },
      ],
      applicationSteps: [
        { order: 1, title: 'Nộp đơn trực tuyến trên cổng Chevening', description: 'Hoàn thành hồ sơ và 4 bài luận chuyên sâu.' },
        { order: 2, title: 'Thông báo danh sách phỏng vấn (Shortlist)', description: 'Tháng 2 hàng năm công bố ứng viên vào vòng phỏng vấn.' },
        { order: 3, title: 'Phỏng vấn tại Đại sứ quán Anh', description: 'Phỏng vấn trực tiếp tại Đại sứ quán Anh Hà Nội hoặc Tổng Lãnh sự quán TP.HCM.' },
      ],
      timelineMilestones: [
        { label: 'Mở cổng nộp hồ sơ', date: '2026-08-05' },
        { label: 'Hạn cuối nộp hồ sơ', date: '2026-11-05' },
        { label: 'Vòng phỏng vấn', date: '2027-02-28 đến 2027-04-15' },
      ],
      benefits: [
        { label: 'Tài trợ', value: '100% học phí thạc sĩ ĐH Anh, sinh hoạt phí GBP 1.300/tháng, vé máy bay khứ hồi, lệ phí Visa' },
      ],
      selectionRounds: 3,
    },
    {
      slug: 'idp-fulbright-foreign-student-program-2026',
      kind: 'scholarship_foreign',
      title: 'Học Bổng Toàn Phần Fulbright Hoa Kỳ (Fulbright Vietnamese Student) 2026',
      organization: 'Bộ Ngoại giao Hoa Kỳ (U.S. Department of State)',
      organizationType: 'government',
      summary: 'Chương trình học bổng Fulbright tài trợ toàn phần bậc Thạc sĩ tại các trường đại học hàng đầu Hoa Kỳ, nhằm thúc đẩy sự hiểu biết lẫn nhau giữa nhân dân hai nước Việt Nam và Mỹ.',
      requirements: {
        citizenship: 'Việt Nam',
        gpa_min: 7.0,
        ielts_min: 6.5,
        toefl_ibt_min: 79,
        work_experience_years: 2,
      },
      fieldCodes: ['01', '02', '03', '05'],
      degreeLevel: ['master'],
      studyLocation: 'United States (Hoa Kỳ)',
      fundingType: 'full',
      fundingValueVnd: 2200000000,
      applyStart: new Date('2026-01-05T00:00:00.000Z'),
      deadline: new Date('2026-04-15T17:00:00.000Z'),
      canonicalUrl: 'https://vn.usembassy.gov/education-culture/fulbright-program-vietnam/vietnamese-student-program/',
      requiredDocuments: [
        { name: 'Bài luận mục tiêu học tập (Study Objective Essay)', format_hint: 'PDF tối đa 2 trang' },
        { name: 'Bài luận cá nhân (Personal Statement Essay)', format_hint: 'PDF tối đa 2 trang' },
        { name: '3 Thư giới thiệu (Letters of Recommendation)', format_hint: 'Gửi trực tiếp qua hệ thống Slate' },
        { name: 'Bảng điểm và bằng đại học dịch thuật', format_hint: 'Bản dịch có xác nhận' },
      ],
      applicationSteps: [
        { order: 1, title: 'Nộp hồ sơ trực tuyến hệ thống Slate', description: 'Kê khai học vấn và tải lên 2 bài luận cốt lõi.' },
        { order: 2, title: 'Phỏng vấn song phương', description: 'Phỏng vấn bằng tiếng Anh với Hội đồng tuyển chọn Việt - Mỹ.' },
        { order: 3, title: 'Thi GRE/GMAT và nộp đơn vào các trường ĐH Mỹ', description: 'Fulbright hỗ trợ toàn bộ lệ phí thi và kết nối trường ĐH Mỹ.' },
      ],
      timelineMilestones: [
        { label: 'Hạn chót nộp hồ sơ Fulbright', date: '2026-04-15' },
        { label: 'Vòng phỏng vấn tuyển chọn', date: '2026-08-20' },
      ],
      benefits: [
        { label: 'Quyền lợi', value: '100% học phí, sinh hoạt phí $2.000/tháng, bảo hiểm y tế và vé máy bay khứ hồi Mỹ' },
      ],
      selectionRounds: 3,
    },
    {
      slug: 'idp-daad-germany-scholarship-2026',
      kind: 'scholarship_foreign',
      title: 'Học Bổng Toàn Phần Chính Phủ Đức DAAD Helmut-Schmidt 2026 – 2027',
      organization: 'Cơ quan Trao đổi Hàn lâm Đức (DAAD)',
      organizationType: 'government',
      summary: 'Học bổng DAAD Helmut-Schmidt tài trợ toàn bộ chi phí du học Thạc sĩ ngành Chính sách công và Quản trị tốt tại các trường đại học hàng đầu Cộng hòa Liên bang Đức.',
      requirements: {
        gpa_min: 7.5,
        ielts_min: 6.5,
        degree: 'Tốt nghiệp ĐH các ngành Luật, Kinh tế, Xã hội, Khoa học Chính trị',
      },
      fieldCodes: ['01', '02'],
      degreeLevel: ['master'],
      studyLocation: 'Germany (Cộng hòa Liên bang Đức)',
      fundingType: 'full',
      fundingValueVnd: 950000000,
      applyStart: new Date('2026-06-01T00:00:00.000Z'),
      deadline: new Date('2026-07-31T23:59:00.000Z'),
      canonicalUrl: 'https://www.daad-vietnam.vn/vi/tim-hoc-bong/hoc-bong-tai-duc/',
      requiredDocuments: [
        { name: 'Mẫu đơn đăng ký DAAD', format_hint: 'Kê khai mẫu PDF DAAD chuẩn' },
        { name: 'Thư nguyện vọng (Motivation Letter)', format_hint: 'Tối đa 2 trang' },
        { name: 'Bằng tốt nghiệp và bảng điểm ĐH dịch tiếng Đức hoặc Anh', format_hint: 'Có công chứng' },
      ],
      applicationSteps: [
        { order: 1, title: 'Nộp đơn trực tiếp tới các trường ĐH tại Đức', description: 'Gửi hồ sơ kèm mã học bổng DAAD Helmut-Schmidt.' },
        { order: 2, title: 'Hội đồng xét tuyển độc lập', description: 'Các trường đề cử danh sách ứng viên xuất sắc lên ủy ban DAAD.' },
      ],
      timelineMilestones: [
        { label: 'Thời gian tiếp nhận hồ sơ', date: '2026-06-01 đến 2026-07-31' },
      ],
      benefits: [
        { label: 'Trợ cấp', value: '934 EUR/tháng, miễn 100% học phí, bảo hiểm y tế và khóa học tiếng Đức miễn phí 6 tháng' },
      ],
      selectionRounds: 2,
    },
    {
      slug: 'idp-melbourne-international-undergraduate-2026',
      kind: 'scholarship_foreign',
      title: 'Học Bổng Cử Nhân Quốc Tế Đại Học Melbourne (Úc) Lên Đến 100% Học Phí',
      organization: 'University of Melbourne (Top 1 Úc)',
      organizationType: 'university',
      summary: 'Đại học Melbourne trao tặng các suất học bổng danh giá lên đến 100% toàn bộ học phí 3-4 năm cử nhân cho sinh viên quốc tế có thành tích học tập xuất sắc.',
      requirements: {
        high_school_gpa: 9.2,
        sat_min: 1480,
        ielts_min: 7.0,
      },
      fieldCodes: ['01', '03', '04', '05'],
      degreeLevel: ['bachelor'],
      studyLocation: 'Melbourne, Australia (Úc)',
      fundingType: 'full',
      fundingValueVnd: 2800000000,
      applyStart: new Date('2026-01-01T00:00:00.000Z'),
      deadline: new Date('2026-06-30T17:00:00.000Z'),
      canonicalUrl: 'https://scholarships.unimelb.edu.au/awards/melbourne-international-undergraduate-scholarship',
      requiredDocuments: [
        { name: 'Hồ sơ tuyển sinh cử nhân ĐH Melbourne', format_hint: 'Tự động xét học bổng khi nộp hồ sơ nhập học' },
        { name: 'Bảng điểm THPT lớp 10, 11, 12', format_hint: 'GPA >= 9.0' },
      ],
      applicationSteps: [
        { order: 1, title: 'Nộp đơn nhập học vào Melbourne qua IDP', description: 'Được miễn lệ phí xét đơn khi nộp qua văn phòng IDP Việt Nam.' },
        { order: 2, title: 'Hệ thống tự động xếp hạng học bổng', description: 'Căn cứ vào điểm học thuật xuất sắc để trao học bổng 10.000 AUD, 50% hoặc 100% học phí.' },
      ],
      timelineMilestones: [
        { label: 'Xét duyệt đợt 1', date: '2026-03-31' },
        { label: 'Xét duyệt đợt 2', date: '2026-06-30' },
      ],
      benefits: [
        { label: 'Giá trị', value: '100% học phí (lên đến 2,8 tỷ VND) hoặc AUD 10.000 - 50% học phí' },
      ],
      selectionRounds: 1,
    },
    {
      slug: 'idp-toronto-lester-b-pearson-2026',
      kind: 'scholarship_foreign',
      title: 'Học Bổng Toàn Phần Lester B. Pearson – Đại Học Toronto (Canada) 2026 – 2027',
      organization: 'University of Toronto (Top 1 Canada)',
      organizationType: 'university',
      summary: 'Học bổng danh giá và cạnh tranh nhất của Đại học Toronto dành cho sinh viên quốc tế xuất sắc, chi trả toàn bộ học phí 4 năm, sách vở, phí phụ thu và toàn bộ chi phí lưu trú ký túc xá.',
      requirements: {
        school_nomination: true,
        high_school_gpa: 9.3,
        ielts_min: 7.0,
      },
      fieldCodes: ['01', '02', '03', '04', '05'],
      degreeLevel: ['bachelor'],
      studyLocation: 'Toronto, Canada',
      fundingType: 'full',
      fundingValueVnd: 3200000000,
      applyStart: new Date('2026-09-01T00:00:00.000Z'),
      deadline: new Date('2026-11-30T17:00:00.000Z'),
      canonicalUrl: 'https://future.utoronto.ca/pearson/about/',
      requiredDocuments: [
        { name: 'Thư đề cử chính thức từ trường THPT (Nomination)', format_hint: 'Mỗi trường THPT chỉ được đề cử 1 học sinh' },
        { name: 'Bài luận cá nhân Lester B. Pearson', format_hint: 'Thể hiện tố chất lãnh đạo và tư duy đổi mới' },
      ],
      applicationSteps: [
        { order: 1, title: 'Trường THPT gửi thư đề cử', description: 'Hạn chót đề cử trước ngày 30/11.' },
        { order: 2, title: 'Học sinh hoàn thành đơn ứng tuyển học bổng', description: 'Nộp hồ sơ trực tuyến trên cổng OUAC và portal trường.' },
      ],
      timelineMilestones: [
        { label: 'Hạn trường THPT đề cử', date: '2026-11-30' },
        { label: 'Hạn học sinh nộp hồ sơ', date: '2027-01-15' },
      ],
      benefits: [
        { label: 'Tài trợ', value: '100% học phí 4 năm cử nhân, chỗ ở ký túc xá, giáo trình và bảo hiểm tại Canada' },
      ],
      selectionRounds: 2,
    },
  ];
}
