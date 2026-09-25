'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  GraduationCap,
  Books,
  FileText,
  Clock,
  CheckCircle,
  MagnifyingGlass,
  ArrowRight,
  Sparkle,
  Star,
  ShieldCheck,
  Headset,
  CalendarBlank,
  BookmarkSimple,
  Calculator,
  Article,
  HourglassHigh,
  UploadSimple,
} from '@phosphor-icons/react';
import ApplicationDossierModal from './ApplicationDossierModal';
import AdmissionScoreSimulatorModal from './AdmissionScoreSimulatorModal';

export default function AcademicPrestigePortal() {
  const [activeTab, setActiveTab] = useState<'scholarship' | 'admission' | 'majors' | 'dossier'>('scholarship');

  // Modal controls
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [dossierMajor, setDossierMajor] = useState('Khoa học Máy tính & AI (7480101)');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // Tab 1 (Scholarship) Filter state
  const [scholarshipCategory, setScholarshipCategory] = useState<'all' | 'presidential' | 'full' | 'stem' | 'talent'>('all');

  // Tab 1 Dynamic Matcher Calculator
  const [calcGpa, setCalcGpa] = useState(9.3);
  const [calcEnglish, setCalcEnglish] = useState<'ielts75' | 'ielts65' | 'toefl' | 'none'>('ielts75');
  const [calcMerit, setCalcMerit] = useState(true);

  // Tab 2 Countdown Timer tính toán thực tế đến đợt tuyển sinh sớm 15/11/2026
  const targetDate = useMemo(() => new Date('2026-11-15T23:59:59'), []);
  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = Math.max(0, targetDate.getTime() - Date.now());
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.max(0, targetDate.getTime() - Date.now());
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  // Tab 3 Majors Roster Search & Category
  const [majorSearch, setMajorSearch] = useState('');
  const [majorCategory, setMajorCategory] = useState<'all' | 'tech' | 'econ' | 'bio' | 'law'>('all');

  const MAJORS_DATA = [
    {
      id: 'cs_ai',
      code: '7480101',
      title: 'Khoa học Máy tính & Trí tuệ Nhân tạo',
      desc: 'Chương trình Tiên tiến Tinh hoa đào tạo song ngữ kết hợp phòng Lab Nghiên cứu Quốc tế.',
      category: 'tech',
      degree: 'Kỹ sư / Cử nhân',
      quota: 350,
      cutoff: '26.50 / 30',
      accreditation: 'ABET Accredited',
      scholarship: 'Học bổng Presidential: Tài trợ đến 100% học phí',
      accent: 'border-l-amber-400',
    },
    {
      id: 'fintech',
      code: '7340205',
      title: 'Tài chính - Công nghệ (Fintech)',
      desc: 'Sự giao thoa giữa Định lượng tài chính hiện đại, Chuỗi khối (Blockchain) & Quản lý rủi ro.',
      category: 'tech econ',
      degree: 'Cử nhân Liên ngành',
      quota: 200,
      cutoff: '25.80 / 30',
      accreditation: 'AACSB Standard',
      scholarship: 'Tài trợ 70% từ Quỹ Đối tác Ngân hàng Đầu tư',
      accent: 'border-l-sky-400',
    },
    {
      id: 'ib',
      code: '7340101',
      title: 'Quản trị Kinh doanh Quốc tế',
      desc: 'Tiêu chuẩn kiểm định học thuật kinh doanh toàn cầu AACSB, cơ hội chuyển tiếp 2+2 Âu/Mỹ.',
      category: 'econ',
      degree: 'AACSB Accredited',
      quota: 400,
      cutoff: '25.00 / 30',
      accreditation: 'AACSB Accredited',
      scholarship: 'Suất học bổng Global Ambassador 50%',
      accent: 'border-l-amber-300',
    },
    {
      id: 'bme',
      code: '7520101',
      title: 'Kỹ thuật Y sinh & Công nghệ Nano',
      desc: 'Nghiên cứu cấu trúc vật liệu kích thước phân tử và thiết bị vi điện tử y tế chuẩn lâm sàng.',
      category: 'bio',
      degree: 'Khoa học Ứng dụng',
      quota: 150,
      cutoff: '24.50 / 30',
      accreditation: 'Research Lab Co-op',
      scholarship: 'Học bổng STEM Innovation 100%',
      accent: 'border-l-emerald-400',
    },
  ];

  const filteredMajors = MAJORS_DATA.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(majorSearch.toLowerCase()) ||
      m.code.includes(majorSearch);
    const matchesCategory =
      majorCategory === 'all' || m.category.includes(majorCategory);
    return matchesSearch && matchesCategory;
  });

  const getBestScholarshipMatch = () => {
    if (calcGpa >= 9.2 && calcEnglish === 'ielts75' && calcMerit) {
      return {
        title: "President's Fellowship (100% Học Phí + 60Tr/Năm)",
        desc: 'Hồ sơ của bạn đạt chuẩn tuyệt đối cho gói học bổng danh giá nhất của Viện. Xác suất được duyệt bảo trợ cao nhất.',
        tag: 'Gói Danh Giá Nhất',
        color: 'amber',
      };
    } else if (calcGpa >= 8.5 && calcMerit) {
      return {
        title: 'STEM & Innovation Excellence (70% - 100%)',
        desc: 'Hồ sơ của bạn phù hợp tuyệt vời với chuyên ban Sáng tạo Công nghệ & Đổi mới khoa học.',
        tag: 'Khối Công Nghệ & STEM',
        color: 'sky',
      };
    } else if (calcEnglish === 'ielts75' || calcEnglish === 'ielts65') {
      return {
        title: 'Global Ambassador Award (50% + Trao Đổi)',
        desc: 'Năng lực ngoại ngữ ưu việt giúp bạn có điểm cộng lớn ở gói học bổng đại sứ hội nhập trao đổi quốc tế.',
        tag: 'Đại Sứ Hội Nhập',
        color: 'emerald',
      };
    } else {
      return {
        title: 'Quỹ Khuyến Tài & Đồng Hành (30% - 50%)',
        desc: 'Bạn hoàn toàn đủ tiêu chuẩn cho các gói trợ cấp học phí khuyến tài thường niên của các doanh nghiệp đối tác.',
        tag: 'Hỗ Trợ Học Tập',
        color: 'slate',
      };
    }
  };

  const bestMatch = getBestScholarshipMatch();

  interface TabItem {
    id: 'scholarship' | 'admission' | 'majors' | 'dossier';
    label: string;
    icon: any;
    count?: string;
    badge?: string;
  }

  const tabsConfig: TabItem[] = [
    { id: 'scholarship', label: 'Quỹ Học Bổng Tinh Hoa', icon: Trophy, count: '520 Suất' },
    { id: 'admission', label: 'Cổng Tuyển Sinh 2025', icon: GraduationCap, badge: 'Đợt 1 Mở' },
    { id: 'majors', label: 'Ngành Học & Nguyện Vọng', icon: Books, count: '4 Ngành' },
    { id: 'dossier', label: 'Quy Trình & Nộp Hồ Sơ', icon: FileText, badge: 'Trực tuyến' },
  ];

  return (
    <section className="relative w-full rounded-3xl liquid-glass-navy border border-white/15 p-4 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

      {/* Header Title with Jacob & Co Gold & Stitch Academic Tone */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl liquid-glass-gold flex items-center justify-center border border-amber-400/40 text-amber-300 shadow-[0_0_20px_rgba(212,175,55,0.25)] flex-shrink-0">
            <GraduationCap size={26} weight="fill" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gold-gradient">
                Academic Prestige Portal 2025 - 2026
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.2 rounded-full bg-blue-950/80 text-sky-300 border border-sky-400/30">
                ABET & AACSB
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Trung Tâm Điều Hành Tuyển Sinh & Học Bổng Tinh Hoa
            </h2>
          </div>
        </div>

        {/* Action button opens quick Dossier */}
        <button
          onClick={() => {
            setDossierMajor('Khoa học Máy tính & AI (7480101)');
            setIsDossierOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(212,175,55,0.35)] hover:brightness-110 active:scale-95 transition flex items-center gap-1.5 flex-shrink-0"
        >
          <Sparkle size={15} weight="fill" />
          <span>Nộp Hồ Sơ Trực Tuyến</span>
        </button>
      </div>

      {/* Liquid Glass Sliding Tab Bar (Thanh Tab Trượt Kính Mờ) */}
      <div className="my-6 relative z-10">
        <div className="flex p-1.5 rounded-2xl liquid-glass border border-white/10 backdrop-blur-2xl overflow-x-auto no-scrollbar gap-1">
          {tabsConfig.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap z-10 flex-1 ${
                  isActive ? 'text-slate-950' : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {/* Framer Motion Sliding Glass Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activePortalTabIndicator"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 shadow-[0_0_20px_rgba(212,175,55,0.45)] border border-amber-200 z-[-1]"
                  />
                )}

                <tab.icon
                  size={18}
                  weight={isActive ? 'fill' : 'regular'}
                  className={isActive ? 'text-slate-950' : 'text-amber-400'}
                />
                <span className="tracking-wide">{tab.label}</span>

                {tab.count && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-slate-950 text-amber-300' : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}

                {tab.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels with AnimatePresence */}
      <AnimatePresence mode="wait">
        {/* ================= TAB 1: QUỸ HỌC BỔNG TINH HOA ================= */}
        {activeTab === 'scholarship' && (
          <motion.div
            key="scholarship-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 relative z-10"
          >
            {/* Hero Showcase Card */}
            <div className="relative rounded-2xl overflow-hidden liquid-glass border border-white/15 p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity pointer-events-none"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCFmy7J2lmvM_CGDP5rNv4wKps5wUeDE2-9IXLSOsw22QAtUi3_-Ynv75AQHEDDXe3oXnQMz6aze8JNmGgqC2Jv4umZ0dqgN12cM5Gbh9IGiwHE9eDE7ppJdCwtYTlqxGbBVZ28RbQTIYKOSRp1aQtb61zLLeXf6Mmq-H9XnEI3SkNxzHgElIF76aMsUZhCNi3B8OOzQ_-BIm3GCMFyEaq0iKUg_3-apZf6pa0RODQwfnxTpZe1-qkAtw')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />

              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold mb-3 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                  <Star size={14} weight="fill" />
                  <span>Hội Đồng Tinh Hoa &mdash; Niên Khóa 2025 - 2026</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-100 leading-tight">
                  QUỸ HỌC BỔNG TINH HOA 2025 <br />
                  <span className="text-gold-gradient">KIẾN TẠO TƯƠNG LAI</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  Hơn 500 suất học bổng danh giá từ 50% đến 100% học phí toàn khóa kèm trợ cấp sinh hoạt phí từ các quỹ đầu tư học thuật quốc tế.
                </p>

                {/* Stats Ribbon */}
                <div className="grid grid-cols-3 gap-3 pt-6 max-w-md">
                  <div className="p-3 rounded-xl liquid-glass border border-white/10 text-center">
                    <span className="block text-lg sm:text-2xl font-black text-white">120+ Tỷ</span>
                    <span className="text-[10px] uppercase font-mono text-slate-400">Tổng ngân sách</span>
                  </div>
                  <div className="p-3 rounded-xl liquid-glass border border-white/10 text-center">
                    <span className="block text-lg sm:text-2xl font-black text-amber-300">520</span>
                    <span className="text-[10px] uppercase font-mono text-slate-400">Suất toàn phần</span>
                  </div>
                  <div className="p-3 rounded-xl liquid-glass border border-white/10 text-center">
                    <span className="block text-lg sm:text-2xl font-black text-emerald-400">98.4%</span>
                    <span className="text-[10px] uppercase font-mono text-slate-400">Tỷ lệ việc làm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <span className="text-xs font-bold text-slate-400 mr-2 flex-shrink-0">Danh mục:</span>
              {[
                { id: 'all', label: 'Tất cả học bổng', count: 24 },
                { id: 'presidential', label: 'Học bổng Thủ khoa' },
                { id: 'full', label: 'Toàn phần 100%' },
                { id: 'stem', label: 'Nghiên cứu & STEM' },
                { id: 'talent', label: 'Khuyến tài & Đồng hành' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setScholarshipCategory(cat.id as any)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                    scholarshipCategory === cat.id
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                      : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <span>{cat.label}</span>
                  {cat.count && (
                    <span className="w-4 h-4 rounded-full bg-slate-950 text-amber-300 text-[10px] font-bold flex items-center justify-center">
                      {cat.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* 3 Prestigious Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: President's Fellowship */}
              <div className="relative rounded-2xl liquid-glass border border-white/15 p-5 flex flex-col justify-between overflow-hidden group hover:border-amber-400/50 transition">
                <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-400 to-amber-600" />
                <div className="pl-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-950/80 border border-amber-400/30 px-2 py-0.5 rounded-full">
                      Danh giá nhất
                    </span>
                    <ShieldCheck size={20} className="text-amber-400" weight="fill" />
                  </div>
                  <h4 className="text-base font-extrabold text-white">President's Fellowship</h4>
                  <span className="text-xs text-slate-400">Học Bổng Chủ Tịch Viện Hàn Lâm</span>

                  <div className="my-3 p-3 rounded-xl bg-amber-400/10 border border-amber-400/20">
                    <span className="text-[11px] text-slate-400 block">Giá trị tài trợ:</span>
                    <span className="text-sm font-black text-amber-300">100% Học phí + 60Tr/năm</span>
                    <p className="text-[11px] text-slate-400 mt-1">Trợ cấp sinh hoạt phí và tài trợ nghiên cứu luân chuyển 4 năm.</p>
                  </div>

                  <ul className="text-xs space-y-1.5 text-slate-300">
                    <li className="flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-amber-400" />
                      <span>GPA THPT ≥ 9.0 hoặc Thủ khoa</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle size={14} className="text-amber-400" />
                      <span>IELTS ≥ 7.5 / TOEFL iBT ≥ 102</span>
                    </li>
                    <li className="flex items-center gap-1.5 text-rose-300">
                      <Clock size={14} />
                      <span>Hạn chót: 30/06/2025</span>
                    </li>
                  </ul>
                </div>

                <div className="pl-2 pt-4">
                  <button
                    onClick={() => {
                      setDossierMajor("President's Fellowship - Khoa học Máy tính & AI");
                      setIsDossierOpen(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-primary-container text-white border border-white/20 hover:border-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 group-hover:bg-amber-400 group-hover:text-slate-950 transition"
                  >
                    <span>Ứng Tuyển Suất Này</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Card 2: STEM & Innovation */}
              <div className="relative rounded-2xl liquid-glass border border-white/15 p-5 flex flex-col justify-between overflow-hidden group hover:border-sky-400/50 transition">
                <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-sky-400 to-sky-600" />
                <div className="pl-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300 bg-sky-950/80 border border-sky-400/30 px-2 py-0.5 rounded-full">
                      Khoa học & Kỹ thuật
                    </span>
                    <Sparkle size={20} className="text-sky-400" weight="fill" />
                  </div>
                  <h4 className="text-base font-extrabold text-white">STEM & Innovation Excellence</h4>
                  <span className="text-xs text-slate-400">Tài Năng Công Nghệ & Sáng Tạo Mở</span>

                  <div className="my-3 p-3 rounded-xl bg-sky-400/10 border border-sky-400/20">
                    <span className="text-[11px] text-slate-400 block">Mức học bổng:</span>
                    <span className="text-sm font-black text-sky-300">70% &minus; 100% Học phí</span>
                    <p className="text-[11px] text-slate-400 mt-1">Đặc quyền gia nhập Viện Trí tuệ Nhân tạo & Lab Bán dẫn.</p>
                  </div>

                  <ul className="text-xs space-y-1.5 text-slate-300">
                    <li className="flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-sky-400" />
                      <span>Giải HSG Quốc gia/Quốc tế hoặc Demo Patent</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle size={14} className="text-sky-400" />
                      <span>IELTS ≥ 6.5 hoặc Bài luận thuyết trình</span>
                    </li>
                  </ul>
                </div>

                <div className="pl-2 pt-4">
                  <button
                    onClick={() => {
                      setDossierMajor('STEM & Innovation Excellence - Khoa học Máy tính & AI');
                      setIsDossierOpen(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-primary-container text-white border border-white/20 hover:border-sky-400 font-bold text-xs flex items-center justify-center gap-1.5 group-hover:bg-sky-400 group-hover:text-slate-950 transition"
                  >
                    <span>Ứng Tuyển Suất Này</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Card 3: Global Ambassador */}
              <div className="relative rounded-2xl liquid-glass border border-white/15 p-5 flex flex-col justify-between overflow-hidden group hover:border-emerald-400/50 transition">
                <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-400 to-emerald-600" />
                <div className="pl-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                      Hội Nhập Toàn Cầu
                    </span>
                    <Star size={20} className="text-emerald-400" weight="fill" />
                  </div>
                  <h4 className="text-base font-extrabold text-white">Global Ambassador Award</h4>
                  <span className="text-xs text-slate-400">Đại Sứ Trao Đổi Quốc Tế</span>

                  <div className="my-3 p-3 rounded-xl bg-emerald-400/10 border border-emerald-400/20">
                    <span className="text-[11px] text-slate-400 block">Quyền lợi:</span>
                    <span className="text-sm font-black text-emerald-300">50% Học phí + Trao đổi Âu/Mỹ</span>
                    <p className="text-[11px] text-slate-400 mt-1">Tài trợ vé máy bay & chi phí sinh hoạt kỳ học chuyển tiếp.</p>
                  </div>

                  <ul className="text-xs space-y-1.5 text-slate-300">
                    <li className="flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-emerald-400" />
                      <span>GPA ≥ 8.5 & Năng nổ hoạt động xã hội</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle size={14} className="text-emerald-400" />
                      <span>IELTS ≥ 7.0 hoặc TOEFL iBT 95</span>
                    </li>
                  </ul>
                </div>

                <div className="pl-2 pt-4">
                  <button
                    onClick={() => {
                      setDossierMajor('Global Ambassador Award - QTKD Quốc Tế');
                      setIsDossierOpen(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-primary-container text-white border border-white/20 hover:border-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 group-hover:bg-emerald-400 group-hover:text-slate-950 transition"
                  >
                    <span>Ứng Tuyển Suất Này</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Interactive Calculator Widget from Stitch */}
            <div className="p-5 sm:p-6 rounded-2xl liquid-glass border border-white/15 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator size={20} className="text-amber-400" />
                  <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">
                    Công Cụ Dự Đoán Gói Học Bổng Phù Hợp Tức Thời
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400">Kéo thanh trượt để thử nghiệm</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* GPA Slider */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-semibold">Điểm TB Học Bạ (GPA):</span>
                    <span className="text-amber-300 font-bold">{calcGpa.toFixed(1)} / 10.0</span>
                  </div>
                  <input
                    type="range"
                    min="7.0"
                    max="10.0"
                    step="0.1"
                    value={calcGpa}
                    onChange={(e) => setCalcGpa(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                {/* English Select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Trình độ Ngoại Ngữ:
                  </label>
                  <select
                    value={calcEnglish}
                    onChange={(e) => setCalcEnglish(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="ielts75">IELTS Academic 7.5+ / TOEFL 102+</option>
                    <option value="ielts65">IELTS Academic 6.5 - 7.0</option>
                    <option value="toefl">TOEFL iBT 80 - 95</option>
                    <option value="none">Chưa có chứng chỉ quốc tế</option>
                  </select>
                </div>

                {/* Merit Checkbox */}
                <div className="flex items-center pt-4">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={calcMerit}
                      onChange={(e) => setCalcMerit(e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-400"
                    />
                    <span>Có giải thưởng HSG / Bài luận / Hoạt động NCKH</span>
                  </label>
                </div>
              </div>

              {/* Realtime Matching Callout */}
              <div className="p-4 rounded-xl liquid-glass-gold border border-amber-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300">
                    {bestMatch.tag}
                  </span>
                  <h5 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                    {bestMatch.title}
                  </h5>
                  <p className="text-xs text-slate-300 mt-0.5">{bestMatch.desc}</p>
                </div>

                <button
                  onClick={() => {
                    setDossierMajor(bestMatch.title);
                    setIsDossierOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:brightness-110 transition whitespace-nowrap flex items-center gap-1.5 flex-shrink-0"
                >
                  <span>Nộp Hồ Sơ Gói Này</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= TAB 2: CỔNG TUYỂN SINH 2025 ================= */}
        {activeTab === 'admission' && (
          <motion.div
            key="admission-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 relative z-10"
          >
            {/* Campus Hero Card with Countdown */}
            <div className="relative rounded-2xl overflow-hidden liquid-glass border border-white/15 p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity pointer-events-none"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAcQBY9w9zDwEMhKkniJLCihYVVBmporFxupfhoMfb7EDUDaZSJSd2UUYSYI_V-35IVjKyxoNNQqSg2v481fj3_-lzgEMBFZDlRJsNTR0ZBMhwjY1qZ_CMfB9NLuveEiDKNRgVhuXB56p2pwk09iOOOHN986KBrn7_LwgExozVC4hS2IugNQkCa7WV4VnFfo5IEQp8DPLgzvJt5dAnjp1HeiW2D_QdKorAbuA81bgC5mrl7mLBe468FRw')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-400/15 border border-sky-400/30 text-sky-300 text-xs font-bold mb-3 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                    <ShieldCheck size={14} weight="fill" />
                    <span>Kiểm Định Quốc Tế &mdash; ABET & AACSB Accredited</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-100 leading-tight">
                    TUYỂN SINH ĐẠI HỌC CHÍNH QUY <br />
                    <span className="text-sapphire-gradient">NIÊN KHÓA 2026 &minus; 2027</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl">
                    Chương trình đào tạo chuẩn quốc tế, giảng dạy song ngữ với cơ sở vật chất chuẩn phòng Lab nghiên cứu và cơ hội việc làm toàn cầu.
                  </p>
                </div>

                {/* Countdown Timer Frosted Capsule */}
                <div className="p-4 rounded-2xl liquid-glass border border-white/15 flex flex-col items-center shadow-lg flex-shrink-0">
                  <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold mb-2">
                    <HourglassHigh size={16} className="animate-pulse" />
                    <span>Hạn nộp hồ sơ Đợt 1</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <div className="text-center px-3 py-2 rounded-xl bg-slate-900 border border-white/10">
                      <span className="text-xl font-black text-white">{timeLeft.days}</span>
                      <span className="block text-[9px] text-slate-400 uppercase">Ngày</span>
                    </div>
                    <span className="text-amber-400 font-bold">:</span>
                    <div className="text-center px-3 py-2 rounded-xl bg-slate-900 border border-white/10">
                      <span className="text-xl font-black text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
                      <span className="block text-[9px] text-slate-400 uppercase">Giờ</span>
                    </div>
                    <span className="text-amber-400 font-bold">:</span>
                    <div className="text-center px-3 py-2 rounded-xl bg-slate-900 border border-white/10">
                      <span className="text-xl font-black text-white">{String(timeLeft.minutes).padStart(2, '0')}</span>
                      <span className="block text-[9px] text-slate-400 uppercase">Phút</span>
                    </div>
                    <span className="text-amber-400 font-bold">:</span>
                    <div className="text-center px-3 py-2 rounded-xl bg-slate-900 border border-white/10">
                      <span className="text-xl font-black text-amber-300">{String(timeLeft.seconds).padStart(2, '0')}</span>
                      <span className="block text-[9px] text-slate-400 uppercase">Giây</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2">Hạn chót: 15 Tháng 11, 2026</span>
                </div>
              </div>
            </div>

            {/* 4 Frosted Interactive Quick Action Tiles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Tile 1: Register */}
              <button
                onClick={() => {
                  setDossierMajor('Khoa học Máy tính & AI (7480101)');
                  setIsDossierOpen(true);
                }}
                className="p-4 rounded-2xl liquid-glass border border-white/10 hover:border-amber-400/40 text-left transition group active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform mb-3">
                  <FileText size={22} weight="fill" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  Đăng ký xét tuyển
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">Trực tuyến 15 phút</p>
              </button>

              {/* Tile 2: Simulator */}
              <button
                onClick={() => setIsSimulatorOpen(true)}
                className="p-4 rounded-2xl liquid-glass border border-white/10 hover:border-sky-400/40 text-left transition group active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-400/10 border border-sky-400/30 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform mb-3">
                  <Calculator size={22} weight="fill" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                  Tính điểm xét tuyển
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">Mô phỏng đỗ trúng tuyển</p>
              </button>

              {/* Tile 3: Regulations */}
              <Link
                href="/tim-kiem?kind=admission_vietnam"
                className="p-4 rounded-2xl liquid-glass border border-white/10 hover:border-emerald-400/40 text-left transition group active:scale-98 block"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform mb-3">
                  <Article size={22} weight="fill" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Quy chế tuyển sinh
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">Chỉ tiêu & Tiêu chí 2025</p>
              </Link>

              {/* Tile 4: Hotline */}
              <a
                href="tel:18006699"
                className="p-4 rounded-2xl liquid-glass border border-white/10 hover:border-purple-400/40 text-left transition group active:scale-98 block"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-400/10 border border-purple-400/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform mb-3">
                  <Headset size={22} weight="fill" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                  Tư vấn trực tuyến
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">Hotline miễn cước: 1800 6699</p>
              </a>
            </div>

            {/* 4-Stage Stepper Roadmap */}
            <div className="p-6 rounded-2xl liquid-glass border border-white/15 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-sky-400">
                    Lộ Trình Đăng Ký
                  </span>
                  <h4 className="text-base font-extrabold text-white">4 Giai Đoạn Tuyển Sinh Chính Quy</h4>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Giai đoạn 1 đang mở
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-sky-500/15 border border-sky-400/30 space-y-1">
                  <span className="w-6 h-6 rounded-full bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h5 className="text-xs font-bold text-white pt-1">Nộp Hồ Sơ Trực Tuyến</h5>
                  <p className="text-[11px] text-slate-300">Tiếp nhận học bạ, CCCD và chứng chỉ quốc tế.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="w-6 h-6 rounded-full bg-white/20 text-white font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h5 className="text-xs font-bold text-white pt-1">Thẩm Định & ĐGNL</h5>
                  <p className="text-[11px] text-slate-400">Hội đồng học thuật rà soát điểm sàn và chứng chỉ.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="w-6 h-6 rounded-full bg-white/20 text-white font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <h5 className="text-xs font-bold text-white pt-1">Phỏng Vấn Song Ngữ</h5>
                  <p className="text-[11px] text-slate-400">25 phút với Giáo sư viện cho ứng viên học bổng.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="w-6 h-6 rounded-full bg-white/20 text-white font-bold text-xs flex items-center justify-center">
                    4
                  </span>
                  <h5 className="text-xs font-bold text-white pt-1">Công Bố & Nhập Học</h5>
                  <p className="text-[11px] text-slate-400">Gửi giấy báo trúng tuyển và hướng dẫn nhập trường.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= TAB 3: NGÀNH HỌC & NGUYỆN VỌNG ================= */}
        {activeTab === 'majors' && (
          <motion.div
            key="majors-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 relative z-10"
          >
            {/* Search & Category Filter */}
            <div className="p-4 rounded-2xl liquid-glass border border-white/15 space-y-3">
              <div className="relative flex items-center">
                <MagnifyingGlass size={18} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={majorSearch}
                  onChange={(e) => setMajorSearch(e.target.value)}
                  placeholder="Tìm theo tên ngành hoặc mã ngành (VD: 7480101, Fintech, AI, Kinh tế...)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                {[
                  { id: 'all', label: 'Tất cả ngành' },
                  { id: 'tech', label: 'Công nghệ & AI' },
                  { id: 'econ', label: 'Kinh tế & Quản trị' },
                  { id: 'bio', label: 'Kỹ thuật cao & Y sinh' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setMajorCategory(c.id as any)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                      majorCategory === c.id
                        ? 'bg-sky-500 text-white font-bold shadow-md'
                        : 'bg-white/5 text-slate-300 hover:text-white border border-white/10'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Major Cards List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMajors.map((m) => (
                <div
                  key={m.id}
                  className={`relative p-5 rounded-2xl liquid-glass border border-white/15 border-l-4 ${m.accent} flex flex-col justify-between space-y-4 hover:border-white/30 transition shadow-lg`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                        Mã: {m.code}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-400/30">
                        {m.accreditation}
                      </span>
                    </div>

                    <h4 className="text-base font-extrabold text-white leading-snug">{m.title}</h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{m.desc}</p>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10 text-xs">
                      <div className="p-2 rounded-lg bg-white/5">
                        <span className="text-[10px] text-slate-400 block">Chỉ tiêu 2025:</span>
                        <span className="font-bold text-white">{m.quota} Sinh viên</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5">
                        <span className="text-[10px] text-slate-400 block">Điểm sàn chuẩn:</span>
                        <span className="font-bold text-amber-300">{m.cutoff}</span>
                      </div>
                    </div>

                    <div className="mt-2.5 p-2 rounded-lg bg-amber-400/10 border border-amber-400/20 text-[11px] text-amber-300 flex items-center gap-1.5">
                      <Sparkle size={14} weight="fill" />
                      <span>{m.scholarship}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => {
                        setDossierMajor(`${m.title} (${m.code})`);
                        setIsDossierOpen(true);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 text-slate-950 font-bold text-xs hover:brightness-110 active:scale-98 transition flex items-center justify-center gap-1.5"
                    >
                      <span>Đăng Ký Nguyện Vọng</span>
                      <ArrowRight size={14} />
                    </button>
                    <button
                      onClick={() => setIsSimulatorOpen(true)}
                      title="Mô phỏng điểm vào ngành này"
                      className="px-3 py-2.5 rounded-xl liquid-glass border border-white/15 text-xs text-slate-300 hover:text-white hover:border-amber-400/40 transition flex items-center gap-1"
                    >
                      <Calculator size={16} />
                      <span className="hidden sm:inline">Tính Điểm</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ================= TAB 4: QUY TRÌNH & NỘP HỒ SƠ ================= */}
        {activeTab === 'dossier' && (
          <motion.div
            key="dossier-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 relative z-10"
          >
            <div className="p-6 sm:p-8 rounded-2xl liquid-glass border border-white/15 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-5">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-gold-gradient">
                    Online Dossier Portal
                  </span>
                  <h3 className="text-xl font-extrabold text-white mt-0.5">
                    Quy Trình 3 Bước Nộp Hồ Sơ Xét Tuyển Trực Tuyến
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Hoàn tất hồ sơ điện tử trong 15 phút &ndash; Dữ liệu được mã hóa chuẩn an ninh cấp cao AES-256.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setDossierMajor('Khoa học Máy tính & AI (7480101)');
                    setIsDossierOpen(true);
                  }}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 text-slate-950 font-extrabold text-xs shadow-[0_0_20px_rgba(212,175,55,0.35)] hover:brightness-110 active:scale-95 transition flex items-center gap-2 flex-shrink-0"
                >
                  <UploadSimple size={16} weight="bold" />
                  <span>Khởi Tạo Hồ Sơ Mới Ngay</span>
                </button>
              </div>

              {/* 3 Steps Detailed Track */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl liquid-glass border border-white/10 space-y-3 relative overflow-hidden">
                  <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-md">
                    1
                  </div>
                  <h4 className="text-sm font-bold text-white">Kê Khai Thông Tin Thí Sinh</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Điền đầy đủ họ tên, số CCCD định danh, phương thức xét tuyển và xếp thứ tự nguyện vọng các ngành học.
                  </p>
                </div>

                <div className="p-5 rounded-2xl liquid-glass border border-white/10 space-y-3 relative overflow-hidden">
                  <div className="w-9 h-9 rounded-xl bg-sky-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-md">
                    2
                  </div>
                  <h4 className="text-sm font-bold text-white">Tải Lên Minh Chứng Hồ Sơ</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Đính kèm bản scan Học bạ THPT (5 học kỳ), phiếu điểm ĐGNL hoặc chứng chỉ IELTS/TOEFL định dạng PDF/JPG.
                  </p>
                </div>

                <div className="p-5 rounded-2xl liquid-glass border border-white/10 space-y-3 relative overflow-hidden">
                  <div className="w-9 h-9 rounded-xl bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-md">
                    3
                  </div>
                  <h4 className="text-sm font-bold text-white">Nhận Mã Hồ Sơ & Cố Vấn 24H</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Hệ thống cấp mã hồ sơ điện tử tức thì. Cố vấn học thuật sẽ gọi điện xác thực thông tin và hỗ trợ phỏng vấn.
                  </p>
                </div>
              </div>

              {/* Bottom Support Banner */}
              <div className="p-4 rounded-xl liquid-glass-gold border border-amber-400/25 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Headset size={18} className="text-amber-400" />
                  <span>Cần hỗ trợ hướng dẫn làm hồ sơ hoặc giải đáp học bổng?</span>
                </div>
                <a
                  href="tel:18006699"
                  className="font-bold text-amber-300 hover:underline flex items-center gap-1"
                >
                  Hotline Miễn Phí: 1800 6699
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Embedded Modals */}
      <ApplicationDossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        defaultMajor={dossierMajor}
      />

      <AdmissionScoreSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSelectMajor={(major) => {
          setDossierMajor(major);
          setIsDossierOpen(true);
        }}
      />
    </section>
  );
}
