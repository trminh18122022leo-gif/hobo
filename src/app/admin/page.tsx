'use client';

import { useState } from 'react';

export default function AdminDashboard() {
  const [triggering, setTriggering] = useState(false);

  const handleCrawl = async () => {
    setTriggering(true);
    // Mock API
    setTimeout(() => {
      alert('Đã kích hoạt crawl thành công');
      setTriggering(false);
    }, 1000);
  };

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
        <button 
          onClick={handleCrawl}
          disabled={triggering}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50"
        >
          {triggering ? 'Đang chạy...' : 'Chạy crawl ngay'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Tổng nguồn dữ liệu', val: '24' },
          { label: 'Cơ hội hiện có', val: '1,250' },
          { label: 'Cần review', val: '5' },
          { label: 'Tỷ lệ crawl thành công', val: '98%' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="text-slate-500 text-sm mb-2">{stat.label}</div>
            <div className="text-3xl font-bold">{stat.val}</div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-bold">Lịch sử Crawl gần đây</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
            <tr>
              <th className="p-4 font-medium">Thời gian</th>
              <th className="p-4 font-medium">Nguồn</th>
              <th className="p-4 font-medium">Trạng thái</th>
              <th className="p-4 font-medium">Kết quả</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            <tr>
              <td className="p-4">10 phút trước</td>
              <td className="p-4">hust.edu.vn</td>
              <td className="p-4"><span className="text-emerald-500">Thành công</span></td>
              <td className="p-4">+5 bản ghi</td>
            </tr>
            <tr>
              <td className="p-4">1 giờ trước</td>
              <td className="p-4">vnu.edu.vn</td>
              <td className="p-4"><span className="text-danger-500">Lỗi</span></td>
              <td className="p-4">Timeout</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
