import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import { KIND_LABELS, FUNDING_LABELS } from '@/types';
import { Bank, CalendarBlank, MapPin, ArrowLeft } from '@phosphor-icons/react/dist/ssr';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug).replace(/-/g, ' ');

  const opp = await prisma.opportunity.findFirst({
    where: {
      OR: [
        { organization: { contains: decoded } },
        { slug: { contains: slug } },
      ],
    },
    select: { organization: true },
  });

  const orgName = opp?.organization || decoded;
  return {
    title: `${orgName} - Học bổng & Tuyển sinh | Học Bổng VN`,
    description: `Danh sách các chương trình tuyển sinh và học bổng chính thức từ ${orgName}.`,
  };
}

export default async function UniversityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug).replace(/-/g, ' ');

  // Tìm các cơ hội thuộc về trường này
  const opportunities = await prisma.opportunity.findMany({
    where: {
      OR: [
        { organization: { contains: decoded } },
        { slug: { contains: slug } },
      ],
      status: 'published',
    },
    orderBy: { rankScore: 'desc' },
  });

  const orgName = opportunities.length > 0 ? opportunities[0].organization : decoded;

  const totalPrograms = opportunities.filter((o) => !o.kind.includes('scholarship')).length;
  const totalScholarships = opportunities.filter((o) => o.kind.includes('scholarship')).length;

  return (
    <div className="py-8 space-y-8 max-w-6xl mx-auto px-4">
      <Link
        href="/tim-kiem"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary-600 transition"
      >
        <ArrowLeft size={16} />
        <span>Quay lại tìm kiếm</span>
      </Link>

      <div className="bg-gradient-to-r from-primary-600 to-indigo-700 text-white rounded-3xl p-8 shadow-xl">
        <span className="text-xs font-bold uppercase tracking-wider text-primary-200 block mb-2">
          Đơn vị đào tạo & Cấp học bổng
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-4">{orgName}</h1>
        <div className="flex flex-wrap gap-8 pt-4 border-t border-white/20">
          <div>
            <div className="text-primary-200 text-xs font-medium">Chương trình tuyển sinh</div>
            <div className="text-2xl font-bold">{totalPrograms}</div>
          </div>
          <div>
            <div className="text-primary-200 text-xs font-medium">Học bổng đang mở</div>
            <div className="text-2xl font-bold">{totalScholarships}</div>
          </div>
          <div>
            <div className="text-primary-200 text-xs font-medium">Tổng cơ hội</div>
            <div className="text-2xl font-bold">{opportunities.length}</div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
          <Bank size={24} className="text-primary-600" />
          Các chương trình đang tuyển từ {orgName}
        </h2>

        {opportunities.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
            <p className="text-slate-500 text-sm mb-4">Chưa có dữ liệu học bổng nào cho trường này.</p>
            <Link href="/tim-kiem" className="text-primary-600 font-semibold text-sm hover:underline">
              Khám phá các trường khác
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map((opp) => {
              const isScholarship = opp.kind.includes('scholarship');
              const link = isScholarship ? `/hoc-bong/${opp.slug}` : `/tuyen-sinh/${opp.slug}`;

              return (
                <Link
                  key={opp.id}
                  href={link}
                  className="block border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-700 transition-all bg-white dark:bg-slate-900 group"
                >
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-3 inline-block ${
                      isScholarship
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    {KIND_LABELS[opp.kind as keyof typeof KIND_LABELS] || opp.kind}
                  </span>
                  <h3 className="font-bold text-base mb-2 text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-2">
                    {opp.title}
                  </h3>

                  <div className="space-y-1 text-xs text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {opp.deadline && (
                      <div className="flex items-center gap-1 text-amber-600">
                        <CalendarBlank size={14} />
                        <span>Hạn: {new Date(opp.deadline).toLocaleDateString('vi-VN')}</span>
                      </div>
                    )}
                    {opp.fundingType && (
                      <div className="font-semibold text-emerald-600">
                        {FUNDING_LABELS[opp.fundingType as keyof typeof FUNDING_LABELS] || opp.fundingType}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
