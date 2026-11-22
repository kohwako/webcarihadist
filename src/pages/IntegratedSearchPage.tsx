import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  BookMarked,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { IntegratedSearchResponse, islamicApi } from '../lib/api';
import { ISLAMIC_CATEGORIES } from '../types/islamic';
import { HadithCard } from '../components/HadithCard';
import { SharePayload } from '../components/ShareModal';
import { VerseCard } from '../components/VerseCard';

interface IntegratedSearchPageProps {
  initialQuery: string;
  initialCategory: string;
  onOpenQuranDetail: (surah: number, ayah: number) => void;
  onOpenHadithDetail: (book: string, number: number) => void;
  onShare: (payload: SharePayload) => void;
  onCreateLinkedNote: (refKey: string, label: string) => void;
}

export const IntegratedSearchPage: React.FC<IntegratedSearchPageProps> = ({
  initialQuery,
  initialCategory,
  onOpenQuranDetail,
  onOpenHadithDetail,
  onShare,
  onCreateLinkedNote,
}) => {
  const { searchHistory, recordSearchHistory, clearSearchHistory } = useApp();

  const [queryText, setQueryText] = useState(initialQuery || 'Kesabaran');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'quran' | 'hadith'>('all');
  const [categoryFilter, setCategoryFilter] = useState(initialCategory || '');
  const [sortFilter, setSortFilter] = useState<'relevansi' | 'asc' | 'desc'>('relevansi');
  const [activeTab, setActiveTab] = useState<'quran' | 'hadith'>('quran');
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<IntegratedSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(
    async (opts?: {
      q?: string;
      source?: 'all' | 'quran' | 'hadith';
      category?: string;
      sort?: 'relevansi' | 'asc' | 'desc';
      page?: number;
      saveHistory?: boolean;
    }) => {
      const q = opts?.q !== undefined ? opts.q : queryText;
      const source = opts?.source !== undefined ? opts.source : sourceFilter;
      const category = opts?.category !== undefined ? opts.category : categoryFilter;
      const sort = opts?.sort !== undefined ? opts.sort : sortFilter;
      const targetPage = opts?.page !== undefined ? opts.page : 1;

      setLoading(true);
      setError(null);
      try {
        const data = await islamicApi.searchIntegrated({
          q: q.trim(),
          source,
          category,
          sort,
          page: targetPage,
          limit: 10,
        });
        setResult(data);
        setPage(targetPage);
        if (source === 'hadith') {
          setActiveTab('hadith');
        } else if (source === 'quran') {
          setActiveTab('quran');
        } else if (data.quran.total === 0 && data.hadith.total > 0) {
          setActiveTab('hadith');
        }
        if (opts?.saveHistory && q.trim()) {
          void recordSearchHistory(q.trim(), source);
        }
      } catch (err) {
        setError((err as Error).message || 'Pencarian terintegrasi gagal dimuat.');
      } finally {
        setLoading(false);
      }
    },
    [categoryFilter, queryText, recordSearchHistory, sortFilter, sourceFilter]
  );

  // React to incoming query/category triggered from HomePage
  useEffect(() => {
    const q = initialQuery || 'Kesabaran';
    const cat = initialCategory || '';
    setQueryText(q);
    setCategoryFilter(cat);
    setSourceFilter('all');
    setActiveTab('quran');
    void runSearch({
      q,
      category: cat,
      source: 'all',
      sort: 'relevansi',
      page: 1,
      saveHistory: Boolean(initialQuery),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, initialCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runSearch({ page: 1, saveHistory: true });
  };

  const currentTabData = activeTab === 'quran' ? result?.quran : result?.hadith;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#064E3B] dark:text-[#E8EFEA]">
          Pencarian Terintegrasi
        </h1>
        <p className="text-sm text-[#5A6572] dark:text-[#93A8A0] mt-1">
          Satu kata kunci mencari secara bersamaan pada database Al-Qur&apos;an dan enam kitab hadis Kutubus Sittah.
        </p>
      </div>

      {/* Unified Search & Filters */}
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
              placeholder="Cari ayat, hadis, kata kunci atau topik (mis. Kesabaran, Doa, Ilmu)..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#FAF9F5] dark:bg-[#0E1916] border border-[#E7E5DC] dark:border-[#1E332D] text-sm focus:outline-none focus:border-[#087A59]"
            />
          </div>
          <button
            type="submit"
            className="px-7 py-3 rounded-xl bg-[#087A59] hover:bg-[#064E3B] text-white text-sm font-semibold transition-colors whitespace-nowrap"
          >
            Cari
          </button>
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#5A6572] dark:text-[#93A8A0] mb-1">
              Sumber Pencarian
            </label>
            <div className="grid grid-cols-3 p-1 rounded-xl bg-[#F3F1E8] dark:bg-[#0E1916] border border-[#E7E5DC] dark:border-[#1E332D]">
              {(
                [
                  { id: 'all', label: 'Semua' },
                  { id: 'quran', label: "Qur'an" },
                  { id: 'hadith', label: 'Hadis' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSourceFilter(opt.id);
                    void runSearch({ source: opt.id, page: 1 });
                  }}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    sourceFilter === opt.id
                      ? 'bg-white dark:bg-[#087A59] text-[#064E3B] dark:text-white shadow-xs'
                      : 'text-[#5A6572] dark:text-[#93A8A0]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5A6572] dark:text-[#93A8A0] mb-1">
              Kategori / Tema
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                const val = e.target.value;
                setCategoryFilter(val);
                void runSearch({ category: val, page: 1 });
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#0E1916] border border-[#E7E5DC] dark:border-[#1E332D] text-sm focus:outline-none focus:border-[#087A59]"
            >
              <option value="">Semua Kategori</option>
              {ISLAMIC_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5A6572] dark:text-[#93A8A0] mb-1">
              Relevansi &amp; Urutan
            </label>
            <select
              value={sortFilter}
              onChange={(e) => {
                const val = e.target.value as 'relevansi' | 'asc' | 'desc';
                setSortFilter(val);
                void runSearch({ sort: val, page: 1 });
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#0E1916] border border-[#E7E5DC] dark:border-[#1E332D] text-sm focus:outline-none focus:border-[#087A59]"
            >
              <option value="relevansi">Relevansi Tertinggi</option>
              <option value="asc">Urutan Nomor Menaik</option>
              <option value="desc">Urutan Nomor Menurun</option>
            </select>
          </div>
        </div>

        {/* Search History Strip */}
        {searchHistory.length > 0 && (
          <div className="pt-2 border-t border-[#EFECE2] dark:border-[#1B2E28] flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="inline-flex items-center gap-1 text-[#6B7280] dark:text-[#8CA39A] mr-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Riwayat:</span>
              </span>
              {searchHistory.slice(0, 6).map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => {
                    setQueryText(h.query);
                    void runSearch({ q: h.query, page: 1 });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#F3F1E8] dark:bg-[#182925] hover:bg-[#E7E3D4] dark:hover:bg-[#223932] text-[#374151] dark:text-[#D4E2DC] transition-colors"
                >
                  {h.query}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void clearSearchHistory()}
              className="inline-flex items-center gap-1 text-xs text-[#6B7280] hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Riwayat</span>
            </button>
          </div>
        )}
      </form>

      {/* Two Primary Result Tabs: AYAT AL-QUR'AN & HADIS */}
      <div className="flex items-center border-b border-[#E7E5DC] dark:border-[#1E332D] gap-2">
        {(sourceFilter === 'all' || sourceFilter === 'quran') && (
          <button
            type="button"
            onClick={() => setActiveTab('quran')}
            className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'quran'
                ? 'border-[#087A59] text-[#064E3B] dark:text-[#E8EFEA] dark:border-[#C6A45C]'
                : 'border-transparent text-[#6B7280] dark:text-[#8CA39A] hover:text-[#1F2937] dark:hover:text-[#E8EFEA]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Ayat Al-Qur&apos;an</span>
            <span className="text-xs tabular-nums text-[#087A59] dark:text-[#C6A45C]">
              ({result ? result.quran.total.toLocaleString('id-ID') : 0})
            </span>
          </button>
        )}

        {(sourceFilter === 'all' || sourceFilter === 'hadith') && (
          <button
            type="button"
            onClick={() => setActiveTab('hadith')}
            className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'hadith'
                ? 'border-[#087A59] text-[#064E3B] dark:text-[#E8EFEA] dark:border-[#C6A45C]'
                : 'border-transparent text-[#6B7280] dark:text-[#8CA39A] hover:text-[#1F2937] dark:hover:text-[#E8EFEA]'
            }`}
          >
            <BookMarked className="w-4 h-4" />
            <span>Hadis</span>
            <span className="text-xs tabular-nums text-[#087A59] dark:text-[#C6A45C]">
              ({result ? result.hadith.total.toLocaleString('id-ID') : 0})
            </span>
          </button>
        )}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-6 space-y-4 animate-pulse"
            >
              <div className="h-4 bg-[#EFECE2] dark:bg-[#1C302A] rounded w-1/3" />
              <div className="h-7 bg-[#EFECE2] dark:bg-[#1C302A] rounded w-5/6 ml-auto" />
              <div className="h-4 bg-[#EFECE2] dark:bg-[#1C302A] rounded w-full" />
              <div className="h-4 bg-[#EFECE2] dark:bg-[#1C302A] rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-10 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
          <p className="text-sm text-[#374151] dark:text-[#C5D5CE]">{error}</p>
          <button
            type="button"
            onClick={() => void runSearch({ page })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#087A59] text-white text-xs font-semibold hover:bg-[#064E3B]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Coba Lagi
          </button>
        </div>
      ) : activeTab === 'quran' ? (
        result && result.quran.items.length > 0 ? (
          <div className="space-y-4">
            {result.quran.items.map((v) => (
              <VerseCard
                key={`${v.surahNumber}:${v.ayahNumber}`}
                verse={v}
                onOpenDetail={onOpenQuranDetail}
                onShare={onShare}
                onCreateLinkedNote={onCreateLinkedNote}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-12 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-[#9CA3AF] mx-auto" />
            <h3 className="font-display font-semibold text-base text-[#1F2937] dark:text-[#E8EFEA]">
              Tidak ada ayat Al-Qur&apos;an yang cocok
            </h3>
            <p className="text-sm text-[#5A6572] dark:text-[#93A8A0] max-w-md mx-auto">
              Coba kata kunci lain seperti &ldquo;sabar&rdquo;, &ldquo;doa&rdquo;, &ldquo;shalat&rdquo;, &ldquo;orang tua&rdquo;, atau periksa tab Hadis.
            </p>
          </div>
        )
      ) : result && result.hadith.items.length > 0 ? (
        <div className="space-y-4">
          {result.hadith.items.map((h) => (
            <HadithCard
              key={`${h.bookSlug}:${h.number}`}
              hadith={h}
              onOpenDetail={onOpenHadithDetail}
              onShare={onShare}
              onCreateLinkedNote={onCreateLinkedNote}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-12 text-center space-y-3">
          <BookMarked className="w-8 h-8 text-[#9CA3AF] mx-auto" />
          <h3 className="font-display font-semibold text-base text-[#1F2937] dark:text-[#E8EFEA]">
            Tidak ada hadis yang cocok
          </h3>
          <p className="text-sm text-[#5A6572] dark:text-[#93A8A0] max-w-md mx-auto">
            Coba kata kunci seperti &ldquo;niat&rdquo;, &ldquo;iman&rdquo;, &ldquo;ilmu&rdquo;, &ldquo;wudhu&rdquo;, &ldquo;shalat&rdquo;, atau periksa tab Ayat Al-Qur&apos;an.
          </p>
        </div>
      )}

      {/* Pagination for Active Tab */}
      {currentTabData && currentTabData.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => {
              void runSearch({ page: page - 1 });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E7E5DC] dark:border-[#1E332D] bg-white dark:bg-[#111E1B] text-xs font-semibold disabled:opacity-40 hover:border-[#087A59]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Sebelumnya</span>
          </button>

          <span className="text-xs text-[#5A6572] dark:text-[#93A8A0] tabular-nums">
            Halaman {page} dari {currentTabData.totalPages}
          </span>

          <button
            type="button"
            disabled={page >= currentTabData.totalPages}
            onClick={() => {
              void runSearch({ page: page + 1 });
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
  );
};
