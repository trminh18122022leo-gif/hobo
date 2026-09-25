'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  RecommendationResult,
  PortfolioStrategy,
  KIND_LABELS,
  FUNDING_LABELS,
} from '@/types';
import {
  Compass,
  RocketLaunch,
  Target,
  ShieldCheck,
  CheckCircle,
  XCircle,
  WarningCircle,
  ArrowRight,
  ArrowSquareOut,
  CalendarBlank,
  Bank,
  User,
  Sparkle,
} from '@phosphor-icons/react';

export default function RecommendationPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioStrategy | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'reach' | 'match' | 'safety'>('all');

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/recommend', { method: 'POST' });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Không thể lấy gợi ý');
      }

      if (json.data) {
        setRecommendations(json.data.recommendations || []);
        setPortfolio(json.data.portfolioStrategy || null);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Vui lòng hoàn thiện hồ sơ để nhận gợi ý chiến lược.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const filteredList =
    activeTab === 'all'
      ? recommendations
      : recommendations.filter((r) => r.category === activeTab);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Compass size={18} />
            <span>Tính năng đột phá B.8</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            Danh mục chiến lược gợi ý học bổng
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Phân loại theo mô hình cố vấn quốc tế: Thử sức (Reach) • Phù hợp (Match) • Chắc chắn (Safety)
          </p>
        </div>

        <Link
          href="/ho-so"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition self-start sm:self-auto"
        >
          <User size={18} />
          <span>Cập nhật hồ sơ</span>
        </Link>
      </div>

      {/* Thông điệp chiến lược (B.8) */}
      {portfolio && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-primary-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkle size={18} weight="fill" />
              <span>Khuyến nghị phân bổ hồ sơ cân bằng rủi ro (Công thức 2-3-2)</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Chiến lược tối ưu cơ hội trúng tuyển</h3>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              {portfolio.summary}
            </p>

            {/* Các nhóm chiến lược */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/30 text-purple-300 flex items-center justify-center font-bold">
                  <RocketLaunch size={22} />
                </div>
                <div>
                  <span className="text-xs text-purple-200 font-semibold uppercase block">
                    Thử sức (Reach)
                  </span>
                  <span className="text-lg font-bold text-white">
                    {portfolio.reach.length} chương trình
                  </span>
                </div>
              </div>

              <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/30 text-blue-300 flex items-center justify-center font-bold">
                  <Target size={22} />
                </div>
                <div>
                  <span className="text-xs text-blue-200 font-semibold uppercase block">
                    Phù hợp (Match)
                  </span>
                  <span className="text-lg font-bold text-white">
                    {portfolio.match.length} chương trình
                  </span>
                </div>
              </div>

              <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/30 text-emerald-300 flex items-center justify-center font-bold">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <span className="text-xs text-emerald-200 font-semibold uppercase block">
                    Chắc chắn (Safety)
                  </span>
                  <span className="text-lg font-bold text-white">
                    {portfolio.safety.length} chương trình
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs chuyển đổi phân loại */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeTab === 'all'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Tất cả gợi ý ({recommendations.length})
        </button>
        <button
          onClick={() => setActiveTab('reach')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'reach'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <RocketLaunch size={16} />
          <span>Thử sức ({recommendations.filter((r) => r.category === 'reach').length})</span>
        </button>
        <button
          onClick={() => setActiveTab('match')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'match'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Target size={16} />
          <span>Phù hợp ({recommendations.filter((r) => r.category === 'match').length})</span>
        </button>
        <button
          onClick={() => setActiveTab('safety')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'safety'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck size={16} />
          <span>Chắc chắn ({recommendations.filter((r) => r.category === 'safety').length})</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="text-center text-slate-500 py-6">Đang phân tích hồ sơ và phân loại chiến lược...</div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <WarningCircle size={36} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Chưa có đủ dữ liệu hồ sơ</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">{error}</p>
          <Link
            href="/ho-so"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-sm transition"
          >
            <span>Tạo hồ sơ năng lực ngay</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="text-center py-12 text-slate-500">Không có chương trình nào trong nhóm này.</div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((item) => {
            const opp = item.opportunity;
            const categoryBadge =
              item.category === 'reach'
                ? { label: 'Thử sức (Reach)', bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' }
                : item.category === 'safety'
                ? { label: 'Chắc chắn (Safety)', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' }
                : { label: 'Phù hợp (Match)', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' };

            const isScholarship =
              opp.kind.toLowerCase().includes('scholarship') || opp.kind.toUpperCase() === 'SCHOLARSHIP';
            const detailUrl = isScholarship ? `/hoc-bong/${opp.slug}` : `/tuyen-sinh/${opp.slug}`;

            return (
              <div
                key={item.opportunityId}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${categoryBadge.bg}`}>
                      {categoryBadge.label}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {KIND_LABELS[opp.kind as keyof typeof KIND_LABELS] || opp.kind}
                    </span>
                  </div>

                  <Link href={detailUrl} className="block group">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition line-clamp-2">
                      {opp.title}
                    </h3>
                  </Link>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                      <Bank size={15} className="text-slate-400" />
                      {opp.organization}
                    </span>
                    {opp.deadline && (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                        <CalendarBlank size={15} />
                        Hạn: {new Date(opp.deadline).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                    {opp.fundingType && (
                      <span className="font-semibold text-emerald-600">
                        {FUNDING_LABELS[opp.fundingType as keyof typeof FUNDING_LABELS] || opp.fundingType}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6 flex-shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
                  <div className="text-center">
                    <div className="text-3xl font-black text-primary-600 dark:text-primary-400">
                      {Math.round(item.softScore * 100)}%
                    </div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                      Độ tương thích
                    </div>
                  </div>

                  <Link
                    href={detailUrl}
                    className="inline-flex items-center gap-1 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
                  >
                    <span>Xem 12 khối</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
