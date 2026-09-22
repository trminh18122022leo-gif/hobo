'use client';

import React from 'react';
import Link from 'next/link';
import { useCompare } from '@/context/CompareContext';
import { Scales, X, ArrowRight } from '@phosphor-icons/react';

export default function CompareFloatingBar() {
  const { selectedOpps, removeFromCompare, clearCompare } = useCompare();

  if (selectedOpps.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 text-white dark:bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-2xl p-4 border border-slate-700/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-primary-600/30 border border-primary-500/40 flex items-center justify-center text-primary-400 flex-shrink-0">
            <Scales size={22} weight="bold" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">So sánh học bổng</span>
              <span className="px-2 py-0.5 bg-primary-600 text-white rounded-full text-xs font-semibold">
                {selectedOpps.length}/4
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {selectedOpps.map((o) => o.title).join(' • ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={clearCompare}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Xóa danh sách"
          >
            <X size={18} />
          </button>
          <Link
            href="/so-sanh"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-primary-900/40"
          >
            <span>So sánh</span>
            <ArrowRight size={16} weight="bold" />
          </Link>
        </div>
      </div>
    </div>
  );
}
