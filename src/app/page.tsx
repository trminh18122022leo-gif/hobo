import Link from 'next/link';
import HomeHero from '@/components/HomeHero';
import prisma from '@/lib/db';
import { KIND_LABELS, FUNDING_LABELS } from '@/types';
import { CalendarBlank, MapPin, Bank, ArrowRight, GraduationCap, Sparkle, Clock, ShieldCheck } from '@phosphor-icons/react/dist/ssr';

export const revalidate = 60; // Revalidate every minute

async function getHomePageData() {
  try {
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
      urgentOpportunities: urgentOpportunities || [],
      featuredScholarships: featuredScholarships || [],
    };
  } catch (error) {
    console.warn('Database query during build/render fallback:', error);
    return {
      stats: {
        totalScholarships: 0,
        universities: 0,
        countries: 15,
      },
      urgentOpportunities: [],
      featuredScholarships: [],
    };
  }
}

export default async function Home() {
  const { stats, urgentOpportunities, featuredScholarships } = await getHomePageData();

  return (
    <div className="space-y-20 py-4">
      {/* Hero Section */}
      <HomeHero stats={stats} />

      {/* Sắp hết hạn — Urgent Section with Liquid Glass & Ruby Red Urgency */}
      <section className="relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-bold mb-2 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
              <Clock size={14} weight="fill" className="animate-spin" />
              <span>Thời Hạn Gấp</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-slate-100 flex items-center gap-2">
              Sắp Hết Hạn Nộp Đơn
            </h2>
            <p className="text-sm text-slate-400 mt-1">Đừng bỏ lỡ các kỳ tuyển sinh và học bổng chuẩn bị đóng cổng nộp hồ sơ</p>
          </div>
          <Link
            href="/tim-kiem?sort=deadline"
            className="px-4 py-2 rounded-xl liquid-glass hover:border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all group"
          >
            <span>Xem tất cả ({urgentOpportunities.length})</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {urgentOpportunities.length === 0 ? (
          <div className="p-12 text-center liquid-glass rounded-3xl text-slate-400 border border-white/10">
            Hiện tất cả chương trình đều đang trong giai đoạn tiếp nhận hồ sơ dài hạn.
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
                  className="block liquid-glass rounded-3xl p-6 border border-white/10 hover:border-amber-400/40 hover:shadow-[0_12px_40px_rgba(0,0,0,0.7),0_0_20px_rgba(212,175,55,0.15)] transition-all group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30">
                      {KIND_LABELS[opp.kind as keyof typeof KIND_LABELS] || opp.kind}
                    </span>
                    {daysLeft !== null && (
                      <span className="text-xs font-black text-rose-300 bg-rose-950/80 border border-rose-500/40 px-2.5 py-1 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.3)] flex items-center gap-1">
                        <Clock size={12} weight="fill" />
                        {daysLeft <= 0 ? 'Hôm nay!' : `Còn ${daysLeft} ngày`}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-lg mb-3 text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
                    {opp.title}
                  </h3>

                  <div className="flex items-center text-slate-400 text-xs mb-4">
                    <Bank size={15} className="mr-1.5 flex-shrink-0 text-amber-400/80" />
                    <span className="truncate font-medium">{opp.organization}</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs">
                    <span className="font-bold text-emerald-400">
                      {opp.fundingValueVnd
                        ? `${new Intl.NumberFormat('vi-VN').format(opp.fundingValueVnd)} đ`
                        : FUNDING_LABELS[opp.fundingType as keyof typeof FUNDING_LABELS] || 'Toàn phần'}
                    </span>
                    {opp.deadline && (
                      <span className="text-slate-400 font-mono">
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

      {/* Học bổng nổi bật — Haute Horlogerie Gold Collection */}
      <section className="relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-bold mb-2 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
              <Sparkle size={14} weight="fill" />
              <span>Haute Selection</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-slate-100 flex items-center gap-2">
              Học Bổng Giá Trị Cao Nhất
            </h2>
            <p className="text-sm text-slate-400 mt-1">Xếp hạng theo thuật toán chất lượng tài trợ & mức độ uy tín học thuật</p>
          </div>
          <Link
            href="/tim-kiem?kind=scholarship_domestic&kind=scholarship_foreign"
            className="px-4 py-2 rounded-xl liquid-glass hover:border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all group"
          >
            <span>Tất cả học bổng</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredScholarships.map((opp) => (
            <Link
              key={opp.id}
              href={`/hoc-bong/${opp.slug}`}
              className="block liquid-glass-gold rounded-3xl p-6 hover:shadow-[0_15px_50px_rgba(212,175,55,0.2)] transition-all group relative overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-sky-950/80 text-sky-300 border border-sky-400/30">
                  {KIND_LABELS[opp.kind as keyof typeof KIND_LABELS] || opp.kind}
                </span>
                <span className="text-xs font-black text-amber-300 flex items-center gap-1 font-mono">
                  ★ {opp.rankScore}/100
                </span>
              </div>

              <h3 className="font-bold text-lg mb-3 text-slate-100 group-hover:text-amber-200 transition-colors line-clamp-2 leading-snug">
                {opp.title}
              </h3>

              <div className="flex items-center text-slate-300 text-xs mb-4">
                <Bank size={15} className="mr-1.5 flex-shrink-0 text-amber-400" />
                <span className="truncate font-medium">{opp.organization}</span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-amber-400/20 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin size={13} className="text-slate-400" />
                  {opp.studyLocation || 'Toàn cầu'}
                </span>
                <span className="text-amber-300 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Khám phá 12 khối &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Khám phá theo danh mục (Sapphire, Emerald, Amethyst Liquid Glass) */}
      <section>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-slate-100 mb-8">
          Khám Phá Theo Danh Mục
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Link
            href="/tim-kiem?kind=scholarship_domestic&kind=scholarship_foreign&kind=scholarship_corporate"
            className="liquid-glass-sapphire p-8 rounded-3xl flex flex-col justify-between hover:scale-[1.02] transition-all group shadow-xl"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl liquid-glass flex items-center justify-center text-2xl mb-4 border border-sky-400/40">
                🎓
              </div>
              <h3 className="text-xl font-bold text-sky-200 mb-2 group-hover:text-sky-100 font-serif">
                Học Bổng Tài Trợ
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Học bổng chính phủ, quỹ tập đoàn và trường đại học tài trợ 100% học phí & sinh hoạt phí.
              </p>
            </div>
            <span className="mt-6 text-xs font-bold text-sky-300 flex items-center gap-1">
              Khám phá ngay &rarr;
            </span>
          </Link>

          <Link
            href="/tim-kiem?kind=undergraduate"
            className="liquid-glass-emerald p-8 rounded-3xl flex flex-col justify-between hover:scale-[1.02] transition-all group shadow-xl"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl liquid-glass flex items-center justify-center text-2xl mb-4 border border-emerald-400/40">
                🏛️
              </div>
              <h3 className="text-xl font-bold text-emerald-200 mb-2 group-hover:text-emerald-100 font-serif">
                Tuyển Sinh Đại Học
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Đề án tuyển sinh chính quy, chỉ tiêu, điểm sàn và các phương thức xét tuyển tài năng 2026-2027.
              </p>
            </div>
            <span className="mt-6 text-xs font-bold text-emerald-300 flex items-center gap-1">
              Khám phá ngay &rarr;
            </span>
          </Link>

          <Link
            href="/tim-kiem?kind=graduate"
            className="liquid-glass-gold p-8 rounded-3xl flex flex-col justify-between hover:scale-[1.02] transition-all group shadow-xl"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl liquid-glass flex items-center justify-center text-2xl mb-4 border border-amber-400/40">
                🔬
              </div>
              <h3 className="text-xl font-bold text-amber-200 mb-2 group-hover:text-amber-100 font-serif">
                Sau Đại Học (Thạc sĩ, Tiến sĩ)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Học bổng nghiên cứu sinh, trợ cấp đề tài tiến sĩ và các chương trình trao đổi sau đại học.
              </p>
            </div>
            <span className="mt-6 text-xs font-bold text-amber-300 flex items-center gap-1">
              Khám phá ngay &rarr;
            </span>
          </Link>
        </div>
      </section>

      {/* Haute Horlogerie Luxury CTA Card */}
      <section className="liquid-glass-gold rounded-3xl p-8 sm:p-14 text-center border border-amber-400/30 relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full liquid-glass border border-amber-400/40 text-amber-300 text-xs font-bold shadow-md">
            <ShieldCheck size={16} weight="fill" />
            <span>Thuật Toán Phân Khúc 2-3-2</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-serif text-slate-100 tracking-tight">
            Định Vị Hồ Sơ & Nhận Chiến Lược
          </h2>
          <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
            Nhập học lực & chứng chỉ của bạn trong 2 phút. Hệ thống tự động phân loại học bổng thành 3 tầng: <strong className="text-amber-300">Thử Sức (Reach) • Vừa Sức (Match) • An Toàn (Safety)</strong>.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-6">
            <Link
              href="/ho-so"
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 font-extrabold text-sm shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-95 transition-all"
            >
              Tạo Hồ Sơ Năng Lực
            </Link>
            <Link
              href="/goi-y"
              className="px-8 py-3.5 rounded-xl liquid-glass text-amber-200 border border-amber-400/40 font-bold text-sm hover:bg-amber-400/10 active:scale-95 transition-all"
            >
              Xem Chiến Lược Gợi Ý
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
