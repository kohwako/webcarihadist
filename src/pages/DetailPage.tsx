import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Bookmark,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Copy,
  FilePlus2,
  GitBranch,
  Pause,
  Play,
  RefreshCw,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { HadithDetailResponse, islamicApi, VerseDetailResponse } from '../lib/api';
import { copyToClipboard, getArabicSizeClass } from '../lib/utils';
import { DetailTarget, QARI_OPTIONS, QariId } from '../types/islamic';
import { SharePayload } from '../components/ShareModal';

interface DetailPageProps {
  target: DetailTarget;
  onBack: () => void;
  onNavigateTarget: (nextTarget: DetailTarget) => void;
  onShare: (payload: SharePayload) => void;
  onCreateLinkedNote: (refKey: string, label: string) => void;
}

export const DetailPage: React.FC<DetailPageProps> = ({
  target,
  onBack,
  onNavigateTarget,
  onShare,
  onCreateLinkedNote,
}) => {
  const {
    arabicFontSize,
    qariId,
    setQariId,
    isBookmarked,
    toggleBookmark,
    notes,
    activeTrack,
    isAudioPlaying,
    playTrack,
    showToast,
  } = useApp();

  const [verseData, setVerseData] = useState<VerseDetailResponse | null>(null);
  const [hadithData, setHadithData] = useState<HadithDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContent = async () => {
    setLoading(true);
    setError(null);
    setVerseData(null);
    setHadithData(null);
    try {
      if (target.type === 'quran' && target.surahNumber && target.ayahNumber) {
        const res = await islamicApi.getVerseDetail(target.surahNumber, target.ayahNumber);
        setVerseData(res);
      } else if (target.type === 'hadith' && target.hadithBook && target.hadithNumber) {
        const res = await islamicApi.getHadithDetail(target.hadithBook, target.hadithNumber);
        setHadithData(res);
      } else {
        setError('Referensi konten tidak lengkap.');
      }
    } catch (err) {
      setError((err as Error).message || 'Gagal memuat detail konten.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadContent();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.type, target.surahNumber, target.ayahNumber, target.hadithBook, target.hadithNumber]);

  const currentRefKey =
    target.type === 'quran'
      ? `quran:${target.surahNumber}:${target.ayahNumber}`
      : `hadith:${target.hadithBook}:${target.hadithNumber}`;

  const relatedNotes = notes.filter((n) => n.linkedRefKey === currentRefKey);
  const saved = isBookmarked(currentRefKey);

  const handleCopyText = async (text: string, label: string) => {
    const ok = await copyToClipboard(text);
    if (ok) showToast(`${label} berhasil disalin.`, 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#374151] dark:text-[#C5D5CE] hover:text-[#087A59] dark:hover:text-[#C6A45C] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>
        <span className="text-xs text-[#6B7280] dark:text-[#8CA39A]">
          {target.type === 'quran' ? "Detail Ayat Al-Qur'an" : 'Detail Hadis'}
        </span>
      </div>

      {loading ? (
        <div className="rounded-3xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-8 sm:p-10 space-y-6 animate-pulse">
          <div className="h-5 bg-[#EFECE2] dark:bg-[#1C302A] rounded w-1/3" />
          <div className="space-y-3 py-6">
            <div className="h-9 bg-[#EFECE2] dark:bg-[#1C302A] rounded w-full" />
            <div className="h-9 bg-[#EFECE2] dark:bg-[#1C302A] rounded w-4/5 ml-auto" />
          </div>
          <div className="space-y-2.5">
            <div className="h-4 bg-[#EFECE2] dark:bg-[#1C302A] rounded w-full" />
            <div className="h-4 bg-[#EFECE2] dark:bg-[#1C302A] rounded w-5/6" />
          </div>
        </div>
      ) : error ? (
        <div className="rounded-3xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-10 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
          <p className="text-sm text-[#374151] dark:text-[#C5D5CE]">{error}</p>
          <button
            type="button"
            onClick={() => void loadContent()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#087A59] text-white text-xs font-semibold hover:bg-[#064E3B]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Coba Lagi
          </button>
        </div>
      ) : verseData ? (
        <>
          {/* Premium Qur'an Reading Sheet */}
          <article className="rounded-3xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] overflow-hidden">
            {/* Subtle Header Banner */}
            <div className="px-6 py-6 sm:px-9 sm:py-7 bg-[#064E3B] text-white islamic-geo-pattern">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-[#E2C98A]">
                    Surah ke-{verseData.surahInfo.nomor} · {verseData.surahInfo.tempatTurun} · {verseData.surahInfo.jumlahAyat} Ayat
                  </p>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold mt-1">
                    QS. {verseData.verse.surahName} : <span className="tabular-nums">{verseData.verse.ayahNumber}</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-[#D4E6DF] mt-1">
                    Arti Surah: {verseData.surahInfo.arti}
                  </p>
                </div>
                <span className="font-arabic text-3xl sm:text-4xl text-[#E2C98A]" lang="ar">
                  {verseData.verse.surahArabicName}
                </span>
              </div>
            </div>

            {/* Body Reading Canvas */}
            <div className="p-6 sm:p-9 space-y-7">
              {/* Audio Murottal Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#EFECE2] dark:border-[#1B2E28]">
                <div className="flex items-center gap-3">
                  {(() => {
                    const trackId = `quran_${verseData.verse.surahNumber}_${verseData.verse.ayahNumber}_${qariId}`;
                    const audioUrl =
                      verseData.verse.audio?.[qariId] ||
                      verseData.verse.audio?.['05'] ||
                      Object.values(verseData.verse.audio || {})[0];
                    const isPlayingHere = activeTrack?.id === trackId && isAudioPlaying;
                    return (
                      <button
                        type="button"
                        disabled={!audioUrl}
                        onClick={() => {
                          if (!audioUrl) return;
                          playTrack({
                            id: trackId,
                            title: `QS. ${verseData.verse.surahName} : ${verseData.verse.ayahNumber}`,
                            subtitle: QARI_OPTIONS[qariId],
                            url: audioUrl,
                            surahNumber: verseData.verse.surahNumber,
                            ayahNumber: verseData.verse.ayahNumber,
                          });
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#087A59] hover:bg-[#064E3B] text-white text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
                      >
                        {isPlayingHere ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current" />
                        )}
                        <span>{isPlayingHere ? 'Jeda Murottal' : 'Putar Murottal'}</span>
                      </button>
                    );
                  })()}

                  <select
                    value={qariId}
                    onChange={(e) => setQariId(e.target.value as QariId)}
                    aria-label="Pilih Qari Murottal"
                    className="px-3 py-2 rounded-xl bg-[#FAF9F5] dark:bg-[#0E1916] border border-[#E7E5DC] dark:border-[#1E332D] text-xs font-medium focus:outline-none focus:border-[#087A59]"
                  >
                    {(Object.entries(QARI_OPTIONS) as Array<[QariId, string]>).map(([id, name]) => (
                      <option key={id} value={id}>
                        Qari: {name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Row */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      void toggleBookmark({
                        type: 'quran',
                        refKey: currentRefKey,
                        title: `QS. ${verseData.verse.surahName} : ${verseData.verse.ayahNumber}`,
                        subtitle: `${verseData.verse.revelationType} · Surah ke-${verseData.verse.surahNumber}`,
                        arabicText: verseData.verse.arabicText,
                        translationText: verseData.verse.translation,
                        sourceLabel: verseData.verse.source,
                        surahNumber: verseData.verse.surahNumber,
                        ayahNumber: verseData.verse.ayahNumber,
                      })
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      saved
                        ? 'bg-[#087A59]/12 text-[#087A59] dark:bg-[#C6A45C]/15 dark:text-[#C6A45C]'
                        : 'bg-[#F3F1E8] dark:bg-[#182925] text-[#374151] dark:text-[#C5D5CE]'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
                    <span>{saved ? 'Tersimpan' : 'Simpan'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onShare({
                        title: `QS. ${verseData.verse.surahName} Ayat ${verseData.verse.ayahNumber}`,
                        arabicText: verseData.verse.arabicText,
                        translationText: verseData.verse.translation,
                        reference: `QS. ${verseData.verse.surahName} (${verseData.verse.surahNumber}): ${verseData.verse.ayahNumber}`,
                        source: verseData.verse.source,
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F3F1E8] dark:bg-[#182925] text-xs font-semibold text-[#374151] dark:text-[#C5D5CE] hover:text-[#087A59]"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Bagikan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onCreateLinkedNote(
                        currentRefKey,
                        `QS. ${verseData.verse.surahName} : ${verseData.verse.ayahNumber}`
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F3F1E8] dark:bg-[#182925] text-xs font-semibold text-[#374151] dark:text-[#C5D5CE] hover:text-[#087A59]"
                  >
                    <FilePlus2 className="w-3.5 h-3.5" />
                    <span>Catat</span>
                  </button>
                </div>
              </div>

              {/* Large Arabic Script */}
              <div className="py-4">
                <p
                  className={`font-arabic text-right text-[#1F2937] dark:text-[#F4F8F6] ${getArabicSizeClass(
                    arabicFontSize,
                    true
                  )}`}
                  lang="ar"
                >
                  {verseData.verse.arabicText}
                </p>
              </div>

              {/* Transliteration & Translation */}
              <div className="space-y-4">
                {verseData.verse.transliteration && (
                  <div>
                    <p className="text-xs font-semibold text-[#6B7280] dark:text-[#8CA39A] mb-1">
                      Transliterasi Latin
                    </p>
                    <p className="text-sm sm:text-base italic text-[#087A59] dark:text-[#7CD4B5] leading-relaxed">
                      {verseData.verse.transliteration}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-[#6B7280] dark:text-[#8CA39A] mb-1">
                    Terjemahan Bahasa Indonesia
                  </p>
                  <p className="text-base sm:text-lg text-[#1F2937] dark:text-[#E8EFEA] leading-relaxed">
                    &ldquo;{verseData.verse.translation}&rdquo;
                  </p>
                </div>

                {/* Quick Copy Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void handleCopyText(verseData.verse.arabicText, 'Teks Arab')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E7E5DC] dark:border-[#1E332D] text-xs font-medium hover:border-[#087A59] transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Teks Arab</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void handleCopyText(
                        `"${verseData.verse.translation}" (QS. ${verseData.verse.surahName}: ${verseData.verse.ayahNumber})`,
                        'Terjemahan'
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E7E5DC] dark:border-[#1E332D] text-xs font-medium hover:border-[#087A59] transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Terjemahan</span>
                  </button>
                </div>
              </div>

              {/* Official Tafsir Kemenag RI */}
              {verseData.verse.tafsir && (
                <div className="pt-6 border-t border-[#EFECE2] dark:border-[#1B2E28] space-y-2.5">
                  <div className="flex items-center gap-2 text-[#064E3B] dark:text-[#C6A45C]">
                    <BookOpen className="w-4 h-4" />
                    <h2 className="font-display font-bold text-base">
                      Tafsir Kementerian Agama RI
                    </h2>
                  </div>
                  <p className="text-sm sm:text-[15px] text-[#374151] dark:text-[#C5D5CE] leading-[1.8] whitespace-pre-line">
                    {verseData.verse.tafsir}
                  </p>
                </div>
              )}

              <p className="pt-4 border-t border-[#EFECE2] dark:border-[#1B2E28] text-xs text-[#6B7280] dark:text-[#8CA39A]">
                Sumber terverifikasi: {verseData.verse.source}
              </p>
            </div>
          </article>

          {/* Previous / Next Verse Navigation */}
          <div className="grid grid-cols-2 gap-3">
            {verseData.navigation.prev ? (
              <button
                type="button"
                onClick={() =>
                  onNavigateTarget({
                    type: 'quran',
                    surahNumber: verseData.navigation.prev!.surahNumber,
                    ayahNumber: verseData.navigation.prev!.ayahNumber,
                    returnPage: target.returnPage,
                  })
                }
                className="flex items-center gap-2.5 p-4 rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] hover:border-[#087A59] text-left transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-[#087A59] dark:text-[#C6A45C] shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[11px] text-[#6B7280] dark:text-[#8CA39A]">
                    Ayat Sebelumnya
                  </span>
                  <span className="block text-sm font-semibold truncate">
                    {verseData.navigation.prev.label}
                  </span>
                </div>
              </button>
            ) : (
              <div />
            )}

            {verseData.navigation.next ? (
              <button
                type="button"
                onClick={() =>
                  onNavigateTarget({
                    type: 'quran',
                    surahNumber: verseData.navigation.next!.surahNumber,
                    ayahNumber: verseData.navigation.next!.ayahNumber,
                    returnPage: target.returnPage,
                  })
                }
                className="flex items-center justify-end gap-2.5 p-4 rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] hover:border-[#087A59] text-right transition-colors"
              >
                <div className="min-w-0">
                  <span className="block text-[11px] text-[#6B7280] dark:text-[#8CA39A]">
                    Ayat Berikutnya
                  </span>
                  <span className="block text-sm font-semibold truncate">
                    {verseData.navigation.next.label}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#087A59] dark:text-[#C6A45C] shrink-0" />
              </button>
            ) : (
              <div />
            )}
          </div>
        </>
      ) : hadithData ? (
        <>
          {/* Premium Hadith Reading Sheet */}
          <article className="rounded-3xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] overflow-hidden">
            <div className="px-6 py-6 sm:px-9 sm:py-7 bg-[#064E3B] text-white islamic-geo-pattern">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-[#E2C98A]">
                    Kutubus Sittah · Total {hadithData.bookInfo.total.toLocaleString('id-ID')} Hadis
                  </p>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold mt-1">
                    HR. {hadithData.hadith.bookName} No. <span className="tabular-nums">{hadithData.hadith.number}</span>
                  </h1>
                  {hadithData.hadith.narrator && (
                    <p className="text-xs sm:text-sm text-[#D4E6DF] mt-1">
                      Perawi Utama: {hadithData.hadith.narrator}
                    </p>
                  )}
                </div>
                <span className="font-arabic text-3xl text-[#E2C98A]" lang="ar">
                  {hadithData.bookInfo.arabicName}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-9 space-y-7">
              {/* Authenticity & Actions Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#EFECE2] dark:border-[#1B2E28]">
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <ShieldCheck
                    className={`w-4 h-4 shrink-0 ${
                      hadithData.hadith.grade
                        ? 'text-[#087A59] dark:text-[#7CD4B5]'
                        : 'text-[#6B7280] dark:text-[#8CA39A]'
                    }`}
                  />
                  <span className="font-medium">
                    {hadithData.hadith.grade
                      ? hadithData.hadith.grade
                      : 'Status derajat tidak tercantum pada sumber API'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      void toggleBookmark({
                        type: 'hadith',
                        refKey: currentRefKey,
                        title: `HR. ${hadithData.hadith.bookName} No. ${hadithData.hadith.number}`,
                        subtitle: hadithData.hadith.narrator
                          ? `Perawi: ${hadithData.hadith.narrator}`
                          : hadithData.hadith.bookName,
                        arabicText: hadithData.hadith.arabicText,
                        translationText: hadithData.hadith.translation,
                        sourceLabel: hadithData.hadith.source,
                        hadithBook: hadithData.hadith.bookSlug,
                        hadithNumber: hadithData.hadith.number,
                      })
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      saved
                        ? 'bg-[#087A59]/12 text-[#087A59] dark:bg-[#C6A45C]/15 dark:text-[#C6A45C]'
                        : 'bg-[#F3F1E8] dark:bg-[#182925] text-[#374151] dark:text-[#C5D5CE]'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
                    <span>{saved ? 'Tersimpan' : 'Simpan'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onShare({
                        title: `HR. ${hadithData.hadith.bookName} No. ${hadithData.hadith.number}`,
                        arabicText: hadithData.hadith.arabicText,
                        translationText: hadithData.hadith.translation,
                        reference: `HR. ${hadithData.hadith.bookName} No. ${hadithData.hadith.number}`,
                        source: hadithData.hadith.source,
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F3F1E8] dark:bg-[#182925] text-xs font-semibold text-[#374151] dark:text-[#C5D5CE]"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Bagikan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onCreateLinkedNote(
                        currentRefKey,
                        `HR. ${hadithData.hadith.bookName} No. ${hadithData.hadith.number}`
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F3F1E8] dark:bg-[#182925] text-xs font-semibold text-[#374151] dark:text-[#C5D5CE]"
                  >
                    <FilePlus2 className="w-3.5 h-3.5" />
                    <span>Catat</span>
                  </button>
                </div>
              </div>

              {/* Large Arabic Hadith Text */}
              <div className="py-3">
                <p
                  className={`font-arabic text-right text-[#1F2937] dark:text-[#F4F8F6] ${getArabicSizeClass(
                    arabicFontSize,
                    true
                  )}`}
                  lang="ar"
                >
                  {hadithData.hadith.arabicText}
                </p>
              </div>

              {/* Indonesian Translation */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[#6B7280] dark:text-[#8CA39A]">
                  Terjemahan Bahasa Indonesia
                </p>
                <p className="text-base sm:text-lg text-[#1F2937] dark:text-[#E8EFEA] leading-[1.8]">
                  {hadithData.hadith.translation}
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void handleCopyText(hadithData.hadith.arabicText, 'Teks Arab Hadis')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E7E5DC] dark:border-[#1E332D] text-xs font-medium hover:border-[#087A59]"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Teks Arab</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void handleCopyText(
                        `${hadithData.hadith.translation} (HR. ${hadithData.hadith.bookName} No. ${hadithData.hadith.number})`,
                        'Terjemahan Hadis'
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E7E5DC] dark:border-[#1E332D] text-xs font-medium hover:border-[#087A59]"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Terjemahan</span>
                  </button>
                </div>
              </div>

              {/* Sanad & Kitab Information */}
              <div className="pt-6 border-t border-[#EFECE2] dark:border-[#1B2E28] space-y-4">
                {hadithData.hadith.sanad.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[#064E3B] dark:text-[#C6A45C]">
                      <GitBranch className="w-4 h-4" />
                      <h2 className="font-display font-bold text-base">
                        Rangkaian Sanad (Sesuai Teks Sumber)
                      </h2>
                    </div>
                    <p className="text-sm text-[#374151] dark:text-[#C5D5CE] leading-relaxed">
                      {hadithData.hadith.sanad.join(' → ')}
                    </p>
                  </div>
                )}

                <div className="space-y-1 text-xs sm:text-sm text-[#5A6572] dark:text-[#93A8A0]">
                  <p>
                    <strong className="text-[#1F2937] dark:text-[#E8EFEA]">Keterangan Kitab:</strong>{' '}
                    {hadithData.bookInfo.collectionNote}
                  </p>
                  <p>
                    <strong className="text-[#1F2937] dark:text-[#E8EFEA]">Catatan Derajat:</strong>{' '}
                    {hadithData.hadith.gradeNote}
                  </p>
                  <p className="text-xs pt-1">Sumber terverifikasi: {hadithData.hadith.source}</p>
                </div>
              </div>
            </div>
          </article>

          {/* Prev / Next Hadith Navigation */}
          <div className="grid grid-cols-2 gap-3">
            {hadithData.navigation.prev ? (
              <button
                type="button"
                onClick={() =>
                  onNavigateTarget({
                    type: 'hadith',
                    hadithBook: hadithData.navigation.prev!.bookSlug,
                    hadithNumber: hadithData.navigation.prev!.number,
                    returnPage: target.returnPage,
                  })
                }
                className="flex items-center gap-2.5 p-4 rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] hover:border-[#087A59] text-left transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-[#087A59] dark:text-[#C6A45C] shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[11px] text-[#6B7280] dark:text-[#8CA39A]">
                    Hadis Sebelumnya
                  </span>
                  <span className="block text-sm font-semibold truncate">
                    {hadithData.navigation.prev.label}
                  </span>
                </div>
              </button>
            ) : (
              <div />
            )}

            {hadithData.navigation.next ? (
              <button
                type="button"
                onClick={() =>
                  onNavigateTarget({
                    type: 'hadith',
                    hadithBook: hadithData.navigation.next!.bookSlug,
                    hadithNumber: hadithData.navigation.next!.number,
                    returnPage: target.returnPage,
                  })
                }
                className="flex items-center justify-end gap-2.5 p-4 rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] hover:border-[#087A59] text-right transition-colors"
              >
                <div className="min-w-0">
                  <span className="block text-[11px] text-[#6B7280] dark:text-[#8CA39A]">
                    Hadis Berikutnya
                  </span>
                  <span className="block text-sm font-semibold truncate">
                    {hadithData.navigation.next.label}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#087A59] dark:text-[#C6A45C] shrink-0" />
              </button>
            ) : (
              <div />
            )}
          </div>
        </>
      ) : null}

      {/* Linked Personal Notes Section */}
      {!loading && !error && (
        <section className="rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-base text-[#064E3B] dark:text-[#E8EFEA]">
                Catatan Terhubung ({relatedNotes.length})
              </h2>
              <p className="text-xs text-[#5A6572] dark:text-[#93A8A0]">
                Simpan hikmah dan tadabbur pribadi Anda untuk referensi ini.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onCreateLinkedNote(
                  currentRefKey,
                  verseData
                    ? `QS. ${verseData.verse.surahName} : ${verseData.verse.ayahNumber}`
                    : hadithData
                      ? `HR. ${hadithData.hadith.bookName} No. ${hadithData.hadith.number}`
                      : currentRefKey
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#087A59] hover:bg-[#064E3B] text-white text-xs font-semibold transition-colors"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>Tambah Catatan</span>
            </button>
          </div>

          {relatedNotes.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-[#EFECE2] dark:border-[#1B2E28]">
              {relatedNotes.map((n) => (
                <div key={n.id} className="space-y-1">
                  <p className="font-display font-semibold text-sm text-[#1F2937] dark:text-[#E8EFEA]">
                    {n.title}
                  </p>
                  <p className="text-sm text-[#4B5563] dark:text-[#B5C7C0] whitespace-pre-line leading-relaxed">
                    {n.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
