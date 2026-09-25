'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Calculator,
  Money,
  TrendDown,
  Briefcase,
  House,
  ShieldCheck,
  Printer,
  Sparkle,
  Info,
} from '@phosphor-icons/react';
import { OpportunityDetail } from '@/types';

interface NetPriceCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: OpportunityDetail | any;
}

// Chi phí sinh hoạt chuẩn và tỷ giá tham chiếu 2026
const COUNTRY_BENCHMARKS: Record<
  string,
  {
    currency: string;
    rateVnd: number;
    defaultTuition: number; // Ngoại tệ / năm
    livingStandard: number; // Ngoại tệ / năm
    insurance: number; // Ngoại tệ / năm
    partTimeHourlyRate: number; // Lương làm thêm tối thiểu / giờ
    maxWorkHoursWeek: number; // Số giờ làm thêm cho phép / tuần
    legalNote: string;
  }
> = {
  'Úc (Australia)': {
    currency: 'AUD',
    rateVnd: 16800,
    defaultTuition: 38000,
    livingStandard: 24500,
    insurance: 650, // OSHC
    partTimeHourlyRate: 24.1,
    maxWorkHoursWeek: 24, // 48h / 2 tuần
    legalNote: 'Chính phủ Úc cho phép sinh viên làm việc tối đa 48 giờ/2 tuần trong kỳ học và không giới hạn trong kỳ nghỉ.',
  },
  'Vương quốc Anh (UK)': {
    currency: 'GBP',
    rateVnd: 33500,
    defaultTuition: 22000,
    livingStandard: 13500,
    insurance: 776, // NHS Immigration Health Surcharge
    partTimeHourlyRate: 11.44,
    maxWorkHoursWeek: 20,
    legalNote: 'Sinh viên visa Tier 4 được làm thêm tối đa 20 giờ/tuần trong thời gian học.',
  },
  'Hoa Kỳ (USA)': {
    currency: 'USD',
    rateVnd: 25400,
    defaultTuition: 42000,
    livingStandard: 16000,
    insurance: 1800,
    partTimeHourlyRate: 15.0,
    maxWorkHoursWeek: 20,
    legalNote: 'Visa F-1 cho phép làm việc on-campus tối đa 20 giờ/tuần trong năm nhất.',
  },
  'Canada': {
    currency: 'CAD',
    rateVnd: 18200,
    defaultTuition: 28000,
    livingStandard: 15000,
    insurance: 800,
    partTimeHourlyRate: 17.3,
    maxWorkHoursWeek: 24,
    legalNote: 'Chính sách mới Canada cho phép làm việc ngoài trường tối đa 24 giờ/tuần.',
  },
  'Đức (Germany)': {
    currency: 'EUR',
    rateVnd: 27500,
    defaultTuition: 0, // Miễn 100% học phí tại hầu hết trường công
    livingStandard: 11200, // Tài khoản phong tỏa Sperrkonto
    insurance: 1300,
    partTimeHourlyRate: 13.5,
    maxWorkHoursWeek: 20,
    legalNote: 'Đức miễn học phí tại các trường công lập; sinh viên được làm việc 140 ngày/năm.',
  },
  'Pháp (France)': {
    currency: 'EUR',
    rateVnd: 27500,
    defaultTuition: 2770, // ĐH công lập Pháp được chính phủ trợ cấp 95%
    livingStandard: 9600,
    insurance: 0, // Miễn phí Sécurité Sociale
    partTimeHourlyRate: 11.65,
    maxWorkHoursWeek: 18,
    legalNote: 'Chính phủ Pháp hỗ trợ nhà ở CAF (giảm 30-50% tiền thuê nhà) cho sinh viên.',
  },
  'Singapore': {
    currency: 'SGD',
    rateVnd: 19200,
    defaultTuition: 32000,
    livingStandard: 16000,
    insurance: 500,
    partTimeHourlyRate: 12.0,
    maxWorkHoursWeek: 16,
    legalNote: 'Sinh viên tại các trường công lập Singapore được làm việc tối đa 16 giờ/tuần.',
  },
  'Việt Nam': {
    currency: 'VND',
    rateVnd: 1,
    defaultTuition: 45000000,
    livingStandard: 84000000, // 7 triệu / tháng
    insurance: 1200000,
    partTimeHourlyRate: 35000,
    maxWorkHoursWeek: 20,
    legalNote: 'Sinh viên có thể làm gia sư, trợ giảng, part-time linh hoạt.',
  },
};

