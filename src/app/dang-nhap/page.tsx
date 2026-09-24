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
  Crown,
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

        if (!res.ok || !data.success) {
          setError(data.error || 'Đăng nhập không thành công. Vui lòng kiểm tra lại email hoặc mật khẩu.');
          return;
        }

        // Clean guest data on successful merge
        clearGuestData();

        setSuccess('Đăng nhập thành công! Đang chuyển hướng...');
        setTimeout(() => {
          const returnTo = searchParams.get('returnTo') || '/';
          router.push(returnTo);
          router.refresh();
        }, 800);
      } catch (err: any) {
        setError('Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.');
      }
    });
  };

  // Handle Magic Link request
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    startTransition(async () => {
      try {
        const guestTrackerItems = getGuestTrackerItems();
        const guestProfile = getGuestProfile();

        const res = await fetch('/api/auth/magic-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            guestTrackerItems,
            guestProfile,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || 'Không thể gửi email đăng nhập lúc này. Vui lòng thử lại.');
          return;
        }

        setSuccess(data.message || 'Liên kết đăng nhập an toàn đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư.');
      } catch (err: any) {
        setError('Lỗi kết nối. Vui lòng thử lại sau.');
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
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
          Đăng Nhập Hệ Thống
        </h1>
        <p className="text-xs text-slate-400 mt-2 font-light">
          Trải nghiệm tra cứu & cố vấn học bổng chuẩn xác nhất
        </p>
      </div>

      {/* Main Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="liquid-glass-gold rounded-3xl p-6 sm:p-8 border border-amber-400/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
      >
        {/* Guest Data Merge Banner */}
        {guestSummary.totalItems > 0 && (
          <div className="mb-6 p-3.5 rounded-2xl liquid-glass border border-amber-400/30 text-xs text-amber-200 flex items-start gap-2.5">
            <Sparkle size={18} weight="fill" className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">Dữ liệu phiên khách sẵn sàng đồng bộ</p>
              <p className="text-slate-300 text-[11px] mt-0.5">
                {guestSummary.trackerCount} học bổng theo dõi & hồ sơ sẽ được tự động lưu vào tài khoản.
              </p>
            </div>
          </div>
        )}

        {/* Tab switcher: Password vs Magic Link */}
        <div className="flex p-1.5 liquid-glass rounded-2xl mb-6 border border-white/10">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('password');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              authMethod === 'password'
                ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key size={14} weight="bold" />
            <span>Mật khẩu</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('magic');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              authMethod === 'magic'
                ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lightning size={14} weight="fill" />
            <span>Magic Link</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <XCircle size={18} className="flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle size={18} className="flex-shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          </div>
        )}

        {authMethod === 'password' ? (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email tài khoản
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Envelope size={16} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl liquid-glass border border-white/10 text-slate-100 placeholder-slate-500 text-sm focus:border-amber-400/60 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Mật khẩu
                </label>
                <Link
                  href="/quen-mat-khau"
                  className="text-xs text-amber-300 hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  <span>Đăng Nhập</span>
                  <ArrowRight size={16} weight="bold" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email nhận liên kết đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Envelope size={16} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl liquid-glass border border-white/10 text-slate-100 placeholder-slate-500 text-sm focus:border-amber-400/60 focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 text-white font-extrabold text-sm shadow-[0_0_25px_rgba(14,165,233,0.4)] hover:brightness-110 active:scale-98 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-6"
            >
              {isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lightning size={16} weight="fill" />
                  <span>Gửi Magic Link Đăng Nhập</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-slate-400">
            Chưa có tài khoản?{' '}
            <Link
              href="/dang-ky"
              className="font-bold text-amber-300 hover:text-amber-200 transition-colors"
            >
              Đăng ký tài khoản mới &rarr;
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
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
