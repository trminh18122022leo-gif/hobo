'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import OpportunityCard from '@/components/OpportunityCard';
import {
  MagnifyingGlass,
  Faders,
  X,
  Funnel,
  CaretLeft,
  CaretRight,
  GraduationCap,
  Sparkle,
} from '@phosphor-icons/react';
import { OpportunityCard as OppCardType, KIND_LABELS, FUNDING_LABELS } from '@/types';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<OppCardType[]>([]);
  const [facets, setFacets] = useState<any>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Filters from URL
  const currentKinds = searchParams.getAll('kind');
  const currentFunding = searchParams.getAll('fundingType');
  const currentDegree = searchParams.getAll('degreeLevel');
  const currentLocation = searchParams.get('studyLocation') || '';
  const currentSort = searchParams.get('sort') || 'relevance';

  const fetchResults = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/search?${searchParams.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setResults(json.data.items || json.data.data || []);
        setFacets(json.data.facets || {});
        setTotal(json.data.total || 0);
        setTotalPages(json.data.totalPages || 1);
        setPage(json.data.page || 1);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const updateParam = (key: string, value: string, isArray = false) => {
    const params = new URLSearchParams(searchParams.toString());
    if (isArray) {
      const currentValues = params.getAll(key);
      if (currentValues.includes(value)) {
        params.delete(key);
        currentValues
          .filter((v) => v !== value)
          .forEach((v) => params.append(key, v));
      } else {
        params.append(key, value);
      }
    } else {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.set('page', '1');
    router.push(`/tim-kiem?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('q', query);
  };

  const clearAllFilters = () => {
    router.push('/tim-kiem');
  };

  const hasActiveFilters =
    currentKinds.length > 0 ||
    currentFunding.length > 0 ||
    currentDegree.length > 0 ||
    Boolean(currentLocation) ||
    Boolean(searchParams.get('q'));

  return (
    <div className="space-y-8 py-4">
      {/* Header Search Banner */}
      <div className="liquid-glass-gold p-8 rounded-3xl border border-amber-400/30 text-center relative overflow-hidden shadow-2xl">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
          Khám Phá & Tra Cứu Học Bổng
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mt-2 font-light">
          Hệ thống tra cứu tự động từ 50+ trường đại học và cơ quan học bổng chính quy 2026 – 2027.
        </p>

        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="max-w-2xl mx-auto mt-6 relative flex items-center p-1.5 rounded-2xl liquid-glass border border-white/20 shadow-xl"
        >
          <div className="pl-3.5 text-slate-400">
            <MagnifyingGlass size={20} weight="bold" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập tên học bổng, trường đại học, ngành học..."
            className="w-full px-4 py-3 bg-transparent border-none outline-none text-sm text-slate-100 placeholder-slate-500 font-medium"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-amber-300 to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-md hover:brightness-110 active:scale-95 transition"
          >
            Tìm
          </button>
        </form>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden md:block w-72 flex-shrink-0 liquid-glass rounded-3xl p-6 border border-white/10 space-y-6 h-fit shadow-xl">
          <div className="flex justify-between items-center pb-4 border-b border-white/10">
            <h2 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Funnel size={16} className="text-amber-400" />
              <span>Bộ Lọc Chuẩn Xác</span>
            </h2>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-amber-300 hover:underline font-semibold"
              >
                Đặt lại
              </button>
            )}
          </div>

          {/* Filter by Opportunity Kind */}
          <div>
            <h3 className="font-mono text-xs font-bold text-amber-200 uppercase tracking-wider mb-3">
              Loại Chương Trình
            </h3>
            <div className="space-y-2.5 text-xs">
              {[
                { id: 'undergraduate', label: 'Tuyển sinh Đại học' },
                { id: 'graduate', label: 'Sau đại học (ThS, TS)' },
                { id: 'scholarship_domestic', label: 'Học bổng trong nước' },
                { id: 'scholarship_foreign', label: 'Học bổng nước ngoài' },
                { id: 'scholarship_corporate', label: 'Học bổng tập đoàn' },
              ].map((k) => (
                <label key={k.id} className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white transition">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentKinds.includes(k.id)}
                      onChange={() => updateParam('kind', k.id, true)}
                      className="rounded text-amber-400 focus:ring-amber-400 bg-slate-900 border-white/20"
                    />
                    <span>{k.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({facets.kind?.[k.id] || 0})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Filter by Funding Type */}
          <div className="border-t border-white/10 pt-4">
            <h3 className="font-mono text-xs font-bold text-amber-200 uppercase tracking-wider mb-3">
              Mức Tài Trợ
            </h3>
            <div className="space-y-2.5 text-xs">
              {[
                { id: 'full', label: 'Toàn phần (100%)' },
                { id: 'partial', label: 'Bán phần' },
                { id: 'tuition', label: 'Miễn học phí' },
                { id: 'stipend', label: 'Trợ cấp sinh hoạt' },
              ].map((f) => (
                <label key={f.id} className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white transition">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentFunding.includes(f.id)}
                      onChange={() => updateParam('fundingType', f.id, true)}
                      className="rounded text-amber-400 focus:ring-amber-400 bg-slate-900 border-white/20"
                    />
                    <span>{f.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({facets.fundingType?.[f.id] || 0})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Filter by Study Location */}
          <div className="border-t border-white/10 pt-4">
            <h3 className="font-mono text-xs font-bold text-amber-200 uppercase tracking-wider mb-3">
              Địa Điểm Đào Tạo
            </h3>
            <select
              value={currentLocation}
              onChange={(e) => updateParam('studyLocation', e.target.value)}
              className="w-full p-2.5 rounded-xl liquid-glass border border-white/10 text-xs text-slate-200 focus:border-amber-400/60 outline-none"
            >
              <option value="" className="bg-slate-950">Tất cả địa điểm</option>
              <option value="Hà Nội" className="bg-slate-950">Hà Nội</option>
              <option value="TP. Hồ Chí Minh" className="bg-slate-950">TP. Hồ Chí Minh</option>
              <option value="Đà Nẵng" className="bg-slate-950">Đà Nẵng</option>
              <option value="Vương quốc Anh" className="bg-slate-950">Vương quốc Anh</option>
              <option value="Mỹ" className="bg-slate-950">Mỹ</option>
              <option value="Nhật Bản" className="bg-slate-950">Nhật Bản</option>
              <option value="Hàn Quốc" className="bg-slate-950">Hàn Quốc</option>
              <option value="Úc" className="bg-slate-950">Úc</option>
            </select>
          </div>
        </aside>

        {/* Main Results Container */}
        <main className="flex-1 space-y-6">
          {/* Results Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl liquid-glass border border-white/10">
            <div className="text-xs text-slate-400">
              Tìm thấy <strong className="text-amber-300 font-bold font-mono">{total}</strong> cơ hội học bổng & tuyển sinh
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="md:hidden px-3 py-2 flex items-center gap-1.5 liquid-glass rounded-xl text-xs font-semibold text-slate-200"
              >
                <Faders size={16} /> <span>Bộ Lọc</span>
              </button>

              <select
                value={currentSort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="px-3 py-2 rounded-xl liquid-glass border border-white/10 text-xs text-slate-200 font-medium focus:border-amber-400/60 outline-none"
              >
                <option value="relevance" className="bg-slate-950">Độ phù hợp cao nhất</option>
                <option value="deadline" className="bg-slate-950">Sắp hết hạn trước</option>
                <option value="rank" className="bg-slate-950">Điểm uy tín cao nhất</option>
                <option value="newest" className="bg-slate-950">Mới cập nhật</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-72 liquid-glass rounded-3xl border border-white/10" />
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center liquid-glass rounded-3xl text-rose-400 border border-rose-500/30">
              Đã xảy ra lỗi khi tải dữ liệu tra cứu. Vui lòng thử lại.
            </div>
          ) : results.length === 0 ? (
            <div className="p-16 text-center liquid-glass rounded-3xl text-slate-400 border border-white/10 space-y-3">
              <div className="text-3xl">🔍</div>
              <p className="font-semibold text-slate-200">Không tìm thấy cơ hội nào phù hợp</p>
              <p className="text-xs">Hãy thử mở rộng bộ lọc hoặc tìm kiếm bằng từ khóa chung hơn.</p>
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold shadow mt-2"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {results.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  id={opp.id}
                  slug={opp.slug}
                  title={opp.title}
                  organization={opp.organization}
                  kind={opp.kind}
                  deadline={opp.deadline}
                  fundingType={
                    opp.fundingValueVnd
                      ? `${new Intl.NumberFormat('vi-VN').format(opp.fundingValueVnd)} đ`
                      : FUNDING_LABELS[opp.fundingType as keyof typeof FUNDING_LABELS] || opp.fundingType
                  }
                  location={opp.studyLocation}
                  fieldTags={opp.fieldCodes}
                  lastVerifiedAt={opp.lastVerifiedAt}
                  rawOpportunity={opp}
                  canonicalUrl={opp.canonicalUrl}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6">
              <button
                onClick={() => updateParam('page', String(page - 1))}
                disabled={page <= 1}
                className="p-2 rounded-xl liquid-glass text-slate-300 disabled:opacity-40 hover:text-white"
              >
                <CaretLeft size={18} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => updateParam('page', String(p))}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                    p === page
                      ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                      : 'liquid-glass text-slate-300 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => updateParam('page', String(page + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-xl liquid-glass text-slate-300 disabled:opacity-40 hover:text-white"
              >
                <CaretRight size={18} />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
