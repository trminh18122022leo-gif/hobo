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
  Sun,
  Moon,
  Scales,
  Kanban,
} from '@phosphor-icons/react';
import { useCompare } from '@/context/CompareContext';

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  interface UserState {
    name?: string;
    email: string;
    studentVerified?: boolean;
    universityName?: string;
  }
  const [user, setUser] = useState<UserState | null>(null);
  const { selectedOpps } = useCompare();

  useEffect(() => {
    // Check auth
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setUser(data.data.user || data.data);
        }
      })
      .catch(() => {});

    // Check dark mode
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const navLinks = [
    { href: '/tim-kiem', label: 'Tìm kiếm', icon: MagnifyingGlass },
    { href: '/so-sanh', label: 'So sánh', icon: Scales, badge: selectedOpps.length },
    { href: '/theo-doi', label: 'Theo dõi hồ sơ', icon: Kanban },
    { href: '/goi-y', label: 'Chiến lược gợi ý', icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur flex-none transition-colors duration-500 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 font-extrabold text-xl text-primary-600 dark:text-primary-500 focus-ring rounded">
              Học Bổng VN
            </Link>
            <nav className="hidden md:block ml-8">
              <ul className="flex space-x-6">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`flex items-center text-sm font-semibold transition-colors focus-ring rounded relative py-1 ${
                        pathname === link.href.split('?')[0]
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400'
                      }`}
                    >
                      <link.icon className="mr-1.5" size={18} />
                      <span>{link.label}</span>
                      {link.badge !== undefined && link.badge > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.2 bg-primary-600 text-white rounded-full text-[10px] font-bold">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 focus-ring rounded-full"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span className="sr-only">Chuyển đổi giao diện sáng/tối</span>
            </button>

            {user ? (
              <div className="flex items-center space-x-2.5">
                <Link
                  href="/ho-so"
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-primary-600 focus-ring rounded py-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <span>{user.name || user.email.split('@')[0]}</span>
                  {user.studentVerified && (
                    <span
                      title={user.universityName ? `Sinh viên xác thực: ${user.universityName}` : 'Sinh viên trường đại học xác thực'}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
                    >
                      <GraduationCap size={12} weight="fill" />
                      SV Xác thực
                    </span>
                  )}
                </Link>

                <Link
                  href="/cai-dat/thiet-bi"
                  title="Quản lý thiết bị và bảo mật phiên"
                  className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold transition"
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
                  className="flex items-center text-xs font-semibold text-red-500 hover:text-red-600 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                >
                  <SignOut className="mr-1" size={16} /> Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/dang-nhap"
                  className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/dang-ky"
                  className="inline-flex items-center justify-center px-4 py-1.5 border border-transparent rounded-xl shadow-sm text-xs sm:text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus-ring transition"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={toggleDarkMode}
              className="p-2 mr-2 text-slate-500 dark:text-slate-400 focus-ring rounded-full"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 focus-ring"
              aria-expanded="false"
            >
              <span className="sr-only">Mở menu chính</span>
              {isMobileMenuOpen ? <X size={24} /> : <List size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800">
          <div className="px-3 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <div className="flex items-center">
                  <link.icon className="mr-3" size={18} />
                  <span>{link.label}</span>
                </div>
                {link.badge !== undefined && link.badge > 0 && (
                  <span className="px-2 py-0.5 bg-primary-600 text-white rounded-full text-xs font-bold">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-2">
              {user ? (
                <>
                  <Link
                    href="/ho-so"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    <span>Hồ sơ ({user.name || user.email})</span>
                    {user.studentVerified && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                        SV Xác thực
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/cai-dat/thiet-bi"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Thiết bị & Bảo mật
                  </Link>
                  <button
                    onClick={() => {
                      fetch('/api/auth/logout', { method: 'POST' }).then(() => window.location.reload());
                    }}
                    className="block w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-red-500"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 px-1">
                  <Link
                    href="/dang-nhap"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-center py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/dang-ky"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-center py-2 px-3 rounded-xl bg-primary-600 text-white font-semibold text-sm"
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
