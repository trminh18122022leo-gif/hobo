'use client';

import { motion } from 'framer-motion';

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
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.section 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="text-center space-y-8"
    >
      <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
        Tra cứu Học bổng & Tuyển sinh <br className="hidden md:block"/> nhanh chóng, chính xác
      </motion.h1>
      <motion.p variants={itemVariants} className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
        Hệ thống tự động tổng hợp thông tin từ hàng trăm nguồn uy tín.
      </motion.p>
      
      <motion.form variants={itemVariants} action="/tim-kiem" className="max-w-xl mx-auto relative flex items-center">
        <label htmlFor="search" className="sr-only">Tìm kiếm</label>
        <input 
          type="text" 
          id="search"
          name="q" 
          placeholder="Nhập tên học bổng, trường đại học, ngành học..." 
          className="w-full pl-6 pr-16 py-4 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-slate-900 dark:text-white shadow-sm"
        />
        <button type="submit" className="absolute right-2 p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-full focus-ring">
          Tìm
        </button>
      </motion.form>

      <motion.div variants={itemVariants} className="flex justify-center gap-8 pt-8">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{stats.totalScholarships}+</div>
          <div className="text-sm text-slate-500">Cơ hội</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{stats.universities}</div>
          <div className="text-sm text-slate-500">Trường</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{stats.countries}</div>
          <div className="text-sm text-slate-500">Quốc gia</div>
        </div>
      </motion.div>
    </motion.section>
  );
}
