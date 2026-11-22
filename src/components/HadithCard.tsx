import React, { useState } from 'react';
import {
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FilePlus2,
  GitBranch,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { copyToClipboard, getArabicSizeClass } from '../lib/utils';
import { HadithItem } from '../types/islamic';
import { SharePayload } from './ShareModal';

interface HadithCardProps {
  hadith: HadithItem;
  kicker?: string;
  onOpenDetail: (bookSlug: string, number: number) => void;
  onShare: (payload: SharePayload) => void;
  onCreateLinkedNote?: (refKey: string, label: string) => void;
}

export const HadithCard: React.FC<HadithCardProps> = ({
  hadith,
  kicker,
  onOpenDetail,
  onShare,
  onCreateLinkedNote,
}) => {
  const { arabicFontSize, isBookmarked, toggleBookmark, showToast } = useApp();
  const [sanadOpen, setSanadOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const refKey = `hadith:${hadith.bookSlug}:${hadith.number}`;
  const saved = isBookmarked(refKey);

  const handleQuickCopy = async () => {
    const text = `${hadith.arabicText}\n\n"${hadith.translation}"\n— HR. ${hadith.bookName} No. ${hadith.number}`;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      showToast(`HR. ${hadith.bookName} No. ${hadith.number} disalin.`, 'success');
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleBookmark = () => {
    void toggleBookmark({
      type: 'hadith',
      refKey,
      title: `HR. ${hadith.bookName} No. ${hadith.number}`,
      subtitle: hadith.narrator ? `Perawi: ${hadith.narrator}` : hadith.bookName,
      arabicText: hadith.arabicText,
      translationText: hadith.translation,
      sourceLabel: hadith.source,
      hadithBook: hadith.bookSlug,
      hadithNumber: hadith.number,
    });
  };

  return (
    <article className="rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-5 sm:p-6 transition-colors hover:border-[#087A59]/45">
      {/* Header Metadata Line */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#EFECE2] dark:border-[#1B2E28]">
        <div className="min-w-0">
          {kicker && (
            <p className="text-xs font-semibold text-[#C6A45C] mb-0.5">{kicker}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
            <button
              type="button"
              onClick={() => onOpenDetail(hadith.bookSlug, hadith.number)}
              className="font-display font-bold text-[#064E3B] dark:text-[#E8EFEA] hover:text-[#087A59] dark:hover:text-[#C6A45C] transition-colors text-left"
            >
              HR. {hadith.bookName} No. <span className="tabular-nums">{hadith.number}</span>
            </button>
            {hadith.narrator && (
              <>
                <span className="text-[#9CA3AF]" aria-hidden="true">·</span>
                <span className="text-xs text-[#5A6572] dark:text-[#93A8A0]">
                  Perawi: {hadith.narrator}
                </span>
              </>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs">
            <ShieldCheck
              className={`w-3.5 h-3.5 shrink-0 ${
                hadith.grade
                  ? 'text-[#087A59] dark:text-[#7CD4B5]'
                  : 'text-[#6B7280] dark:text-[#8CA39A]'
              }`}
            />
            <span
              className={
                hadith.grade
                  ? 'font-medium text-[#087A59] dark:text-[#7CD4B5]'
                  : 'text-[#6B7280] dark:text-[#8CA39A]'
              }
            >
              {hadith.grade ? hadith.grade : 'Derajat tidak tercantum di sumber API'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenDetail(hadith.bookSlug, hadith.number)}
          title="Buka halaman detail hadis"
          className="p-2 rounded-lg text-[#5A6572] dark:text-[#93A8A0] hover:text-[#087A59] dark:hover:text-[#C6A45C] hover:bg-[#F3F1E8] dark:hover:bg-[#182925] transition-colors shrink-0"
        >
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Arabic Hadith Text */}
      <div className="py-5">
        <p
          className={`font-arabic text-right text-[#1F2937] dark:text-[#F2F7F4] ${getArabicSizeClass(
            arabicFontSize
          )}`}
          lang="ar"
        >
          {hadith.arabicText}
        </p>
      </div>

      {/* Indonesian Translation */}
      <p className="text-sm sm:text-[15px] text-[#374151] dark:text-[#D4E2DC] leading-relaxed">
        {hadith.translation}
      </p>

      {/* Expandable Sanad Chain (verbatim extracted from authentic source text) */}
      {sanadOpen && (
        <div className="mt-4 pt-4 border-t border-[#EFECE2] dark:border-[#1B2E28] space-y-2">
          <p className="text-xs font-semibold text-[#064E3B] dark:text-[#C6A45C]">
            Rangkaian Sanad (Sesuai Teks Sumber)
          </p>
          {hadith.sanad.length > 0 ? (
            <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#B5C7C0] leading-relaxed">
              {hadith.sanad.join(' → ')}
            </p>
          ) : (
            <p className="text-xs text-[#6B7280] dark:text-[#8CA39A]">
              Rangkaian sanad terpisah tidak terdeteksi pada teks sumber.
            </p>
          )}
          <p className="text-[11px] text-[#6B7280] dark:text-[#8CA39A]">{hadith.gradeNote}</p>
        </div>
      )}

      {/* Footer Actions & Source Attribution */}
      <div className="mt-5 pt-4 border-t border-[#EFECE2] dark:border-[#1B2E28] flex flex-wrap items-center justify-between gap-3">
        <span className="text-[11px] text-[#6B7280] dark:text-[#8CA39A]">
          Sumber: {hadith.source}
        </span>

        <div className="flex flex-wrap items-center gap-1.5">
          {hadith.sanad.length > 0 && (
            <button
              type="button"
              onClick={() => setSanadOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#374151] dark:text-[#C5D5CE] hover:bg-[#F3F1E8] dark:hover:bg-[#182925] transition-colors whitespace-nowrap"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Sanad ({hadith.sanad.length})</span>
              {sanadOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          <button
            type="button"
            onClick={handleBookmark}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              saved
                ? 'bg-[#087A59]/12 text-[#087A59] dark:bg-[#C6A45C]/15 dark:text-[#C6A45C]'
                : 'text-[#374151] dark:text-[#C5D5CE] hover:bg-[#F3F1E8] dark:hover:bg-[#182925]'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
            <span>{saved ? 'Tersimpan' : 'Simpan'}</span>
          </button>

          <button
            type="button"
            onClick={() => void handleQuickCopy()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#374151] dark:text-[#C5D5CE] hover:bg-[#F3F1E8] dark:hover:bg-[#182925] transition-colors whitespace-nowrap"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#087A59]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Disalin' : 'Salin'}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onShare({
                title: `HR. ${hadith.bookName} No. ${hadith.number}`,
                arabicText: hadith.arabicText,
                translationText: hadith.translation,
                reference: `HR. ${hadith.bookName} No. ${hadith.number}${
                  hadith.narrator ? ` (Perawi: ${hadith.narrator})` : ''
                }`,
                source: hadith.source,
              })
            }
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#374151] dark:text-[#C5D5CE] hover:bg-[#F3F1E8] dark:hover:bg-[#182925] transition-colors whitespace-nowrap"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Bagikan</span>
          </button>

          {onCreateLinkedNote && (
            <button
              type="button"
              onClick={() =>
                onCreateLinkedNote(refKey, `HR. ${hadith.bookName} No. ${hadith.number}`)
              }
              title="Buat catatan terhubung"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#374151] dark:text-[#C5D5CE] hover:bg-[#F3F1E8] dark:hover:bg-[#182925] transition-colors whitespace-nowrap"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Catat</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
