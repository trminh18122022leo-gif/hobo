'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MagnifyingGlass,
  GraduationCap,
  User,
  List,
  X,
  SignOut,
  Scales,
  Kanban,
  Sparkle,
  ShieldCheck,
} from '@phosphor-icons/react';
import { useCompare } from '@/context/CompareContext';

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  interface UserState {
    name?: string;
    email: string;
    role?: string;
    studentVerified?: boolean;
    universityName?: string;
  }
  const [user, setUser] = useState<UserState | null>(null);
  const { selectedOpps } = useCompare();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setUser(data.data.user || data.data);
        }
      })
      .catch(() => {});
  }, []);

  const navLinks = [
    { href: '/tim-kiem', label: 'Khám Phá Học Bổng', icon: MagnifyingGlass },
    { href: '/so-sanh', label: 'So Sánh Chi Tiết', icon: Scales, badge: selectedOpps.length },
    { href: '/theo-doi', label: 'Theo Dõi Hồ Sơ', icon: Kanban },
    { href: '/goi-y', label: 'Chiến Lược Gợi Ý', icon: Sparkle },
  ];

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
        <div className="liquid-glass rounded-2xl px-5 h-16 flex items-center justify-between border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          
          {/* Logo with Jacob & Co Gold Sheen */}
          <div className="flex items-center gap-8">
            <Link 
              href="/" 
              className="flex items-center gap-2 group focus-ring rounded-xl py-1 px-2"
            >
              <div className="w-9 h-9 rounded-xl liquid-glass-gold flex items-center justify-center border border-amber-400/40 shadow-[0_0_15px_rgba(212,175,55,0.3)] group-hover:scale-105 transition-transform">
                <span className="text-amber-300 font-serif font-black text-lg">H</span>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-wider uppercase text-gold-gradient font-serif leading-none">
                  Học Bổng VN
                </span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-mono mt-0.5">
                  Haute Precision
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:block">
              <ul className="flex items-center space-x-1">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href.split('?')[0];
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                          isActive
                            ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30 shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                            : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <link.icon size={16} weight={isActive ? 'fill' : 'regular'} className={isActive ? 'text-amber-400' : 'text-slate-400'} />
                        <span>{link.label}</span>
                        {link.badge !== undefined && link.badge > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 shadow-[0_0_10px_rgba(212,175,55,0.5)]">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* User / Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user?.role?.toLowerCase() === 'admin' && (
              <Link
                href="/admin/review"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/60 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition flex items-center gap-1.5"
              >
                <ShieldCheck size={15} weight="fill" />
                <span>Admin Thẩm Định</span>
              </Link>
            )}

            {user ? (
              <div className="flex items-center space-x-2.5">
                <Link
                  href="/ho-so"
                  className="flex items-center gap-2 text-xs font-semibold text-slate-200 liquid-glass hover:border-amber-400/30 py-1.5 px-3 rounded-xl transition"
                >
                  <User size={15} className="text-amber-400" />
                  <span>{user.name || user.email.split('@')[0]}</span>
                  {user.studentVerified && (
                    <span
                      title={user.universityName ? `Sinh viên xác thực: ${user.universityName}` : 'Sinh viên trường đại học xác thực'}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-950 text-sky-300 border border-sky-400/40 shadow-[0_0_10px_rgba(56,189,248,0.25)]"
                    >
                      <GraduationCap size={12} weight="fill" />
                      SV Xác thực
                    </span>
                  )}
                </Link>

                <Link
                  href="/cai-dat/thiet-bi"
                  title="Quản lý thiết bị và bảo mật"
                  className="px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-white/5 border border-white/10 rounded-xl text-xs font-semibold transition"
                >
                  Thiết bị
                </Link>

                <button
                  onClick={() => {
                    fetch('/api/auth/logout', { method: 'POST' }).then(() => {
                      setUser(null);
                      window.location.reload();
                    });
                  }}
                  className="flex items-center text-xs font-semibold text-rose-400 hover:text-rose-300 px-2.5 py-1.5 hover:bg-rose-950/30 border border-rose-500/20 rounded-xl transition"
                >
                  <SignOut className="mr-1" size={14} /> Thoát
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/dang-nhap"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-white/5 border border-white/10 transition"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/dang-ky"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:brightness-110 shadow-[0_0_20px_rgba(212,175,55,0.4)] border border-amber-300 transition"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white liquid-glass"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <List size={22} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Glass Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden max-w-7xl mx-auto px-4 sm:px-6 mt-2">
          <div className="liquid-glass-gold rounded-2xl p-4 space-y-2 border border-amber-400/20 shadow-2xl">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-white/10"
              >
                <div className="flex items-center gap-2.5">
                  <link.icon size={18} className="text-amber-400" />
                  <span>{link.label}</span>
                </div>
                {link.badge !== undefined && link.badge > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}

            <div className="border-t border-white/10 pt-3 mt-2">
              {user ? (
                <div className="space-y-2">
                  <Link
                    href="/ho-so"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 text-xs font-semibold text-amber-300"
                  >
                    Hồ sơ ({user.name || user.email})
                  </Link>
                  <Link
                    href="/cai-dat/thiet-bi"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 text-xs font-semibold text-slate-300"
                  >
                    Thiết bị & Bảo mật
                  </Link>
                  <button
                    onClick={() => {
                      fetch('/api/auth/logout', { method: 'POST' }).then(() => window.location.reload());
                    }}
                    className="block w-full text-left px-3 py-2 text-xs font-semibold text-rose-400"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href="/dang-nhap"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-center py-2 px-3 rounded-xl border border-white/20 text-slate-200 text-xs font-bold"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/dang-ky"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-center py-2 px-3 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
