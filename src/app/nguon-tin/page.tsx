'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlass,
  Globe,
  ArrowSquareOut,
  Funnel,
  ShieldCheck,
  Coins,
  CalendarBlank,
  Translate,
} from '@phosphor-icons/react';
import { INITIAL_SOURCES, SourceConfig } from '@/lib/crawler/sources';

export default function SourcesDirectoryPage() {
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [feeFilter, setFeeFilter] = useState('ALL');

  // Extract unique countries & categories
  const countries = useMemo(() => {
    const list = Array.from(
      new Set(INITIAL_SOURCES.map((s) => s.country).filter(Boolean) as string[])
    );
    return list.sort();
  }, []);

  const categories = useMemo(() => {
    const list = Array.from(
      new Set(INITIAL_SOURCES.map((s) => s.category).filter(Boolean) as string[])
    );
    return list.sort();
  }, []);

  // Filter sources
  const filteredSources = useMemo(() => {
    return INITIAL_SOURCES.filter((s) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.baseUrl.toLowerCase().includes(q) ||
        (s.country && s.country.toLowerCase().includes(q)) ||
        (s.features && s.features.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q));

      const matchCountry = selectedCountry === 'ALL' || s.country === selectedCountry;
      const matchCategory = selectedCategory === 'ALL' || s.category === selectedCategory;

      let matchFee = true;
      if (feeFilter === 'FREE') {
        matchFee = (s.appFee || '').toLowerCase().includes('free');
      } else if (feeFilter === 'PAID') {
        matchFee = Boolean(s.appFee) && !(s.appFee || '').toLowerCase().includes('free');
      }

      return matchSearch && matchCountry && matchCategory && matchFee;
    });
  }, [search, selectedCountry, selectedCategory, feeFilter]);

  const freeCount = useMemo(() => {
    return INITIAL_SOURCES.filter((s) => (s.appFee || '').toLowerCase().includes('free')).length;
  }, []);

  return (
    <div className="py-8 space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="liquid-glass-gold p-8 rounded-3xl border border-amber-400/30 text-center relative overflow-hidden shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-mono mb-3">
          <Globe size={14} weight="fill" />
          <span>Mạng Lưới Dữ Liệu Toàn Cầu 2026 – 2027</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
          Danh Mục {INITIAL_SOURCES.length}+ Cổng Tuyển Sinh, Học Bổng & Việc Làm
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto mt-2 font-light">
          Hệ thống giám sát và crawl dữ liệu tự động từ 21 quốc gia, bao gồm các cổng Bộ GD&ĐT, các tổ chức
          học bổng chính phủ (DAAD, Eiffel, MEXT, GKS, AAS), cổng xét tuyển chung (Common App, UCAS, Uni-assist) và
          các nền tảng thực tập sinh uy tín.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mt-6 pt-6 border-t border-white/10 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono">
              {INITIAL_SOURCES.length}
            </div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">
              Cổng dữ liệu
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono">
              {countries.length}
            </div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">
              Quốc gia theo dõi
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              {freeCount}
            </div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">
              Miễn lệ phí nộp đơn
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-sky-400 font-mono">
              24/7
            </div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">
              Cập nhật liên tục
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="liquid-glass rounded-2xl p-4 sm:p-6 border border-white/10 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Box */}
          <div className="flex-1 relative flex items-center p-1.5 rounded-xl bg-slate-900/60 border border-white/15">
            <MagnifyingGlass size={18} className="ml-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm cổng theo tên trường, quốc gia, tính năng (ví dụ: Đức, Common App, TopCV)..."
              className="w-full px-3 py-2 bg-transparent outline-none text-xs sm:text-sm text-slate-100 placeholder-slate-500 font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs text-slate-400 hover:text-white px-2"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Quick Selects */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-slate-200 outline-none focus:border-amber-400/50"
            >
              <option value="ALL">Tất cả quốc gia ({countries.length})</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-slate-200 outline-none focus:border-amber-400/50"
            >
              <option value="ALL">Tất cả phân loại</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={feeFilter}
              onChange={(e) => setFeeFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-slate-200 outline-none focus:border-amber-400/50"
            >
              <option value="ALL">Tất cả lệ phí</option>
              <option value="FREE">🆓 Miễn phí nộp đơn (Free)</option>
              <option value="PAID">💳 Có lệ phí xét tuyển</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-white/10">
          <div>
            Hiển thị <strong className="text-amber-300 font-mono font-bold">{filteredSources.length}</strong> / {INITIAL_SOURCES.length} cổng thông tin
          </div>
          {(search || selectedCountry !== 'ALL' || selectedCategory !== 'ALL' || feeFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCountry('ALL');
                setSelectedCategory('ALL');
                setFeeFilter('ALL');
              }}
              className="text-amber-300 hover:underline font-semibold"
            >
              Xóa tất cả bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSources.map((source, index) => {
          const isFree = (source.appFee || '').toLowerCase().includes('free');
          return (
            <div
              key={`${source.baseUrl}-${index}`}
              className="liquid-glass rounded-2xl p-5 border border-white/10 hover:border-amber-400/40 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(212,175,55,0.1)] transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Source Header Tags */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                    🌍 {source.country || 'Toàn cầu'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isFree ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
                        🆓 Miễn phí
                      </span>
                    ) : source.appFee ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-500/30">
                        💳 {source.appFee}
                      </span>
                    ) : null}
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Tier {source.tier}
                    </span>
                  </div>
                </div>

                {/* Name */}
                <h3 className="font-bold text-slate-100 text-base group-hover:text-amber-300 transition-colors line-clamp-2">
                  {source.name}
                </h3>

                <p className="text-[11px] text-amber-300/80 font-mono mt-0.5 mb-3">
                  {source.category || 'Cổng thông tin'}
                </p>

                {/* Features & Notes */}
                {source.features && (
                  <p className="text-xs text-slate-300 line-clamp-3 mb-3 leading-relaxed">
                    {source.features}
                  </p>
                )}

                {/* Metadata Pills */}
                <div className="space-y-1.5 text-[11px] text-slate-400 pt-2 border-t border-white/5">
                  {source.language && (
                    <div className="flex items-center gap-1.5">
                      <Translate size={13} className="text-slate-500" />
                      <span>Ngôn ngữ: <strong className="text-slate-300 font-normal">{source.language}</strong></span>
                    </div>
                  )}
                  {source.deadlinePattern && (
                    <div className="flex items-center gap-1.5">
                      <CalendarBlank size={13} className="text-slate-500" />
                      <span>Chu kỳ hạn chót: <strong className="text-slate-300 font-normal">{source.deadlinePattern}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Direct Link */}
              <div className="pt-4 mt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 truncate max-w-[180px]">
                  {source.baseUrl.replace(/^https?:\/\//, '')}
                </span>
                <a
                  href={source.baseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors"
                >
                  <span>Truy cập nguồn</span>
                  <ArrowSquareOut size={13} weight="bold" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
