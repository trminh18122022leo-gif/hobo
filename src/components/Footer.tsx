import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Về chúng tôi
            </h3>
            <p className="text-base text-slate-600 dark:text-slate-400">
              Học Bổng VN là nền tảng tra cứu thông tin tuyển sinh và học bổng tự động hóa, giúp học sinh và sinh viên dễ dàng tiếp cận cơ hội học tập.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Liên kết
            </h3>
            <ul className="space-y-4">
              <li>
                <Link href="/tim-kiem?kind=SCHOLARSHIP" className="text-base text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-500 focus-ring rounded">
                  Tìm học bổng
                </Link>
              </li>
              <li>
                <Link href="/tim-kiem?kind=ADMISSION" className="text-base text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-500 focus-ring rounded">
                  Thông tin tuyển sinh
                </Link>
              </li>
              <li>
                <Link href="/goi-y" className="text-base text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-500 focus-ring rounded">
                  Gợi ý phù hợp
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Pháp lý
            </h3>
            <ul className="space-y-4">
              <li>
                <Link href="/chinh-sach-bao-mat" className="text-base text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-500 focus-ring rounded">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link href="/dieu-khoan" className="text-base text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-500 focus-ring rounded">
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link href="/bot" className="text-base text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-500 focus-ring rounded">
                  Thông tin về Crawler
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-base text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} Học Bổng VN. Tất cả các quyền được bảo lưu.
          </p>
          <p className="mt-4 md:mt-0 text-sm text-slate-500 dark:text-slate-400 max-w-md text-center md:text-right">
            Thông tin được tổng hợp tự động từ các nguồn công khai. Vui lòng xác nhận tại nguồn chính thức trước khi nộp hồ sơ.
          </p>
        </div>
      </div>
    </footer>
  );
}
