import { OpportunityDetail, TimelineMilestone } from '@/types';

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Tạo file chuẩn iCalendar (.ics) cho một cơ hội học bổng / tuyển sinh (Tính năng B.7)
 */
export function generateOpportunityIcs(opportunity: OpportunityDetail): string {
  const now = new Date();
  const dtstamp = formatIcsDate(now);

  const events: string[] = [];

  // 1. Sự kiện chính: Hạn nộp hồ sơ
  if (opportunity.deadline) {
    const deadlineDate = new Date(opportunity.deadline);
    const startDate = new Date(deadlineDate.getTime() - 2 * 60 * 60 * 1000); // 2 giờ trước hạn chót

    events.push(`BEGIN:VEVENT
UID:deadline-${opportunity.id}-${opportunity.slug}@hocbong.vn
DTSTAMP:${dtstamp}
DTSTART:${formatIcsDate(startDate)}
DTEND:${formatIcsDate(deadlineDate)}
SUMMARY:⏰ HẠN CHÓT: ${opportunity.title.replace(/\n/g, ' ')}
DESCRIPTION:Hạn cuối nộp hồ sơ ${opportunity.title} tại ${opportunity.organization}.\\n\\nLink nộp hồ sơ: ${opportunity.canonicalUrl}\\nChi tiết tại Học Bổng VN: https://hocbong.vn/hoc-bong/${opportunity.slug}
URL:${opportunity.canonicalUrl}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Nhắc nhở: Còn 1 ngày nữa là đến hạn nộp hồ sơ ${opportunity.title}
END:VALARM
BEGIN:VALARM
TRIGGER:-P3D
ACTION:DISPLAY
DESCRIPTION:Nhắc nhở: Còn 3 ngày nữa là đến hạn nộp hồ sơ ${opportunity.title}
END:VALARM
END:VEVENT`);
  }

  // 2. Các mốc thời gian phụ (TimelineMilestones)
  if (opportunity.timelineMilestones && opportunity.timelineMilestones.length > 0) {
    opportunity.timelineMilestones.forEach((milestone: TimelineMilestone, idx: number) => {
      if (!milestone.date) return;
      const mDate = new Date(milestone.date);
      const mEnd = new Date(mDate.getTime() + 60 * 60 * 1000);

      events.push(`BEGIN:VEVENT
UID:milestone-${opportunity.id}-${idx}@hocbong.vn
DTSTAMP:${dtstamp}
DTSTART:${formatIcsDate(mDate)}
DTEND:${formatIcsDate(mEnd)}
SUMMARY:📅 ${milestone.label}: ${opportunity.title.replace(/\n/g, ' ')}${milestone.is_estimated ? ' (Dự kiến)' : ''}
DESCRIPTION:Mốc thời gian: ${milestone.label}\\nChương trình: ${opportunity.title} - ${opportunity.organization}\\n\\nChi tiết: https://hocbong.vn/hoc-bong/${opportunity.slug}
STATUS:CONFIRMED
END:VEVENT`);
    });
  }

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//HocBong VN//Nen Tang Tuyen Sinh Hoc Bong//VI
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Học bổng & Tuyển sinh - ${opportunity.title}
X-WR-TIMEZONE:Asia/Ho_Chi_Minh
${events.join('\n')}
END:VCALENDAR`;

  return icsContent;
}

/**
 * Trigger download file .ics trên trình duyệt
 */
export function downloadIcsFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Tạo link 1-Click đồng bộ trực tiếp vào Google Calendar (Chuẩn Common App & UCAS)
 */
export function getGoogleCalendarUrl(opportunity: OpportunityDetail | any): string | null {
  if (!opportunity.deadline) return null;

  const deadlineDate = new Date(opportunity.deadline);
  const startDate = new Date(deadlineDate.getTime() - 2 * 60 * 60 * 1000); // 2h trước hạn

  const formatGCalDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const title = encodeURIComponent(`⏰ Hạn Chót Nộp: ${opportunity.title}`);
  const dates = `${formatGCalDate(startDate)}/${formatGCalDate(deadlineDate)}`;
  const details = encodeURIComponent(
    `Hạn chót nộp hồ sơ chương trình: ${opportunity.title}\nĐơn vị: ${opportunity.organization}\nĐịa điểm: ${opportunity.studyLocation || 'Toàn cầu'}\n\nLink nộp hồ sơ chính thức: ${opportunity.canonicalUrl}\nTra cứu chi tiết: https://hocbong.vn/hoc-bong/${opportunity.slug}`
  );
  const location = encodeURIComponent(opportunity.organization || 'Trực tuyến');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

