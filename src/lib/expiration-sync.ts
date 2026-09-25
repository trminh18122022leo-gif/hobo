import prisma from '@/lib/db';

let lastSyncTimestamp = 0;
const SYNC_INTERVAL_MS = 60 * 1000; // Check at most once per minute

/**
 * Tự động rà soát và chuyển toàn bộ các cơ hội đã quá hạn sang trạng thái 'expired'
 * Đảm bảo hệ thống loại bỏ ngay lập tức các bài đã hết hạn khỏi đề xuất & tìm kiếm.
 */
export async function syncExpiredOpportunities(force: boolean = false): Promise<number> {
  const now = Date.now();
  if (!force && now - lastSyncTimestamp < SYNC_INTERVAL_MS) {
    return 0;
  }
  lastSyncTimestamp = now;

  try {
    const currentDate = new Date();
    const result = await prisma.opportunity.updateMany({
      where: {
        status: 'published',
        deadline: { lt: currentDate },
      },
      data: {
        status: 'expired',
      },
    });

    if (result.count > 0) {
      console.log(`[ExpirationSync] Đã tự động cập nhật ${result.count} cơ hội quá hạn sang trạng thái 'expired'.`);
    }

    return result.count;
  } catch (error) {
    console.error('[ExpirationSync] Lỗi khi đồng bộ hạn chót:', error);
    return 0;
  }
}

/**
 * Kiểm tra nhanh một cơ hội có đang thực sự còn hạn và hợp lệ hay không
 */
export function isOpportunityActive(opp: { status: string; deadline?: Date | string | null }): boolean {
  if (opp.status !== 'published') return false;
  if (!opp.deadline) return true; // Tuyển sinh hoặc học bổng mở định kỳ / rolling
  const deadlineDate = typeof opp.deadline === 'string' ? new Date(opp.deadline) : opp.deadline;
  return deadlineDate.getTime() >= Date.now();
}
