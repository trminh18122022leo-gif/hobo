'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  OpportunityDetail,
  KIND_LABELS,
  FUNDING_LABELS,
  ProfileInput,
  HistoricalBenchmarkEntry,
} from '@/types';
import {
  CalendarBlank,
  Clock,
  Money,
  GraduationCap,
  MapPin,
  CheckCircle,
  XCircle,
  FileText,
  Gift,
  Steps,
  Question,
  ArrowSquareOut,
  Scales,
  BookmarkSimple,
  DownloadSimple,
  Sparkle,
  WarningCircle,
  ShareNetwork,
  ShieldCheck,
  Calculator,
  Gauge,
  TrendUp,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Lightning,
} from '@phosphor-icons/react';
import { useCompare } from '@/context/CompareContext';
import { generatePrepRoadmap } from '@/lib/roadmap';
import { generateOpportunityIcs, downloadIcsFile, getGoogleCalendarUrl } from '@/lib/calendar';
import BenchmarkChart from '@/components/BenchmarkChart';
import VersionDiffViewer from '@/components/VersionDiffViewer';
import EssayReviewModal from '@/components/EssayReviewModal';
import NetPriceCalculatorModal from '@/components/NetPriceCalculatorModal';

interface OpportunityDetailViewProps {
  opportunity: OpportunityDetail;
  similarOpportunities?: any[];
  historicalBenchmarks?: HistoricalBenchmarkEntry[];
}

