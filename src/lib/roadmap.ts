import { RequiredDocument, ChecklistItem } from '@/types';

interface DocumentTemplate {
  keywords: string[];
  leadWeeks: number;
  taskTemplate: (docName: string) => string;
  notes: string;
}

const PREP_TEMPLATES: DocumentTemplate[] = [
  {
    keywords: ['ielts', 'toefl', 'toeic', 'tiếng anh', 'ngoại ngữ', 'chứng chỉ tiếng'],
    leadWeeks: 10,
    taskTemplate: (doc) => `Đăng ký thi và ôn luyện nước rút ${doc}`,
    notes: 'Cần tối thiểu 2-4 tuần để nhận kết quả bảng điểm chính thức.',
  },
  {
    keywords: ['thư giới thiệu', 'recommendation', 'reference'],
    leadWeeks: 6,
    taskTemplate: (doc) => `Liên hệ giáo viên/giảng viên xin ${doc}`,
    notes: 'Gửi kèm CV và tóm tắt thành tích để người viết có thông tin chi tiết.',
  },
  {
    keywords: ['bài luận', 'essay', 'sop', 'statement of purpose', 'thư nguyện vọng'],
    leadWeeks: 4,
    taskTemplate: (doc) => `Hoàn thiện bản thảo ${doc} và nhờ người sửa (proofread)`,
    notes: 'Đối chiếu bài viết với tiêu chí cụ thể của học bổng bằng công cụ phản hồi luận.',
  },
  {
    keywords: ['bảng điểm', 'học bạ', 'transcript', 'công chứng', 'dịch thuật'],
    leadWeeks: 3,
    taskTemplate: (doc) => `Xin cấp và dịch thuật công chứng ${doc}`,
    notes: 'Kiểm tra kỹ số lượng bản dịch và thời hạn công chứng hợp lệ.',
  },
  {
    keywords: ['cv', 'resume', 'hồ sơ năng lực', 'portfolio'],
    leadWeeks: 3,
    taskTemplate: (doc) => `Cập nhật và định dạng chuẩn ${doc}`,
    notes: 'Tối ưu hóa các dự án và thành tích nổi bật liên quan đến ngành học.',
  },
  {
    keywords: ['khám sức khỏe', 'giấy khám sức khoẻ', 'medical'],
    leadWeeks: 2,
    taskTemplate: (doc) => `Đi khám sức khỏe tại bệnh viện được chỉ định để nộp ${doc}`,
    notes: 'Một số học bổng chỉ định các bệnh viện đa khoa tuyến tỉnh/trung ương.',
  },
];

/**
 * Sinh lộ trình chuẩn bị hồ sơ đếm ngược từ hạn nộp (Tính năng B.2)
 */
export function generatePrepRoadmap(
  deadlineStr: string | null | undefined,
  requiredDocuments: RequiredDocument[] = []
): ChecklistItem[] {
  const deadline = deadlineStr ? new Date(deadlineStr) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  const checklist: ChecklistItem[] = [];

  // Mốc cuối cùng: Rà soát tổng thể trước 1 tuần
  const reviewDate = new Date(deadline.getTime() - 7 * 24 * 60 * 60 * 1000);
  checklist.push({
    id: 'step-final-review',
    task: 'Rà soát tổng thể toàn bộ hồ sơ và chuẩn bị nộp trên cổng chính thức',
    weekNumber: 1,
    isCompleted: false,
    deadline: reviewDate.toISOString().split('T')[0],
  });

  // Khớp từng tài liệu vào template
  const matchedWeeks = new Set<number>();

  requiredDocuments.forEach((doc, index) => {
    const docLower = doc.name.toLowerCase();
    const template = PREP_TEMPLATES.find((t) =>
      t.keywords.some((kw) => docLower.includes(kw))
    );

    const leadWeeks = template ? template.leadWeeks : 3;
    const taskName = template ? template.taskTemplate(doc.name) : `Chuẩn bị ${doc.name} (${doc.format_hint || 'theo yêu cầu'})`;
    const targetDate = new Date(deadline.getTime() - leadWeeks * 7 * 24 * 60 * 60 * 1000);

    checklist.push({
      id: `step-doc-${index}`,
      task: taskName,
      weekNumber: leadWeeks,
      isCompleted: false,
      deadline: targetDate.toISOString().split('T')[0],
    });

    matchedWeeks.add(leadWeeks);
  });

  // Nếu không có tài liệu cụ thể, thêm các mốc mẫu
  if (requiredDocuments.length === 0) {
    [
      { week: 8, task: 'Kiểm tra điều kiện ngoại ngữ và chuẩn bị chứng chỉ tương đương' },
      { week: 4, task: 'Chuẩn bị bài luận cá nhân và thư nguyện vọng' },
      { week: 2, task: 'Sao y công chứng học bạ / bảng điểm và giấy tờ tùy thân' },
    ].forEach((m, idx) => {
      const targetDate = new Date(deadline.getTime() - m.week * 7 * 24 * 60 * 60 * 1000);
      checklist.push({
        id: `step-default-${idx}`,
        task: m.task,
        weekNumber: m.week,
        isCompleted: false,
        deadline: targetDate.toISOString().split('T')[0],
      });
    });
  }

  // Sắp xếp đếm ngược theo số tuần từ xa nhất đến gần nhất (Tuần 10 -> Tuần 6 -> Tuần 1)
  return checklist.sort((a, b) => b.weekNumber - a.weekNumber);
}
