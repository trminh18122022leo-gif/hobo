'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useCompare } from '@/context/CompareContext';
import { FUNDING_LABELS, KIND_LABELS } from '@/types';
import { Scales, DownloadSimple, Trash, ArrowLeft, Check, X, Warning, GraduationCap } from '@phosphor-icons/react';
import { toPng } from 'html-to-image';

export default function ComparePage() {
  const { selectedOpps, removeFromCompare, clearCompare } = useCompare();
  const tableRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportImage = async () => {
    if (!tableRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(tableRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `so-sanh-hoc-bong-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export image error:', err);
      alert('Không thể xuất ảnh, vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

  if (selectedOpps.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 flex items-center justify-center mx-auto mb-4">
          <Scales size={36} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Chưa chọn học bổng nào để so sánh</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
          Hãy tìm kiếm và bấm nút &quot;Thêm vào so sánh&quot; trên các thẻ học bổng để đối chiếu song song lên tới 4 chương trình cùng lúc.
        </p>
        <Link
          href="/tim-kiem"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition"
        >
          <span>Khám phá học bổng ngay</span>
        </Link>
      </div>
    );
  }

  // Tiêu chí so sánh
  const criteriaRows = [
    {
      id: 'kind',
      label: 'Loại chương trình',
      getValue: (o: any) => KIND_LABELS[o.kind as keyof typeof KIND_LABELS] || o.kind,
    },
    {
      id: 'fundingType',
      label: 'Mức tài trợ',
      getValue: (o: any) => FUNDING_LABELS[o.fundingType as keyof typeof FUNDING_LABELS] || o.fundingType || 'Chưa rõ',
    },
    {
      id: 'fundingValue',
      label: 'Giá trị ước tính',
      getValue: (o: any) =>
        o.fundingValueVnd ? `${new Intl.NumberFormat('vi-VN').format(o.fundingValueVnd)} đ` : 'Theo thông báo của trường',
    },
    {
      id: 'deadline',
      label: 'Hạn chót nộp đơn',
      getValue: (o: any) => (o.deadline ? new Date(o.deadline).toLocaleDateString('vi-VN') : 'Đang mở đơn'),
    },
    {
      id: 'location',
      label: 'Địa điểm học tập',
      getValue: (o: any) => o.studyLocation || 'Toàn quốc / Quốc tế',
    },
    {
      id: 'degreeLevel',
      label: 'Cấp học áp dụng',
      getValue: (o: any) => (Array.isArray(o.degreeLevel) ? o.degreeLevel.join(', ') : o.degreeLevel || 'Đại học'),
    },
    {
      id: 'rankScore',
      label: 'Điểm xếp hạng độ uy tín',
      getValue: (o: any) => `${o.rankScore || 85}/100`,
    },
  ];

  // Kiểm tra hàng nào có sự khác biệt giữa các học bổng
  const checkRowDiff = (getValue: (o: any) => string): boolean => {
    if (selectedOpps.length <= 1) return false;
    const firstVal = getValue(selectedOpps[0]);
    return selectedOpps.some((o) => getValue(o) !== firstVal);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href="/tim-kiem"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 mb-2 transition"
          >
            <ArrowLeft size={16} />
            <span>Quay lại tìm kiếm</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Scales size={32} className="text-primary-600" />
            Bảng so sánh học bổng song song
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Đối chiếu trực quan {selectedOpps.length} chương trình. Các hàng có sự khác biệt sẽ tự động được làm nổi bật.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={clearCompare}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium transition"
          >
            <Trash size={16} />
            <span>Xoá tất cả</span>
          </button>
          <button
            onClick={handleExportImage}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
          >
            <DownloadSimple size={18} />
            <span>{isExporting ? 'Đang xuất ảnh...' : 'Xuất ảnh chia sẻ'}</span>
          </button>
        </div>
      </div>

      {/* Bảng so sánh (Ref để chụp ảnh html-to-image) */}
      <div ref={tableRef} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-x-auto p-4 sm:p-6">
        <table className="w-full border-collapse min-w-[700px]">
          <thead>
            <tr>
              <th className="p-4 text-left w-1/5 text-sm font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-tl-xl">
                Tiêu chí so sánh
              </th>
              {selectedOpps.map((opp) => (
                <th
                  key={opp.id}
                  className="p-4 text-left border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 mb-1 inline-block">
                        {KIND_LABELS[opp.kind as keyof typeof KIND_LABELS] || opp.kind}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2">
                        {opp.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{opp.organization}</p>
                    </div>
                    <button
                      onClick={() => removeFromCompare(opp.id)}
                      className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      title="Bỏ khỏi so sánh"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {criteriaRows.map((row) => {
              const hasDiff = checkRowDiff(row.getValue);
              return (
                <tr
                  key={row.id}
                  className={`border-b border-slate-100 dark:border-slate-800/80 transition-colors ${
                    hasDiff
                      ? 'bg-amber-50/50 dark:bg-amber-950/20'
                      : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <td className="p-4 text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    {hasDiff && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" title="Có sự khác biệt" />
                    )}
                    {row.label}
                  </td>
                  {selectedOpps.map((opp) => (
                    <td key={opp.id} className="p-4 text-sm text-slate-800 dark:text-slate-200">
                      <div className="font-medium">{row.getValue(opp)}</div>
                    </td>
                  ))}
                </tr>
              );
            })}
            <tr>
              <td className="p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Thao tác
              </td>
              {selectedOpps.map((opp) => (
                <td key={opp.id} className="p-4">
                  <Link
                    href={`/hoc-bong/${opp.slug}`}
                    className="inline-flex items-center justify-center w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition"
                  >
                    Xem toàn diện
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Chú thích bảng xuất ảnh */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Tổng hợp tự động bởi Học Bổng VN • https://hocbong.vn</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Dòng có sự khác biệt được tô sáng
          </span>
        </div>
      </div>
    </div>
  );
}
