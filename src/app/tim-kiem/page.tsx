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

  // Lấy các filters hiện tại từ URL
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
  }, [searchParams]);

  const updateParam = (key: string, value: string, isArray: boolean = false) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1'); // Reset về trang 1

    if (isArray) {
      const existing = params.getAll(key);
      params.delete(key);
      if (existing.includes(value)) {
        existing.filter((v) => v !== value).forEach((v) => params.append(key, v));
      } else {
        [...existing, value].forEach((v) => params.append(key, v));
      }
    } else {
      if (value) params.set(key, value);
      else params.delete(key);
    }

    router.push(`/tim-kiem?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('q', query);
  };

  const clearAllFilters = () => {
    setQuery('');
    router.push('/tim-kiem');
  };

  return (
    <div className="py-6 space-y-6">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap size={32} className="text-primary-600" />
            Tìm kiếm Học bổng & Tuyển sinh
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tổng hợp dữ liệu chính xác từ hơn 30 đại học và tổ chức cấp học bổng hàng đầu Việt Nam.
          </p>
        </div>

        {/* Thanh tìm kiếm */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên học bổng, trường, ngành..."
            className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none shadow-sm transition"
          />
          <MagnifyingGlass size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            Tìm
          </button>
        </form>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Bộ lọc Sidebar Desktop */}
        <aside className="hidden md:block w-64 flex-shrink-0 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
              <Funnel size={18} />
              <span>Bộ lọc tìm kiếm</span>
            </h2>
            {(currentKinds.length > 0 || currentFunding.length > 0 || currentDegree.length > 0 || currentLocation || query) && (
              <button onClick={clearAllFilters} className="text-xs text-red-500 hover:underline">
                Xóa tất cả
              </button>
            )}
          </div>

          {/* Lọc theo Loại chương trình */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-3">
              Loại cơ hội
            </h3>
            <div className="space-y-2 text-sm">
              {[
                { id: 'undergraduate', label: 'Tuyển sinh Đại học' },
                { id: 'graduate', label: 'Sau đại học (ThS, TS)' },
                { id: 'scholarship_domestic', label: 'Học bổng trong nước' },
                { id: 'scholarship_foreign', label: 'Học bổng nước ngoài' },
                { id: 'scholarship_corporate', label: 'Học bổng doanh nghiệp' },
              ].map((k) => (
                <label key={k.id} className="flex items-center justify-between cursor-pointer text-slate-700 dark:text-slate-300 hover:text-primary-600">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={currentKinds.includes(k.id)}
                      onChange={() => updateParam('kind', k.id, true)}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span>{k.label}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    ({facets.kind?.[k.id] || 0})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Lọc theo Mức tài trợ */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-3">
              Mức tài trợ
            </h3>
            <div className="space-y-2 text-sm">
              {[
                { id: 'full', label: 'Toàn phần' },
                { id: 'partial', label: 'Bán phần' },
                { id: 'tuition', label: 'Miễn học phí' },
                { id: 'stipend', label: 'Trợ cấp sinh hoạt' },
              ].map((f) => (
                <label key={f.id} className="flex items-center justify-between cursor-pointer text-slate-700 dark:text-slate-300 hover:text-primary-600">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={currentFunding.includes(f.id)}
                      onChange={() => updateParam('fundingType', f.id, true)}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span>{f.label}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    ({facets.fundingType?.[f.id] || 0})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Lọc theo Địa điểm học tập */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-3">
              Khu vực học tập
            </h3>
            <select
              value={currentLocation}
              onChange={(e) => updateParam('studyLocation', e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-primary-500"
            >
              <option value="">Tất cả địa điểm</option>
              <option value="Hà Nội">Hà Nội</option>
              <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
              <option value="Đà Nẵng">Đà Nẵng</option>
              <option value="Cần Thơ">Cần Thơ</option>
              <option value="Vương quốc Anh">Vương quốc Anh</option>
              <option value="Mỹ">Mỹ</option>
              <option value="Nhật Bản">Nhật Bản</option>
              <option value="Hàn Quốc">Hàn Quốc</option>
              <option value="Úc">Úc</option>
            </select>
          </div>
        </aside>

        {/* Nội dung kết quả */}
        <main className="flex-1">
          {/* Thanh toolbar kết quả */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Tìm thấy <strong className="text-slate-900 dark:text-white font-bold">{total}</strong> cơ hội phù hợp
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="md:hidden px-3 py-1.5 flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900"
              >
                <Faders size={16} /> <span>Lọc</span>
              </button>

              <select
                value={currentSort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-primary-500"
              >
                <option value="relevance">Độ phù hợp cao nhất</option>
                <option value="deadline">Sắp hết hạn trước</option>
                <option value="rank">Điểm uy tín cao nhất</option>
                <option value="newest">Mới cập nhật</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <p className="text-red-500 mb-4 font-semibold text-sm">Đã xảy ra lỗi khi tìm kiếm dữ liệu.</p>
              <button onClick={fetchResults} className="px-5 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold">
                Thử lại
              </button>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">Không tìm thấy cơ hội nào phù hợp</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Hãy thử nới lỏng các tiêu chí lọc hoặc tìm kiếm bằng từ khoá rộng hơn.
              </p>
              <button onClick={clearAllFilters} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold">
                Xóa tất cả bộ lọc
              </button>
            </div>
          ) : (
            <div className="space-y-6">
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
                    fundingType={FUNDING_LABELS[opp.fundingType as keyof typeof FUNDING_LABELS] || opp.fundingType}
                    location={opp.studyLocation}
                    fieldTags={opp.fieldCodes}
                    lastVerifiedAt={opp.lastVerifiedAt}
                    rawOpportunity={opp}
                  />
                ))}
              </div>

              {/* Phân trang */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button
                    disabled={page <= 1}
                    onClick={() => updateParam('page', String(page - 1))}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                  >
                    <CaretLeft size={16} />
                  </button>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 px-3">
                    Trang {page} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => updateParam('page', String(page + 1))}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                  >
                    <CaretRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Modal */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileFiltersOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">Bộ lọc tìm kiếm</h2>
              <button onClick={() => setIsMobileFiltersOpen(false)} className="p-1 text-slate-400">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500">Chọn các danh mục muốn lọc và bấm Áp dụng.</p>
              <button
                onClick={() => {
                  clearAllFilters();
                  setIsMobileFiltersOpen(false);
                }}
                className="w-full py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
              >
                Xóa tất cả bộ lọc
              </button>
              <button
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold shadow-md"
                onClick={() => setIsMobileFiltersOpen(false)}
              >
                Xem {total} kết quả
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="h-96 w-full rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />}>
      <SearchContent />
    </Suspense>
  );
}
