'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Devices,
  Desktop,
  DeviceMobile,
  ShieldCheck,
  Trash,
  SignOut,
  WarningOctagon,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  SpinnerGap,
} from '@phosphor-icons/react';

interface SessionItem {
  id: string;
  deviceLabel: string;
  ipPrefix: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export default function DeviceSettingsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/sessions');
      const data = await res.json();
      if (data.success && data.data?.sessions) {
        setSessions(data.data.sessions);
      } else if (res.status === 401) {
        router.push('/dang-nhap');
      }
    } catch {
      setMessage({ type: 'error', text: 'Không thể tải danh sách phiên đăng nhập' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/auth/sessions?id=${sessionId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Đã thu hồi phiên đăng nhập thành công.' });
        fetchSessions();
      } else {
        setMessage({ type: 'error', text: data.error || 'Lỗi khi thu hồi phiên' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Không thể kết nối đến máy chủ' });
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm('Bạn có chắc chắn muốn đăng xuất khỏi tất cả các thiết bị khác không?')) return;

    try {
      const res = await fetch('/api/auth/logout-all', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Đã đăng xuất toàn bộ thiết bị khác thành công.' });
        fetchSessions();
      }
    } catch {
      setMessage({ type: 'error', text: 'Không thể đăng xuất tất cả thiết bị' });
    }
  };

  const handleSoftDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'XOA TAI KHOAN') {
      alert('Vui lòng nhập đúng cụm từ "XOA TAI KHOAN" để xác nhận.');
      return;
    }

    try {
      setIsDeleting(true);
      const res = await fetch('/api/auth/account', { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        alert(
          'Tài khoản đã được chuyển sang trạng thái chờ xóa. Bạn có 30 ngày ân hạn để đăng nhập lại bất kỳ lúc nào để khôi phục.'
        );
        router.push('/dang-nhap');
        router.refresh();
      } else {
        alert(data.error || 'Lỗi khi yêu cầu xóa tài khoản');
      }
    } catch {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const getDeviceIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('iphone') || l.includes('android') || l.includes('mobile')) {
      return <DeviceMobile size={24} className="text-primary-600 dark:text-primary-400" weight="duotone" />;
    }
    return <Desktop size={24} className="text-primary-600 dark:text-primary-400" weight="duotone" />;
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-2xl">
            <Devices size={28} weight="duotone" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Thiết bị & Bảo mật phiên</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Quản lý các thiết bị đang đăng nhập tài khoản và quyền riêng tư dữ liệu
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-2xl flex items-center gap-2 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
              : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Feature D.2: Active Sessions List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-10">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Các phiên đăng nhập đang hoạt động</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                {sessions.length} thiết bị
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Token refresh xoay vòng tự động mỗi lần sử dụng. Hệ thống tự động khóa phiên khi phát hiện tái sử dụng trái phép.
            </p>
          </div>

          {sessions.length > 1 && (
            <button
              onClick={handleLogoutAll}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900/60 transition"
            >
              <SignOut size={16} weight="bold" />
              Đăng xuất các thiết bị khác
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
              <SpinnerGap size={28} className="animate-spin text-primary-600" />
              <span>Đang tải danh sách thiết bị...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-12 text-center text-slate-400">Không tìm thấy phiên làm việc nào.</div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                  session.isCurrent ? 'bg-primary-50/40 dark:bg-primary-950/20' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl flex-shrink-0">
                    {getDeviceIcon(session.deviceLabel)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {session.deviceLabel}
                      </span>
                      {session.isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Phiên hiện tại
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        IP: {session.ipPrefix}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        Hoạt động: {new Date(session.lastUsedAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>

                {!session.isCurrent && (
                  <button
                    onClick={() => handleRevokeSession(session.id)}
                    className="self-start sm:self-center px-3.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border border-slate-200 dark:border-slate-700 transition"
                  >
                    Thu hồi phiên
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Feature D.3: Danger Zone & 30-Day Grace Period Soft Delete */}
      <div className="bg-red-50/50 dark:bg-red-950/20 rounded-3xl border border-red-200 dark:border-red-900/60 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-2xl flex-shrink-0">
            <WarningOctagon size={28} weight="duotone" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-900 dark:text-red-300">Khu vực nhạy cảm: Xóa tài khoản</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
              Khi bạn yêu cầu xóa, tài khoản sẽ được đưa vào <strong className="text-red-700 dark:text-red-300">thời gian ân hạn 30 ngày</strong>.
              Bạn có thể đăng nhập lại bất kỳ lúc nào trong 30 ngày này để khôi phục tài khoản ngay lập tức. Sau 30 ngày, toàn bộ dữ liệu cá nhân sẽ bị xóa vĩnh viễn và không thể phục hồi.
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-md transition"
              >
                Yêu cầu xóa tài khoản (Ân hạn 30 ngày)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/40 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash size={28} weight="duotone" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center">
              Xác nhận xóa tài khoản?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center mt-2">
              Tài khoản sẽ bị đăng xuất ngay lập tức và chuyển sang chế độ chờ xóa trong 30 ngày. Để tiếp tục, vui lòng nhập:
            </p>
            <p className="text-center font-mono font-bold text-red-600 my-2 select-all">
              XOA TAI KHOAN
            </p>

            <input
              type="text"
              placeholder="Nhập XOA TAI KHOAN"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center font-mono text-sm uppercase focus:ring-2 focus:ring-red-500 outline-none my-4"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting || deleteConfirmText.trim().toUpperCase() !== 'XOA TAI KHOAN'}
                onClick={handleSoftDeleteAccount}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-sm shadow transition"
              >
                {isDeleting ? 'Đang xử lý...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