export default function NetPriceCalculatorModal({
  isOpen,
  onClose,
  opportunity,
}: NetPriceCalculatorModalProps) {
  if (!isOpen) return null;

  // Xác định quốc gia mặc định theo cơ hội
  const detectedCountry = useMemo(() => {
    const loc = (opportunity?.studyLocation || '').toLowerCase();
    if (loc.includes('úc') || loc.includes('australia')) return 'Úc (Australia)';
    if (loc.includes('anh') || loc.includes('uk')) return 'Vương quốc Anh (UK)';
    if (loc.includes('mỹ') || loc.includes('usa')) return 'Hoa Kỳ (USA)';
    if (loc.includes('canada')) return 'Canada';
    if (loc.includes('đức') || loc.includes('germany')) return 'Đức (Germany)';
    if (loc.includes('pháp') || loc.includes('france')) return 'Pháp (France)';
    if (loc.includes('singapore')) return 'Singapore';
    return 'Úc (Australia)'; // Default benchmark phong cách ISC/IDP
  }, [opportunity]);

  const [selectedCountry, setSelectedCountry] = useState(detectedCountry);
  const benchmark = COUNTRY_BENCHMARKS[selectedCountry] || COUNTRY_BENCHMARKS['Úc (Australia)'];

  // Xác định mức học bổng mặc định từ cơ hội
  const initialScholarshipPercent = useMemo(() => {
    const fundingType = opportunity?.fundingType;
    if (fundingType === 'full') return 100;
    if (fundingType === 'tuition') return 100;
    if (fundingType === 'partial') return 50;
    return 30;
  }, [opportunity]);

  const [scholarshipPercent, setScholarshipPercent] = useState<number>(initialScholarshipPercent);
  const [tuitionFee, setTuitionFee] = useState<number>(benchmark.defaultTuition);
  const [workHoursPerWeek, setWorkHoursPerWeek] = useState<number>(15);
  const [livingOption, setLivingOption] = useState<'budget' | 'standard'>('standard');

  // Cập nhật tuition khi đổi country
  const handleCountryChange = (c: string) => {
    setSelectedCountry(c);
    const b = COUNTRY_BENCHMARKS[c];
    if (b) setTuitionFee(b.defaultTuition);
  };

  // Tính toán
  const calculations = useMemo(() => {
    const b = benchmark;
    const livingCost = livingOption === 'budget' ? b.livingStandard * 0.75 : b.livingStandard;
    const insuranceCost = b.insurance;

    // Giá trị học bổng giảm trừ
    const scholarshipDiscount = (tuitionFee * scholarshipPercent) / 100;
    const tuitionAfterScholarship = Math.max(0, tuitionFee - scholarshipDiscount);

    // Thu nhập làm thêm (40 tuần học/năm)
    const annualWorkIncome = workHoursPerWeek * b.partTimeHourlyRate * 40;

    // Tổng chi phí ban đầu (Học phí + Sinh hoạt + Bảo hiểm)
    const totalGrossAnnual = tuitionFee + livingCost + insuranceCost;

    // Thực chi sau học bổng
    const netAnnualBeforeWork = tuitionAfterScholarship + livingCost + insuranceCost;

    // Thực chi sau học bổng & có làm thêm
    const netAnnualAfterWork = Math.max(0, netAnnualBeforeWork - annualWorkIncome);
    const netMonthlyAfterWork = netAnnualAfterWork / 12;

    // Quy đổi sang VNĐ
    const netAnnualVnd = Math.round(netAnnualAfterWork * b.rateVnd);
    const netMonthlyVnd = Math.round(netMonthlyAfterWork * b.rateVnd);
    const scholarshipSavedVnd = Math.round(scholarshipDiscount * b.rateVnd);
    const workIncomeVnd = Math.round(annualWorkIncome * b.rateVnd);

    return {
      livingCost,
      insuranceCost,
      scholarshipDiscount,
      tuitionAfterScholarship,
      annualWorkIncome,
      totalGrossAnnual,
      netAnnualAfterWork,
      netMonthlyAfterWork,
      netAnnualVnd,
      netMonthlyVnd,
      scholarshipSavedVnd,
      workIncomeVnd,
    };
  }, [benchmark, tuitionFee, scholarshipPercent, workHoursPerWeek, livingOption]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="liquid-glass border border-amber-400/40 rounded-3xl max-w-3xl w-full p-6 sm:p-8 relative shadow-[0_20px_60px_rgba(0,0,0,0.8)] max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white liquid-glass hover:border-amber-400/30 transition-all"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-mono mb-2">
            <Calculator size={14} weight="fill" />
            <span>Công Cụ Độc Quyền Theo Chuẩn ISC & IDP</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100">
            Dự Toán Chi Phí & Thực Chi Sau Học Bổng
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Chương trình:{' '}
            <strong className="text-amber-200">{opportunity?.title || 'Học bổng du học'}</strong>
          </p>
        </div>

        {/* Control Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 rounded-2xl liquid-glass border border-white/10 text-xs">
          {/* Country Selector */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Quốc gia du học:</label>
            <select
              value={selectedCountry}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/20 text-slate-200 outline-none focus:border-amber-400/60 font-medium"
            >
              {Object.keys(COUNTRY_BENCHMARKS).map((c) => (
                <option key={c} value={c}>
                  {c} ({COUNTRY_BENCHMARKS[c].currency})
                </option>
              ))}
            </select>
          </div>

          {/* Scholarship Percentage Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-300 font-semibold">Mức học bổng đạt được:</label>
              <span className="text-amber-300 font-mono font-bold text-sm">
                {scholarshipPercent}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={scholarshipPercent}
              onChange={(e) => setScholarshipPercent(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
              <span>0% (Tự túc)</span>
              <span>50% (Bán phần)</span>
              <span>100% (Toàn phần)</span>
            </div>
          </div>

          {/* Living Standard Option */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Mức sống / Chỗ ở:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLivingOption('budget')}
                className={`py-2 px-3 rounded-xl border text-center transition-all ${
                  livingOption === 'budget'
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/60 font-bold'
                    : 'liquid-glass text-slate-400 border-white/10'
                }`}
              >
                Tiết kiệm (KTX/Share)
              </button>
              <button
                type="button"
                onClick={() => setLivingOption('standard')}
                className={`py-2 px-3 rounded-xl border text-center transition-all ${
                  livingOption === 'standard'
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/60 font-bold'
                    : 'liquid-glass text-slate-400 border-white/10'
                }`}
              >
                Tiêu chuẩn (Studio)
              </button>
            </div>
          </div>

          {/* Work Hours Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-300 font-semibold">Giờ làm thêm dự kiến/tuần:</label>
              <span className="text-emerald-400 font-mono font-bold text-sm">
                {workHoursPerWeek}h / tuần
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={benchmark.maxWorkHoursWeek}
              step="2"
              value={workHoursPerWeek}
              onChange={(e) => setWorkHoursPerWeek(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Tối đa theo luật: {benchmark.maxWorkHoursWeek}h/tuần (~{benchmark.partTimeHourlyRate} {benchmark.currency}/h)
            </div>
          </div>
        </div>

        {/* Results Highlight Card */}
        <div className="p-6 rounded-2xl liquid-glass-gold border border-amber-400/50 mb-6 shadow-xl relative overflow-hidden">
          <div className="text-xs uppercase tracking-wider text-amber-300/90 font-mono font-bold mb-1">
            Số Tiền Thực Tế Gia Đình Cần Chuẩn Bị (Net Out-of-Pocket)
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
            <span className="text-3xl sm:text-4xl font-black text-white font-mono">
              ~{new Intl.NumberFormat('vi-VN').format(calculations.netAnnualVnd)} đ
            </span>
            <span className="text-sm font-bold text-amber-300 font-mono">
              (~{new Intl.NumberFormat('en-US').format(Math.round(calculations.netAnnualAfterWork))} {benchmark.currency} / năm)
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-amber-400/30 flex items-center justify-between text-xs text-slate-300">
            <div>
              Trung bình mỗi tháng:{' '}
              <strong className="text-emerald-400 font-mono font-bold">
                ~{new Intl.NumberFormat('vi-VN').format(calculations.netMonthlyVnd)} đ/tháng
              </strong>
            </div>
            <div className="text-amber-200">
              Đã tiết kiệm:{' '}
              <strong className="text-amber-300 font-mono">
                {new Intl.NumberFormat('vi-VN').format(calculations.scholarshipSavedVnd)} đ
              </strong>
            </div>
          </div>
        </div>

        {/* Breakdown Items */}
        <div className="space-y-3 mb-6 text-xs">
          <div className="flex justify-between items-center py-2 border-b border-white/10 text-slate-300">
            <span className="flex items-center gap-2">
              <Money size={16} className="text-amber-400" />
              <span>Học phí gốc trường đại học / năm:</span>
            </span>
            <span className="font-mono font-semibold text-slate-100">
              {new Intl.NumberFormat('en-US').format(tuitionFee)} {benchmark.currency}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-white/10 text-slate-300">
            <span className="flex items-center gap-2 text-amber-300">
              <TrendDown size={16} className="text-amber-400" />
              <span>Học bổng giảm trừ ({scholarshipPercent}%):</span>
            </span>
            <span className="font-mono font-bold text-amber-300">
              - {new Intl.NumberFormat('en-US').format(Math.round(calculations.scholarshipDiscount))} {benchmark.currency}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-white/10 text-slate-300">
            <span className="flex items-center gap-2">
              <House size={16} className="text-sky-400" />
              <span>Sinh hoạt phí & nhà ở ước tính / năm:</span>
            </span>
            <span className="font-mono font-semibold text-slate-100">
              + {new Intl.NumberFormat('en-US').format(Math.round(calculations.livingCost))} {benchmark.currency}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-white/10 text-slate-300">
            <span className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-purple-400" />
              <span>Bảo hiểm y tế du học sinh / năm:</span>
            </span>
            <span className="font-mono font-semibold text-slate-100">
              + {new Intl.NumberFormat('en-US').format(Math.round(calculations.insuranceCost))} {benchmark.currency}
            </span>
          </div>

          {calculations.annualWorkIncome > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-white/10 text-slate-300">
              <span className="flex items-center gap-2 text-emerald-400">
                <Briefcase size={16} className="text-emerald-400" />
                <span>Thu nhập làm thêm hợp pháp ước tính ({workHoursPerWeek}h/tuần):</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">
                - {new Intl.NumberFormat('en-US').format(Math.round(calculations.annualWorkIncome))} {benchmark.currency}
              </span>
            </div>
          )}
        </div>

        {/* Legal Note Box */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 text-[11px] text-slate-400 flex items-start gap-2 mb-6">
          <Info size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <span>{benchmark.legalNote}</span>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 liquid-glass rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
          >
            <Printer size={16} />
            <span>In Bản Dự Toán</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-300 to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-md hover:brightness-110 active:scale-95 transition-all"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
}
