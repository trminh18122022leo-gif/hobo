'use client';

import { motion } from 'framer-motion';
import { MagnifyingGlass, Sparkle, ShieldCheck, Crown } from '@phosphor-icons/react';

interface HomeHeroProps {
  stats: {
    totalScholarships: number;
    universities: number;
    countries: number;
  };
}

export default function HomeHero({ stats }: HomeHeroProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
  };

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="text-center relative py-12 md:py-20"
    >
      {/* Precision Haute Horlogerie Dial Badge */}
      <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full liquid-glass-gold mb-6 border border-amber-400/40 shadow-[0_0_25px_rgba(212,175,55,0.25)]">
        <Crown size={15} weight="fill" className="text-amber-300 animate-pulse" />
        <span className="text-[11px] uppercase tracking-[0.25em] font-bold text-amber-200">
          Hệ Thống Thẩm Định Thời Gian Thực 2026 – 2027
        </span>
        <Sparkle size={13} weight="fill" className="text-amber-300" />
      </motion.div>

      {/* Main Luxury Title */}
      <motion.h1
        variants={itemVariants}
        className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight font-serif text-slate-100 max-w-4xl mx-auto leading-[1.1]"
      >
        Cổng Học Bổng & Tuyển Sinh <br />
        <span className="text-gold-gradient font-serif">Chuẩn Xác Hàng Đầu</span>
      </motion.h1>

      <motion.p
        variants={itemVariants}
        className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-light mt-6 leading-relaxed"
      >
        Tổng hợp, thẩm định đa tầng và liên tục cập nhật học bổng còn hạn từ hơn <span className="text-amber-300 font-semibold">50+ trường đại học</span> và tổ chức chính phủ uy tín toàn cầu.
      </motion.p>

      {/* Google Liquid Glass Luxury Search Bar */}
      <motion.form
        variants={itemVariants}
        action="/tim-kiem"
        className="max-w-2xl mx-auto mt-10 relative flex items-center p-2 rounded-2xl liquid-glass border border-white/20 shadow-[0_15px_50px_rgba(0,0,0,0.6)] group hover:border-amber-400/40 transition-all"
      >
        <div className="pl-4 text-slate-400 group-focus-within:text-amber-400 transition-colors">
          <MagnifyingGlass size={22} weight="bold" />
        </div>
        <input
          type="text"
          name="q"
          placeholder="Tìm học bổng Bách Khoa, VinUni, Chevening, Fulbright, Ngành IT..."
          className="w-full px-4 py-3.5 bg-transparent border-none outline-none text-sm md:text-base text-slate-100 placeholder-slate-500 font-medium"
        />
        <button
          type="submit"
          className="px-6 py-3.5 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 font-bold rounded-xl text-sm shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0"
        >
          <span>Khám Phá</span>
        </button>
      </motion.form>

      {/* Jacob & Co. Haute Horlogerie Metric Dials */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-3 max-w-2xl mx-auto gap-4 pt-14"
      >
        <div className="liquid-glass rounded-2xl p-4 border border-white/10 relative overflow-hidden group hover:border-amber-400/30 transition-colors">
          <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gold-gradient font-serif">
            {stats.totalScholarships > 0 ? `${stats.totalScholarships}+` : '52+'}
          </div>
          <div className="text-xs uppercase tracking-wider text-slate-400 mt-1 font-mono">
            Học Bổng Còn Hạn
          </div>
        </div>

        <div className="liquid-glass rounded-2xl p-4 border border-white/10 relative overflow-hidden group hover:border-sky-400/30 transition-colors">
          <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-sapphire-gradient font-serif">
            {stats.universities > 0 ? stats.universities : '50+'}
          </div>
          <div className="text-xs uppercase tracking-wider text-slate-400 mt-1 font-mono">
            Đại Học & Viện
          </div>
        </div>

        <div className="liquid-glass rounded-2xl p-4 border border-white/10 relative overflow-hidden group hover:border-emerald-400/30 transition-colors">
          <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-emerald-400 font-serif">
            100%
          </div>
          <div className="text-xs uppercase tracking-wider text-slate-400 mt-1 font-mono">
            Dữ Liệu Thẩm Định
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}
