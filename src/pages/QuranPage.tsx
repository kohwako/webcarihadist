import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  List,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { islamicApi } from '../lib/api';
import { ISLAMIC_CATEGORIES, QuranVerseItem, SurahSummary } from '../types/islamic';
import { SharePayload } from '../components/ShareModal';
import { VerseCard } from '../components/VerseCard';

interface QuranPageProps {
  onOpenDetail: (surah: number, ayah: number) => void;
  onShare: (payload: SharePayload) => void;
  onCreateLinkedNote: (refKey: string, label: string) => void;
}

export const QuranPage: React.FC<QuranPageProps> = ({
  onOpenDetail,
  onShare,
  onCreateLinkedNote,
}) => {
  const { recordSearchHistory } = useApp();

  const [viewMode, setViewMode] = useState<'search' | 'surahs'>('search');
  const [surahs, setSurahs] = useState<SurahSummary[]>([]);
  const [surahFilterText, setSurahFilterText] = useState('');

  const [queryText, setQueryText] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<number | ''>('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'relevansi' | 'surah_asc' | 'surah_desc'>('relevansi');
  const [page, setPage] = useState(1);

  const [verses, setVerses] = useState<QuranVerseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void islamicApi
      .getSurahs()
      .then((res) => setSurahs(res.surahs))
      .catch((err) => console.error('Failed loading surah list:', err));
  }, []);

  const executeSearch = useCallback(
    async (opts?: {
      q?: string;
      surah?: number | '';
      category?: string;
      sort?: 'relevansi' | 'surah_asc' | 'surah_desc';
      page?: number;
      saveHistory?: boolean;
    }) => {
      const q = opts?.q !== undefined ? opts.q : queryText;
      const surah = opts?.surah !== undefined ? opts.surah : selectedSurah;
      const category = opts?.category !== undefined ? opts.category : selectedCategory;
      const sort = opts?.sort !== undefined ? opts.sort : sortBy;
      const targetPage = opts?.page !== undefined ? opts.page : 1;

      setLoading(true);
      setError(null);
      try {
        const res = await islamicApi.searchQuran({
          q: q.trim() || undefined,
          surah,
          category: category || undefined,
          sort,
          page: targetPage,
          limit: 10,
        });
        setVerses(res.items);
        setTotal(res.total);
        setPage(res.page);
        setTotalPages(res.totalPages);
        if (opts?.saveHistory && q.trim()) {
          void recordSearchHistory(q.trim(), 'quran');
        }
      } catch (err) {
        setError((err as Error).message || 'Gagal mencari ayat Al-Qur\'an.');
      } finally {
        setLoading(false);
      }
    },
    [queryText, recordSearchHistory, selectedCategory, selectedSurah, sortBy]
  );

  useEffect(() => {
    void executeSearch({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setViewMode('search');
    void executeSearch({ page: 1, saveHistory: true });
  };

  const handleSelectSurahFromList = (nomor: number) => {
    setSelectedSurah(nomor);
    setQueryText('');
    setSelectedCategory('');
    setViewMode('search');
    void executeSearch({ q: '', surah: nomor, category: '', page: 1 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredSurahs = surahs.filter((s) => {
    if (!surahFilterText.trim()) return true;
    const term = surahFilterText.toLowerCase();
    return (
      s.namaLatin.toLowerCase().includes(term) ||
      s.arti.toLowerCase().includes(term) ||
      String(s.nomor) === term ||
      s.nama.includes(surahFilterText.trim())
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header & Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#064E3B] dark:text-[#E8EFEA]">
            Pencarian Al-Qur&apos;an
          </h1>
          <p className="text-sm text-[#5A6572] dark:text-[#93A8A0] mt-1">
            Cari berdasarkan nama surah, nomor ayat (mis. 2:255), kata kunci Indonesia, teks Arab, atau tema.
          </p>
        </div>

        <div className="inline-flex p-1 rounded-xl bg-[#EFECE2] dark:bg-[#162722] self-start shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('search')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              viewMode === 'search'
                ? 'bg-white dark:bg-[#087A59] text-[#064E3B] dark:text-white shadow-xs'
                : 'text-[#5A6572] dark:text-[#93A8A0]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Pencarian Ayat</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('surahs')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              viewMode === 'surahs'
                ? 'bg-white dark:bg-[#087A59] text-[#064E3B] dark:text-white shadow-xs'
                : 'text-[#5A6572] dark:text-[#93A8A0]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Daftar 114 Surah</span>
          </button>
        </div>
      </div>

      {viewMode === 'surahs' ? (
        <section className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={surahFilterText}
              onChange={(e) => setSurahFilterText(e.target.value)}
              placeholder="Saring nama surah, arti, atau nomor (1–114)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] text-sm focus:outline-none focus:border-[#087A59]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSurahs.map((s) => (
              <button
                key={s.nomor}
                type="button"
                onClick={() => handleSelectSurahFromList(s.nomor)}
                className="group flex items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] hover:border-[#087A59] dark:hover:border-[#C6A45C] text-left transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-[#F3F1E8] dark:bg-[#182925] group-hover:bg-[#087A59] group-hover:text-white text-[#064E3B] dark:text-[#C6A45C] text-xs font-bold tabular-nums flex items-center justify-center shrink-0 transition-colors">
                    {s.nomor}
                  </span>
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-sm text-[#1F2937] dark:text-[#E8EFEA] truncate">
                      {s.namaLatin}
                    </p>
                    <p className="text-xs text-[#5A6572] dark:text-[#8CA39A] truncate">
                      {s.arti} · <span className="tabular-nums">{s.jumlahAyat}</span> ayat
                    </p>
                  </div>
                </div>
                <span className="font-arabic text-xl text-[#064E3B] dark:text-[#C6A45C] shrink-0" lang="ar">
                  {s.nama}
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <>
          {/* Search & Filter Panel */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-5 space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#6B7280] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="Contoh: 2:153, Al-Baqarah 255, sabar, rezeki, atau teks Arab (الصبر)..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#FAF9F5] dark:bg-[#0E1916] border border-[#E7E5DC] dark:border-[#1E332D] text-sm focus:outline-none focus:border-[#087A59]"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-[#087A59] hover:bg-[#064E3B] text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                Cari Ayat
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-[#5A6572] dark:text-[#93A8A0] mb-1">
                  Filter Surah
                </label>
                <select
                  value={selectedSurah}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : '';
                    setSelectedSurah(val);
                    void executeSearch({ surah: val, page: 1 });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#0E1916] border border-[#E7E5DC] dark:border-[#1E332D] text-sm focus:outline-none focus:border-[#087A59]"
                >
                  <option value="">Semua 114 Surah</option>
                  {surahs.map((s) => (
                    <option key={s.nomor} value={s.nomor}>
                      {s.nomor}. {s.namaLatin} ({s.jumlahAyat} ayat)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5A6572] dark:text-[#93A8A0] mb-1">
                  Filter Tema
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedCategory(val);
                    void executeSearch({ category: val, page: 1 });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#0E1916] border border-[#E7E5DC] dark:border-[#1E332D] text-sm focus:outline-none focus:border-[#087A59]"
                >
                  <option value="">Semua Tema</option>
                  {ISLAMIC_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5A6572] dark:text-[#93A8A0] mb-1">
                  Urutkan Hasil
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    const val = e.target.value as 'relevansi' | 'surah_asc' | 'surah_desc';
                    setSortBy(val);
                    void executeSearch({ sort: val, page: 1 });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#0E1916] border border-[#E7E5DC] dark:border-[#1E332D] text-sm focus:outline-none focus:border-[#087A59]"
                >
                  <option value="relevansi">Paling Relevan</option>
                  <option value="surah_asc">Urutan Mushaf (1 → 114)</option>
                  <option value="surah_desc">Urutan Terbalik (114 → 1)</option>
                </select>
              </div>
            </div>
          </form>

          {/* Results Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5A6572] dark:text-[#93A8A0]">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>
                Menampilkan <strong className="text-[#1F2937] dark:text-[#E8EFEA] tabular-nums">{verses.length}</strong> dari{' '}
                <strong className="text-[#1F2937] dark:text-[#E8EFEA] tabular-nums">{total}</strong> ayat
                {selectedSurah && surahs.length > 0 && (
                  <> · Surah {surahs.find((s) => s.nomor === selectedSurah)?.namaLatin}</>
                )}
              </span>
            </div>
            {(queryText || selectedSurah || selectedCategory) && (
              <button
                type="button"
                onClick={() => {
                  setQueryText('');
                  setSelectedSurah('');
                  setSelectedCategory('');
                  setSortBy('relevansi');
                  void executeSearch({ q: '', surah: '', category: '', sort: 'relevansi', page: 1 });
                }}
                className="text-[#087A59] dark:text-[#C6A45C] font-semibold hover:underline"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Results List */}
          {loading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-6 space-y-4 animate-pulse"
                >
                  <div className="h-4 bg-[#EFECE2] dark:bg-[#1C302A] rounded w-1/4" />
                  <div className="h-7 bg-[#EFECE2] dark:bg-[#1C302A] rounded w-4/5 ml-auto" />
                  <div className="h-4 bg-[#EFECE2] dark:bg-[#1C302A] rounded w-full" />
                  <div className="h-4 bg-[#EFECE2] dark:bg-[#1C302A] rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-10 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
              <p className="text-sm text-[#374151] dark:text-[#C5D5CE]">{error}</p>
              <button
                type="button"
                onClick={() => void executeSearch({ page })}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#087A59] text-white text-xs font-semibold hover:bg-[#064E3B]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Coba Lagi
              </button>
            </div>
          ) : verses.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-12 text-center space-y-3">
              <BookOpen className="w-8 h-8 text-[#9CA3AF] mx-auto" />
              <h3 className="font-display font-semibold text-base text-[#1F2937] dark:text-[#E8EFEA]">
                Ayat tidak ditemukan
              </h3>
              <p className="text-sm text-[#5A6572] dark:text-[#93A8A0] max-w-md mx-auto">
                Coba gunakan kata kunci yang lebih singkat (misalnya &ldquo;sabar&rdquo;, &ldquo;syukur&rdquo;, &ldquo;2:255&rdquo;) atau hapus filter surah.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {verses.map((v) => (
                <VerseCard
                  key={`${v.surahNumber}:${v.ayahNumber}`}
                  verse={v}
                  onOpenDetail={onOpenDetail}
                  onShare={onShare}
                  onCreateLinkedNote={onCreateLinkedNote}
                />
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => {
                      void executeSearch({ page: page - 1 });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E7E5DC] dark:border-[#1E332D] bg-white dark:bg-[#111E1B] text-xs font-semibold disabled:opacity-40 hover:border-[#087A59]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>

                  <span className="text-xs text-[#5A6572] dark:text-[#93A8A0] tabular-nums">
                    Halaman {page} dari {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => {
                      void executeSearch({ page: page + 1 });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E7E5DC] dark:border-[#1E332D] bg-white dark:bg-[#111E1B] text-xs font-semibold disabled:opacity-40 hover:border-[#087A59]"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
