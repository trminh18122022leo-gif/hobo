'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface OpportunityItem {
  id: number;
  title: string;
  slug: string;
  organization: string;
  kind: string;
  fundingType: string;
  fundingValueVnd: number | null;
  deadline: string | null;
  canonicalUrl: string;
  confidence: number | null;
  status: string;
  linkStatus: string;
  linkCheckCount: number;
  verifiedAt: string | null;
  verifyNote: string | null;
  source: {
    name: string;
    baseUrl: string;
    tier: string;
    trustScore: number;
  };
}

interface Stats {
  totalCount: number;
  verifiedCount: number;
  deadLinkCount: number;
  unverifiedCount: number;
}

export default function AdminReviewPage() {
  const [items, setItems] = useState<OpportunityItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [linkFilter, setLinkFilter] = useState('all');
  const [unverifiedOnly, setUnverifiedOnly] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [triggeringCrawl, setTriggeringCrawl] = useState(false);
  const [triggeringLinkCheck, setTriggeringLinkCheck] = useState(false);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (linkFilter !== 'all') params.set('linkStatus', linkFilter);
      if (unverifiedOnly) params.set('unverifiedOnly', 'true');

      const res = await fetch(`/api/admin/opportunities?${params.toString()}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Lỗi khi tải dữ liệu');
      }

      setItems(data.data.items || []);
      setStats(data.data.stats || null);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách học bổng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [statusFilter, linkFilter, unverifiedOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOpportunities();
  };

  const handleVerify = async (id: number, action: 'verify' | 'archive') => {
    try {
      setActionLoading(id);
      const res = await fetch(`/api/admin/opportunities/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Thao tác thất bại');
      }
      setMessage(data.message);
      setTimeout(() => setMessage(null), 4000);
      fetchOpportunities();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi thực hiện thao tác');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTriggerCrawl = async () => {
    try {
      setTriggeringCrawl(true);
      const res = await fetch('/api/crawl/trigger', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMessage(`Quét crawler thành công: ${data.data?.newRecords || 0} mới, ${data.data?.updatedRecords || 0} cập nhật.`);
        fetchOpportunities();
      } else {
        alert(data.error || 'Lỗi quét');
      }
    } catch (err: any) {
      alert('Không thể kích hoạt crawler');
    } finally {
      setTriggeringCrawl(false);
    }
  };

  const handleTriggerLinkCheck = async () => {
    try {
      setTriggeringLinkCheck(true);
      const res = await fetch('/api/crawl/check-links', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMessage(`Kiểm tra link hoàn tất: ${data.data?.aliveCount || 0} sống, ${data.data?.deadCount || 0} chết, ${data.data?.archivedCount || 0} đã ẩn.`);
        fetchOpportunities();
      } else {
        alert(data.error || 'Lỗi kiểm tra link');
      }
    } catch (err: any) {
      alert('Không thể kích hoạt kiểm tra link');
    } finally {
      setTriggeringLinkCheck(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/admin" className="text-sm font-semibold text-blue-600 hover:underline">
                ← Bảng điều khiển Admin
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              🛡️ Thẩm Định & Xác Thực Học Bổng
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Kiểm tra tính chính xác, thời hạn nộp đơn, tình trạng liên kết và phê duyệt cơ hội học bổng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleTriggerCrawl}
              disabled={triggeringCrawl}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
            >
              {triggeringCrawl ? '⏳ Đang quét nguồn...' : '🚀 Quét Crawler Mới'}
            </button>
            <button
              onClick={handleTriggerLinkCheck}
              disabled={triggeringLinkCheck}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
            >
              {triggeringLinkCheck ? '🔍 Đang check...' : '🔗 Kiểm Tra Link Chết'}
            </button>
          </div>
        </div>

        {/* Alert notification */}
        {message && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center justify-between">
            <span>✅ {message}</span>
            <button onClick={() => setMessage(null)} className="text-emerald-600 font-bold">×</button>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-400">Tổng Học Bổng</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalCount}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase text-emerald-600">Đã Thẩm Định ✅</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.verifiedCount}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase text-amber-600">Chờ Kiểm Duyệt ⚠️</p>
              <p className="text-2xl font-bold text-amber-700 mt-1">{stats.unverifiedCount}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase text-rose-600">Link Chết / 404 ❌</p>
              <p className="text-2xl font-bold text-rose-700 mt-1">{stats.deadLinkCount}</p>
            </div>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên học bổng, trường, tổ chức..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Tìm
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700"
            >
              <option value="all">Trạng thái: Tất cả</option>
              <option value="published">Đã công khai (Published)</option>
              <option value="review">Cần xem xét (Review)</option>
              <option value="archived">Đã lưu trữ (Archived)</option>
              <option value="expired">Đã hết hạn (Expired)</option>
            </select>

            <select
              value={linkFilter}
              onChange={(e) => setLinkFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700"
            >
              <option value="all">Link: Tất cả</option>
              <option value="alive">Hoạt động (Alive)</option>
              <option value="dead">Chết / Lỗi (Dead)</option>
              <option value="unknown">Chưa check (Unknown)</option>
            </select>

            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={unverifiedOnly}
                onChange={(e) => setUnverifiedOnly(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span>Chỉ chưa thẩm định</span>
            </label>
          </div>
        </div>

        {/* Opportunity List Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <p className="animate-pulse font-medium">Đang tải danh sách học bổng...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-600">
              <p>{error}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <p>Không tìm thấy học bổng nào phù hợp với bộ lọc.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Tên Học Bổng & Trường</th>
                    <th className="py-3 px-4">Hạn Nộp</th>
                    <th className="py-3 px-4">Độ Tin Cậy</th>
                    <th className="py-3 px-4">Link Nguồn</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((opp) => (
                    <tr key={opp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-4 max-w-sm">
                        <p className="font-semibold text-slate-900 line-clamp-1">{opp.title}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>🏛️ {opp.organization}</span>
                          <span>•</span>
                          <span className="text-blue-600">{opp.fundingType}</span>
                        </p>
                        {opp.verifyNote && (
                          <p className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-1 inline-block">
                            ✍️ {opp.verifyNote}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        {opp.deadline ? (
                          <span className="font-medium text-slate-700">
                            {new Date(opp.deadline).toLocaleDateString('vi-VN')}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Thường niên / Chưa rõ</span>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                (opp.confidence || 0) >= 80
                                  ? 'bg-emerald-500'
                                  : (opp.confidence || 0) >= 60
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(opp.confidence || 50, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700">
                            {opp.confidence || 70}%
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <a
                            href={opp.canonicalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-blue-600 hover:underline max-w-[120px] truncate block"
                          >
                            {opp.source?.name || 'Xem gốc'} ↗
                          </a>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              opp.linkStatus === 'alive'
                                ? 'bg-emerald-100 text-emerald-800'
                                : opp.linkStatus === 'dead'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {opp.linkStatus === 'alive' ? 'ALIVE' : opp.linkStatus === 'dead' ? '404 DEAD' : 'UNKNOWN'}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        {opp.verifiedAt ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                            ✓ Đã xác thực
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                            ⏳ Chờ duyệt
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {!opp.verifiedAt && (
                            <button
                              onClick={() => handleVerify(opp.id, 'verify')}
                              disabled={actionLoading === opp.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors"
                            >
                              {actionLoading === opp.id ? '...' : '✅ Duyệt'}
                            </button>
                          )}
                          <button
                            onClick={() => handleVerify(opp.id, 'archive')}
                            disabled={actionLoading === opp.id}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                          >
                            📦 Ẩn
                          </button>
                          <Link
                            href={`/hoc-bong/${opp.slug}`}
                            target="_blank"
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Chi tiết ↗
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
