'use client';

import { useState, useEffect, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Envelope,
  Sparkle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Lightning,
  Key,
  ShieldCheck,
} from '@phosphor-icons/react';
import { getGuestTrackerItems, getGuestProfile, clearGuestData, getGuestDataSummary } from '@/lib/guest-storage';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authMethod, setAuthMethod] = useState<'password' | 'magic'>('password');
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [devPreviewUrl, setDevPreviewUrl] = useState<string | null>(null);
  const [guestSummary, setGuestSummary] = useState({ trackerCount: 0, hasProfile: false, totalItems: 0 });

  useEffect(() => {
    setGuestSummary(getGuestDataSummary());
    const errParam = searchParams.get('error');
    if (errParam === 'expired_token') {
      setError('Liên kết đăng nhập đã hết hạn hoặc đã được sử dụng. Vui lòng yêu cầu liên kết mới.');
    } else if (errParam === 'missing_token') {
      setError('Mã đăng nhập không hợp lệ.');
    }
  }, [searchParams]);

  // Handle password login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    startTransition(async () => {
      try {
        const guestTrackerItems = getGuestTrackerItems();
        const guestProfile = getGuestProfile();

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            guestTrackerItems,
            guestProfile,
          }),
        });

        const data = await res.json();

        if (data.success) {
          clearGuestData();
          if (data.reactivated) {
            setSuccess(data.message || 'Tài khoản của bạn đã được khôi phục thành công!');
          } else {
            setSuccess('Đăng nhập thành công! Đang chuyển hướng...');
          }
          setTimeout(() => {
            router.push('/');
            router.refresh();
          }, 900);
        } else {
          setError(data.error || 'Email hoặc mật khẩu không chính xác');
        }
      } catch {
        setError('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
      }
    });
  };

  // Handle magic link login
  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setDevPreviewUrl(null);

    if (!email || !email.includes('@')) {
      setError('Vui lòng nhập email hợp lệ');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/magic-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (data.success) {
          setSuccess(data.message);
          if (data.devPreviewUrl) {
            setDevPreviewUrl(data.devPreviewUrl);
          }
        } else {
          setError(data.error || 'Không thể gửi email đăng nhập lúc này.');
        }
      } catch {
        setError('Không thể kết nối đến máy chủ');
      }
    });
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 mb-4">
            <Lock size={30} weight="duotone" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Đăng nhập
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Chào mừng bạn quay lại hệ thống Học Bổng VN
          </p>
        </div>

        {/* Guest merge alert */}
        {guestSummary.totalItems > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
            <Sparkle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={20} weight="fill" />
            <div className="text-xs text-amber-900 dark:text-amber-200">
              <span className="font-bold">Đồng bộ dữ liệu khách:</span> {guestSummary.trackerCount} mục đã theo dõi sẽ
              được tự động sáp nhập vào tài khoản của bạn ngay khi đăng nhập.
            </div>
          </div>
        )}

        {/* Tab switcher: Password vs Magic Link */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('password');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
              authMethod === 'password'
                ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Key size={16} weight="bold" />
            <span>Mật khẩu</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('magic');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
              authMethod === 'magic'
                ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Lightning size={16} weight="fill" />
            <span>Magic Link</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
            <XCircle size={20} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle size={20} className="flex-shrink-0" />
              <span>{success}</span>
            </div>
            {devPreviewUrl && (
              <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800/60">
                <a
                  href={devPreviewUrl}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow transition"
                >
                  <Lightning size={14} weight="fill" />
                  Mở liên kết Magic Link thử nghiệm ngay
                </a>
              </div>
            )}
          </div>
        )}

        {authMethod === 'password' ? (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Envelope size={18} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Mật khẩu
                </label>
                <Link
                  href="/quen-mat-khau"
                  className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-3.5 px-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-primary-600/25 transition duration-200 flex items-center justify-center gap-2"
            >
              {isPending ? 'Đang xác thực...' : 'Đăng nhập'}
              {!isPending && <ArrowRight size={18} weight="bold" />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email của bạn
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Envelope size={18} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 outline-none transition"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Chúng tôi sẽ gửi một liên kết bảo mật có hiệu lực trong 15 phút. Bạn chỉ cần nhấp vào để đăng nhập ngay mà không cần nhớ mật khẩu.
              </p>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-3.5 px-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-primary-600/25 transition duration-200 flex items-center justify-center gap-2"
            >
              <Lightning size={18} weight="fill" />
              {isPending ? 'Đang gửi link...' : 'Gửi liên kết đăng nhập Magic Link'}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Chưa có tài khoản?{' '}
            <Link
              href="/dang-ky"
              className="font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline"
            >
              Đăng ký tài khoản mới
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

