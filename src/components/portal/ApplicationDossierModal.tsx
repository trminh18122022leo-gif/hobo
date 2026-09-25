'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  UploadSimple,
  ShieldCheck,
  CheckCircle,
  FilePdf,
  LockKey,
  GraduationCap,
  Sparkle,
  ArrowRight,
  IdentificationCard,
  Phone,
  Envelope,
  BookOpen,
} from '@phosphor-icons/react';

interface ApplicationDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMajor?: string;
}

export default function ApplicationDossierModal({
  isOpen,
  onClose,
  defaultMajor = 'Khoa học Máy tính & AI (7480101)',
}: ApplicationDossierModalProps) {
  const [candidateName, setCandidateName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedMajor, setSelectedMajor] = useState(defaultMajor);
  const [admissionMethod, setAdmissionMethod] = useState('hocba_ielts');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [dossierRef, setDossierRef] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const randomCode = 'VN-' + Math.floor(100000 + Math.random() * 900000);
      setDossierRef(randomCode);
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1200);
  };

  const handleReset = () => {
    setIsSuccess(false);
    setCandidateName('');
    setIdNumber('');
    setPhone('');
    setEmail('');
    setFileName(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Envelope */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xl liquid-glass-navy rounded-3xl border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl liquid-glass-gold flex items-center justify-center border border-amber-400/40 text-amber-300">
                  <GraduationCap size={22} weight="fill" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-sky-400">
                      Cổng Tuyển Sinh 2025 - 2026
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.2 rounded-full">
                      <LockKey size={10} weight="fill" /> AES-256
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-100">
                    Khởi Tạo Hồ Sơ Trực Tuyến
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

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {isSuccess ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                    <CheckCircle size={36} weight="fill" />
                  </div>
                  <div>
                    <h4 className="text-xl font-extrabold text-slate-100">
                      Khởi Tạo Hồ Sơ Thành Công!
                    </h4>
                    <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                      Mã hồ sơ điện tử của bạn là{' '}
                      <span className="text-amber-300 font-mono font-bold">{dossierRef}</span>.
                      Cố vấn học thuật sẽ kiểm tra minh chứng và liên hệ trong 24h.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl liquid-glass border border-white/10 text-left text-xs space-y-1.5 text-slate-300 max-w-md mx-auto">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Thí sinh:</span>
                      <span className="font-semibold text-white">{candidateName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nguyện vọng 1:</span>
                      <span className="font-semibold text-amber-300">{selectedMajor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Trạng thái:</span>
                      <span className="text-emerald-400 font-semibold">Đã mã hóa & Đưa vào danh sách xét duyệt</span>
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 text-slate-950 font-bold text-xs shadow-lg hover:brightness-110 transition"
                  >
                    Hoàn Tất & Đóng
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Candidate Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Họ và tên thí sinh <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        required
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        placeholder="VÍ DỤ: NGUYỄN VĂN AN"
                        className="w-full px-3.5 py-2.5 rounded-xl liquid-glass border border-white/15 text-xs text-white placeholder-slate-500 focus:border-amber-400/60 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* ID & Phone in 2 columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Số CCCD / Định danh <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        placeholder="001204019283"
                        className="w-full px-3.5 py-2.5 rounded-xl liquid-glass border border-white/15 text-xs text-white placeholder-slate-500 focus:border-amber-400/60 focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Số điện thoại liên hệ <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0912 345 678"
                        className="w-full px-3.5 py-2.5 rounded-xl liquid-glass border border-white/15 text-xs text-white placeholder-slate-500 focus:border-amber-400/60 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Target Major */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Nguyện vọng đăng ký chính <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={selectedMajor}
                      onChange={(e) => setSelectedMajor(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-slate-200 focus:border-amber-400/60 focus:outline-none transition"
                    >
                      <option value="Khoa học Máy tính & AI (7480101)">Khoa học Máy tính & Trí tuệ Nhân tạo (Mã: 7480101)</option>
                      <option value="Tài chính - Công nghệ / Fintech (7340205)">Tài chính - Công nghệ / Fintech (Mã: 7340205)</option>
                      <option value="Quản trị Kinh doanh Quốc tế (7340101)">Quản trị Kinh doanh Quốc tế (Mã: 7340101)</option>
                      <option value="Kỹ thuật Y sinh & Công nghệ Nano (7520101)">Kỹ thuật Y sinh & Công nghệ Nano (Mã: 7520101)</option>
                      <option value="Khoa học Dữ liệu & Trí tuệ Kinh doanh (7480109)">Khoa học Dữ liệu & Phân tích Kinh doanh (Mã: 7480109)</option>
                    </select>
                  </div>

                  {/* Admission Method */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Phương thức xét tuyển chính
                    </label>
                    <select
                      value={admissionMethod}
                      onChange={(e) => setAdmissionMethod(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-slate-200 focus:border-amber-400/60 focus:outline-none transition"
                    >
                      <option value="hocba_ielts">Xét học bạ THPT kết hợp Chứng chỉ Tiếng Anh Quốc tế (IELTS/TOEFL)</option>
                      <option value="dgnl">Kết quả kỳ thi Đánh giá Năng lực ĐHQG Hà Nội / TP.HCM</option>
                      <option value="thpt">Điểm thi Tốt nghiệp THPT 2025</option>
                      <option value="direct">Xét tuyển thẳng Tài năng & Giải thưởng HSG Quốc gia/Quốc tế</option>
                    </select>
                  </div>

                  {/* File Upload Dropzone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Tải lên Minh chứng Hồ sơ (Học bạ / Bảng điểm / Bằng khen)
                    </label>
                    <label
                      className="flex flex-col items-center justify-center p-4 rounded-2xl liquid-glass border border-dashed border-white/20 hover:border-amber-400/50 cursor-pointer transition text-center group"
                    >
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setFileName(e.target.files[0].name);
                          }
                        }}
                      />
                      <UploadSimple size={26} className="text-amber-400 group-hover:scale-110 transition-transform mb-1.5" />
                      {fileName ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                          <FilePdf size={16} /> {fileName}
                        </div>
                      ) : (
                        <>
                          <span className="text-xs font-medium text-slate-300">
                            Nhấp hoặc kéo thả tệp (PDF, JPG tối đa 15MB)
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5">
                            Toàn bộ hồ sơ được lưu trữ và mã hóa bảo mật chuẩn AES-256
                          </span>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(212,175,55,0.35)] hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span>Đang mã hóa & Đăng ký...</span>
                      ) : (
                        <>
                          <span>Xác Nhận Nộp Hồ Sơ Xét Tuyển</span>
                          <ArrowRight size={15} weight="bold" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
