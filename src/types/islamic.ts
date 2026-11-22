export type NavPage =
  | 'home'
  | 'quran'
  | 'hadith'
  | 'search'
  | 'collections'
  | 'notes'
  | 'settings'
  | 'detail';

export type ArabicFontSize = 'sm' | 'md' | 'lg' | 'xl';

export type QariId = '01' | '02' | '03' | '04' | '05' | '06';

export const QARI_OPTIONS: Record<QariId, string> = {
  '01': 'Abdullah Al-Juhany',
  '02': 'Abdul Muhsin Al-Qasim',
  '03': 'Abdurrahman As-Sudais',
  '04': 'Ibrahim Al-Dossari',
  '05': 'Misyari Rasyid Al-Afasi',
  '06': 'Yasser Al-Dosari',
};

export interface CategoryTopic {
  id: string;
  label: string;
  description: string;
  keywords: string[];
}

export const ISLAMIC_CATEGORIES: CategoryTopic[] = [
  {
    id: 'doa',
    label: 'Doa',
    description: 'Permohonan, munajat, dan doa para nabi serta orang beriman.',
    keywords: ['doa', 'berdoa', 'ampun', 'rahmat', 'ya tuhan', 'rabb'],
  },
  {
    id: 'dzikir',
    label: 'Dzikir',
    description: 'Mengingat Allah, tasbih, tahmid, takbir, dan ketenangan jiwa.',
    keywords: ['ingat', 'dzikir', 'zikir', 'tasbih', 'bertasbih', 'istighfar'],
  },
  {
    id: 'akhlak',
    label: 'Akhlak',
    description: 'Budi pekerti mulia, kejujuran, amanah, dan kasih sayang.',
    keywords: ['akhlak', 'jujur', 'baik', 'kasih', 'amanah', 'lembut', 'malu'],
  },
  {
    id: 'keluarga',
    label: 'Keluarga',
    description: 'Rumah tangga sakinah, berbakti kepada orang tua, dan mendidik anak.',
    keywords: ['keluarga', 'orang tua', 'ibu', 'istri', 'suami', 'anak', 'nikah'],
  },
  {
    id: 'pendidikan',
    label: 'Pendidikan',
    description: 'Keutamaan ilmu, adab menuntut ilmu, hikmah, dan pengajaran.',
    keywords: ['ilmu', 'belajar', 'mengajar', 'ulama', 'hikmah', 'pengetahuan'],
  },
  {
    id: 'rezeki',
    label: 'Rezeki',
    description: 'Keberkahan nafkah, sedekah, zakat, dan tawakal mencari rezeki.',
    keywords: ['rezeki', 'sedekah', 'zakat', 'nafkah', 'harta', 'infak'],
  },
  {
    id: 'kesabaran',
    label: 'Kesabaran',
    description: 'Keteguhan hati dalam ujian, syukur, dan pertolongan Allah.',
    keywords: ['sabar', 'bersabar', 'kesabaran', 'ujian', 'cobaan', 'tabah'],
  },
  {
    id: 'ibadah',
    label: 'Ibadah',
    description: 'Shalat, puasa, haji, wudhu, dan kekhusyukan beribadah.',
    keywords: ['shalat', 'salat', 'puasa', 'wudhu', 'haji', 'ibadah', 'sujud'],
  },
  {
    id: 'muamalah',
    label: 'Muamalah',
    description: 'Jual beli, keadilan, amanah harta, utang piutang, dan hak sesama.',
    keywords: ['jual', 'beli', 'utang', 'riba', 'adil', 'tetangga', 'dagang'],
  },
  {
    id: 'kisah-nabi',
    label: 'Kisah Nabi',
    description: 'Teladan perjuangan dan hikmah dari kisah para Nabi dan Rasul.',
    keywords: ['musa', 'ibrahim', 'yusuf', 'nuh', 'isa', 'sulaiman', 'adam'],
  },
];

export interface SurahSummary {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
  tempatTurun: string;
  arti: string;
  deskripsi?: string;
  audioFull?: Record<string, string>;
}

export interface QuranVerseItem {
  surahNumber: number;
  surahName: string;
  surahArabicName: string;
  revelationType: string;
  ayahNumber: number;
  arabicText: string;
  transliteration: string;
  translation: string;
  audio: Record<string, string>;
  tafsir?: string;
  source: string;
  relevanceScore?: number;
}

export interface HadithBookMeta {
  slug: string;
  name: string;
  arabicName: string;
  total: number;
  collectionNote: string;
}

export interface HadithItem {
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

export interface DetailTarget {
  type: 'quran' | 'hadith';
  surahNumber?: number;
  ayahNumber?: number;
  hadithBook?: string;
  hadithNumber?: number;
  returnPage?: NavPage;
}

export interface UserProfileDoc {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  theme: 'light' | 'dark';
  arabicFontSize: ArabicFontSize;
  qariId: QariId;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CollectionFolderDoc {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface BookmarkDoc {
  id: string;
  userId: string;
  type: 'quran' | 'hadith';
  refKey: string;
  folderId: string;
  title: string;
  subtitle: string;
  arabicText: string;
  translationText: string;
  sourceLabel: string;
  surahNumber?: number;
  ayahNumber?: number;
  hadithBook?: string;
  hadithNumber?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StudyNoteDoc {
  id: string;
  userId: string;
  title: string;
  content: string;
  linkedType: 'none' | 'quran' | 'hadith';
  linkedRefKey: string;
  linkedLabel: string;
  tags: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SearchHistoryDoc {
  id: string;
  userId: string;
  query: string;
  scope: 'all' | 'quran' | 'hadith';
  createdAt?: unknown;
}

export interface AudioTrack {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  surahNumber?: number;
  ayahNumber?: number;
}
