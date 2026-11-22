import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// ============================================================================
// Verifiable Islamic Data Providers & In-Memory Caches
// ============================================================================

interface EquranSurahSummary {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
  tempatTurun: string;
  arti: string;
  deskripsi: string;
  audioFull: Record<string, string>;
}

interface EquranAyah {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
  audio: Record<string, string>;
}

interface EquranSurahDetail extends EquranSurahSummary {
  ayat: EquranAyah[];
}

interface EquranTafsirItem {
  ayat: number;
  teks: string;
}

interface HadithBookConfig {
  slug: string;
  name: string;
  arabicName: string;
  total: number;
  collectionNote: string;
  isSahihain: boolean;
}

interface RawHadithItem {
  number: number;
  arab: string;
  id: string;
}

interface EnrichedHadith {
  bookSlug: string;
  bookName: string;
  number: number;
  arabicText: string;
  translation: string;
  narrator: string | null;
  sanad: string[];
  grade: string | null;
  gradeNote: string;
  source: string;
  relevanceScore?: number;
}

const KUTUBUS_SITTAH: HadithBookConfig[] = [
  {
    slug: 'bukhari',
    name: 'Shahih Bukhari',
    arabicName: 'صحيح البخاري',
    total: 6638,
    collectionNote: 'Disusun oleh Imam Muhammad bin Ismail Al-Bukhari (194–256 H).',
    isSahihain: true,
  },
  {
    slug: 'muslim',
    name: 'Shahih Muslim',
    arabicName: 'صحيح مسلم',
    total: 4930,
    collectionNote: 'Disusun oleh Imam Muslim bin Al-Hajjaj An-Naisaburi (204–261 H).',
    isSahihain: true,
  },
  {
    slug: 'abu-dawud',
    name: 'Sunan Abu Dawud',
    arabicName: 'سنن أبي داود',
    total: 4419,
    collectionNote: 'Disusun oleh Imam Sulaiman bin Al-Asy\'ats Abu Dawud (202–275 H).',
    isSahihain: false,
  },
  {
    slug: 'tirmidzi',
    name: "Jami' At-Tirmidzi",
    arabicName: 'جامع الترمذي',
    total: 3625,
    collectionNote: 'Disusun oleh Imam Muhammad bin Isa At-Tirmidzi (209–279 H).',
    isSahihain: false,
  },
  {
    slug: 'nasai',
    name: "Sunan An-Nasa'i",
    arabicName: 'سنن النسائي',
    total: 5364,
    collectionNote: 'Disusun oleh Imam Ahmad bin Syu\'aib An-Nasa\'i (215–303 H).',
    isSahihain: false,
  },
  {
    slug: 'ibnu-majah',
    name: 'Sunan Ibnu Majah',
    arabicName: 'سنن ابن ماجه',
    total: 4285,
    collectionNote: 'Disusun oleh Imam Muhammad bin Yazid Ibnu Majah (209–273 H).',
    isSahihain: false,
  },
];

const BOOK_MAP = new Map<string, HadithBookConfig>(
  KUTUBUS_SITTAH.map((b) => [b.slug, b])
);

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  doa: ['doa', 'berdoa', 'ampun', 'rahmat', 'ya tuhan', 'mohon'],
  dzikir: ['dzikir', 'zikir', 'ingat', 'tasbih', 'bertasbih', 'istighfar'],
  akhlak: ['akhlak', 'jujur', 'amanah', 'kasih sayang', 'lembut', 'malu', 'baik'],
  keluarga: ['keluarga', 'orang tua', 'ibu', 'istri', 'suami', 'anak', 'nikah'],
  pendidikan: ['ilmu', 'belajar', 'mengajar', 'ulama', 'hikmah', 'pengetahuan'],
  rezeki: ['rezeki', 'sedekah', 'zakat', 'nafkah', 'harta', 'infak'],
  kesabaran: ['sabar', 'bersabar', 'kesabaran', 'ujian', 'cobaan'],
  ibadah: ['shalat', 'salat', 'puasa', 'wudhu', 'haji', 'ibadah', 'sujud'],
  muamalah: ['jual', 'beli', 'utang', 'riba', 'adil', 'tetangga', 'dagang'],
  'kisah-nabi': ['musa', 'ibrahim', 'yusuf', 'nuh', 'isa', 'sulaiman', 'adam'],
};

