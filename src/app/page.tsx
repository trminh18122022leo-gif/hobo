import Link from 'next/link';
import HomeHero from '@/components/HomeHero';
import prisma from '@/lib/db';
import { KIND_LABELS, FUNDING_LABELS } from '@/types';
import { CalendarBlank, MapPin, Bank, ArrowRight, GraduationCap } from '@phosphor-icons/react/dist/ssr';

export const revalidate = 60; // Revalidate every minute

async function getHomePageData() {
  const [totalOpportunities, totalSources, urgentOpportunities, featuredScholarships] = await Promise.all([
    prisma.opportunity.count({ where: { status: 'published' } }),
    prisma.source.count({ where: { isActive: true } }),
    prisma.opportunity.findMany({
      where: {
        status: 'published',
        deadline: { gt: new Date() },
      },
      orderBy: { deadline: 'asc' },
      take: 6,
    }),
    prisma.opportunity.findMany({
      where: {
        status: 'published',
        kind: { in: ['scholarship_domestic', 'scholarship_foreign', 'scholarship_corporate'] },
      },
      orderBy: { rankScore: 'desc' },
      take: 6,
    }),
  ]);

  return {
    stats: {
      totalScholarships: totalOpportunities,
      universities: totalSources,
      countries: 15,
    },
    urgentOpportunities,
    featuredScholarships,
  };
}

