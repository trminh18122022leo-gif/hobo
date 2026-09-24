import Link from 'next/link';
import { ShieldCheck, Sparkle, Globe } from '@phosphor-icons/react/dist/ssr';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 liquid-glass relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl liquid-glass-gold flex items-center justify-center border border-amber-400/40">
                <span className="text-amber-300 font-serif font-black text-base">H</span>
              </div>
              <span className="text-lg font-bold text-gold-gradient font-serif uppercase tracking-wider">
                Học Bổng Việt Nam
              </span>
            </div>
            <p className="text-sm text-slate-400 font-light max-w-md leading-relaxed">
              Cổng dữ liệu tuyển sinh và học bổng chuẩn xác, ứng dụng công nghệ trích xuất LLM & cơ chế thẩm định đa tầng bảo đảm dữ liệu luôn còn hạn, đúng và đủ từ các trường đại học hàng đầu.
            </p>
            <div className="flex items-center gap-3 text-xs text-amber-300/80 font-mono">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck size={14} weight="fill" /> Dữ liệu thẩm định
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Sparkle size={14} weight="fill" /> 50+ Nguồn chính quy
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-amber-200 uppercase tracking-[0.2em] font-mono mb-4">
              Khám Phá
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li>
                <Link href="/tim-kiem?kind=scholarship_domestic&kind=scholarship_foreign" className="hover:text-amber-300 transition-colors">
                  Học bổng đại học & quốc tế
                </Link>
              </li>
              <li>
                <Link href="/tim-kiem?kind=undergraduate" className="hover:text-amber-300 transition-colors">
                  Đề án tuyển sinh 2026-2027
                </Link>
              </li>
              <li>
                <Link href="/goi-y" className="hover:text-amber-300 transition-colors">
                  Chiến lược cố vấn 2-3-2
                </Link>
              </li>
              <li>
                <Link href="/theo-doi" className="hover:text-amber-300 transition-colors">
                  Quản lý hồ sơ ứng tuyển
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-amber-200 uppercase tracking-[0.2em] font-mono mb-4">
              Hệ Thống
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li>
                <Link href="/cai-dat/thiet-bi" className="hover:text-amber-300 transition-colors">
                  Bảo mật & Phiên thiết bị
                </Link>
              </li>
              <li>
                <Link href="/admin/review" className="hover:text-amber-300 transition-colors">
                  Cổng thẩm định học bổng
                </Link>
              </li>
              <li>
                <Link href="/api/health" target="_blank" className="hover:text-amber-300 transition-colors">
                  Trạng thái hệ thống (API Health)
                </Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-light">
          <p>
            &copy; {new Date().getFullYear()} Học Bổng VN. Thiết kế kết hợp Google Liquid Glass & Jacob & Co Haute Horlogerie.
          </p>
          <p className="flex items-center gap-2">
            <Globe size={14} className="text-amber-400" />
            <span>Nguồn cấp dữ liệu thời gian thực được bảo hộ bản quyền.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
