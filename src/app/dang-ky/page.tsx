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
  Crown,
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
      } catch (err) {
        setStudentBadge(null);
      } finally {
        setCheckingDomain(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.password.length < 8) {
      setError('Mật khẩu phải chứa ít nhất 8 ký tự');
      return;
    }

    startTransition(async () => {
      try {
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

        if (!res.ok || !data.success) {
          setError(data.error || 'Đăng ký không thành công. Vui lòng thử lại.');
          return;
        }

        // Clean guest data on successful merge
        clearGuestData();

        setSuccess('Đăng ký tài khoản thành công! Đang chuyển hướng...');
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 1000);
      } catch (err: any) {
        setError('Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.');
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto py-10 px-4">
      {/* Brand Badge */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl liquid-glass-gold mb-4 border border-amber-400/40 shadow-[0_0_30px_rgba(212,175,55,0.3)]">
          <Crown size={26} weight="fill" className="text-amber-300" />
        </div>
        <h1 className="text-3xl font-extrabold font-serif text-slate-100 tracking-tight">
          Đăng Ký Tài Khoản
        </h1>
        <p className="text-xs text-slate-400 mt-2 font-light">
          Nhận thông báo học bổng phù hợp & mở khóa phân tích hồ sơ chuyên sâu
        </p>
      </div>

      {/* Main Glass Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="liquid-glass-gold rounded-3xl p-6 sm:p-8 border border-amber-400/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
      >
        {/* Guest Data Notice */}
        {guestSummary.totalItems > 0 && (
          <div className="mb-6 p-3.5 rounded-2xl liquid-glass border border-amber-400/30 text-xs text-amber-200 flex items-start gap-2.5">
            <Sparkle size={18} weight="fill" className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">Tự động hợp nhất dữ liệu phiên khách</p>
              <p className="text-slate-300 text-[11px] mt-0.5">
                {guestSummary.trackerCount} học bổng bạn đang theo dõi sẽ được lưu tự động vào tài khoản mới.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <XCircle size={18} className="flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle size={18} className="flex-shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Họ và tên
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User size={16} />
              </div>
              <input
                type="text"
                required
                placeholder="Nguyễn Văn A"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl liquid-glass border border-white/10 text-slate-100 placeholder-slate-500 text-sm focus:border-amber-400/60 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Địa chỉ Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Envelope size={16} />
              </div>
              <input
                type="email"
                required
                placeholder="name@hust.edu.vn hoặc name@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl liquid-glass border border-white/10 text-slate-100 placeholder-slate-500 text-sm focus:border-amber-400/60 focus:outline-none transition-all"
              />
            </div>

            {/* Live Student Domain Badge Notification (Feature D.1) */}
            <AnimatePresence>
              {studentBadge && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2.5 p-3 rounded-xl bg-blue-950/80 border border-sky-400/40 text-sky-200 text-xs flex items-center gap-2.5 shadow-[0_0_15px_rgba(56,189,248,0.2)]"
                >
                  <GraduationCap size={20} weight="fill" className="text-sky-400 flex-shrink-0" />
                  <div>
                    <span className="font-extrabold text-sky-300">🎓 Xác thực Sinh viên Tức thì!</span>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Đã nhận diện: <strong>{studentBadge.universityName}</strong>. Huy hiệu sinh viên xác thực sẽ được cấp ngay khi kích hoạt.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock size={16} />
              </div>
              <input
                type="password"
                required
                placeholder="Tối thiểu 8 ký tự (chữ hoa, thường, số)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl liquid-glass border border-white/10 text-slate-100 placeholder-slate-500 text-sm focus:border-amber-400/60 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock size={16} />
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl liquid-glass border border-white/10 text-slate-100 placeholder-slate-500 text-sm focus:border-amber-400/60 focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 font-extrabold text-sm shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-98 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-6"
          >
            {isPending ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Tạo Tài Khoản Mới</span>
                <ArrowRight size={16} weight="bold" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-slate-400">
            Đã có tài khoản?{' '}
            <Link
              href="/dang-nhap"
              className="font-bold text-amber-300 hover:text-amber-200 transition-colors"
            >
              Đăng nhập ngay &rarr;
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
