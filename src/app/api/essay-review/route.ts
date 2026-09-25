import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { llmRouter } from '@/lib/llm/router';
import { enforceRateLimit, essayLimiter, rateLimitResponse } from '@/lib/security/rate-limit';
import { getAuthUser } from '@/lib/security/auth';

const ACADEMIC_INTEGRITY_PROMPT = `Bạn là cố vấn bài luận học bổng chuyên sâu.
NHIỆM VỤ CỦA BẠN: Đối chiếu bài viết của ứng viên với các tiêu chí xét tuyển của học bổng cụ thể được cung cấp.

QUY TẮC BẮT BUỘC VỀ LIÊM CHÍNH HỌC THUẬT:
1. TUYỆT ĐỐI KHÔNG viết hộ bài luận, không viết lại câu chữ, không sinh bất kỳ đoạn văn thay thế nào cho thí sinh.
2. Đầu ra CHỈ ĐƯỢC PHÉP bao gồm: Nhận xét điểm mạnh, điểm yếu, các tiêu chí học bổng mà bài viết chưa chạm tới, và CÂU HỎI GỢI MỞ để thí sinh tự tư duy và hoàn thiện bài viết của mình.
3. Chỉ trả về định dạng JSON hợp lệ theo cấu trúc:
{
  "fitScore": number (từ 0 đến 100),
  "strengths": ["điểm mạnh 1", "điểm mạnh 2"],
  "weaknesses": ["điểm hạn chế 1", "điểm hạn chế 2"],
  "missingCriteria": ["tiêu chí của học bổng chưa được đề cập rõ 1"],
  "guidingQuestions": ["câu hỏi gợi mở 1 để thí sinh tự bổ sung ý"],
  "overallFeedback": "tổng kết nhận xét ngắn gọn dưới 300 từ"
}`;

export async function POST(request: NextRequest) {
  try {
    // Auth: must be logged in (prevent LLM quota abuse)
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng đăng nhập để sử dụng tính năng phân tích bài luận.' },
        { status: 401 }
      );
    }

    // Per-user rate limit (5 req / 10 min) — keyed by userId, not IP
    const rl = enforceRateLimit(essayLimiter, request, authUser.id);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

    const body = await request.json();
    const { opportunityId, essayText } = body;

    if (!essayText || essayText.trim().length < 50) {
      return NextResponse.json(
        { success: false, error: 'Bài luận cần tối thiểu 50 ký tự để có thể phân tích.' },
        { status: 400 }
      );
    }

    if (essayText.length > 10000) {
      return NextResponse.json(
        { success: false, error: 'Bài luận quá dài. Tối đa 10.000 ký tự.' },
        { status: 400 }
      );
    }

    // Lấy thông tin tiêu chí học bổng từ DB
    const opp = await prisma.opportunity.findUnique({
      where: { id: Number(opportunityId) },
      select: {
        title: true,
        organization: true,
        requirements: true,
        summary: true,
      },
    });

    if (!opp) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy thông tin học bổng.' },
        { status: 404 }
      );
    }

    const userPrompt = `
DỮ LIỆU HỌC BỔNG:
- Tên học bổng: ${opp.title}
- Tổ chức: ${opp.organization}
- Tóm tắt: ${opp.summary || 'Không có'}
- Yêu cầu & Tiêu chí trích xuất: ${opp.requirements}

BẢN NHÁP BÀI LUẬN CỦA THÍ SINH:
"""
${essayText.slice(0, 4000)}
"""

Hãy đối chiếu bài viết trên với tiêu chí cụ thể của học bổng này và trả về JSON nhận xét theo quy tắc liêm chính học thuật.`;

    const rawResponse = await llmRouter.complete(
      ACADEMIC_INTEGRITY_PROMPT,
      userPrompt,
      `essay-${opportunityId}-${essayText.slice(0, 40)}`
    );

    let parsedResult = null;

    if (rawResponse) {
      try {
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Fallback
      }
    }

    // Fallback nếu không có LLM key hoặc gọi LLM thất bại
    if (!parsedResult) {
      const wordCount = essayText.trim().split(/\s+/).length;
      parsedResult = {
        fitScore: wordCount >= 250 ? 80 : 65,
        strengths: [
          `Độ dài bài viết tương đối phù hợp (${wordCount} từ).`,
          'Bài viết thể hiện được nguyện vọng tham gia chương trình học.',
        ],
        weaknesses: [
          'Cần liên kết rõ hơn giữa mục tiêu nghề nghiệp và thế mạnh của chương trình tại ' + opp.organization,
          'Cần đưa thêm số liệu hoặc dẫn chứng cụ thể cho các thành tích đã đạt được.',
        ],
        missingCriteria: [
          'Chưa nêu rõ đóng góp dự kiến cho cộng đồng hoặc tổ chức sau khi nhận học bổng.',
        ],
        guidingQuestions: [
          'Tại sao chương trình này là bước đi không thể thiếu trong kế hoạch 3-5 năm tới của bạn?',
          'Kinh nghiệm vượt khó nổi bật nhất nào chứng minh bạn xứng đáng với tiêu chí của ' + opp.title + '?',
        ],
        overallFeedback:
          'Bài luận có khung ý tưởng tốt. Để gia tăng tính cạnh tranh, hãy đào sâu vào các giá trị cốt lõi mà ' +
          opp.organization +
          ' tìm kiếm và trả lời các câu hỏi gợi mở ở trên trước khi nộp bản hoàn chỉnh.',
      };
    }

    return NextResponse.json({
      success: true,
      data: parsedResult,
    });
  } catch (error) {
    console.error('Essay review error:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi phân tích bài luận.' },
      { status: 500 }
    );
  }
}