// In-memory caches to keep latency snappy and respect upstream rate limits
let surahsCache: EquranSurahSummary[] | null = null;
const surahDetailCache = new Map<number, EquranSurahDetail>();
const tafsirCache = new Map<number, Map<number, string>>();
const hadithSingleCache = new Map<string, EnrichedHadith>();
const hadithBookPoolCache = new Map<string, EnrichedHadith[]>();
const hadithPoolPromises = new Map<string, Promise<EnrichedHadith[]>>();

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 10000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'QuranHadisIntegratedSearch/1.0',
      },
    });
    if (!res.ok) {
      throw new Error(`Upstream HTTP ${res.status} for ${url}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function getSurahsList(): Promise<EquranSurahSummary[]> {
  if (surahsCache) return surahsCache;
  const payload = await fetchJsonWithTimeout<{ data: EquranSurahSummary[] }>(
    'https://equran.id/api/v2/surat'
  );
  if (!payload?.data || !Array.isArray(payload.data)) {
    throw new Error('Gagal memuat daftar surah dari EQuran.id');
  }
  surahsCache = payload.data;
  return surahsCache;
}

async function getSurahDetail(nomor: number): Promise<EquranSurahDetail> {
  const cached = surahDetailCache.get(nomor);
  if (cached) return cached;
  const payload = await fetchJsonWithTimeout<{ data: EquranSurahDetail }>(
    `https://equran.id/api/v2/surat/${nomor}`
  );
  if (!payload?.data) {
    throw new Error(`Surah nomor ${nomor} tidak ditemukan.`);
  }
  surahDetailCache.set(nomor, payload.data);
  return payload.data;
}

async function getSurahTafsir(nomor: number): Promise<Map<number, string>> {
  const cached = tafsirCache.get(nomor);
  if (cached) return cached;
  const payload = await fetchJsonWithTimeout<{
    data: { tafsir: EquranTafsirItem[] };
  }>(`https://equran.id/api/v2/tafsir/${nomor}`);
  const map = new Map<number, string>();
  if (payload?.data?.tafsir) {
    for (const item of payload.data.tafsir) {
      map.set(item.ayat, item.teks);
    }
  }
  tafsirCache.set(nomor, map);
  return map;
}

function formatQuranVerse(surah: EquranSurahDetail, ayah: EquranAyah, tafsir?: string, relevanceScore?: number) {
  return {
    surahNumber: surah.nomor,
    surahName: surah.namaLatin,
    surahArabicName: surah.nama,
    revelationType: surah.tempatTurun,
    ayahNumber: ayah.nomorAyat,
    arabicText: ayah.teksArab,
    transliteration: ayah.teksLatin.trim(),
    translation: ayah.teksIndonesia.trim(),
    audio: ayah.audio || {},
    ...(tafsir ? { tafsir } : {}),
    source: 'Kementerian Agama RI (EQuran.id)',
    ...(typeof relevanceScore === 'number' ? { relevanceScore } : {}),
  };
}

/**
 * Extract verbatim narrator chain (Sanad) from bracketed names in authentic Indonesian hadith text.
 * Never fabricates names or degrees.
 */
function parseSanadAndNarrator(translation: string): {
  narrator: string | null;
  sanad: string[];
} {
  const matches = [...translation.matchAll(/\[([^\]]{2,80})\]/g)];
  const rawNames = matches.map((m) => m[1].trim()).filter(Boolean);
  // Preserve chronological sanad order while removing accidental exact adjacent duplicates
  const sanad: string[] = [];
  for (const name of rawNames) {
    if (sanad[sanad.length - 1] !== name) {
      sanad.push(name);
    }
  }
  // Typically the final bracketed narrator right before Rasulullah SAW is the Sahabat primary perawi
  const narrator = sanad.length > 0 ? sanad[sanad.length - 1] : null;
  return { narrator, sanad };
}

function enrichHadith(bookSlug: string, raw: RawHadithItem): EnrichedHadith {
  const book = BOOK_MAP.get(bookSlug) || {
    slug: bookSlug,
    name: bookSlug,
    arabicName: '',
    total: 0,
    collectionNote: '',
    isSahihain: false,
  };
  const { narrator, sanad } = parseSanadAndNarrator(raw.id || '');
  return {
    bookSlug: book.slug,
    bookName: book.name,
    number: raw.number,
    arabicText: (raw.arab || '').trim(),
    translation: (raw.id || '').trim(),
    narrator,
    sanad,
    grade: book.isSahihain ? `Shahih (${book.name})` : null,
    gradeNote: book.isSahihain
      ? `Termuat dalam kitab ${book.name} (Ash-Shahihain).`
      : 'Status derajat per hadis tidak tercantum pada sumber API ini; rujuk kitab tahqiq hadis terkait.',
    source: `Kitab ${book.name} No. ${raw.number} (Hadis API Indonesia)`,
  };
}

async function fetchSingleHadith(bookSlug: string, num: number): Promise<EnrichedHadith | null> {
  const key = `${bookSlug}:${num}`;
  const cached = hadithSingleCache.get(key);
  if (cached) return cached;

  try {
    const data = await fetchJsonWithTimeout<{
      number: number;
      arab: string;
      id: string;
    }>(`https://hadis-api-id.vercel.app/hadith/${bookSlug}/${num}`, 8000);
    if (data && data.arab && data.id) {
      const enriched = enrichHadith(bookSlug, data);
      hadithSingleCache.set(key, enriched);
      return enriched;
    }
  } catch {
    // Try secondary verifiable mirror (MyQuran API v2)
    try {
      const fallback = await fetchJsonWithTimeout<{
        status: boolean;
        data?: { number: number; arab: string; id: string };
      }>(`https://api.myquran.com/v2/hadits/${bookSlug}/${num}`, 8000);
      if (fallback?.status && fallback.data?.arab && fallback.data?.id) {
        const enriched = enrichHadith(bookSlug, fallback.data);
        hadithSingleCache.set(key, enriched);
        return enriched;
      }
    } catch {
      return null;
    }
  }
  return null;
}

