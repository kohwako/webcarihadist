import {
  HadithBookMeta,
  HadithItem,
  QuranVerseItem,
  SurahSummary,
} from '../types/islamic';

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error || `Gagal menghubungi server (${res.status}).`
    );
  }
  return data as T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  matchedBy?: string;
}

export interface DailyFeaturedResponse {
  dateLabel: string;
  dailyVerseTheme: string;
  dailyVerse: QuranVerseItem;
  dailyHadithTheme: string;
  dailyHadith: HadithItem;
}

export interface VerseDetailResponse {
  verse: QuranVerseItem;
  surahInfo: {
    nomor: number;
    namaLatin: string;
    arti: string;
    jumlahAyat: number;
    tempatTurun: string;
  };
  navigation: {
    prev: { surahNumber: number; ayahNumber: number; label: string } | null;
    next: { surahNumber: number; ayahNumber: number; label: string } | null;
  };
}

export interface HadithDetailResponse {
  hadith: HadithItem;
  bookInfo: HadithBookMeta;
  navigation: {
    prev: { bookSlug: string; number: number; label: string } | null;
    next: { bookSlug: string; number: number; label: string } | null;
  };
}

export interface IntegratedSearchResponse {
  query: string;
  category: string;
  source: string;
  sort: string;
  quran: PaginatedResponse<QuranVerseItem>;
  hadith: PaginatedResponse<HadithItem>;
}

export const islamicApi = {
  getFeaturedDaily: () => apiGet<DailyFeaturedResponse>('/api/featured/daily'),

  getSurahs: () => apiGet<{ surahs: SurahSummary[] }>('/api/quran/surahs'),

  getSurahDetail: (nomor: number) =>
    apiGet<{ surah: SurahSummary; verses: QuranVerseItem[] }>(
      `/api/quran/surah/${nomor}`
    ),

  getVerseDetail: (surah: number, ayah: number) =>
    apiGet<VerseDetailResponse>(`/api/quran/verse/${surah}/${ayah}`),

  getSurahTafsir: (nomor: number) =>
    apiGet<{
      surahNumber: number;
      tafsir: Array<{ ayat: number; teks: string }>;
      source: string;
    }>(`/api/quran/tafsir/${nomor}`),

  searchQuran: (params: {
    q?: string;
    surah?: number | '';
    category?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) => {
    const sp = new URLSearchParams();
    if (params.q) sp.set('q', params.q);
    if (params.surah) sp.set('surah', String(params.surah));
    if (params.category) sp.set('category', params.category);
    if (params.sort) sp.set('sort', params.sort);
    if (params.page) sp.set('page', String(params.page));
    if (params.limit) sp.set('limit', String(params.limit));
    return apiGet<PaginatedResponse<QuranVerseItem>>(
      `/api/quran/search?${sp.toString()}`
    );
  },

  getHadithBooks: () => apiGet<{ books: HadithBookMeta[] }>('/api/hadith/books'),

  getHadithDetail: (book: string, number: number) =>
    apiGet<HadithDetailResponse>(
      `/api/hadith/detail/${encodeURIComponent(book)}/${number}`
    ),

  searchHadith: (params: {
    q?: string;
    book?: string;
    perawi?: string;
    category?: string;
    number?: number | '';
    sort?: string;
    page?: number;
    limit?: number;
  }) => {
    const sp = new URLSearchParams();
    if (params.q) sp.set('q', params.q);
    if (params.book) sp.set('book', params.book);
    if (params.perawi) sp.set('perawi', params.perawi);
    if (params.category) sp.set('category', params.category);
    if (params.number) sp.set('number', String(params.number));
    if (params.sort) sp.set('sort', params.sort);
    if (params.page) sp.set('page', String(params.page));
    if (params.limit) sp.set('limit', String(params.limit));
    return apiGet<PaginatedResponse<HadithItem>>(
      `/api/hadith/search?${sp.toString()}`
    );
  },

  searchIntegrated: (params: {
    q?: string;
    source?: 'all' | 'quran' | 'hadith';
    category?: string;
    sort?: 'relevansi' | 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) => {
    const sp = new URLSearchParams();
    if (params.q) sp.set('q', params.q);
    if (params.source) sp.set('source', params.source);
    if (params.category) sp.set('category', params.category);
    if (params.sort) sp.set('sort', params.sort);
    if (params.page) sp.set('page', String(params.page));
    if (params.limit) sp.set('limit', String(params.limit));
    return apiGet<IntegratedSearchResponse>(
      `/api/search/integrated?${sp.toString()}`
    );
  },
};
