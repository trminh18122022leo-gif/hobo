'use client';

import React from 'react';
import { CalendarBlank, MapPin, Bank, WarningCircle, Scales, BookmarkSimple } from '@phosphor-icons/react';
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
}: OpportunityCardProps) {
  const { addToCompare, isInCompare } = useCompare();
  const numericId = Number(id) || 0;
  const inCompare = isInCompare(numericId);

  const isStale = new Date(lastVerifiedAt).getTime() < Date.now() - 48 * 60 * 60 * 1000;

  let urgencyColor = 'text-slate-600 dark:text-slate-400';
  if (deadline) {
    const daysUntilDeadline = (new Date(deadline).getTime() - Date.now()) / (1000 * 3600 * 24);
    if (daysUntilDeadline < 0) urgencyColor = 'text-slate-400';
    else if (daysUntilDeadline < 7) urgencyColor = 'text-red-500 font-semibold';
    else if (daysUntilDeadline < 30) urgencyColor = 'text-amber-500 font-semibold';
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
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }} className="h-full flex flex-col">
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-300 bg-white dark:bg-slate-900 focus-ring h-full flex flex-col justify-between relative group">
        <div>
          <div className="flex justify-between items-start mb-3 gap-2">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                isScholarship
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}
            >
              {isScholarship ? 'Học bổng' : 'Tuyển sinh'}
            </span>

            <div className="flex items-center gap-1.5">
              {isStale && (
                <span className="flex items-center text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded font-medium">
                  <WarningCircle size={12} className="mr-1" />
                  &gt;48h
                </span>
              )}

              {/* Nút so sánh nhanh B.1 */}
              <button
                type="button"
                onClick={handleCompareClick}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  inCompare
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                    : 'text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={inCompare ? 'Bỏ so sánh' : 'Thêm vào so sánh'}
              >
                <Scales size={16} weight={inCompare ? 'fill' : 'regular'} />
              </button>
            </div>
          </div>

          <Link href={linkPath} className="block group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            <h3 className="font-bold text-base sm:text-lg mb-2 text-slate-900 dark:text-white line-clamp-2 leading-snug">
              {title}
            </h3>
          </Link>

          <div className="flex items-center text-slate-600 dark:text-slate-400 text-xs mb-3">
            <Bank size={15} className="mr-1.5 flex-shrink-0 text-slate-400" />
            <span className="truncate font-medium">{organization}</span>
          </div>

          <div className="space-y-1.5 mb-4 text-xs text-slate-600 dark:text-slate-400">
            {deadline && (
              <div className={`flex items-center ${urgencyColor}`}>
                <CalendarBlank size={14} className="mr-1.5 flex-shrink-0" />
                <span>Hạn chót: {new Date(deadline).toLocaleDateString('vi-VN')}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center">
                <MapPin size={14} className="mr-1.5 flex-shrink-0 text-slate-400" />
                <span className="truncate">{location}</span>
              </div>
            )}
            {fundingType && (
              <div className="flex items-center font-medium text-emerald-600 dark:text-emerald-400">
                <span className="mr-1.5 text-xs">💎</span>
                <span className="truncate">{fundingType}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          {fieldTags && fieldTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              {fieldTags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium"
                >
                  {tag}
                </span>
              ))}
              {fieldTags.length > 2 && (
                <span className="text-[11px] text-slate-400 self-center">
                  +{fieldTags.length - 2}
                </span>
              )}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <Link
              href={linkPath}
              className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center"
            >
              Xem toàn diện 12 khối &rarr;
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
