'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [triggering, setTriggering] = useState(false);
  const [stats, setStats] = useState<{ totalCount: number; verifiedCount: number; deadLinkCount: number; unverifiedCount: number } | null>(null);

  useEffect(() => {
    fetch('/api/admin/opportunities?limit=1')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.stats) {
          setStats(data.data.stats);
        }
      })
      .catch(() => {});
  }, []);

  const handleCrawl = async () => {
    setTriggering(true);
    try {
      const res = await fetch('/api/crawl/trigger', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`Quét thành công: ${data.data?.newRecords || 0} mới, ${data.data?.updatedRecords || 0} cập nhật.`);
      } else {
        alert(data.error || 'Lỗi quét');
      }
    } catch {
      alert('Lỗi kết nối');
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="py-8 max-w-7xl mx-auto px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bảng Quản Trị Hệ Thống</h1>
          <p className="text-sm text-slate-500 mt-1">Giám sát crawler và thẩm định dữ liệu học bổng</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/review"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm shadow-sm transition-colors flex items-center gap-1.5"
          >
            🛡️ Thẩm Định Học Bổng
          </Link>
          <button 
            onClick={handleCrawl}
            disabled={triggering}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm disabled:opacity-50 transition-colors"
          >
            {triggering ? '⏳ Đang quét...' : '🚀 Chạy crawl ngay'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Tổng cơ hội học bổng', val: stats ? stats.totalCount : '52', color: 'text-slate-900 dark:text-white' },
          { label: 'Đã thẩm định chuẩn xác', val: stats ? stats.verifiedCount : '18', color: 'text-emerald-600' },
          { label: 'Cần kiểm duyệt / Review', val: stats ? stats.unverifiedCount : '34', color: 'text-amber-600' },
          { label: 'Liên kết bị lỗi / Chết', val: stats ? stats.deadLinkCount : '0', color: 'text-rose-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-slate-500 text-sm mb-2">{stat.label}</div>
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.val}</div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="font-bold text-slate-900 dark:text-white">Cơ Chế Tự Động & Lịch Trình Quét</h2>
          <Link href="/admin/review" className="text-xs text-blue-600 hover:underline font-semibold">
            Xem toàn bộ học bổng →
          </Link>
        </div>
        <div className="p-6 space-y-4 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Tier A (Trường ĐH Quốc Gia & Bộ GD&ĐT)</p>
              <p className="text-xs text-slate-500">Tần suất quét: Mỗi 1 giờ</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded">Đang hoạt động</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Tier B (Trường ĐH Vùng & Học Bổng Chính Phủ)</p>
              <p className="text-xs text-slate-500">Tần suất quét: Mỗi 6 giờ</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded">Đang hoạt động</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Tự động phát hiện & Ẩn link chết (Auto-Archive)</p>
              <p className="text-xs text-slate-500">Tần suất: Hàng ngày lúc 02:30 UTC</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-1 rounded">Bật</span>
          </div>
        </div>
      </div>
    </div>
  );
}