export default function OpportunityDetailView({
  opportunity,
  similarOpportunities = [],
  historicalBenchmarks = [],
}: OpportunityDetailViewProps) {
  const { addToCompare, isInCompare } = useCompare();
  const [userProfile, setUserProfile] = useState<ProfileInput | null>(null);
  const [isTracked, setIsTracked] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [isEssayModalOpen, setIsEssayModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isNetPriceModalOpen, setIsNetPriceModalOpen] = useState(false);
  const [checkedDocs, setCheckedDocs] = useState<Record<number, boolean>>({});

  // Đánh giá Xác suất Trúng tuyển (Niche & Fastweb benchmark)
  const [userGpa, setUserGpa] = useState<number>(3.5);
  const [userIelts, setUserIelts] = useState<number>(6.5);
  const [userSopReady, setUserSopReady] = useState<'not_started' | 'drafting' | 'ready'>('drafting');
  const [hasExtracurriculars, setHasExtracurriculars] = useState<boolean>(true);

  // Khôi phục checklist từ localStorage (DAAD & PhDPortal benchmark)
  useEffect(() => {
    try {
      const savedDocs = localStorage.getItem(`opp_checklist_${opportunity.id}`);
      if (savedDocs) {
        setCheckedDocs(JSON.parse(savedDocs));
      }
    } catch {}
  }, [opportunity.id]);

  const toggleDocCheck = (idx: number) => {
    setCheckedDocs((prev) => {
      const next = { ...prev, [idx]: !prev[idx] };
      try {
        localStorage.setItem(`opp_checklist_${opportunity.id}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    // Lấy profile người dùng để so khớp điều kiện
    fetch('/api/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setUserProfile(data.data);
          if (data.data.gpa) setUserGpa(Number(data.data.gpa));
        }
      })
      .catch(() => {});

    // Kiểm tra xem đã lưu vào tracker chưa
    fetch('/api/tracker')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const exists = data.data.some((item: any) => item.opportunityId === opportunity.id);
          setIsTracked(exists);
        }
      })
      .catch(() => {});
  }, [opportunity.id]);

  const inCompare = isInCompare(opportunity.id);

  // Tính số ngày còn lại đến hạn
  const isExpired = opportunity.deadline ? new Date(opportunity.deadline).getTime() < Date.now() : false;
  const daysLeft = opportunity.deadline
    ? Math.ceil((new Date(opportunity.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Tính kiểm tra độ tươi (>48h)
  const isStale =
    opportunity.lastVerifiedAt &&
    Date.now() - new Date(opportunity.lastVerifiedAt).getTime() > 48 * 60 * 60 * 1000;

  // 1-Click Google Calendar URL (Common App & UCAS benchmark)
  const googleCalendarUrl = getGoogleCalendarUrl(opportunity);

  // Xử lý Thêm vào Kanban Tracker (B.6)
  const handleToggleTrack = async () => {
    try {
      setTrackingLoading(true);
      const res = await fetch('/api/tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId: opportunity.id }),
      });
      const data = await res.json();
      if (data.success) {
        setIsTracked(true);
        alert('Đã thêm vào bảng theo dõi hồ sơ của bạn!');
      } else {
        alert(data.error || 'Vui lòng đăng nhập để theo dõi hồ sơ.');
      }
    } catch {
      alert('Không thể kết nối máy chủ.');
    } finally {
      setTrackingLoading(false);
    }
  };

  // Xuất file lịch .ics (B.7)
  const handleExportIcs = () => {
    const icsString = generateOpportunityIcs(opportunity);
    downloadIcsFile(`${opportunity.slug}-deadline.ics`, icsString);
  };

  // Sinh lộ trình đếm ngược tuần (B.2)
  const prepRoadmap = generatePrepRoadmap(opportunity.deadline, opportunity.requiredDocuments || []);

  // So khớp điều kiện với Profile người dùng
  const reqObj: any = opportunity.requirements || {};
  const gpaMin = Number(reqObj.gpa_min || reqObj.gpa) || 3.0;
  const hasGpaCheck = reqObj.gpa_min || reqObj.gpa;
  const isGpaMet = hasGpaCheck && userProfile?.gpa ? userProfile.gpa >= gpaMin : null;

  // Đánh giá Xác suất Trúng tuyển & Độ tương thích (Smart Match Calculation)
  const matchCalculation = useMemo(() => {
    let score = 50;

    // 1. Yếu tố GPA (+25% / -25%)
    const gpaDiff = userGpa - gpaMin;
    if (gpaDiff >= 0.5) score += 25;
    else if (gpaDiff >= 0.2) score += 18;
    else if (gpaDiff >= 0) score += 10;
    else if (gpaDiff >= -0.3) score -= 12;
    else score -= 25;

    // 2. Yếu tố Ngoại ngữ (+20% / -15%)
    const isForeign =
      opportunity.kind === 'scholarship_foreign' ||
      (opportunity.studyLocation && !opportunity.studyLocation.includes('Việt Nam'));
    if (isForeign) {
      if (userIelts >= 8.0) score += 20;
      else if (userIelts >= 7.0) score += 15;
      else if (userIelts >= 6.5) score += 8;
      else score -= 15;
    } else {
      if (userIelts >= 7.0) score += 10;
      else score += 5;
    }

    // 3. Yếu tố Bài luận SOP (+15% / -10%)
    if (userSopReady === 'ready') score += 15;
    else if (userSopReady === 'drafting') score += 5;
    else score -= 10;

    // 4. Hoạt động ngoại khóa / NCKH (+10%)
    if (hasExtracurriculars) score += 10;

    const finalScore = Math.min(98, Math.max(20, score));

    let tier: 'safe' | 'target' | 'reach' = 'target';
    let tierLabel = 'Vừa sức (Target Match)';
    let tierColor = 'text-amber-400 bg-amber-400/10 border-amber-400/30';
    let advice = 'Hồ sơ của bạn khá cạnh tranh. Hãy hoàn thiện bài luận SOP sớm và bổ sung thư giới thiệu để bứt phá.';

    if (finalScore >= 82) {
      tier = 'safe';
      tierLabel = 'An toàn (Safe Match) - Tỷ lệ trúng tuyển rất cao';
      tierColor = 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
      advice = 'Bạn vượt trội so với yêu cầu chuẩn của chương trình! Hãy nộp hồ sơ sớm để được ưu tiên xét duyệt mức tài trợ cao nhất.';
    } else if (finalScore < 60) {
      tier = 'reach';
      tierLabel = 'Thử thách (Reach Match) - Cạnh tranh cao';
      tierColor = 'text-rose-400 bg-rose-400/10 border-rose-400/30';
      advice = 'Chương trình có tính cạnh tranh lớn. Bạn nên cải thiện thêm điểm GPA/IELTS hoặc đầu tư bài luận mang dấu ấn cá nhân.';
    }

    return { score: finalScore, tier, tierLabel, tierColor, advice };
  }, [userGpa, gpaMin, userIelts, userSopReady, hasExtracurriculars, opportunity.kind, opportunity.studyLocation]);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500 flex items-center space-x-2 truncate">
        <Link href="/" className="hover:text-primary-600 transition">Trang chủ</Link>
        <span>&gt;</span>
        <Link href="/tim-kiem" className="hover:text-primary-600 transition">Học bổng & Tuyển sinh</Link>
        <span>&gt;</span>
        <span className="text-slate-900 dark:text-slate-300 font-medium truncate">{opportunity.title}</span>
      </nav>

      {/* Cảnh báo hết hạn */}
      {isExpired && (
        <div className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 p-4 rounded-2xl border border-red-200 dark:border-red-900 flex items-center gap-3">
          <WarningCircle size={24} className="flex-shrink-0" />
          <p className="text-sm font-semibold">
            Chương trình này đã hết hạn nộp hồ sơ. Các thông tin dưới đây được lưu giữ phục vụ mục đích tra cứu và tham khảo lịch sử.
          </p>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          KHỐI 01: THANH TRẠNG THÁI NHANH (QUICK ACTION BAR)
      ════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 font-semibold text-xs rounded-full border border-primary-200 dark:border-primary-900">
              {KIND_LABELS[opportunity.kind] || opportunity.kind}
            </span>
            {opportunity.fundingType && (
              <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold text-xs rounded-full border border-emerald-200 dark:border-emerald-900">
                {FUNDING_LABELS[opportunity.fundingType as keyof typeof FUNDING_LABELS] || opportunity.fundingType}
              </span>
            )}
            {/* Nhãn độ tươi dữ liệu */}
            {isStale ? (
              <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-medium text-xs rounded-full border border-amber-200 dark:border-amber-900 flex items-center gap-1">
                <Clock size={13} />
                <span>Chưa xác minh lại &gt; 48h</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-xs rounded-full flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-500" />
                <span>Dữ liệu đã kiểm tra</span>
              </span>
            )}
          </div>

          {/* Đếm ngược hạn nộp */}
          {daysLeft !== null && (
            <div className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${
              daysLeft < 0
                ? 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                : daysLeft <= 7
                ? 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 animate-pulse'
                : daysLeft <= 30
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
            }`}>
              <Clock size={16} />
              <span>
                {daysLeft < 0
                  ? 'Đã hết hạn'
                  : daysLeft === 0
                  ? 'Hôm nay là hạn chót!'
                  : `Còn ${daysLeft} ngày để nộp hồ sơ`}
              </span>
            </div>
          )}
        </div>

        <div className="pt-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-snug">
            {opportunity.title}
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-2 font-medium flex items-center gap-2">
            <span>{opportunity.organization}</span>
            {opportunity.studyLocation && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin size={16} className="text-slate-400" />
                  {opportunity.studyLocation}
                </span>
              </>
            )}
          </p>

          {/* Các nút hành động chính */}
          <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            {/* Nút nộp hồ sơ / đến trang tuyển sinh gốc */}
            <a
              href={opportunity.canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 rounded-xl font-extrabold shadow-[0_0_25px_rgba(212,175,55,0.35)] hover:brightness-110 active:scale-95 transition-all text-sm group"
            >
              <span>Đến Trang Tuyển Sinh / Nộp Hồ Sơ Gốc</span>
              <ArrowSquareOut size={18} weight="bold" className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            {/* Nút Theo dõi Kanban (B.6) */}
            <button
              onClick={handleToggleTrack}
              disabled={trackingLoading || isTracked}
              className={`inline-flex items-center gap-1.5 px-4 py-3 rounded-xl font-semibold text-sm border transition ${
                isTracked
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-700 dark:text-emerald-400'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <BookmarkSimple size={18} weight={isTracked ? 'fill' : 'regular'} />
              <span>{isTracked ? 'Đang theo dõi' : 'Theo dõi hồ sơ'}</span>
            </button>

            {/* Nút Thêm vào so sánh (B.1) */}
            <button
              onClick={() => addToCompare(opportunity)}
              className={`inline-flex items-center gap-1.5 px-4 py-3 rounded-xl font-semibold text-sm border transition ${
                inCompare
                  ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-300 text-primary-700 dark:text-primary-300'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Scales size={18} weight={inCompare ? 'fill' : 'regular'} />
              <span>{inCompare ? 'Đã trong so sánh' : 'So sánh'}</span>
            </button>

            {/* Nút Góp ý bài luận AI (B.5) */}
            <button
              onClick={() => setIsEssayModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 rounded-xl font-semibold text-sm transition"
            >
              <Sparkle size={18} weight="fill" />
              <span>Góp ý bài luận AI</span>
            </button>

            {/* Nút Dự toán Chi phí & Thực chi Net Price (ISC Education & IDP benchmark) */}
            <button
              onClick={() => setIsNetPriceModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/40 text-amber-600 dark:text-amber-300 rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(212,175,55,0.2)] transition active:scale-95"
              title="Dự toán tổng chi phí và số tiền thực chi ròng sau học bổng & đi làm thêm"
            >
              <Calculator size={18} weight="bold" />
              <span>Dự toán Chi phí & Thực chi</span>
            </button>

            {/* Nút Thêm vào Google Calendar 1-Click (Common App & UCAS benchmark) */}
            {googleCalendarUrl && (
              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl font-semibold text-sm transition"
                title="Đồng bộ hạn chót vào Google Calendar với chuông nhắc tự động"
              >
                <CalendarBlank size={18} weight="bold" />
                <span>+ Google Calendar</span>
              </a>
            )}

            {/* Nút Xuất lịch .ics (B.7) */}
            <button
              onClick={handleExportIcs}
              className="inline-flex items-center gap-1.5 px-4 py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-sm transition"
              title="Tải file .ics cho Apple Calendar / Outlook"
            >
              <DownloadSimple size={18} />
              <span>Xuất lịch .ics</span>
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          KHỐI 02: TỔNG QUAN (OVERVIEW DIỄN GIẢI SỰ KIỆN CÓ CẤU TRÚC)
      ════════════════════════════════════════════════════════════ */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText size={22} className="text-primary-600" />
          Tổng quan chương trình
        </h2>
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base">
          {opportunity.summary || 'Thông tin chi tiết chương trình đang được hệ thống đồng bộ và cập nhật liên tục.'}
        </p>

        {/* Thông số nhanh */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Hạn chót nhận đơn</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block">
              {opportunity.deadline ? new Date(opportunity.deadline).toLocaleDateString('vi-VN') : 'Đang mở'}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Giá trị tài trợ</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
              {opportunity.fundingValueVnd
                ? `${new Intl.NumberFormat('vi-VN').format(opportunity.fundingValueVnd)} đ`
                : opportunity.fundingType
                ? FUNDING_LABELS[opportunity.fundingType as keyof typeof FUNDING_LABELS] || opportunity.fundingType
                : 'Theo quy định'}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Cấp học áp dụng</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block">
              {Array.isArray(opportunity.degreeLevel) ? opportunity.degreeLevel.join(', ') : opportunity.degreeLevel || 'Đại học'}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Số vòng tuyển chọn</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block">
              {opportunity.selectionRounds > 0 ? `${opportunity.selectionRounds} vòng` : '2 vòng'}
            </span>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          KHỐI 03: ĐIỀU KIỆN & TIÊU CHÍ (REQUIREMENTS CHECKLIST)
      ════════════════════════════════════════════════════════════ */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle size={22} className="text-emerald-600" />
            Điều kiện & Tiêu chí xét tuyển
          </h2>
          {userProfile && (
            <span className="text-xs px-2.5 py-1 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-semibold rounded-lg">
              Đã đối chiếu với Hồ sơ của bạn
            </span>
          )}
        </div>

        <div className="space-y-3">
          {/* GPA */}
          {gpaMin && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Điểm trung bình (GPA) tối thiểu
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">Yêu cầu từ {gpaMin}/4.0 trở lên</span>
              </div>
              {hasGpaCheck && (
                <div className="flex items-center gap-1 text-xs font-bold">
                  {isGpaMet ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle size={18} weight="fill" /> Đạt ({userProfile?.gpa})
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center gap-1">
                      <XCircle size={18} weight="fill" /> Chưa đạt ({userProfile?.gpa})
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tiêu chí khác từ requirements JSON */}
          {Object.entries(reqObj).map(([key, val]: any, i) => {
            if (key === 'gpa_min' || key === 'gpa') return null;
            return (
              <div
                key={i}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3"
              >
                <CheckCircle size={18} className="text-primary-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-slate-800 dark:text-slate-200">
                  <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                  <span>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          KHỐI 03.5: ĐÁNH GIÁ XÁC SUẤT TRÚNG TUYỂN & ĐỘ TƯƠNG THÍCH (TÍNH NĂNG NICHE & FASTWEB)
      ════════════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkle size={16} weight="fill" />
              <span>Công cụ Độc quyền • Chuẩn Niche & Fastweb Global</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Gauge size={26} className="text-amber-400" />
              <span>Đo Lường Xác Suất Trúng Tuyển Hồ Sơ</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Điều chỉnh thông số cá nhân để hệ thống dự đoán tỷ lệ cạnh tranh và mức độ tương thích của bạn với chương trình.
            </p>
          </div>

          {/* Badge Điểm số & Phân loại */}
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3.5 rounded-2xl">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Độ Tương Thích</span>
              <span className="text-3xl font-black text-amber-300 font-mono">
                {matchCalculation.score}%
              </span>
            </div>
            <div className="h-10 w-[1px] bg-white/10" />
            <div>
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full border inline-block ${matchCalculation.tierColor}`}>
                {matchCalculation.tierLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Thanh trượt điều chỉnh chỉ số */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Slider 1: GPA */}
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <GraduationCap size={16} className="text-amber-400" />
                <span>Điểm GPA của bạn:</span>
              </label>
              <span className="text-sm font-black text-amber-300 font-mono">{userGpa.toFixed(1)} / 4.0</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="4.0"
              step="0.1"
              value={userGpa}
              onChange={(e) => setUserGpa(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>2.0 (TB)</span>
              <span>3.2 (Khá)</span>
              <span>3.6 (Giỏi)</span>
              <span>4.0 (Xuất sắc)</span>
            </div>
          </div>

          {/* Slider 2: IELTS / Tiếng Anh */}
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <SlidersHorizontal size={16} className="text-amber-400" />
                <span>Chứng chỉ IELTS:</span>
              </label>
              <span className="text-sm font-black text-amber-300 font-mono">{userIelts.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="5.0"
              max="9.0"
              step="0.5"
              value={userIelts}
              onChange={(e) => setUserIelts(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>5.0</span>
              <span>6.5 (Chuẩn)</span>
              <span>7.5 (Cao)</span>
              <span>9.0</span>
            </div>
          </div>

          {/* Selector 3: SOP / Bài luận */}
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2">
              <FileText size={16} className="text-amber-400" />
              <span>Tiến độ Bài luận (SOP):</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {[
                { id: 'not_started', label: 'Chưa viết' },
                { id: 'drafting', label: 'Bản nháp' },
                { id: 'ready', label: 'Hoàn thiện' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setUserSopReady(s.id as any)}
                  className={`py-2 px-1 rounded-lg text-center font-bold text-[11px] transition ${
                    userSopReady === s.id
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-300">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasExtracurriculars}
                  onChange={(e) => setHasExtracurriculars(e.target.checked)}
                  className="rounded text-amber-400 bg-slate-900 border-white/20"
                />
                <span>Có hoạt động NCKH / Ngoại khóa</span>
              </label>
            </div>
          </div>
        </div>

        {/* Lời khuyên chiến lược trúng tuyển */}
        <div className="mt-6 p-4 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-start gap-3">
          <TrendUp size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-slate-200">
            <span className="font-bold text-amber-300">Chiến lược tối ưu hồ sơ: </span>
            <span>{matchCalculation.advice}</span>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          KHỐI 04: HỒ SƠ CẦN CHUẨN BỊ (INTERACTIVE CHECKLIST - DAAD & PHD PORTAL)
      ════════════════════════════════════════════════════════════ */}
      {opportunity.requiredDocuments && opportunity.requiredDocuments.length > 0 && (() => {
        const totalDocs = opportunity.requiredDocuments.length;
        const completedDocs = opportunity.requiredDocuments.filter((_, idx) => checkedDocs[idx]).length;
        const progressPct = Math.round((completedDocs / totalDocs) * 100);

        return (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText size={22} className="text-primary-600" />
                  <span>Danh mục Hồ sơ & Tiến độ Chuẩn bị</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Tích chọn các giấy tờ bạn đã hoàn tất để theo dõi mức độ sẵn sàng nộp đơn (Tự động lưu vào trình duyệt).
                </p>
              </div>

              {/* Thanh tiến độ */}
              <div className="flex items-center gap-3 sm:self-center">
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Đã chuẩn bị: <strong className="text-primary-600 dark:text-primary-400">{completedDocs}/{totalDocs}</strong>
                  </span>
                  <span className="text-[11px] text-slate-400 block font-mono">({progressPct}% hoàn thành)</span>
                </div>
                <div className="w-24 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunity.requiredDocuments.map((doc, idx) => {
                const isChecked = Boolean(checkedDocs[idx]);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleDocCheck(idx)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                      isChecked
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-primary-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
                            isChecked
                              ? 'bg-emerald-600 text-white'
                              : 'bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className={isChecked ? 'line-through text-slate-500 dark:text-slate-400' : ''}>
                            {doc.name}
                          </span>
                        </h4>
                        <div className="text-primary-600 dark:text-primary-400">
                          {isChecked ? (
                            <CheckSquare size={20} weight="fill" className="text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Square size={20} className="text-slate-400" />
                          )}
                        </div>
                      </div>

                      {doc.format_hint && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                          <strong>Định dạng yêu cầu:</strong> {doc.format_hint}
                        </p>
                      )}
                    </div>
                    {doc.evidence_quote && (
                      <p className="text-[11px] text-slate-400 italic mt-3 border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
                        &quot;{doc.evidence_quote}&quot;
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════
          KHỐI 05: QUYỀN LỢI CHI TIẾT (BENEFITS TABLE)
      ════════════════════════════════════════════════════════════ */}
      {opportunity.benefits && opportunity.benefits.length > 0 && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Gift size={22} className="text-emerald-600" />
            Chi tiết các khoản quyền lợi & Tài trợ
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase">
                  <th className="py-3 px-4">Hạng mục quyền lợi</th>
                  <th className="py-3 px-4">Mức hỗ trợ</th>
                  <th className="py-3 px-4">Căn cứ văn bản gốc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {opportunity.benefits.map((b, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">{b.label}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">{b.value}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 italic">
                      {b.evidence_quote ? `"${b.evidence_quote}"` : 'Theo quy chế'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════
          KHỐI 06: MỐC THỜI GIAN (TIMELINE MILESTONES)
      ════════════════════════════════════════════════════════════ */}
      {opportunity.timelineMilestones && opportunity.timelineMilestones.length > 0 && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <CalendarBlank size={22} className="text-primary-600" />
            Mốc thời gian quan trọng
          </h2>
          <div className="relative pl-6 border-l-2 border-primary-200 dark:border-primary-900 space-y-6">
            {opportunity.timelineMilestones.map((milestone, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-primary-600 border-4 border-white dark:border-slate-900" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{milestone.label}</span>
                    {milestone.is_estimated && (
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-semibold">
                        Dự kiến
                      </span>
                    )}
                  </h4>
                  <span className="text-xs font-mono font-semibold text-primary-600 dark:text-primary-400">
                    {milestone.date ? new Date(milestone.date).toLocaleDateString('vi-VN') : 'Đang cập nhật'}
                  </span>
                </div>
                {milestone.evidence_quote && (
                  <p className="text-xs text-slate-500 mt-1 italic">&quot;{milestone.evidence_quote}&quot;</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════
          KHỐI 07: QUY TRÌNH XÉT DUYỆT (APPLICATION STEPS)
      ════════════════════════════════════════════════════════════ */}
      {opportunity.applicationSteps && opportunity.applicationSteps.length > 0 && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Steps size={22} className="text-primary-600" />
            Quy trình tuyển chọn qua các vòng
          </h2>
          <div className="space-y-4">
            {opportunity.applicationSteps.map((step) => (
              <div
                key={step.order}
                className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-4"
              >
                <div className="w-8 h-8 rounded-xl bg-primary-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                  {step.order}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{step.title}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════
          KHỐI 08: LỘ TRÌNH CHUẨN BỊ NGƯỢC TỪ HẠN NỘP (TÍNH NĂNG B.2)
      ════════════════════════════════════════════════════════════ */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
              Tính năng đột phá B.2
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
              <Clock size={22} className="text-primary-600" />
              Lộ trình chuẩn bị hồ sơ đếm ngược theo tuần
            </h2>
          </div>
          <button
            onClick={handleToggleTrack}
            className="text-xs px-3 py-1.5 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 rounded-lg font-semibold hover:bg-primary-100 transition self-start sm:self-auto"
          >
            Lưu vào Kanban cá nhân
          </button>
        </div>

        <div className="space-y-3">
          {prepRoadmap.map((item, i) => (
            <div
              key={item.id || i}
              className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  T-{item.weekNumber}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.task}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Khuyến nghị hoàn thành trước {item.weekNumber} tuần tính từ hạn nộp
                  </p>
                </div>
              </div>
              {item.deadline && (
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex-shrink-0">
                  {item.deadline}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          KHỐI 09: XU HƯỚNG LỊCH SỬ & ĐIỂM CHUẨN (TÍNH NĂNG B.3)
      ════════════════════════════════════════════════════════════ */}
      <BenchmarkChart data={historicalBenchmarks} title={`Xu hướng điểm chuẩn & Tỷ lệ chọi qua các năm`} />

      {/* ════════════════════════════════════════════════════════════
          CẢNH BÁO DIFF LỊCH SỬ PHIÊN BẢN (TÍNH NĂNG B.4)
      ════════════════════════════════════════════════════════════ */}
      {opportunity.versions && opportunity.versions.length > 0 && (
        <VersionDiffViewer versions={opportunity.versions} />
      )}

      {/* ════════════════════════════════════════════════════════════
          KHỐI 10: CÂU HỎI THƯỜNG GẶP (FAQ CÓ EVIDENCE QUOTE)
      ════════════════════════════════════════════════════════════ */}
      {opportunity.faq && opportunity.faq.length > 0 && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Question size={22} className="text-primary-600" />
            Câu hỏi thường gặp & Giải đáp trích dẫn
          </h2>
          <div className="space-y-3">
            {opportunity.faq.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left font-semibold text-sm text-slate-900 dark:text-white flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/60 transition"
                  >
                    <span>{item.question}</span>
                    <span className="text-slate-400 font-bold">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div className="p-4 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 space-y-2 border-t border-slate-100 dark:border-slate-800">
                      <p>{item.answer}</p>
                      {item.evidence_quote && (
                        <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          <strong>Trích dẫn nguồn:</strong> &quot;{item.evidence_quote}&quot;
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════
          KHỐI 11: CƠ HỘI TƯƠNG TỰ (SIMILAR OPPORTUNITIES)
      ════════════════════════════════════════════════════════════ */}
      {similarOpportunities.length > 0 && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <GraduationCap size={22} className="text-primary-600" />
            Học bổng & Chương trình tương tự
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {similarOpportunities.map((sim: any) => (
              <Link
                key={sim.id}
                href={`/hoc-bong/${sim.slug}`}
                className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-400 transition block group"
              >
                <span className="text-xs font-semibold text-primary-600 block mb-1">
                  {sim.organization}
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition line-clamp-2">
                  {sim.title}
                </h4>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                  <span>{sim.fundingType || 'Toàn phần'}</span>
                  <span>{sim.deadline ? new Date(sim.deadline).toLocaleDateString('vi-VN') : 'Đang mở'}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════
          KHỐI 12: NGUỒN & MINH BẠCH (SOURCE & TRANSPARENCY)
          ĐÂY LÀ ĐIỂM RỜI TRANG DUY NHẤT!
      ════════════════════════════════════════════════════════════ */}
      <section className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-primary-400 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck size={18} />
              <span>Minh bạch thông tin & Nguồn gốc</span>
            </div>
            <h3 className="text-xl font-bold text-white">Bạn đã sẵn sàng nộp hồ sơ?</h3>
            <p className="text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              Mọi quy định, điều kiện và quyền lợi đã được tổng hợp đầy đủ phía trên. Hãy bấm nút dưới đây để chuyển trực tiếp đến hệ thống nộp hồ sơ chính thức của nhà trường.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-4">
              <span>Đơn vị công bố: {opportunity.source?.name || opportunity.organization}</span>
              <span>•</span>
              <span>
                Cập nhật lần cuối: {new Date(opportunity.lastVerifiedAt).toLocaleString('vi-VN')}
              </span>
            </div>
          </div>

          <div className="flex-shrink-0">
            <a
              href={opportunity.canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-400 text-white font-extrabold rounded-xl text-base shadow-xl shadow-primary-500/30 transition transform hover:-translate-y-0.5"
            >
              <span>Nộp hồ sơ ngay tại nguồn</span>
              <ArrowSquareOut size={20} weight="bold" />
            </a>
          </div>
        </div>
      </section>

      {/* Modal phản hồi bài luận AI (Tính năng B.5) */}
      <EssayReviewModal
        isOpen={isEssayModalOpen}
        onClose={() => setIsEssayModalOpen(false)}
        opportunityId={opportunity.id}
        opportunityTitle={opportunity.title}
      />

      {/* Modal Dự toán Chi phí & Thực chi Net Price (ISC Education & IDP benchmark) */}
      <NetPriceCalculatorModal
        isOpen={isNetPriceModalOpen}
        onClose={() => setIsNetPriceModalOpen(false)}
        opportunity={opportunity}
      />
    </div>
  );
}
