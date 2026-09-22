'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Kanban,
  CheckCircle,
  CalendarCheck,
  Clock,
  Trash,
  ArrowRight,
  ArrowLeft,
  DownloadSimple,
  Plus,
  ListChecks,
  X,
} from '@phosphor-icons/react';
import { ApplicationTrackerItem, ChecklistItem } from '@/types';
import { downloadIcsFile } from '@/lib/calendar';

const COLUMNS: { id: 'interested' | 'preparing' | 'submitted' | 'result'; label: string; color: string }[] = [
  { id: 'interested', label: 'Quan tâm', color: 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20' },
  { id: 'preparing', label: 'Đang chuẩn bị', color: 'border-amber-500 bg-amber-50/30 dark:bg-amber-950/20' },
  { id: 'submitted', label: 'Đã nộp hồ sơ', color: 'border-purple-500 bg-purple-50/30 dark:bg-purple-950/20' },
  { id: 'result', label: 'Có kết quả', color: 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20' },
];

export default function TrackerPage() {
  const [items, setItems] = useState<ApplicationTrackerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChecklistOpp, setActiveChecklistOpp] = useState<ApplicationTrackerItem | null>(null);

  const fetchTracker = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tracker');
      const json = await res.json();
      if (json.success && json.data) {
        setItems(json.data);
      }
    } catch (err) {
      console.error('Fetch tracker error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracker();
  }, []);

  const handleStatusChange = async (id: number, newStatus: 'interested' | 'preparing' | 'submitted' | 'result') => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    try {
      await fetch('/api/tracker', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
    } catch (err) {
      console.error(err);
      fetchTracker();
    }
  };

  const handleToggleChecklist = async (trackerId: number, taskId: string) => {
    const target = items.find((i) => i.id === trackerId);
    if (!target) return;

    const updatedChecklist = (target.checklist || []).map((t) =>
      t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
    );

    setItems((prev) =>
      prev.map((i) => (i.id === trackerId ? { ...i, checklist: updatedChecklist } : i))
    );

    if (activeChecklistOpp && activeChecklistOpp.id === trackerId) {
      setActiveChecklistOpp({ ...activeChecklistOpp, checklist: updatedChecklist });
    }

    try {
      await fetch('/api/tracker', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: trackerId, checklist: updatedChecklist }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn bỏ theo dõi học bổng này?')) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await fetch(`/api/tracker?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  // Xuất file lịch .ics cho toàn bộ deadline
  const handleExportAllCalendar = () => {
    const events: string[] = [];
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    items.forEach((item) => {
      const opp = item.opportunity;
      if (!opp || !opp.deadline) return;
      const d = new Date(opp.deadline);
      const dt = d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      events.push(`BEGIN:VEVENT
UID:tracker-${item.id}@hocbong.vn
DTSTAMP:${now}
DTSTART:${dt}
DTEND:${dt}
SUMMARY:⏰ HẠN CHÓT: ${opp.title}
DESCRIPTION:Trạng thái của bạn: ${item.status}\\nĐơn vị: ${opp.organization}\\nLink: https://hocbong.vn/hoc-bong/${opp.slug}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-P2D
ACTION:DISPLAY
DESCRIPTION:Nhắc hạn nộp: ${opp.title}
END:VALARM
END:VEVENT`);
    });

    if (events.length === 0) {
      alert('Chưa có học bổng nào có hạn nộp để xuất lịch.');
      return;
    }

    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//HocBong VN//Tracker//VI
CALSCALE:GREGORIAN
${events.join('\n')}
END:VCALENDAR`;

    downloadIcsFile('tat-ca-deadline-hoc-bong.ics', ics);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Kanban size={32} className="text-primary-600" />
            Bảng theo dõi hồ sơ ứng tuyển cá nhân
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Quản lý tiến độ theo mô hình Kanban và theo dõi checklist lộ trình chuẩn bị từng học bổng.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportAllCalendar}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-sm transition"
          >
            <DownloadSimple size={18} />
            <span>Xuất toàn bộ lịch (.ics)</span>
          </button>
          <Link
            href="/tim-kiem"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-semibold shadow-sm transition"
          >
            <Plus size={18} />
            <span>Tìm thêm học bổng</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((col) => (
            <div key={col} className="h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl p-4" />
          ))}
        </div>
      ) : (
        /* Bảng Kanban 4 cột */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {COLUMNS.map((col) => {
            const colItems = items.filter((i) => i.status === col.id);

            return (
              <div
                key={col.id}
                className={`rounded-2xl border-t-4 p-4 border border-slate-200 dark:border-slate-800 ${col.color} flex flex-col min-h-[500px]`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <span>{col.label}</span>
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs flex items-center justify-center font-bold">
                      {colItems.length}
                    </span>
                  </h3>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colItems.length === 0 ? (
                    <div className="h-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center text-xs text-slate-400">
                      Chưa có hồ sơ
                    </div>
                  ) : (
                    colItems.map((item) => {
                      const opp = item.opportunity;
                      const checklist = item.checklist || [];
                      const completedCount = checklist.filter((t) => t.isCompleted).length;
                      const totalTasks = checklist.length;
                      const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

                      return (
                        <div
                          key={item.id}
                          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 truncate">
                              {opp?.organization}
                            </span>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-slate-300 hover:text-red-500 transition"
                              title="Bỏ theo dõi"
                            >
                              <Trash size={15} />
                            </button>
                          </div>

                          <Link
                            href={`/hoc-bong/${opp?.slug}`}
                            className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-primary-600 transition mt-1"
                          >
                            {opp?.title}
                          </Link>

                          {/* Hạn nộp */}
                          {opp?.deadline && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2">
                              <Clock size={14} className="text-amber-500" />
                              <span>Hạn: {new Date(opp.deadline).toLocaleDateString('vi-VN')}</span>
                            </div>
                          )}

                          {/* Thanh tiến độ Checklist (Tính năng B.2 & B.6) */}
                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <ListChecks size={14} /> Tiến độ hồ sơ
                              </span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {progress}% ({completedCount}/{totalTasks})
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-primary-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <button
                              onClick={() => setActiveChecklistOpp(item)}
                              className="w-full mt-2 text-center text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 py-1 rounded hover:bg-primary-50 dark:hover:bg-primary-950/30 transition"
                            >
                              Mở checklist ({totalTasks} việc)
                            </button>
                          </div>

                          {/* Nút chuyển trạng thái nhanh */}
                          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                            <span>Chuyển cột:</span>
                            <select
                              value={item.status}
                              onChange={(e) => handleStatusChange(item.id, e.target.value as any)}
                              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none"
                            >
                              <option value="interested">Quan tâm</option>
                              <option value="preparing">Đang chuẩn bị</option>
                              <option value="submitted">Đã nộp</option>
                              <option value="result">Có kết quả</option>
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Checklist nhiệm vụ đếm ngược theo tuần (B.2) */}
      {activeChecklistOpp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
                  Lộ trình chuẩn bị ngược từ hạn nộp
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1 mt-0.5">
                  {activeChecklistOpp.opportunity?.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveChecklistOpp(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {(activeChecklistOpp.checklist || []).map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleChecklist(activeChecklistOpp.id, task.id)}
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                    task.isCompleted
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-slate-500 line-through'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-primary-300'
                  }`}
                >
                  <div className="pt-0.5">
                    {task.isCompleted ? (
                      <CheckCircle size={20} weight="fill" className="text-emerald-600" />
                    ) : (
                      <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.isCompleted ? 'text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {task.task}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span>Tuần trước hạn: {task.weekNumber} tuần</span>
                      {task.deadline && <span>Mục tiêu: {task.deadline}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveChecklistOpp(null)}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition"
              >
                Đóng & Lưu tiến độ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
