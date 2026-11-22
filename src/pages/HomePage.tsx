import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Clock,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DailyFeaturedResponse, islamicApi } from '../lib/api';
import { ISLAMIC_CATEGORIES, NavPage } from '../types/islamic';
import { HadithCard } from '../components/HadithCard';
import { SharePayload } from '../components/ShareModal';
import { VerseCard } from '../components/VerseCard';

interface HomePageProps {
  onRunIntegratedSearch: (query: string, category?: string) => void;
  onNavigate: (page: NavPage) => void;
  onOpenQuranDetail: (surah: number, ayah: number) => void;
  onOpenHadithDetail: (book: string, number: number) => void;
  onShare: (payload: SharePayload) => void;
  onCreateLinkedNote: (refKey: string, label: string) => void;
}

const HERO_IMAGE_PATH = '/src/assets/images/islamic_hero_banner_1795315639000.jpg';

export const HomePage: React.FC<HomePageProps> = ({
  onRunIntegratedSearch,
  onNavigate,
  onOpenQuranDetail,
  onOpenHadithDetail,
  onShare,
  onCreateLinkedNote,
}) => {
  const { searchHistory, deleteSearchHistoryItem } = useApp();
  const [queryText, setQueryText] = useState('');
  const [featured, setFeatured] = useState<DailyFeaturedResponse | null>(null);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [featuredError, setFeaturedError] = useState<string | null>(null);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const loadFeatured = async () => {
    setLoadingFeatured(true);
    setFeaturedError(null);
    try {
      const data = await islamicApi.getFeaturedDaily();
      setFeatured(data);
    } catch (err) {
      setFeaturedError((err as Error).message || 'Gagal memuat konten pilihan harian.');
    } finally {
      setLoadingFeatured(false);
    }
  };

  useEffect(() => {
    void loadFeatured();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = queryText.trim();
    if (!trimmed) {
      onNavigate('search');
      return;
    }
    onRunIntegratedSearch(trimmed);
  };

  return (
    <div className="space-y-10">
      {/* Hero Banner with Architectural Geometric Backdrop & Search Bar */}
      <section className="relative rounded-3xl overflow-hidden bg-[#064E3B] border border-[#087A59]/50 shadow-sm">
        {!heroImgFailed && (
          <img
            src={HERO_IMAGE_PATH}
            alt="Ornamen geometris arsitektur Islami bernuansa zamrud dan emas"
            referrerPolicy="no-referrer"
            onError={() => setHeroImgFailed(true)}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-45"
          />
        )}
        <div
          className={`absolute inset-0 ${
            heroImgFailed
              ? 'islamic-geo-pattern bg-gradient-to-br from-[#064E3B] via-[#075F46] to-[#04372A]'
              : 'bg-gradient-to-r from-[#064E3B]/96 via-[#064E3B]/86 to-[#064E3B]/58'
          }`}
        />

        <div className="relative z-10 px-6 py-9 sm:px-10 sm:py-12 lg:py-14 max-w-3xl space-y-6">
          <div className="space-y-3">
            {featured?.dateLabel && (
              <p className="text-xs font-medium text-[#E2C98A]">
                {featured.dateLabel} · Al-Qur&apos;an Kemenag RI &amp; Kutubus Sittah
              </p>
            )}
            <h1 className="font-display text-2xl sm:text-4xl lg:text-[2.55rem] font-bold tracking-tight text-white leading-[1.18] [text-wrap:balance]">
              Temukan Petunjuk dalam Al-Qur&apos;an dan Hadis
            </h1>
            <p className="text-sm sm:text-base text-[#D4E6DF] leading-relaxed max-w-2xl">
              Jelajahi ayat dan hadis shahih untuk menambah ilmu, memperkuat iman, dan menenangkan hati.
            </p>
          </div>

          {/* Primary Integrated Search Bar */}
          <form onSubmit={handleSearchSubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5 p-1.5 rounded-2xl bg-white dark:bg-[#111E1B] shadow-md">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-[#6B7280] dark:text-[#8CA39A] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="Cari ayat, hadis, kata kunci atau topik..."
                  aria-label="Cari ayat, hadis, kata kunci atau topik"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-transparent text-sm sm:text-[15px] text-[#1F2937] dark:text-[#E8EFEA] placeholder:text-[#6B7280] dark:placeholder:text-[#7E968E] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-7 py-3 rounded-xl bg-[#087A59] hover:bg-[#064E3B] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                Cari
              </button>
            </div>

            {/* Quick Suggestions & Recent Search History */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#D4E6DF]">
              {searchHistory.length > 0 ? (
                <>
                  <span className="inline-flex items-center gap-1 text-[#E2C98A] mr-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Terakhir dicari:</span>
                  </span>
                  {searchHistory.slice(0, 5).map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/18 text-white transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => onRunIntegratedSearch(item.query)}
                        className="pl-2.5 py-1 text-xs font-medium"
                      >
                        {item.query}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteSearchHistoryItem(item.id)}
                        aria-label={`Hapus riwayat ${item.query}`}
                        className="pr-2 py-1 opacity-70 hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </>
              ) : (
                <>
                  <span className="text-[#E2C98A] mr-1">Contoh pencarian:</span>
                  {['Kesabaran', '2:153', 'Niat', 'Orang tua', 'Sedekah'].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => onRunIntegratedSearch(sample)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                      {sample}
                    </button>
                  ))}
                </>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* Thematic Categories Grid (10 Topics) */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#064E3B] dark:text-[#E8EFEA]">
              Jelajahi Berdasarkan Kategori
            </h2>
            <p className="text-xs sm:text-sm text-[#5A6572] dark:text-[#93A8A0] mt-0.5">
              Pilih topik untuk menemukan ayat Al-Qur&apos;an dan hadis yang relevan secara bersamaan.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('search')}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#087A59] dark:text-[#C6A45C] hover:underline whitespace-nowrap"
          >
            <span>Pencarian Lanjutan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {ISLAMIC_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onRunIntegratedSearch(cat.label, cat.id)}
              className="group text-left rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] hover:border-[#087A59] dark:hover:border-[#C6A45C] p-4 transition-all"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-display font-semibold text-sm text-[#064E3B] dark:text-[#E8EFEA] group-hover:text-[#087A59] dark:group-hover:text-[#C6A45C] transition-colors">
                  {cat.label}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#087A59] dark:group-hover:text-[#C6A45C] group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
              <p className="text-xs text-[#5A6572] dark:text-[#8CA39A] line-clamp-2 leading-relaxed">
                {cat.description}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Content: Daily Ayat & Daily Hadith */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#064E3B] dark:text-[#E8EFEA]">
              Ayat &amp; Hadis Pilihan Hari Ini
            </h2>
            <p className="text-xs sm:text-sm text-[#5A6572] dark:text-[#93A8A0] mt-0.5">
              Renungan harian bersumber langsung dari mushaf Kementerian Agama RI dan kitab hadis shahih.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => onNavigate('quran')}
              className="text-[#087A59] dark:text-[#C6A45C] hover:underline whitespace-nowrap"
            >
              Buka Al-Qur&apos;an
            </button>
            <button
              type="button"
              onClick={() => onNavigate('hadith')}
              className="text-[#087A59] dark:text-[#C6A45C] hover:underline whitespace-nowrap"
            >
              Buka Kitab Hadis
            </button>
          </div>
        </div>

        {loadingFeatured ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[0, 1].map((idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-6 space-y-5 animate-pulse"
              >
                <div className="h-4 bg-[#EFECE2] dark:bg-[#1C302A] rounded w-1/3" />
                <div className="space-y-3 py-3">
                  <div className="h-6 bg-[#EFECE2] dark:bg-[#1C302A] rounded w-full" />
                  <div className="h-6 bg-[#EFECE2] dark:bg-[#1C302A] rounded w-4/5 ml-auto" />
                </div>
                <div className="space-y-2">
                  <div className="h-3.5 bg-[#EFECE2] dark:bg-[#1C302A] rounded w-full" />
                  <div className="h-3.5 bg-[#EFECE2] dark:bg-[#1C302A] rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : featuredError ? (
          <div className="rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-8 text-center space-y-3">
            <AlertCircle className="w-7 h-7 text-amber-600 mx-auto" />
            <p className="text-sm text-[#374151] dark:text-[#C5D5CE]">{featuredError}</p>
            <button
              type="button"
              onClick={() => void loadFeatured()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#087A59] text-white text-xs font-semibold hover:bg-[#064E3B] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Muat Ulang
            </button>
          </div>
        ) : featured ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {featured.dailyVerse && (
              <VerseCard
                verse={featured.dailyVerse}
                kicker={`Ayat Pilihan · ${featured.dailyVerseTheme}`}
                onOpenDetail={onOpenQuranDetail}
                onShare={onShare}
                onCreateLinkedNote={onCreateLinkedNote}
              />
            )}
            {featured.dailyHadith && (
              <HadithCard
                hadith={featured.dailyHadith}
                kicker={`Hadis Pilihan · ${featured.dailyHadithTheme}`}
                onOpenDetail={onOpenHadithDetail}
                onShare={onShare}
                onCreateLinkedNote={onCreateLinkedNote}
              />
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
};
