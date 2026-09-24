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
  Lock,
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
      setMessage({ type: 'error', text: 'Lỗi kết nối' });
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm('Bạn có chắc chắn muốn đăng xuất khỏi tất cả các thiết bị khác không?')) return;
    try {
      const res = await fetch('/api/auth/logout-all', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Đã đăng xuất toàn bộ các thiết bị khác.' });
        fetchSessions();
      } else {
        setMessage({ type: 'error', text: data.error || 'Lỗi khi thu hồi phiên' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối' });
    }
  };

  const handleSoftDeleteAccount = async () => {
    if (deleteConfirmText !== 'XOA TAI KHOAN') {
      alert('Vui lòng nhập đúng cụm từ "XOA TAI KHOAN" để xác nhận');
      return;
    }

    try {
      setIsDeleting(true);
      const res = await fetch('/api/auth/account', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('Tài khoản của bạn đã được chuyển sang chế độ chờ xóa trong 30 ngày. Bạn có thể đăng nhập lại bất kỳ lúc nào trong 30 ngày để kích hoạt lại tài khoản.');
        router.push('/dang-nhap');
      } else {
        alert(data.error || 'Lỗi khi xóa tài khoản');
      }
    } catch {
      alert('Lỗi kết nối');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="liquid-glass-gold p-8 rounded-3xl border border-amber-400/30 relative overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl liquid-glass flex items-center justify-center border border-amber-400/40 text-amber-300">
            <ShieldCheck size={22} weight="fill" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              Quản Lý Thiết Bị & Bảo Mật
            </h1>
            <p className="text-xs text-slate-300 font-light mt-0.5">
              Kiểm soát các phiên làm việc đa thiết bị và chính sách an toàn tài khoản
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Active Sessions List */}
      <div className="liquid-glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Devices size={20} className="text-amber-400" />
              <span>Thiết Bị Đang Hoạt Động ({sessions.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-light">
              Mỗi thiết bị được bảo vệ bằng cơ chế xoay vòng Refresh Token 30 ngày và IP ẩn danh.
            </p>
          </div>

          {sessions.length > 1 && (
            <button
              onClick={handleRevokeAllSessions}
              className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition shadow-sm"
            >
              Đăng xuất các thiết bị khác
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse text-xs">
            Đang tải danh sách thiết bị...
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => {
              const isMobile = s.deviceLabel.toLowerCase().includes('phone') || s.deviceLabel.toLowerCase().includes('android');
              return (
                <div
                  key={s.id}
                  className={`p-5 rounded-2xl liquid-glass border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition ${
                    s.isCurrent ? 'border-amber-400/40 bg-amber-400/[0.03]' : 'border-white/10'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl liquid-glass flex items-center justify-center text-amber-300 border border-white/10 flex-shrink-0">
                      {isMobile ? <DeviceMobile size={20} /> : <Desktop size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-100">{s.deviceLabel}</span>
                        {s.isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shadow-[0_0_10px_rgba(212,175,55,0.4)]">
                            Thiết bị này
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap font-mono">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-slate-500" />
                          IP: {s.ipPrefix}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-slate-500" />
                          Hoạt động: {new Date(s.lastUsedAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!s.isCurrent && (
                    <button
                      onClick={() => handleRevokeSession(s.id)}
                      className="px-3 py-1.5 liquid-glass hover:bg-rose-950/50 hover:text-rose-300 border border-white/10 rounded-xl text-xs font-semibold text-slate-300 transition flex items-center gap-1.5"
                    >
                      <SignOut size={14} />
                      <span>Thu hồi</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Danger Zone: 30-Day Grace Period Soft Delete (Feature D.3) */}
      <div className="liquid-glass rounded-3xl p-6 sm:p-8 border border-rose-500/20 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-rose-400">
          <WarningOctagon size={20} weight="fill" />
          <h2 className="text-base font-bold">Khu Vực Nguy Hiểm (Danger Zone)</h2>
        </div>
        <p className="text-xs text-slate-400 font-light leading-relaxed">
          Xóa tài khoản của bạn khỏi hệ thống. Tài khoản sẽ được chuyển vào chế độ <strong className="text-amber-300">ân hạn 30 ngày (Soft Delete)</strong>. Trong vòng 30 ngày, bạn có thể kích hoạt lại bất kỳ lúc nào bằng cách đăng nhập lại. Sau 30 ngày, hệ thống sẽ xóa vĩnh viễn toàn bộ dữ liệu.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition flex items-center gap-2"
        >
          <Trash size={15} />
          <span>Yêu cầu xóa tài khoản (Ân hạn 30 ngày)</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass rounded-3xl p-6 sm:p-8 max-w-md w-full border border-rose-500/30 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-rose-300 flex items-center gap-2">
              <WarningOctagon size={22} weight="fill" />
              <span>Xác Nhận Xóa Tài Khoản</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Để xác nhận, vui lòng nhập chính xác cụm từ <strong className="text-amber-300 font-mono">XOA TAI KHOAN</strong> vào ô bên dưới:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="XOA TAI KHOAN"
              className="w-full px-4 py-3 rounded-xl liquid-glass border border-white/20 text-slate-100 font-mono text-sm focus:border-rose-400 outline-none"
            />
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl liquid-glass text-xs font-semibold text-slate-300 hover:text-white"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSoftDeleteAccount}
                disabled={deleteConfirmText !== 'XOA TAI KHOAN' || isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
              >
                {isDeleting ? <SpinnerGap size={16} className="animate-spin" /> : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
