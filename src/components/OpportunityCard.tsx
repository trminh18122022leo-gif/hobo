'use client';

import React from 'react';
import { CalendarBlank, MapPin, Bank, WarningCircle, Scales, Sparkle, Clock, ArrowSquareOut } from '@phosphor-icons/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCompare } from '@/context/CompareContext';
import { OpportunityCard as OppCardType } from '@/types';

interface OpportunityCardProps {
  id: string | number;
  slug: string;
  title: string;
  organization: string;
  kind: string;
  deadline?: string | null;
  fundingType?: string | null;
  location?: string | null;
  fieldTags?: string[];
  lastVerifiedAt: string;
  rawOpportunity?: any;
  canonicalUrl?: string | null;
}

export default function OpportunityCard({
  id,
  slug,
  title,
  organization,
  kind,
  deadline,
  fundingType,
  location,
  fieldTags,
  lastVerifiedAt,
  rawOpportunity,
  canonicalUrl,
}: OpportunityCardProps) {
  const { addToCompare, isInCompare } = useCompare();
  const numericId = Number(id) || 0;
  const inCompare = isInCompare(numericId);

  let urgencyBadge = null;
  if (deadline) {
    const daysUntilDeadline = (new Date(deadline).getTime() - Date.now()) / (1000 * 3600 * 24);
    if (daysUntilDeadline >= 0 && daysUntilDeadline <= 7) {
      urgencyBadge = (
        <span className="text-[10px] font-black text-rose-300 bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(244,63,94,0.3)]">
          <Clock size={11} weight="fill" />
          Còn {Math.ceil(daysUntilDeadline)} ngày
        </span>
      );
    }
  }

  const isScholarship =
    kind.toLowerCase().includes('scholarship') || kind.toUpperCase() === 'SCHOLARSHIP';
  const linkPath = isScholarship ? `/hoc-bong/${slug}` : `/tuyen-sinh/${slug}`;

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const oppToSave: OppCardType = rawOpportunity || {
      id: numericId,
      slug,
      title,
      organization,
      kind: kind as any,
      deadline: deadline || null,
      fundingType: fundingType || null,
      studyLocation: location || null,
      fundingValueVnd: null,
      fieldCodes: fieldTags || [],
      degreeLevel: ['bachelor'],
      rankScore: 85,
      confidence: 0.9,
      lastVerifiedAt,
      daysUntilDeadline: null,
      canonicalUrl: `https://hocbong.vn${linkPath}`,
      status: 'published',
      organizationType: null,
      summary: null,
      applyStart: null,
    };
    addToCompare(oppToSave);
  };

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="h-full flex flex-col"
    >
      <div className="liquid-glass rounded-3xl p-6 border border-white/10 hover:border-amber-400/40 hover:shadow-[0_15px_40px_rgba(0,0,0,0.6),0_0_25px_rgba(212,175,55,0.15)] transition-all h-full flex flex-col justify-between relative group overflow-hidden">
        
        {/* Card Top / Header */}
        <div>
          <div className="flex justify-between items-start mb-4 gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                  isScholarship
                    ? 'bg-amber-400/10 text-amber-300 border-amber-400/30 shadow-[0_0_10px_rgba(212,175,55,0.15)]'
                    : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                }`}
              >
                {isScholarship ? '★ Học bổng' : '🏛️ Tuyển sinh'}
              </span>
              {urgencyBadge}
            </div>

            {/* Compare Quick Toggle */}
            <button
              type="button"
              onClick={handleCompareClick}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center transition-all ${
                inCompare
                  ? 'bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(212,175,55,0.5)]'
                  : 'text-slate-400 hover:text-white liquid-glass hover:border-amber-400/30'
              }`}
              title={inCompare ? 'Bỏ so sánh' : 'Thêm vào so sánh'}
            >
              <Scales size={16} weight={inCompare ? 'fill' : 'regular'} />
            </button>
          </div>

          <Link href={linkPath} className="block group-hover:text-amber-200 transition-colors">
            <h3 className="font-bold text-base sm:text-lg mb-2.5 text-slate-100 line-clamp-2 leading-snug">
              {title}
            </h3>
          </Link>

          <div className="flex items-center text-slate-400 text-xs mb-4 font-medium">
            <Bank size={15} className="mr-1.5 flex-shrink-0 text-amber-400/80" />
            <span className="truncate">{organization}</span>
          </div>

          <div className="space-y-2 mb-4 text-xs text-slate-300">
            {deadline && (
              <div className="flex items-center text-slate-400 font-mono">
                <CalendarBlank size={14} className="mr-1.5 flex-shrink-0 text-slate-500" />
                <span>Hạn chót: {new Date(deadline).toLocaleDateString('vi-VN')}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center text-slate-400">
                <MapPin size={14} className="mr-1.5 flex-shrink-0 text-slate-500" />
                <span className="truncate">{location}</span>
              </div>
            )}
            {fundingType && (
              <div className="flex items-center font-bold text-emerald-400">
                <span className="mr-1.5 text-xs">💎</span>
                <span className="truncate">{fundingType}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card Bottom / Tags & CTA */}
        <div>
          {fieldTags && fieldTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/10">
              {fieldTags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] liquid-glass text-slate-300 px-2.5 py-0.5 rounded-lg font-mono border border-white/10"
                >
                  {tag}
                </span>
              ))}
              {fieldTags.length > 2 && (
                <span className="text-[10px] text-slate-400 self-center font-mono">
                  +{fieldTags.length - 2}
                </span>
              )}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
            <Link
              href={linkPath}
              className="text-xs font-bold text-amber-300 hover:text-amber-200 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              <span>Xem chi tiết</span>
              <span>&rarr;</span>
            </Link>

            {canonicalUrl && (
              <a
                href={canonicalUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] font-medium text-slate-300 hover:text-amber-300 px-2.5 py-1 rounded-xl liquid-glass border border-white/10 hover:border-amber-400/40 flex items-center gap-1 transition-all"
                title="Đến trang tuyển sinh / học bổng chính thức của trường"
              >
                <span>Nguồn gốc</span>
                <ArrowSquareOut size={13} weight="bold" />
              </a>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