export default async function Home() {
  const { stats, urgentOpportunities, featuredScholarships } = await getHomePageData();

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <HomeHero stats={stats} />

      {/* Sắp hết hạn (Dữ liệu thật từ Database) */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-red-500">⏰</span> Sắp hết hạn nộp hồ sơ
            </h2>
            <p className="text-sm text-slate-500 mt-1">Đừng bỏ lỡ các học bổng và kỳ tuyển sinh sắp đóng đơn</p>
          </div>
          <Link href="/tim-kiem?sort=deadline" className="text-primary-600 hover:underline text-sm font-semibold flex items-center gap-1">
            <span>Xem tất cả</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {urgentOpportunities.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-500">
            Hiện không có chương trình nào sắp hết hạn trong vài ngày tới.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {urgentOpportunities.map((opp) => {
              const isScholarship = opp.kind.includes('scholarship');
              const link = isScholarship ? `/hoc-bong/${opp.slug}` : `/tuyen-sinh/${opp.slug}`;
              const daysLeft = opp.deadline
                ? Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <Link
                  key={opp.id}
                  href={link}
                  className="block border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-700 transition-all bg-white dark:bg-slate-900 group"
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300">
                      {KIND_LABELS[opp.kind as keyof typeof KIND_LABELS] || opp.kind}
                    </span>
                    {daysLeft !== null && (
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded">
                        {daysLeft <= 0 ? 'Hôm nay!' : `Còn ${daysLeft} ngày`}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base mb-2 text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-2">
                    {opp.title}
                  </h3>

                  <div className="flex items-center text-slate-500 text-xs mb-3">
                    <Bank size={15} className="mr-1.5 flex-shrink-0" />
                    <span className="truncate font-medium">{opp.organization}</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="font-semibold text-emerald-600">
                      {opp.fundingValueVnd
                        ? `${new Intl.NumberFormat('vi-VN').format(opp.fundingValueVnd)} đ`
                        : FUNDING_LABELS[opp.fundingType as keyof typeof FUNDING_LABELS] || 'Toàn phần'}
                    </span>
                    {opp.deadline && (
                      <span className="text-slate-400">
                        {new Date(opp.deadline).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Học bổng nổi bật */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🌟</span> Học bổng giá trị cao nhất
            </h2>
            <p className="text-sm text-slate-500 mt-1">Được tuyển chọn theo hệ thống xếp hạng uy tín 6 thành phần</p>
          </div>
          <Link href="/tim-kiem?kind=scholarship_domestic&kind=scholarship_foreign" className="text-primary-600 hover:underline text-sm font-semibold flex items-center gap-1">
            <span>Xem tất cả học bổng</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredScholarships.map((opp) => (
            <Link
              key={opp.id}
              href={`/hoc-bong/${opp.slug}`}
              className="block border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-700 transition-all bg-white dark:bg-slate-900 group"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                  {KIND_LABELS[opp.kind as keyof typeof KIND_LABELS] || opp.kind}
                </span>
                <span className="text-xs font-bold text-emerald-600">
                  Điểm rank: {opp.rankScore}/100
                </span>
              </div>

              <h3 className="font-bold text-base mb-2 text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-2">
                {opp.title}
              </h3>

              <div className="flex items-center text-slate-500 text-xs mb-3">
                <Bank size={15} className="mr-1.5 flex-shrink-0" />
                <span className="truncate font-medium">{opp.organization}</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                <span>{opp.studyLocation || 'Toàn quốc'}</span>
                <span className="text-primary-600 font-bold group-hover:underline">Chi tiết 12 khối &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Khám phá theo loại */}
      <section>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Khám phá theo danh mục</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Link
            href="/tim-kiem?kind=scholarship_domestic&kind=scholarship_foreign&kind=scholarship_corporate"
            className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 p-6 rounded-2xl flex flex-col justify-between hover:shadow-lg transition group"
          >
            <div>
              <span className="text-3xl mb-3 block">🎓</span>
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-1 group-hover:text-primary-600">Học bổng tài trợ</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Trong nước, quốc tế và doanh nghiệp tài trợ toàn phần & bán phần.</p>
            </div>
            <span className="mt-4 text-xs font-bold text-primary-600">Khám phá ngay &rarr;</span>
          </Link>

          <Link
            href="/tim-kiem?kind=undergraduate"
            className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 p-6 rounded-2xl flex flex-col justify-between hover:shadow-lg transition group"
          >
            <div>
              <span className="text-3xl mb-3 block">🏛️</span>
              <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-300 mb-1 group-hover:text-emerald-600">Tuyển sinh Đại học</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Đề án tuyển sinh chính quy, chỉ tiêu, điểm sàn và các đợt xét tuyển tài năng.</p>
            </div>
            <span className="mt-4 text-xs font-bold text-emerald-600">Khám phá ngay &rarr;</span>
          </Link>

          <Link
            href="/tim-kiem?kind=graduate"
            className="bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 p-6 rounded-2xl flex flex-col justify-between hover:shadow-lg transition group"
          >
            <div>
              <span className="text-3xl mb-3 block">🔬</span>
              <h3 className="text-lg font-bold text-purple-900 dark:text-purple-300 mb-1 group-hover:text-purple-600">Sau Đại học (Thạc sĩ, Tiến sĩ)</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Học bổng nghiên cứu sinh, trợ cấp nghiên cứu và đào tạo sau đại học.</p>
            </div>
            <span className="mt-4 text-xs font-bold text-purple-600">Khám phá ngay &rarr;</span>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-center text-white shadow-xl">
        <h2 className="text-3xl font-extrabold mb-3">Định vị hồ sơ & Nhận chiến lược trúng tuyển</h2>
        <p className="text-base text-primary-100 mb-8 max-w-2xl mx-auto leading-relaxed">
          Tạo hồ sơ năng lực của bạn trong 2 phút để hệ thống tự động phân loại danh mục học bổng Thử sức • Phù hợp • Chắc chắn theo công thức cố vấn 2-3-2.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/ho-so"
            className="inline-block bg-white text-primary-700 font-bold px-8 py-3.5 rounded-xl hover:bg-slate-100 transition shadow-lg text-sm"
          >
            Tạo hồ sơ năng lực
          </Link>
          <Link
            href="/goi-y"
            className="inline-block bg-primary-700/80 hover:bg-primary-700 text-white font-bold px-8 py-3.5 rounded-xl transition border border-white/20 text-sm"
          >
            Xem chiến lược gợi ý
          </Link>
        </div>
      </section>
    </div>
  );
}
