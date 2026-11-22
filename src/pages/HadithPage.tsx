import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  BookMarked,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { islamicApi } from '../lib/api';
import { HadithBookMeta, HadithItem, ISLAMIC_CATEGORIES } from '../types/islamic';
import { HadithCard } from '../components/HadithCard';
import { SharePayload } from '../components/ShareModal';

interface HadithPageProps {
  onOpenDetail: (bookSlug: string, number: number) => void;
  onShare: (payload: SharePayload) => void;
  onCreateLinkedNote: (refKey: string, label: string) => void;
}

export const HadithPage: React.FC<HadithPageProps> = ({
  onOpenDetail,
  onShare,
  onCreateLinkedNote,
}) => {
  const { recordSearchHistory } = useApp();

  const [books, setBooks] = useState<HadithBookMeta[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>('bukhari');
  const [queryText, setQueryText] = useState('');
  const [perawiText, setPerawiText] = useState('');
  const [numberText, setNumberText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'relevansi' | 'number_asc' | 'number_desc'>('relevansi');

  const [items, setItems] = useState<HadithItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void islamicApi
      .getHadithBooks()
      .then((res) => setBooks(res.books))
      .catch((err) => console.error('Failed loading hadith books:', err));
  }, []);

  const executeSearch = useCallback(
    async (opts?: {
      q?: string;
      book?: string;
      perawi?: string;
      number?: string;
      category?: string;
      sort?: 'relevansi' | 'number_asc' | 'number_desc';
      page?: number;
      saveHistory?: boolean;
    }) => {
      const q = opts?.q !== undefined ? opts.q : queryText;
      const book = opts?.book !== undefined ? opts.book : selectedBook;
      const perawi = opts?.perawi !== undefined ? opts.perawi : perawiText;
      const numStr = opts?.number !== undefined ? opts.number : numberText;
      const category = opts?.category !== undefined ? opts.category : selectedCategory;
      const sort = opts?.sort !== undefined ? opts.sort : sortBy;
      const targetPage = opts?.page !== undefined ? opts.page : 1;

      setLoading(true);
      setError(null);
      try {
        const parsedNum = numStr.trim() ? Number(numStr.trim()) : '';
        const res = await islamicApi.searchHadith({
          q: q.trim() || undefined,
          book: book || undefined,
          perawi: perawi.trim() || undefined,
          number: typeof parsedNum === 'number' && !Number.isNaN(parsedNum) ? parsedNum : '',
          category: category || undefined,
          sort,
          page: targetPage,
          limit: 10,
        });
        setItems(res.items);
        setTotal(res.total);
        setPage(res.page);
        setTotalPages(res.totalPages);
        if (opts?.saveHistory && q.trim()) {
          void recordSearchHistory(q.trim(), 'hadith');
        }
      } catch (err) {
        setError((err as Error).message || 'Gagal memuat pencarian hadis.');
      } finally {
        setLoading(false);
      }
    },
    [numberText, perawiText, queryText, recordSearchHistory, selectedBook, selectedCategory, sortBy]
  );

  useEffect(() => {
    void executeSearch({ book: 'bukhari', page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void executeSearch({ page: 1, saveHistory: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#064E3B] dark:text-[#E8EFEA]">
          Pencarian Hadis Kutubus Sittah
        </h1>
        <p className="text-sm text-[#5A6572] dark:text-[#93A8A0] mt-1">
          Telusuri hadis berdasarkan kata kunci, tema, nama perawi, kitab rujukan, atau nomor hadis autentik.
        </p>
      </div>

      {/* 6 Kitab Hadis Selector Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => {
            setSelectedBook('');
            void executeSearch({ book: '', page: 1 });
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 border ${
            selectedBook === ''
              ? 'bg-[#087A59] border-[#087A59] text-white'
              : 'bg-white dark:bg-[#111E1B] border-[#E7E5DC] dark:border-[#1E332D] text-[#374151] dark:text-[#C5D5CE] hover:border-[#087A59]'
          }`}
        >
          Semua 6 Kitab
        </button>
        {books.map((book) => (
          <button
            key={book.slug}
            type="button"
            onClick={() => {
              setSelectedBook(book.slug);
              void executeSearch({ book: book.slug, page: 1 });
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 border ${
              selectedBook === book.slug
                ? 'bg-[#087A59] border-[#087A59] text-white'
                : 'bg-white dark:bg-[#111E1B] border-[#E7E5DC] dark:border-[#1E332D] text-[#374151] dark:text-[#C5D5CE] hover:border-[#087A59]'
            }`}
          >
            <span>{book.name}</span>
            <span
              className={`ml-1.5 tabular-nums ${
                selectedBook === book.slug ? 'text-white/80' : 'text-[#6B7280] dark:text-[#8CA39A]'
              }`}
            >
              ({book.total.toLocaleString('id-ID')})
            </span>
          </button>
        ))}
      </div>

      {/* Search & Filter Form */}
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
              placeholder="Cari kata kunci hadis (mis. niat, sabar, shalat, ilmu) atau teks Arab..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#FAF9F5] dark:bg-[#0E1916] border border-[#E7E5DC] dark:border-[#1E332D] text-sm focus:outline-none focus:border-[#087A59]"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#087A59] hover:bg-[#064E3B] text-white text-sm font-semibold transition-colors whitespace-nowrap"
          >
            Cari Hadis
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#5A6572] dark:text-[#93A8A0] mb-1">
              Nama Perawi
            </label>
            <input
              type="text"
              value={perawiText}
              onChange={(e) => setPerawiText(e.target.value)}
              placeholder="Mis. Abu Hurairah, Aisyah, Umar"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#0E1916] border border-[#E7E5DC] dark:border-[#1E332D] text-sm focus:outline-none focus:border-[#087A59]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5A6572] dark:text-[#93A8A0] mb-1">
              Nomor Hadis
            </label>
            <input
              type="number"
              min={1}
              value={numberText}
              onChange={(e) => setNumberText(e.target.value)}
              placeholder="Mis. 1, 50, 6018"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#0E1916] border border-[#E7E5DC] dark:border-[#1E332D] text-sm tabular-nums focus:outline-none focus:border-[#087A59]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5A6572] dark:text-[#93A8A0] mb-1">
              Tema / Kategori
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
              Urutkan
            </label>
            <select
              value={sortBy}
              onChange={(e) => {
                const val = e.target.value as 'relevansi' | 'number_asc' | 'number_desc';
                setSortBy(val);
                void executeSearch({ sort: val, page: 1 });
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#0E1916] border border-[#E7E5DC] dark:border-[#1E332D] text-sm focus:outline-none focus:border-[#087A59]"
            >
              <option value="relevansi">Paling Relevan</option>
              <option value="number_asc">Nomor Terkecil</option>
              <option value="number_desc">Nomor Terbesar</option>
            </select>
          </div>
        </div>
      </form>

      {/* Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5A6572] dark:text-[#93A8A0]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>
            Menampilkan <strong className="text-[#1F2937] dark:text-[#E8EFEA] tabular-nums">{items.length}</strong> dari{' '}
            <strong className="text-[#1F2937] dark:text-[#E8EFEA] tabular-nums">{total.toLocaleString('id-ID')}</strong> hadis
          </span>
        </div>
        {(queryText || perawiText || numberText || selectedCategory) && (
          <button
            type="button"
            onClick={() => {
              setQueryText('');
              setPerawiText('');
              setNumberText('');
              setSelectedCategory('');
              void executeSearch({
                q: '',
                perawi: '',
                number: '',
                category: '',
                page: 1,
              });
            }}
            className="text-[#087A59] dark:text-[#C6A45C] font-semibold hover:underline"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Hadith Results */}
      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-6 space-y-4 animate-pulse"
            >
              <div className="h-4 bg-[#EFECE2] dark:bg-[#1C302A] rounded w-1/3" />
              <div className="h-6 bg-[#EFECE2] dark:bg-[#1C302A] rounded w-full" />
              <div className="h-6 bg-[#EFECE2] dark:bg-[#1C302A] rounded w-5/6 ml-auto" />
              <div className="h-4 bg-[#EFECE2] dark:bg-[#1C302A] rounded w-full" />
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
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-12 text-center space-y-3">
          <BookMarked className="w-8 h-8 text-[#9CA3AF] mx-auto" />
          <h3 className="font-display font-semibold text-base text-[#1F2937] dark:text-[#E8EFEA]">
            Hadis tidak ditemukan
          </h3>
          <p className="text-sm text-[#5A6572] dark:text-[#93A8A0] max-w-md mx-auto">
            Coba perluas ke &ldquo;Semua 6 Kitab&rdquo;, gunakan kata dasar bahasa Indonesia, atau masukkan nomor hadis langsung.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((h) => (
            <HadithCard
              key={`${h.bookSlug}:${h.number}`}
              hadith={h}
              onOpenDetail={onOpenDetail}
              onShare={onShare}
              onCreateLinkedNote={onCreateLinkedNote}
            />
          ))}

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
    </div>
  );
};
