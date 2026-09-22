'use client';

import React from 'react';
import { VersionEntry } from '@/types';
import { ClockCounterClockwise, ArrowRight, CheckCircle, WarningCircle } from '@phosphor-icons/react';

interface VersionDiffViewerProps {
  versions: VersionEntry[];
}

const FIELD_LABELS: Record<string, string> = {
  deadline: 'Hạn chót nộp đơn',
  fundingValueVnd: 'Mức tài trợ (VND)',
  fundingType: 'Hình thức tài trợ',
  requirements: 'Điều kiện & Tiêu chí',
  title: 'Tiêu đề chương trình',
  summary: 'Tóm tắt nội dung',
  amount: 'Giá trị học bổng',
};

function formatDiffValue(val: unknown): string {
  if (val === null || val === undefined) return '(trống)';
  if (typeof val === 'number') {
    if (val > 100000) return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
    return String(val);
  }
  if (typeof val === 'string') {
    // Check if date
    if (val.match(/^\d{4}-\d{2}-\d{2}/)) {
      return new Date(val).toLocaleDateString('vi-VN');
    }
    return val;
  }
  if (typeof val === 'object') {
    return JSON.stringify(val);
  }
  return String(val);
}

export default function VersionDiffViewer({ versions }: VersionDiffViewerProps) {
  if (!versions || versions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
        <ClockCounterClockwise size={22} className="text-primary-600" />
        Lịch sử cập nhật & Cảnh báo thay đổi
      </h3>

      <div className="space-y-4">
        {versions.map((ver, vIdx) => {
          let diffObj: Record<string, { old: unknown; new: unknown }> = {};
          try {
            diffObj = typeof ver.diff === 'string' ? JSON.parse(ver.diff) : ver.diff;
          } catch {
            diffObj = {};
          }

          const diffKeys = Object.keys(diffObj);
          if (diffKeys.length === 0) return null;

          return (
            <div
              key={ver.id || vIdx}
              className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Cập nhật lần {versions.length - vIdx}
                </span>
                <span>{new Date(ver.changedAt).toLocaleString('vi-VN')}</span>
              </div>

              <div className="space-y-2">
                {diffKeys.map((key) => {
                  const entry = diffObj[key];
                  const label = FIELD_LABELS[key] || key;
                  const oldText = formatDiffValue(entry.old);
                  const newText = formatDiffValue(entry.new);

                  return (
                    <div
                      key={key}
                      className="text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800"
                    >
                      <span className="font-medium text-slate-700 dark:text-slate-300">{label}:</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Giá trị cũ (tô đỏ, gạch ngang) */}
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 rounded text-xs line-through font-mono">
                          {oldText}
                        </span>
                        <ArrowRight size={14} className="text-slate-400" />
                        {/* Giá trị mới (tô xanh) */}
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 rounded text-xs font-semibold font-mono">
                          {newText}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
