'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Sparkle, Globe, Clock, CheckCircle, XCircle, ArrowRight, Eye, Trash, MagnifyingGlass, ArrowsClockwise } from '@phosphor-icons/react';

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
    <div className="min-h-screen py-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="liquid-glass-gold p-8 rounded-3xl border border-amber-400/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/admin" className="text-xs font-bold text-amber-300 hover:underline">
                ← Bảng điều khiển Admin
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-slate-100 flex items-center gap-2.5">
              <ShieldCheck size={28} weight="fill" className="text-amber-300" />
              <span>Thẩm Định & Xác Thực Học Bổng</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 font-light">
              Kiểm tra tính chính xác, thời hạn nộp đơn, tình trạng liên kết và phê duyệt cơ hội học bổng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleTriggerCrawl}
              disabled={triggeringCrawl}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:brightness-110 active:scale-95 disabled:opacity-50 transition flex items-center gap-2"
            >
              {triggeringCrawl ? '⏳ Đang quét nguồn...' : '🚀 Quét Crawler Mới'}
            </button>
            <button
              onClick={handleTriggerLinkCheck}
              disabled={triggeringLinkCheck}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 disabled:opacity-50 transition flex items-center gap-2"
            >
              {triggeringLinkCheck ? '🔍 Đang check...' : '🔗 Kiểm Tra Link Chết'}
            </button>
          </div>
        </div>

        {/* Alert notification */}
        {message && (
          <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs flex items-center justify-between shadow-lg">
            <span>✅ {message}</span>
            <button onClick={() => setMessage(null)} className="text-emerald-400 font-bold text-sm">×</button>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="liquid-glass p-5 rounded-2xl border border-white/10 shadow-lg">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Tổng Học Bổng</p>
              <p className="text-3xl font-extrabold text-slate-100 mt-1 font-serif">{stats.totalCount}</p>
            </div>
            <div className="liquid-glass p-5 rounded-2xl border border-emerald-500/30 shadow-lg">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">Đã Thẩm Định ✅</p>
              <p className="text-3xl font-extrabold text-emerald-400 mt-1 font-serif">{stats.verifiedCount}</p>
            </div>
            <div className="liquid-glass p-5 rounded-2xl border border-amber-500/30 shadow-lg">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300 font-mono">Chờ Kiểm Duyệt ⚠️</p>
              <p className="text-3xl font-extrabold text-amber-300 mt-1 font-serif">{stats.unverifiedCount}</p>
            </div>
            <div className="liquid-glass p-5 rounded-2xl border border-rose-500/30 shadow-lg">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400 font-mono">Link Chết / 404 ❌</p>
              <p className="text-3xl font-extrabold text-rose-400 mt-1 font-serif">{stats.deadLinkCount}</p>
            </div>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="liquid-glass p-4 rounded-2xl border border-white/10 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên học bổng, trường, tổ chức..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 liquid-glass border border-white/10 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:border-amber-400/60 outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-amber-400 text-slate-950 rounded-xl text-xs font-bold hover:brightness-110 transition"
            >
              Tìm
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 liquid-glass border border-white/10 rounded-xl text-xs text-slate-200 outline-none"
            >
              <option value="all" className="bg-slate-950">Trạng thái: Tất cả</option>
              <option value="published" className="bg-slate-950">Đã công khai (Published)</option>
              <option value="review" className="bg-slate-950">Cần xem xét (Review)</option>
              <option value="archived" className="bg-slate-950">Đã lưu trữ (Archived)</option>
              <option value="expired" className="bg-slate-950">Đã hết hạn (Expired)</option>
            </select>

            <select
              value={linkFilter}
              onChange={(e) => setLinkFilter(e.target.value)}
              className="px-3 py-2 liquid-glass border border-white/10 rounded-xl text-xs text-slate-200 outline-none"
            >
              <option value="all" className="bg-slate-950">Link: Tất cả</option>
              <option value="alive" className="bg-slate-950">Hoạt động (Alive)</option>
              <option value="dead" className="bg-slate-950">Chết / Lỗi (Dead)</option>
              <option value="unknown" className="bg-slate-950">Chưa check (Unknown)</option>
            </select>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={unverifiedOnly}
                onChange={(e) => setUnverifiedOnly(e.target.checked)}
                className="rounded text-amber-400 focus:ring-amber-400 bg-slate-900 border-white/20"
              />
              <span>Chỉ chưa thẩm định</span>
            </label>
          </div>
        </div>

        {/* Opportunity List Table */}
        <div className="liquid-glass rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-400 text-xs animate-pulse">
              Đang tải danh sách học bổng thẩm định...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-400 text-xs">
              <p>{error}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-16 text-center text-slate-400 text-xs">
              <p>Không tìm thấy học bổng nào phù hợp với bộ lọc.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 font-mono uppercase text-[11px] bg-white/[0.02]">
                    <th className="py-4 px-5">Tên Học Bổng & Trường</th>
                    <th className="py-4 px-5">Hạn Nộp</th>
                    <th className="py-4 px-5">Độ Tin Cậy</th>
                    <th className="py-4 px-5">Link Nguồn</th>
                    <th className="py-4 px-5">Trạng Thái</th>
                    <th className="py-4 px-5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((opp) => (
                    <tr key={opp.id} className="hover:bg-white/[0.04] transition-colors">
                      <td className="py-4 px-5 max-w-sm">
                        <p className="font-bold text-slate-100 line-clamp-1 text-sm">{opp.title}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
                          <span>🏛️ {opp.organization}</span>
                          <span>•</span>
                          <span className="text-amber-300 font-mono">{opp.fundingType}</span>
                        </p>
                        {opp.verifyNote && (
                          <p className="text-[10px] text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded mt-1 inline-block">
                            ✍️ {opp.verifyNote}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap font-mono">
                        {opp.deadline ? (
                          <span className="font-medium text-slate-300">
                            {new Date(opp.deadline).toLocaleDateString('vi-VN')}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Thường niên</span>
                        )}
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${
                                (opp.confidence || 0) >= 80
                                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                  : (opp.confidence || 0) >= 60
                                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(212,175,55,0.5)]'
                                  : 'bg-rose-400'
                              }`}
                              style={{ width: `${Math.min(opp.confidence || 50, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-200 font-mono">
                            {opp.confidence || 70}%
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <a
                            href={opp.canonicalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-sky-400 hover:underline max-w-[120px] truncate block"
                          >
                            {opp.source?.name || 'Xem gốc'} ↗
                          </a>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded font-mono ${
                              opp.linkStatus === 'alive'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                : opp.linkStatus === 'dead'
                                ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {opp.linkStatus === 'alive' ? 'ALIVE' : opp.linkStatus === 'dead' ? '404 DEAD' : 'UNKNOWN'}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        {opp.verifiedAt ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                            ✓ Đã thẩm định
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(212,175,55,0.25)]">
                            ⏳ Chờ duyệt
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {!opp.verifiedAt && (
                            <button
                              onClick={() => handleVerify(opp.id, 'verify')}
                              disabled={actionLoading === opp.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm"
                            >
                              {actionLoading === opp.id ? '...' : '✅ Duyệt'}
                            </button>
                          )}
                          <button
                            onClick={() => handleVerify(opp.id, 'archive')}
                            disabled={actionLoading === opp.id}
                            className="px-3 py-1.5 liquid-glass hover:bg-rose-950/50 hover:text-rose-300 border border-white/10 disabled:opacity-50 text-slate-300 rounded-xl text-xs font-semibold transition"
                          >
                            📦 Ẩn
                          </button>
                          <Link
                            href={`/hoc-bong/${opp.slug}`}
                            target="_blank"
                            className="px-3 py-1.5 liquid-glass hover:border-amber-400/30 text-amber-300 rounded-xl text-xs font-semibold transition"
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
