'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calculator,
  Sparkle,
  TrendUp,
  CheckCircle,
  GraduationCap,
  WarningCircle,
  ArrowRight,
} from '@phosphor-icons/react';

interface AdmissionScoreSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMajor?: (majorName: string) => void;
}

export default function AdmissionScoreSimulatorModal({
  isOpen,
  onClose,
  onSelectMajor,
}: AdmissionScoreSimulatorModalProps) {
  const [method, setMethod] = useState<'thpt' | 'dgnl' | 'hocba'>('thpt');

  // THPT state
  const [block, setBlock] = useState<'A00' | 'A01' | 'D01'>('A00');
  const [sub1, setSub1] = useState(8.5);
  const [sub2, setSub2] = useState(8.2);
  const [sub3, setSub3] = useState(8.8);
  const [bonus, setBonus] = useState(0.5);

  // DGNL state
  const [dgnlScore, setDgnlScore] = useState(860);

  // Học bạ state
  const [hocBaGpa, setHocBaGpa] = useState(8.8);

  const calculateTotalThpt = () => {
    return Math.min(30, +(sub1 + sub2 + sub3 + bonus).toFixed(2));
  };

  const MAJORS_BENCHMARK = [
    {
      name: 'Khoa học Máy tính & AI',
      code: '7480101',
      thptCutoff: 26.5,
      dgnlCutoff: 880,
      hocbaCutoff: 8.9,
      seats: 350,
    },
    {
      name: 'Tài chính - Công nghệ (Fintech)',
      code: '7340205',
      thptCutoff: 25.8,
      dgnlCutoff: 840,
      hocbaCutoff: 8.6,
      seats: 200,
    },
    {
      name: 'Quản trị Kinh doanh Quốc tế (AACSB)',
      code: '7340101',
      thptCutoff: 25.0,
      dgnlCutoff: 800,
      hocbaCutoff: 8.3,
      seats: 400,
    },
    {
      name: 'Kỹ thuật Y sinh & Công nghệ Nano',
      code: '7520101',
      thptCutoff: 24.5,
      dgnlCutoff: 780,
      hocbaCutoff: 8.1,
      seats: 150,
    },
  ];

  const getOdds = (major: typeof MAJORS_BENCHMARK[0]) => {
    let diff = 0;
    if (method === 'thpt') {
      const total = calculateTotalThpt();
      diff = total - major.thptCutoff;
    } else if (method === 'dgnl') {
      diff = (dgnlScore - major.dgnlCutoff) / 30;
    } else {
      diff = (hocBaGpa - major.hocbaCutoff) * 2;
    }

    if (diff >= 1.0) {
      return { label: 'Rất Cao (≥ 90%)', color: 'emerald', tag: 'An toàn' };
    } else if (diff >= -0.5) {
      return { label: 'Khả Quan (70% - 85%)', color: 'amber', tag: 'Vừa sức' };
    } else {
      return { label: 'Cạnh Tranh Cao (< 60%)', color: 'rose', tag: 'Thử thách' };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl liquid-glass-navy rounded-3xl border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl liquid-glass-sapphire flex items-center justify-center border border-sky-400/40 text-sky-300">
                  <Calculator size={22} weight="fill" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-sky-400">
                    AI Simulated Admission Engine
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-100">
                    Mô Phỏng Điểm & Tỷ Lệ Đỗ 2025
                  </h3>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Method Switcher */}
              <div className="flex p-1 rounded-2xl liquid-glass border border-white/10">
                <button
                  onClick={() => setMethod('thpt')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                    method === 'thpt'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Điểm Thi THPT (Khối)
                </button>
                <button
                  onClick={() => setMethod('dgnl')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                    method === 'dgnl'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Đánh Giá Năng Lực (ĐGNL)
                </button>
                <button
                  onClick={() => setMethod('hocba')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                    method === 'hocba'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Xét Học Bạ (5 HK)
                </button>
              </div>

              {/* Input Form per Method */}
              {method === 'thpt' && (
                <div className="space-y-4 p-4 rounded-2xl liquid-glass border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Tổ hợp môn xét tuyển:</span>
                    <div className="flex gap-1.5">
                      {(['A00', 'A01', 'D01'] as const).map((b) => (
                        <button
                          key={b}
                          onClick={() => setBlock(b)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                            block === b
                              ? 'bg-sky-500 text-white'
                              : 'bg-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        {block === 'D01' ? 'Môn Văn' : 'Môn Toán'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={sub1}
                        onChange={(e) => setSub1(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        {block === 'A00' ? 'Môn Lý' : block === 'A01' ? 'Môn Lý' : 'Môn Toán'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={sub2}
                        onChange={(e) => setSub2(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        {block === 'A00' ? 'Môn Hóa' : 'Môn Tiếng Anh'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={sub3}
                        onChange={(e) => setSub3(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white text-center font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                    <span className="text-slate-400">Điểm ưu tiên khu vực / đối tượng:</span>
                    <input
                      type="number"
                      min="0"
                      max="2.75"
                      step="0.25"
                      value={bonus}
                      onChange={(e) => setBonus(Number(e.target.value))}
                      className="w-20 px-2 py-1 rounded-lg bg-slate-950 border border-white/15 text-xs text-white text-center font-bold"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-400/10 border border-amber-400/30">
                    <span className="text-xs font-bold text-amber-300">Tổng điểm xét tuyển mô phỏng:</span>
                    <span className="text-lg font-black text-amber-300">
                      {calculateTotalThpt()} / 30.0
                    </span>
                  </div>
                </div>
              )}

              {method === 'dgnl' && (
                <div className="p-4 rounded-2xl liquid-glass border border-white/10 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-300">Điểm thi ĐGNL (Thang 1200):</span>
                    <span className="text-lg font-black text-sky-400">{dgnlScore} / 1200</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="1150"
                    step="10"
                    value={dgnlScore}
                    onChange={(e) => setDgnlScore(Number(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>500 (Cơ bản)</span>
                    <span>850 (Khá giỏi - Top 15%)</span>
                    <span>1100 (Xuất sắc - Top 1%)</span>
                  </div>
                </div>
              )}

              {method === 'hocba' && (
                <div className="p-4 rounded-2xl liquid-glass border border-white/10 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-300">Điểm trung bình Học bạ (5 HK):</span>
                    <span className="text-lg font-black text-emerald-400">{hocBaGpa.toFixed(1)} / 10.0</span>
                  </div>
                  <input
                    type="range"
                    min="6.5"
                    max="10.0"
                    step="0.1"
                    value={hocBaGpa}
                    onChange={(e) => setHocBaGpa(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>
              )}

              {/* Matching Results List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Dự Báo Tỷ Lệ Trúng Tuyển Từng Ngành 2025
                  </h4>
                  <span className="text-[11px] text-slate-400">4 Ngành chính quy</span>
                </div>

                <div className="space-y-2.5">
                  {MAJORS_BENCHMARK.map((m) => {
                    const odds = getOdds(m);
                    return (
                      <div
                        key={m.code}
                        className="p-3.5 rounded-2xl liquid-glass border border-white/10 hover:border-white/20 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
                              Mã: {m.code}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                odds.color === 'emerald'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                  : odds.color === 'amber'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                                  : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {odds.tag}
                            </span>
                          </div>
                          <h5 className="text-sm font-bold text-slate-100 mt-1">{m.name}</h5>
                          <span className="text-[11px] text-slate-400">
                            Điểm sàn chuẩn:{' '}
                            <b className="text-slate-300">
                              {method === 'thpt' ? `${m.thptCutoff}/30` : method === 'dgnl' ? `${m.dgnlCutoff}/1200` : `${m.hocbaCutoff}/10.0`}
                            </b>
                            {' '}| Chỉ tiêu: {m.seats} SV
                          </span>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Xác suất trúng tuyển</span>
                            <span
                              className={`text-xs font-black ${
                                odds.color === 'emerald'
                                  ? 'text-emerald-400'
                                  : odds.color === 'amber'
                                  ? 'text-amber-400'
                                  : 'text-rose-400'
                              }`}
                            >
                              {odds.label}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              onClose();
                              if (onSelectMajor) onSelectMajor(`${m.name} (${m.code})`);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-slate-950 text-xs font-bold text-slate-200 transition"
                          >
                            Chọn Ngành
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
