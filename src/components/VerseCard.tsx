import React, { useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FilePlus2,
  Pause,
  Play,
  Share2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { islamicApi } from '../lib/api';
import { copyToClipboard, getArabicSizeClass } from '../lib/utils';
import { QARI_OPTIONS, QuranVerseItem } from '../types/islamic';
import { SharePayload } from './ShareModal';

interface VerseCardProps {
  verse: QuranVerseItem;
  kicker?: string;
  onOpenDetail: (surahNumber: number, ayahNumber: number) => void;
  onShare: (payload: SharePayload) => void;
  onCreateLinkedNote?: (refKey: string, label: string) => void;
}

export const VerseCard: React.FC<VerseCardProps> = ({
  verse,
  kicker,
  onOpenDetail,
  onShare,
  onCreateLinkedNote,
}) => {
  const {
    arabicFontSize,
    qariId,
    isBookmarked,
    toggleBookmark,
    activeTrack,
    isAudioPlaying,
    playTrack,
    showToast,
  } = useApp();

  const [tafsirOpen, setTafsirOpen] = useState(false);
  const [tafsirText, setTafsirText] = useState<string | null>(verse.tafsir || null);
  const [loadingTafsir, setLoadingTafsir] = useState(false);
  const [copied, setCopied] = useState(false);

  const refKey = `quran:${verse.surahNumber}:${verse.ayahNumber}`;
  const saved = isBookmarked(refKey);
  const trackId = `quran_${verse.surahNumber}_${verse.ayahNumber}_${qariId}`;
  const isThisPlaying = activeTrack?.id === trackId && isAudioPlaying;
  const audioUrl = verse.audio?.[qariId] || verse.audio?.['05'] || Object.values(verse.audio || {})[0];

  const handleToggleTafsir = async () => {
    if (tafsirOpen) {
      setTafsirOpen(false);
      return;
    }
    setTafsirOpen(true);
    if (tafsirText) return;
    setLoadingTafsir(true);
    try {
      const data = await islamicApi.getSurahTafsir(verse.surahNumber);
      const match = data.tafsir.find((t) => t.ayat === verse.ayahNumber);
      setTafsirText(
        match?.teks || 'Tafsir untuk ayat ini belum tersedia pada sumber.'
      );
    } catch {
      setTafsirText('Gagal memuat tafsir Kemenag RI. Silakan coba lagi.');
    } finally {
      setLoadingTafsir(false);
    }
  };

  const handleQuickCopy = async () => {
    const text = `${verse.arabicText}\n\n"${verse.translation}"\n— QS. ${verse.surahName} (${verse.surahNumber}): ${verse.ayahNumber}`;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      showToast(`QS. ${verse.surahName}: ${verse.ayahNumber} disalin.`, 'success');
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleBookmark = () => {
    void toggleBookmark({
      type: 'quran',
      refKey,
      title: `QS. ${verse.surahName} : ${verse.ayahNumber}`,
      subtitle: `${verse.revelationType} · Surah ke-${verse.surahNumber}`,
      arabicText: verse.arabicText,
      translationText: verse.translation,
      sourceLabel: verse.source,
      surahNumber: verse.surahNumber,
      ayahNumber: verse.ayahNumber,
    });
  };

  const handlePlayAudio = () => {
    if (!audioUrl) {
      showToast('Audio murottal belum tersedia untuk ayat ini.', 'info');
      return;
    }
    playTrack({
      id: trackId,
      title: `QS. ${verse.surahName} : ${verse.ayahNumber}`,
      subtitle: QARI_OPTIONS[qariId] || 'Murottal Al-Qur\'an',
      url: audioUrl,
      surahNumber: verse.surahNumber,
      ayahNumber: verse.ayahNumber,
    });
  };

  return (
    <article className="rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-5 sm:p-6 transition-colors hover:border-[#087A59]/45">
      {/* Header Metadata Line (Zero-Pill Editorial Style) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EFECE2] dark:border-[#1B2E28]">
        <div className="min-w-0">
          {kicker && (
            <p className="text-xs font-semibold text-[#C6A45C] mb-0.5">{kicker}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
            <button
              type="button"
              onClick={() => onOpenDetail(verse.surahNumber, verse.ayahNumber)}
              className="font-display font-bold text-[#064E3B] dark:text-[#E8EFEA] hover:text-[#087A59] dark:hover:text-[#C6A45C] transition-colors text-left"
            >
              QS. {verse.surahName} : <span className="tabular-nums">{verse.ayahNumber}</span>
            </button>
            <span className="text-[#9CA3AF]" aria-hidden="true">·</span>
            <span className="text-xs text-[#5A6572] dark:text-[#93A8A0] tabular-nums">
              Surah ke-{verse.surahNumber} · {verse.revelationType}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {audioUrl && (
            <button
              type="button"
              onClick={handlePlayAudio}
              title={isThisPlaying ? 'Jeda Murottal' : 'Putar Murottal'}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                isThisPlaying
                  ? 'bg-[#087A59] text-white'
                  : 'bg-[#F3F1E8] dark:bg-[#182925] text-[#064E3B] dark:text-[#D1E0DA] hover:bg-[#E7E3D4] dark:hover:bg-[#1F352F]'
              }`}
            >
              {isThisPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isThisPlaying ? 'Jeda' : 'Audio'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenDetail(verse.surahNumber, verse.ayahNumber)}
            title="Buka halaman detail ayat"
            className="p-2 rounded-lg text-[#5A6572] dark:text-[#93A8A0] hover:text-[#087A59] dark:hover:text-[#C6A45C] hover:bg-[#F3F1E8] dark:hover:bg-[#182925] transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Arabic Verse Text */}
      <div className="py-5">
        <p
          className={`font-arabic text-right text-[#1F2937] dark:text-[#F2F7F4] ${getArabicSizeClass(
            arabicFontSize
          )}`}
          lang="ar"
        >
          {verse.arabicText}
        </p>
      </div>

      {/* Transliteration & Indonesian Translation */}
      <div className="space-y-2.5">
        {verse.transliteration && (
          <p className="text-xs sm:text-[13px] italic text-[#087A59] dark:text-[#7CD4B5] leading-relaxed">
            {verse.transliteration}
          </p>
        )}
        <p className="text-sm sm:text-[15px] text-[#374151] dark:text-[#D4E2DC] leading-relaxed">
          &ldquo;{verse.translation}&rdquo;
        </p>
      </div>

      {/* Expandable Tafsir Kemenag RI */}
      {tafsirOpen && (
        <div className="mt-4 pt-4 border-t border-[#EFECE2] dark:border-[#1B2E28] space-y-1.5">
          <p className="text-xs font-semibold text-[#064E3B] dark:text-[#C6A45C]">
            Tafsir Kementerian Agama RI
          </p>
          {loadingTafsir ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-3 bg-[#EFECE2] dark:bg-[#1C302A] rounded w-full" />
              <div className="h-3 bg-[#EFECE2] dark:bg-[#1C302A] rounded w-5/6" />
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#B5C7C0] leading-relaxed whitespace-pre-line">
              {tafsirText}
            </p>
          )}
        </div>
      )}

      {/* Footer Actions & Source Attribution */}
      <div className="mt-5 pt-4 border-t border-[#EFECE2] dark:border-[#1B2E28] flex flex-wrap items-center justify-between gap-3">
        <span className="text-[11px] text-[#6B7280] dark:text-[#8CA39A]">
          Sumber: {verse.source}
        </span>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => void handleToggleTafsir()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#374151] dark:text-[#C5D5CE] hover:bg-[#F3F1E8] dark:hover:bg-[#182925] transition-colors whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Tafsir</span>
            {tafsirOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

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
                title: `QS. ${verse.surahName} Ayat ${verse.ayahNumber}`,
                arabicText: verse.arabicText,
                translationText: verse.translation,
                reference: `QS. ${verse.surahName} (${verse.surahNumber}): ${verse.ayahNumber}`,
                source: verse.source,
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
                onCreateLinkedNote(refKey, `QS. ${verse.surahName} : ${verse.ayahNumber}`)
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
