'use client';

import React, { useState } from 'react';
import {
  Sparkle,
  X,
  CheckCircle,
  WarningCircle,
  Question,
  ShieldCheck,
  PaperPlaneRight,
  Spinner,
} from '@phosphor-icons/react';

interface EssayReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityId: number;
  opportunityTitle: string;
}

interface ReviewResult {
  fitScore: number;
  strengths: string[];
  weaknesses: string[];
  missingCriteria: string[];
  guidingQuestions: string[];
  overallFeedback: string;
}

export default function EssayReviewModal({
  isOpen,
  onClose,
  opportunityId,
  opportunityTitle,
}: EssayReviewModalProps) {
  const [essayText, setEssayText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const wordCount = essayText.trim() ? essayText.trim().split(/\s+/).length : 0;

  const handleSubmit = async () => {
    if (wordCount < 30) {
      setError('Vui lòng nhập bài viết tối thiểu 30 từ để hệ thống đối chiếu chính xác.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/essay-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId, essayText }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Có lỗi xảy ra');
      }
      setResult(json.data);
    } catch (err: any) {
      setError(err.message || 'Không thể kết nối máy chủ phân tích.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 text-sm font-semibold">
              <Sparkle size={18} weight="fill" />
              <span>Trợ lý AI Phản hồi Bài luận (Tính năng B.5)</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1 line-clamp-1">
              {opportunityTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cảnh báo liêm chính học thuật bắt buộc (Tài liệu v2.1 mục B.5) */}
        <div className="my-4 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2">
          <ShieldCheck size={20} className="flex-shrink-0 text-blue-600" />
          <span>
            <strong>Góp ý từ AI, không phải bài viết hoàn chỉnh:</strong> Công cụ chỉ nhận xét và gợi mở câu hỏi, tuyệt đối không viết hộ bài luận nhằm đảm bảo liêm chính học thuật.
          </span>
        </div>

        {/* Nội dung cuộn được */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {!result ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Dán bản nháp bài luận hoặc thư trình bày nguyện vọng (SOP):
              </label>
              <textarea
                value={essayText}
                onChange={(e) => setEssayText(e.target.value)}
                placeholder="Dán nội dung bài luận của bạn vào đây (tiếng Việt hoặc tiếng Anh)..."
                rows={10}
                className="w-full p-4 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none transition"
              />
              <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                <span>Số từ: {wordCount} từ</span>
                <span>Tối thiểu 30 từ</span>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl text-xs mt-2 border border-red-200 dark:border-red-900">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Điểm tương thích */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    Mức độ phù hợp với tiêu chí học bổng
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Dựa trên các tiêu chuẩn xét tuyển cụ thể của nhà trường
                  </p>
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {result.fitScore}/100
                </div>
              </div>

              {/* Nhận xét tổng quan */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Đánh giá chung</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {result.overallFeedback}
                </p>
              </div>

              {/* Điểm mạnh & Điểm hạn chế */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/60 rounded-xl">
                  <h5 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <CheckCircle size={16} /> Điểm sáng đã đạt được
                  </h5>
                  <ul className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300 list-disc pl-4">
                    {result.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/60 rounded-xl">
                  <h5 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <WarningCircle size={16} /> Khía cạnh cần làm sâu sắc hơn
                  </h5>
                  <ul className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300 list-disc pl-4">
                    {result.weaknesses.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Tiêu chí học bổng còn thiếu */}
              {result.missingCriteria && result.missingCriteria.length > 0 && (
                <div className="p-4 bg-red-50/40 dark:bg-red-950/20 border border-red-100 dark:border-red-900/60 rounded-xl">
                  <h5 className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <WarningCircle size={16} /> Tiêu chí học bổng chưa được chạm tới
                  </h5>
                  <ul className="text-xs space-y-1 text-slate-700 dark:text-slate-300 list-disc pl-4">
                    {result.missingCriteria.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Câu hỏi gợi mở để tự phát triển */}
              <div className="p-4 bg-primary-50/40 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/60 rounded-xl">
                <h5 className="text-xs font-bold text-primary-800 dark:text-primary-300 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                  <Question size={16} /> Câu hỏi gợi mở để bạn tự hoàn thiện bài viết
                </h5>
                <ul className="text-xs space-y-2 text-slate-700 dark:text-slate-300">
                  {result.guidingQuestions.map((q, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                        {i + 1}
                      </span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          {result ? (
            <button
              onClick={() => setResult(null)}
              className="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition"
            >
              Chỉnh sửa & Thử lại
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Spinner size={18} className="animate-spin" />
                  <span>Đang đối chiếu với tiêu chí học bổng...</span>
                </>
              ) : (
                <>
                  <PaperPlaneRight size={18} />
                  <span>Phân tích bài luận</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