async function loadHadithBookPool(bookSlug: string): Promise<EnrichedHadith[]> {
  const cached = hadithBookPoolCache.get(bookSlug);
  if (cached) return cached;

  const existingPromise = hadithPoolPromises.get(bookSlug);
  if (existingPromise) return existingPromise;

  const promise = (async () => {
    // Fetch 3 authentic batches (300 real hadiths per kitab) from different sections of the book
    // so thematic searches (niat, iman, ilmu, wudhu, shalat, doa, akhlak, sabar, muamalah) yield rich verified hits
    const book = BOOK_MAP.get(bookSlug);
    const maxPage = book ? Math.max(1, Math.floor(book.total / 100)) : 20;
    const pagesToFetch = [
      1,
      Math.min(Math.max(2, Math.floor(maxPage * 0.35)), maxPage),
      Math.min(Math.max(3, Math.floor(maxPage * 0.7)), maxPage),
    ];
    const uniquePages = [...new Set(pagesToFetch)];

    const results = await Promise.allSettled(
      uniquePages.map((p) =>
        fetchJsonWithTimeout<{ items?: RawHadithItem[] }>(
          `https://hadis-api-id.vercel.app/hadith/${bookSlug}?page=${p}&limit=100`,
          9000
        )
      )
    );

    const seenNumbers = new Set<number>();
    const pool: EnrichedHadith[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled' && Array.isArray(r.value.items)) {
        for (const item of r.value.items) {
          if (item && typeof item.number === 'number' && !seenNumbers.has(item.number)) {
            seenNumbers.add(item.number);
            const enriched = enrichHadith(bookSlug, item);
            pool.push(enriched);
            hadithSingleCache.set(`${bookSlug}:${item.number}`, enriched);
          }
        }
      }
    }

    if (pool.length > 0) {
      hadithBookPoolCache.set(bookSlug, pool);
    }
    hadithPoolPromises.delete(bookSlug);
    return pool;
  })();

  hadithPoolPromises.set(bookSlug, promise);
  return promise;
}

function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim();
}

