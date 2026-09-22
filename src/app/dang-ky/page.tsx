'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Lock,
  Envelope,
  User,
  CheckCircle,
  XCircle,
  Sparkle,
  ShieldCheck,
  ArrowRight,
  GoogleLogo,
  GithubLogo,
} from '@phosphor-icons/react';
import { getGuestTrackerItems, getGuestProfile, clearGuestData, getGuestDataSummary } from '@/lib/guest-storage';

export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    dataResidency: 'vietnam',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [guestSummary, setGuestSummary] = useState({ trackerCount: 0, hasProfile: false, totalItems: 0 });

  // Student Domain Detection State (Feature D.1)
  const [studentBadge, setStudentBadge] = useState<{
    isStudent: boolean;
    universityName?: string;
    badgeLabel?: string;
  } | null>(null);
  const [checkingDomain, setCheckingDomain] = useState(false);

  // Check guest storage on mount
  useEffect(() => {
    setGuestSummary(getGuestDataSummary());
  }, []);

  // Live email domain check with debounce
  useEffect(() => {
    if (!formData.email || !formData.email.includes('@')) {
      setStudentBadge(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingDomain(true);
      try {
        const res = await fetch('/api/auth/check-domain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email }),
        });
        const data = await res.json();
        if (data.success && data.data?.isStudent) {
          setStudentBadge(data.data);
        } else {
          setStudentBadge(null);
        }
      } catch {
        setStudentBadge(null);
      } finally {
        setCheckingDomain(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [formData.email]);

  // Password rules
  const hasMinLength = formData.password.length >= 8;
  const hasMixedCase = /[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password);
  const hasNumber = /\d/.test(formData.password);
  const isPasswordValid = hasMinLength && hasMixedCase && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isPasswordValid) {
      setError('Mật khẩu chưa đáp ứng đủ các tiêu chuẩn bảo mật.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    startTransition(async () => {
      try {
        // Collect guest data for seamless merge (Feature D.4)
        const guestTrackerItems = getGuestTrackerItems();
        const guestProfile = getGuestProfile();

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            guestTrackerItems,
            guestProfile,
          }),
        });

        const data = await res.json();

        if (data.success) {
          clearGuestData();
          setSuccess(
            data.data?.badgeLabel
              ? `Đăng ký thành công! Đã cấp huy hiệu "${data.data.badgeLabel}" cho bạn.`
              : 'Đăng ký tài khoản thành công!'
          );
          setTimeout(() => {
            router.push('/');
            router.refresh();
          }, 1200);
        } else {
          setError(data.error || 'Đã có lỗi xảy ra khi tạo tài khoản.');
        }
      } catch {
        setError('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
      }
    });
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 mb-4">
            <GraduationCap size={32} weight="duotone" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Đăng ký tài khoản
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Truy cập hơn 100+ học bổng xác thực & cơ hội tuyển sinh đại học hàng đầu
          </p>
        </div>

        {/* Feature D.4: Guest Mode Merge Notification */}
        {guestSummary.totalItems > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3"
          >
            <Sparkle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={20} weight="fill" />
            <div className="text-xs text-amber-900 dark:text-amber-200">
              <span className="font-bold">Đồng bộ dữ liệu khách:</span> Chúng tôi tìm thấy{' '}
              <span className="font-bold underline">{guestSummary.trackerCount} học bổng</span> bạn đang theo dõi trên
              trình duyệt này. Sau khi đăng ký, toàn bộ sẽ được lưu tự động vào tài khoản!
            </div>
          </motion.div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
            <XCircle size={20} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
            <CheckCircle size={20} className="flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Họ và tên
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input
                type="text"
                required
                placeholder="Nguyễn Văn A"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Email
              </label>
              <span className="text-xs text-primary-600 dark:text-primary-400">
                Dùng email trường (.edu.vn) để nhận huy hiệu
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Envelope size={18} />
              </div>
              <input
                type="email"
                required
                placeholder="tenban@hust.edu.vn hoặc gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              />
            </div>

            {/* Feature D.1: Live Student Badge Preview */}
            <AnimatePresence>
              {studentBadge?.isStudent && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -5 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2.5 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/60 flex items-center gap-3 shadow-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow">
                    <GraduationCap size={20} weight="fill" />
                  </div>
                  <div className="text-xs text-blue-900 dark:text-blue-200">
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{studentBadge.badgeLabel}</span>
                      <ShieldCheck size={16} className="text-blue-600 dark:text-blue-400" weight="fill" />
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                      Email đại học hợp lệ! Hệ thống sẽ tự động cấp huy hiệu sinh viên xác thực và ưu tiên gợi ý học bổng {studentBadge.universityName}.
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              />
            </div>

            {/* Password security checklist */}
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div
                className={`flex items-center gap-1.5 ${
                  hasMinLength ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                }`}
              >
                <CheckCircle size={14} weight={hasMinLength ? 'fill' : 'regular'} />
                <span>Từ 8 ký tự</span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${
                  hasMixedCase ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                }`}
              >
                <CheckCircle size={14} weight={hasMixedCase ? 'fill' : 'regular'} />
                <span>Hoa & thường</span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${
                  hasNumber ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                }`}
              >
                <CheckCircle size={14} weight={hasNumber ? 'fill' : 'regular'} />
                <span>Chữ số</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          {/* Privacy & Residency choice */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                defaultChecked
                disabled
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span>
                Dữ liệu cá nhân được mã hóa AES-256-GCM và lưu trữ an toàn tại máy chủ Việt Nam.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 px-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-primary-600/25 transition duration-200 flex items-center justify-center gap-2"
          >
            {isPending ? 'Đang tạo tài khoản...' : 'Hoàn tất đăng ký'}
            {!isPending && <ArrowRight size={18} weight="bold" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Đã có tài khoản?{' '}
            <Link
              href="/dang-nhap"
              className="font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