function hasArabicChars(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

// ============================================================================
// Core Search Functions (Shared by Quran, Hadith, and Integrated Routes)
// ============================================================================

async function searchQuranCore(params: {
  q?: string;
  surah?: number;
  category?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) {
  const qRaw = (params.q || '').trim();
  const category = (params.category || '').trim().toLowerCase();
  const surahFilter = params.surah && !Number.isNaN(params.surah) ? params.surah : undefined;
  const sort = params.sort || 'relevansi';
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(30, Math.max(1, params.limit || 12));

  const surahs = await getSurahsList();

  // Case 1: Specific Surah:Ayah reference like "2:153", "QS 2:255", or "Al-Baqarah 153"
  const refMatch = qRaw.match(/^(?:qs\.?\s*)?(\d{1,3})\s*[:./-]\s*(\d{1,3})$/i);
  if (refMatch) {
    const sNum = Number(refMatch[1]);
    const aNum = Number(refMatch[2]);
    if (sNum >= 1 && sNum <= 114) {
      const detail = await getSurahDetail(sNum);
      const ayah = detail.ayat.find((a) => a.nomorAyat === aNum);
      if (ayah) {
        return {
          items: [formatQuranVerse(detail, ayah, undefined, 100)],
          total: 1,
          page: 1,
          totalPages: 1,
          matchedBy: 'reference',
        };
      }
    }
  }

  // Case 2: Surah name + optional ayah number (e.g. "Al-Baqarah 153" or "Yasin")
  if (qRaw && !hasArabicChars(qRaw)) {
    const cleanQ = qRaw.toLowerCase().replace(/^surat?\s+|^qs\.?\s+/i, '').trim();
    const nameWithAyah = cleanQ.match(/^([a-z'\-\s]+?)\s+(\d{1,3})$/i);
    const candidateName = nameWithAyah ? nameWithAyah[1].trim() : cleanQ;
    const candidateAyah = nameWithAyah ? Number(nameWithAyah[2]) : null;

    const matchedSurah = surahs.find((s) => {
      const latin = s.namaLatin.toLowerCase();
      const plain = latin.replace(/['-\s]/g, '');
      const candPlain = candidateName.replace(/['-\s]/g, '');
      return (
        latin === candidateName ||
        plain === candPlain ||
        (candPlain.length >= 4 && plain.includes(candPlain))
      );
    });

    if (matchedSurah && (!surahFilter || surahFilter === matchedSurah.nomor)) {
      const detail = await getSurahDetail(matchedSurah.nomor);
      if (candidateAyah) {
        const found = detail.ayat.find((a) => a.nomorAyat === candidateAyah);
        if (found) {
          return {
            items: [formatQuranVerse(detail, found, undefined, 100)],
            total: 1,
            page: 1,
            totalPages: 1,
            matchedBy: 'surah-ayah',
          };
        }
      } else if (!category) {
        const total = detail.ayat.length;
        const start = (page - 1) * limit;
        const slice = detail.ayat.slice(start, start + limit);
        return {
          items: slice.map((a) => formatQuranVerse(detail, a, undefined, 95)),
          total,
          page,
          totalPages: Math.max(1, Math.ceil(total / limit)),
          matchedBy: 'surah-name',
        };
      }
    }
  }

  // Case 3: Pure surah filter without search keyword or category
  if (surahFilter && !qRaw && !category) {
    const detail = await getSurahDetail(surahFilter);
    const ordered = sort === 'surah_desc' ? [...detail.ayat].reverse() : detail.ayat;
    const total = ordered.length;
    const start = (page - 1) * limit;
    const slice = ordered.slice(start, start + limit);
    return {
      items: slice.map((a) => formatQuranVerse(detail, a, undefined, 90)),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      matchedBy: 'surah-browse',
    };
  }

  // Case 4: Full-text search via AlQuran.cloud (Indonesian or Arabic) + category keyword expansion
  const searchTerms: string[] = [];
  if (qRaw) {
    searchTerms.push(qRaw);
    // If query matches a known category label, also search its core Indonesian root
    const matchedCatKey = Object.keys(CATEGORY_KEYWORDS).find(
      (k) => k === qRaw.toLowerCase() || k.replace('-', ' ') === qRaw.toLowerCase()
    );
    if (matchedCatKey) {
      searchTerms.push(...CATEGORY_KEYWORDS[matchedCatKey].slice(0, 2));
    }
  }
  if (category && CATEGORY_KEYWORDS[category]) {
    searchTerms.push(...CATEGORY_KEYWORDS[category].slice(0, 3));
  }

  const uniqueTerms = [...new Set(searchTerms.filter(Boolean))];
  if (uniqueTerms.length === 0) {
    // Default browse: Al-Fatihah + opening of Al-Baqarah
    const detail = await getSurahDetail(1);
    return {
      items: detail.ayat.map((a) => formatQuranVerse(detail, a, undefined, 80)),
      total: detail.ayat.length,
      page: 1,
      totalPages: 1,
      matchedBy: 'default',
    };
  }

  type CloudMatch = {
    surah: { number: number; englishName: string; name: string; revelationType: string };
    numberInSurah: number;
    text: string;
  };

  const matchMap = new Map<string, { surahNum: number; ayahNum: number; score: number }>();

  await Promise.all(
    uniqueTerms.map(async (term, idx) => {
      const edition = hasArabicChars(term) ? 'quran-simple-clean' : 'id.indonesian';
      const cleanedTerm = hasArabicChars(term) ? normalizeArabic(term) : term;
      const scope = surahFilter ? String(surahFilter) : 'all';
      const url = `https://api.alquran.cloud/v1/search/${encodeURIComponent(cleanedTerm)}/${scope}/${edition}`;
      try {
        const res = await fetchJsonWithTimeout<{
          code: number;
          data?: { count: number; matches: CloudMatch[] };
        }>(url, 8000);
        const matches = res?.data?.matches || [];
        for (const m of matches) {
          const key = `${m.surah.number}:${m.numberInSurah}`;
          const baseScore = idx === 0 ? 100 : 75;
          const exactBonus =
            m.text.toLowerCase().includes(term.toLowerCase()) ? 15 : 0;
          const prev = matchMap.get(key);
          if (!prev) {
            matchMap.set(key, {
              surahNum: m.surah.number,
              ayahNum: m.numberInSurah,
              score: baseScore + exactBonus,
            });
          } else {
            prev.score += 20;
          }
        }
      } catch {
        // Ignore individual upstream search misses (e.g., 404 when no matches)
      }
    })
  );

  // If user searched Indonesian multi-word phrase and got 0 hits, retry with individual words (>= 4 chars)
  if (matchMap.size === 0 && qRaw.includes(' ')) {
    const words = qRaw
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 4)
      .slice(0, 3);
    await Promise.all(
      words.map(async (word) => {
        const edition = hasArabicChars(word) ? 'quran-simple-clean' : 'id.indonesian';
        const scope = surahFilter ? String(surahFilter) : 'all';
        const url = `https://api.alquran.cloud/v1/search/${encodeURIComponent(word)}/${scope}/${edition}`;
        try {
          const res = await fetchJsonWithTimeout<{
            data?: { matches: CloudMatch[] };
          }>(url, 8000);
          for (const m of res?.data?.matches || []) {
            const key = `${m.surah.number}:${m.numberInSurah}`;
            const prev = matchMap.get(key);
            if (!prev) {
              matchMap.set(key, {
                surahNum: m.surah.number,
                ayahNum: m.numberInSurah,
                score: 70,
              });
            } else {
              prev.score += 25;
            }
          }
        } catch {
          // Ignore 404
        }
      })
    );
  }

  let ranked = Array.from(matchMap.values());
  if (sort === 'surah_asc') {
    ranked.sort((a, b) => a.surahNum - b.surahNum || a.ayahNum - b.ayahNum);
  } else if (sort === 'surah_desc') {
    ranked.sort((a, b) => b.surahNum - a.surahNum || b.ayahNum - a.ayahNum);
  } else {
    ranked.sort((a, b) => b.score - a.score || a.surahNum - b.surahNum || a.ayahNum - b.ayahNum);
  }

  const total = ranked.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const pageItems = ranked.slice(start, start + limit);

  // Fetch EQuran.id surah details for unique surahs on the current page (cached)
  const uniqueSurahNums = [...new Set(pageItems.map((i) => i.surahNum))];
  await Promise.allSettled(uniqueSurahNums.map((n) => getSurahDetail(n)));

  const items = [];
  for (const entry of pageItems) {
    const detail = surahDetailCache.get(entry.surahNum);
    if (!detail) continue;
    const ayah = detail.ayat.find((a) => a.nomorAyat === entry.ayahNum);
    if (!ayah) continue;
    items.push(formatQuranVerse(detail, ayah, undefined, entry.score));
  }

  return {
    items,
    total,
    page,
    totalPages,
    matchedBy: 'full-text',
  };
}

async function searchHadithCore(params: {
  q?: string;
  book?: string;
  perawi?: string;
  category?: string;
  number?: number;
  sort?: string;
  page?: number;
  limit?: number;
}) {
  const qRaw = (params.q || '').trim();
  const bookFilter = (params.book || '').trim().toLowerCase();
  const perawiFilter = (params.perawi || '').trim().toLowerCase();
  const category = (params.category || '').trim().toLowerCase();
  const explicitNumber =
    params.number && !Number.isNaN(params.number) && params.number > 0
      ? params.number
      : undefined;
  const sort = params.sort || 'relevansi';
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(30, Math.max(1, params.limit || 12));

  const targetBooks =
    bookFilter && BOOK_MAP.has(bookFilter)
      ? [bookFilter]
      : KUTUBUS_SITTAH.map((b) => b.slug);

  // Case 1: Direct number lookup (explicit `number` param OR query like "bukhari 1" / "muslim 2999" / "15")
  const bookNumMatch = qRaw.match(
    /^(?:hr\.?\s*|shahih\s+|sunan\s+|jami'?\s+)?(bukhari|muslim|abu[\s-]?dawud|tirmidzi|nasai|ibnu[\s-]?majah)\s*(?:no\.?\s*|#)?(\d+)$/i
  );
  const pureNumMatch = qRaw.match(/^#?(\d{1,5})$/);
  const lookupNumber =
    explicitNumber ||
    (bookNumMatch ? Number(bookNumMatch[2]) : undefined) ||
    (pureNumMatch ? Number(pureNumMatch[1]) : undefined);

  if (lookupNumber) {
    let lookupBooks = targetBooks;
    if (bookNumMatch) {
      const rawSlug = bookNumMatch[1].toLowerCase().replace(/\s+/g, '-');
      if (BOOK_MAP.has(rawSlug)) {
        lookupBooks = [rawSlug];
      }
    }
    const fetched = await Promise.all(
      lookupBooks.map((b) => fetchSingleHadith(b, lookupNumber))
    );
    const valid = fetched.filter((h): h is EnrichedHadith => h !== null);
    return {
      items: valid.map((h) => ({ ...h, relevanceScore: 100 })),
      total: valid.length,
      page: 1,
      totalPages: 1,
      matchedBy: 'number',
    };
  }

  // Case 2: Browsing a specific kitab with no keyword/perawi/category -> live paginated upstream fetch across all 29,261 hadiths!
  if (!qRaw && !perawiFilter && !category && targetBooks.length === 1) {
    const slug = targetBooks[0];
    const data = await fetchJsonWithTimeout<{
      total: number;
      items?: RawHadithItem[];
    }>(
      `https://hadis-api-id.vercel.app/hadith/${slug}?page=${page}&limit=${limit}`,
      9000
    );
    const items = (data.items || []).map((item) => {
      const enriched = enrichHadith(slug, item);
      hadithSingleCache.set(`${slug}:${item.number}`, enriched);
      return enriched;
    });
    const total = data.total || items.length;
    return {
      items,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      matchedBy: 'kitab-browse',
    };
  }

  // Case 3: Full-text / Perawi / Thematic search across cached live Kutubus Sittah pools
  const pools = await Promise.all(targetBooks.map((slug) => loadHadithBookPool(slug)));
  const allHadiths = pools.flat();

  const keywords: string[] = [];
  if (qRaw) {
    keywords.push(qRaw);
    const matchedCatKey = Object.keys(CATEGORY_KEYWORDS).find(
      (k) => k === qRaw.toLowerCase() || k.replace('-', ' ') === qRaw.toLowerCase()
    );
    if (matchedCatKey) {
      keywords.push(...CATEGORY_KEYWORDS[matchedCatKey]);
    }
    if (qRaw.includes(' ')) {
      keywords.push(
        ...qRaw
          .split(/\s+/)
          .map((w) => w.trim())
          .filter((w) => w.length >= 3)
      );
    }
  }
  if (category && CATEGORY_KEYWORDS[category]) {
    keywords.push(...CATEGORY_KEYWORDS[category]);
  }
  const uniqueKeywords = [...new Set(keywords.map((k) => k.toLowerCase()))];
  const isArabicQuery = hasArabicChars(qRaw);
  const normArabicQ = isArabicQuery ? normalizeArabic(qRaw) : '';

  const scored: Array<EnrichedHadith & { relevanceScore: number }> = [];

  for (const h of allHadiths) {
    // Filter by Perawi if specified
    if (perawiFilter) {
      const sanadStr = h.sanad.join(' ').toLowerCase();
      const narratorStr = (h.narrator || '').toLowerCase();
      if (!sanadStr.includes(perawiFilter) && !narratorStr.includes(perawiFilter)) {
        continue;
      }
    }

    if (uniqueKeywords.length === 0) {
      scored.push({ ...h, relevanceScore: 80 });
      continue;
    }

    let score = 0;
    const transLower = h.translation.toLowerCase();
    const bookLower = h.bookName.toLowerCase();
    const sanadLower = h.sanad.join(' ').toLowerCase();

    if (isArabicQuery) {
      if (normalizeArabic(h.arabicText).includes(normArabicQ)) {
        score += 100;
      }
    } else {
      if (qRaw && transLower.includes(qRaw.toLowerCase())) {
        score += 90;
      }
      if (qRaw && sanadLower.includes(qRaw.toLowerCase())) {
        score += 75;
      }
      if (qRaw && bookLower.includes(qRaw.toLowerCase())) {
        score += 40;
      }
      for (const kw of uniqueKeywords) {
        if (transLower.includes(kw)) {
          score += 25;
        }
        if (sanadLower.includes(kw)) {
          score += 15;
        }
      }
    }

    if (score > 0) {
      // Slight preference for Shahih Bukhari & Muslim on equal textual relevance
      if (h.bookSlug === 'bukhari' || h.bookSlug === 'muslim') {
        score += 5;
      }
      scored.push({ ...h, relevanceScore: score });
    }
  }

  if (sort === 'number_asc') {
    scored.sort((a, b) => a.number - b.number || a.bookName.localeCompare(b.bookName));
  } else if (sort === 'number_desc') {
    scored.sort((a, b) => b.number - a.number || a.bookName.localeCompare(b.bookName));
  } else {
    scored.sort((a, b) => b.relevanceScore - a.relevanceScore || a.number - b.number);
  }

  const total = scored.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const items = scored.slice(start, start + limit);

  return {
    items,
    total,
    page,
    totalPages,
    matchedBy: 'full-text',
  };
}

// ============================================================================
// REST API Routes
// ============================================================================

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/quran/surahs', async (_req, res) => {
  try {
    const surahs = await getSurahsList();
    res.json({ surahs });
  } catch (err) {
    console.error('Error fetching surahs:', err);
    res.status(502).json({ error: 'Gagal memuat daftar surah Al-Qur\'an.' });
  }
});

app.get('/api/quran/surah/:nomor', async (req, res) => {
  const nomor = Number(req.params.nomor);
  if (!Number.isInteger(nomor) || nomor < 1 || nomor > 114) {
    return res.status(400).json({ error: 'Nomor surah harus antara 1 hingga 114.' });
  }
  try {
    const detail = await getSurahDetail(nomor);
    res.json({
      surah: {
        nomor: detail.nomor,
        nama: detail.nama,
        namaLatin: detail.namaLatin,
        jumlahAyat: detail.jumlahAyat,
        tempatTurun: detail.tempatTurun,
        arti: detail.arti,
        deskripsi: detail.deskripsi,
        audioFull: detail.audioFull,
      },
      verses: detail.ayat.map((a) => formatQuranVerse(detail, a)),
    });
  } catch (err) {
    console.error(`Error fetching surah ${nomor}:`, err);
    res.status(502).json({ error: 'Gagal memuat isi surah dari sumber Al-Qur\'an.' });
  }
});

app.get('/api/quran/tafsir/:nomor', async (req, res) => {
  const nomor = Number(req.params.nomor);
  if (!Number.isInteger(nomor) || nomor < 1 || nomor > 114) {
    return res.status(400).json({ error: 'Nomor surah tidak valid.' });
  }
  try {
    const tafsirMap = await getSurahTafsir(nomor);
    const items = Array.from(tafsirMap.entries()).map(([ayat, teks]) => ({ ayat, teks }));
    res.json({ surahNumber: nomor, tafsir: items, source: 'Tafsir Kementerian Agama RI (EQuran.id)' });
  } catch (err) {
    console.error(`Error fetching tafsir ${nomor}:`, err);
    res.status(502).json({ error: 'Gagal memuat tafsir Kemenag RI.' });
  }
});

app.get('/api/quran/verse/:surah/:ayah', async (req, res) => {
  const surahNum = Number(req.params.surah);
  const ayahNum = Number(req.params.ayah);
  if (!Number.isInteger(surahNum) || surahNum < 1 || surahNum > 114) {
    return res.status(400).json({ error: 'Nomor surah tidak valid.' });
  }
  try {
    const [detail, tafsirMap, surahs] = await Promise.all([
      getSurahDetail(surahNum),
      getSurahTafsir(surahNum).catch(() => new Map<number, string>()),
      getSurahsList(),
    ]);
    const ayah = detail.ayat.find((a) => a.nomorAyat === ayahNum);
    if (!ayah) {
      return res.status(404).json({ error: `Ayat ${ayahNum} tidak ditemukan pada surah ${detail.namaLatin}.` });
    }

    // Compute previous and next verse coordinates
    let prev: { surahNumber: number; ayahNumber: number; label: string } | null = null;
    let next: { surahNumber: number; ayahNumber: number; label: string } | null = null;

    if (ayahNum > 1) {
      prev = { surahNumber: surahNum, ayahNumber: ayahNum - 1, label: `${detail.namaLatin}: ${ayahNum - 1}` };
    } else if (surahNum > 1) {
      const prevSurah = surahs.find((s) => s.nomor === surahNum - 1);
      if (prevSurah) {
        prev = {
          surahNumber: prevSurah.nomor,
          ayahNumber: prevSurah.jumlahAyat,
          label: `${prevSurah.namaLatin}: ${prevSurah.jumlahAyat}`,
        };
      }
    }

    if (ayahNum < detail.jumlahAyat) {
      next = { surahNumber: surahNum, ayahNumber: ayahNum + 1, label: `${detail.namaLatin}: ${ayahNum + 1}` };
    } else if (surahNum < 114) {
      const nextSurah = surahs.find((s) => s.nomor === surahNum + 1);
      if (nextSurah) {
        next = {
          surahNumber: nextSurah.nomor,
          ayahNumber: 1,
          label: `${nextSurah.namaLatin}: 1`,
        };
      }
    }

    res.json({
      verse: formatQuranVerse(detail, ayah, tafsirMap.get(ayahNum)),
      surahInfo: {
        nomor: detail.nomor,
        namaLatin: detail.namaLatin,
        arti: detail.arti,
        jumlahAyat: detail.jumlahAyat,
        tempatTurun: detail.tempatTurun,
      },
      navigation: { prev, next },
    });
  } catch (err) {
    console.error(`Error fetching verse ${surahNum}:${ayahNum}:`, err);
    res.status(502).json({ error: 'Gagal memuat detail ayat Al-Qur\'an.' });
  }
});

app.get('/api/quran/search', async (req, res) => {
  try {
    const result = await searchQuranCore({
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
      surah: req.query.surah ? Number(req.query.surah) : undefined,
      category: typeof req.query.category === 'string' ? req.query.category : undefined,
      sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 12,
    });
    res.json(result);
  } catch (err) {
    console.error('Error searching Quran:', err);
    res.status(502).json({ error: 'Pencarian Al-Qur\'an sedang mengalami gangguan. Silakan coba lagi.' });
  }
});

app.get('/api/hadith/books', (_req, res) => {
  res.json({
    books: KUTUBUS_SITTAH.map(({ isSahihain: _omit, ...rest }) => rest),
  });
});

app.get('/api/hadith/detail/:book/:number', async (req, res) => {
  const bookSlug = req.params.book.toLowerCase();
  const num = Number(req.params.number);
  const book = BOOK_MAP.get(bookSlug);
  if (!book) {
    return res.status(400).json({ error: 'Kitab hadis tidak dikenal.' });
  }
  if (!Number.isInteger(num) || num < 1 || num > book.total) {
    return res.status(400).json({ error: `Nomor hadis untuk ${book.name} harus antara 1 hingga ${book.total}.` });
  }

  try {
    const hadith = await fetchSingleHadith(bookSlug, num);
    if (!hadith) {
      return res.status(404).json({ error: `Hadis ${book.name} No. ${num} tidak ditemukan pada sumber.` });
    }

    res.json({
      hadith,
      bookInfo: {
        slug: book.slug,
        name: book.name,
        arabicName: book.arabicName,
        total: book.total,
        collectionNote: book.collectionNote,
      },
      navigation: {
        prev: num > 1 ? { bookSlug, number: num - 1, label: `${book.name} No. ${num - 1}` } : null,
        next: num < book.total ? { bookSlug, number: num + 1, label: `${book.name} No. ${num + 1}` } : null,
      },
    });
  } catch (err) {
    console.error(`Error fetching hadith ${bookSlug}:${num}:`, err);
    res.status(502).json({ error: 'Gagal memuat detail hadis dari sumber.' });
  }
});

app.get('/api/hadith/search', async (req, res) => {
  try {
    const result = await searchHadithCore({
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
      book: typeof req.query.book === 'string' ? req.query.book : undefined,
      perawi: typeof req.query.perawi === 'string' ? req.query.perawi : undefined,
      category: typeof req.query.category === 'string' ? req.query.category : undefined,
      number: req.query.number ? Number(req.query.number) : undefined,
      sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 12,
    });
    res.json(result);
  } catch (err) {
    console.error('Error searching Hadith:', err);
    res.status(502).json({ error: 'Pencarian hadis sedang mengalami gangguan. Silakan coba lagi.' });
  }
});

app.get('/api/search/integrated', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  const source = typeof req.query.source === 'string' ? req.query.source : 'all';
  const category = typeof req.query.category === 'string' ? req.query.category : '';
  const sort = typeof req.query.sort === 'string' ? req.query.sort : 'relevansi';
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 10;

  try {
    const quranSort = sort === 'asc' ? 'surah_asc' : sort === 'desc' ? 'surah_desc' : 'relevansi';
    const hadithSort = sort === 'asc' ? 'number_asc' : sort === 'desc' ? 'number_desc' : 'relevansi';

    const [quranRes, hadithRes] = await Promise.all([
      source === 'hadith'
        ? Promise.resolve({ items: [], total: 0, page: 1, totalPages: 1, matchedBy: 'skipped' })
        : searchQuranCore({ q, category, sort: quranSort, page, limit }),
      source === 'quran'
        ? Promise.resolve({ items: [], total: 0, page: 1, totalPages: 1, matchedBy: 'skipped' })
        : searchHadithCore({ q, category, sort: hadithSort, page, limit }),
    ]);

    res.json({
      query: q,
      category,
      source,
      sort,
      quran: quranRes,
      hadith: hadithRes,
    });
  } catch (err) {
    console.error('Error in integrated search:', err);
    res.status(502).json({ error: 'Pencarian terintegrasi sedang mengalami kendala. Silakan coba lagi.' });
  }
});

// Deterministic verified daily Ayat & Hadith rotation
const DAILY_VERSES: Array<{ surah: number; ayah: number; theme: string }> = [
  { surah: 2, ayah: 153, theme: 'Kesabaran & Shalat' },
  { surah: 94, ayah: 5, theme: 'Kemudahan Bersama Kesulitan' },
  { surah: 13, ayah: 28, theme: 'Ketenangan Hati dengan Dzikir' },
  { surah: 3, ayah: 139, theme: 'Keteguhan Iman' },
  { surah: 14, ayah: 7, theme: 'Keutamaan Syukur' },
  { surah: 2, ayah: 286, theme: 'Doa & Rahmat Allah' },
  { surah: 65, ayah: 3, theme: 'Tawakal & Rezeki' },
];

const DAILY_HADITHS: Array<{ book: string; number: number; theme: string }> = [
  { book: 'bukhari', number: 1, theme: 'Keikhlasan Niat' },
  { book: 'bukhari', number: 13, theme: 'Kasih Sayang Sesama' },
  { book: 'bukhari', number: 50, theme: 'Iman, Islam & Ihsan' },
  { book: 'muslim', number: 1, theme: 'Hakikat Iman' },
  { book: 'bukhari', number: 71, theme: 'Keutamaan Ilmu' },
  { book: 'bukhari', number: 6018, theme: 'Menjaga Lisan & Memuliakan Tamu' },
  { book: 'muslim', number: 5318, theme: 'Kesabaran & Syukur Orang Beriman' },
];

app.get('/api/featured/daily', async (_req, res) => {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const vPick = DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
  const hPick = DAILY_HADITHS[dayOfYear % DAILY_HADITHS.length];

  try {
    const [surahDetail, tafsirMap, hadith] = await Promise.all([
      getSurahDetail(vPick.surah),
      getSurahTafsir(vPick.surah).catch(() => new Map<number, string>()),
      fetchSingleHadith(hPick.book, hPick.number),
    ]);

    const ayah = surahDetail.ayat.find((a) => a.nomorAyat === vPick.ayah) || surahDetail.ayat[0];
    // Fallback to Bukhari #1 if a rotated number happens to differ in numbering
    const resolvedHadith = hadith || (await fetchSingleHadith('bukhari', 1));

    res.json({
      dateLabel: now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      dailyVerseTheme: vPick.theme,
      dailyVerse: formatQuranVerse(surahDetail, ayah, tafsirMap.get(ayah.nomorAyat)),
      dailyHadithTheme: hPick.theme,
      dailyHadith: resolvedHadith,
    });
  } catch (err) {
    console.error('Error loading daily featured content:', err);
    res.status(502).json({ error: 'Gagal memuat ayat dan hadis pilihan harian.' });
  }
});

// ============================================================================
// Vite Dev Middleware & Production Static Serving
// ============================================================================

async function startServer() {
  const PORT = Number(process.env.PORT || 3000);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`QUR'AN & HADIS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
