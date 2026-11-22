import React, { useState } from 'react';
import {
  BookMarked,
  BookOpen,
  Bookmark,
  CheckCircle2,
  FileText,
  Home,
  LogIn,
  LogOut,
  MailCheck,
  Menu,
  Moon,
  Pause,
  Play,
  Search,
  Settings,
  Sun,
  Volume2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NavPage } from '../types/islamic';

interface LayoutProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  children: React.ReactNode;
}

const NAV_ITEMS: Array<{
  id: NavPage;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'home', label: 'Beranda', shortLabel: 'Beranda', icon: Home },
  { id: 'quran', label: "Al-Qur'an", shortLabel: "Qur'an", icon: BookOpen },
  { id: 'hadith', label: 'Hadis', shortLabel: 'Hadis', icon: BookMarked },
  { id: 'search', label: 'Pencarian', shortLabel: 'Cari', icon: Search },
  { id: 'collections', label: 'Koleksi Saya', shortLabel: 'Koleksi', icon: Bookmark },
  { id: 'notes', label: 'Catatan', shortLabel: 'Catatan', icon: FileText },
  { id: 'settings', label: 'Pengaturan', shortLabel: 'Atur', icon: Settings },
];

const MOBILE_BOTTOM_NAV: NavPage[] = ['home', 'quran', 'hadith', 'search', 'collections'];

export const IslamicBrandMark: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
    <rect width="40" height="40" rx="11" fill="#064E3B" />
    <path
      d="M20 6L24.2 12.2L31.6 12.2L27.9 18.8L31.6 25.4L24.2 25.4L20 31.6L15.8 25.4L8.4 25.4L12.1 18.8L8.4 12.2L15.8 12.2L20 6Z"
      stroke="#C6A45C"
      strokeWidth="1.5"
      fill="none"
    />
    <circle cx="20" cy="18.8" r="3.4" fill="#C6A45C" />
    <path d="M13 33.5H27" stroke="#C6A45C" strokeWidth="1.3" strokeLinecap="round" strokeOpacity="0.7" />
  </svg>
);

function formatSeconds(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const Layout: React.FC<LayoutProps> = ({ currentPage, onNavigate, children }) => {
  const {
    user,
    isVerified,
    profile,
    theme,
    toggleTheme,
    setAuthModalOpen,
    logout,
    resendVerificationEmail,
    refreshVerificationStatus,
    bookmarks,
    notes,
    activeTrack,
    isAudioPlaying,
    audioProgress,
    audioDuration,
    toggleAudioPlay,
    seekAudio,
    stopAudio,
    toasts,
    dismissToast,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (page: NavPage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const displayName = profile?.displayName || user?.displayName || user?.email?.split('@')[0] || '';

  return (
    <div className="min-h-screen flex bg-[#FAF9F5] dark:bg-[#0B1412] text-[#1F2937] dark:text-[#E8EFEA] transition-colors duration-200">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 bg-white dark:bg-[#111E1B] border-r border-[#E7E5DC] dark:border-[#1E332D] z-30">
        {/* Brand */}
        <div className="h-18 px-6 flex items-center gap-3 border-b border-[#E7E5DC] dark:border-[#1E332D]">
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087A59] rounded-lg"
          >
            <IslamicBrandMark className="w-9 h-9 shrink-0" />
            <div className="min-w-0">
              <span className="block font-display font-bold text-[15px] tracking-tight text-[#064E3B] dark:text-[#E8EFEA] whitespace-nowrap">
                QUR&apos;AN &amp; HADIS
              </span>
              <span className="block text-[11px] text-[#5A6572] dark:text-[#93A8A0] whitespace-nowrap">
                Integrated Search
              </span>
            </div>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto" aria-label="Navigasi Utama">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            const count =
              item.id === 'collections' && bookmarks.length > 0
                ? bookmarks.length
                : item.id === 'notes' && notes.length > 0
                  ? notes.length
                  : null;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#087A59] text-white'
                    : 'text-[#374151] dark:text-[#C5D5CE] hover:bg-[#F3F1E8] dark:hover:bg-[#182925] hover:text-[#064E3B] dark:hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  <span>{item.label}</span>
                </span>
                {count !== null && (
                  <span
                    className={`text-xs tabular-nums ${
                      active ? 'text-white/85' : 'text-[#6B7280] dark:text-[#8CA39A]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Theme Footer */}
        <div className="p-4 border-t border-[#E7E5DC] dark:border-[#1E332D] space-y-3">
          {user ? (
            <div className="flex items-center justify-between gap-2 px-2 py-1.5">
              <button
                type="button"
                onClick={() => handleNavClick('settings')}
                className="flex items-center gap-2.5 min-w-0 text-left group"
              >
                <div className="w-9 h-9 rounded-full bg-[#064E3B] text-[#FAF9F5] font-display font-semibold text-xs flex items-center justify-center shrink-0">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1F2937] dark:text-[#E8EFEA] truncate group-hover:text-[#087A59] dark:group-hover:text-[#C6A45C]">
                    {displayName}
                  </p>
                  <p className="text-xs text-[#6B7280] dark:text-[#8CA39A] truncate">
                    {user.email}
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => void logout()}
                title="Keluar"
                aria-label="Keluar dari akun"
                className="p-2 rounded-lg text-[#6B7280] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#064E3B] hover:bg-[#087A59] text-white text-sm font-medium transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk / Daftar</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-[#111E1B] border-r border-[#E7E5DC] dark:border-[#1E332D] flex flex-col shadow-xl">
            <div className="h-16 px-5 flex items-center justify-between border-b border-[#E7E5DC] dark:border-[#1E332D]">
              <div className="flex items-center gap-2.5">
                <IslamicBrandMark className="w-8 h-8" />
                <span className="font-display font-bold text-sm text-[#064E3B] dark:text-[#E8EFEA]">
                  QUR&apos;AN &amp; HADIS
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Tutup menu"
                className="p-2 rounded-lg text-[#5A6572] hover:bg-[#F3F1E8] dark:hover:bg-[#182925]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[#087A59] text-white'
                        : 'text-[#374151] dark:text-[#C5D5CE] hover:bg-[#F3F1E8] dark:hover:bg-[#182925]'
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-[#E7E5DC] dark:border-[#1E332D]">
              {user ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{displayName}</p>
                    <p className="text-xs text-[#6B7280] dark:text-[#8CA39A] truncate">
                      {user.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      void logout();
                    }}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    Keluar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#087A59] text-white text-sm font-medium"
                >
                  Masuk / Daftar
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 h-14 lg:h-16 bg-[#FAF9F5]/92 dark:bg-[#0B1412]/92 backdrop-blur-md border-b border-[#E7E5DC] dark:border-[#1E332D] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka navigasi"
              className="lg:hidden p-2 -ml-1 rounded-xl text-[#374151] dark:text-[#C5D5CE] hover:bg-[#EFECE2] dark:hover:bg-[#182925]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <IslamicBrandMark className="w-7 h-7 shrink-0" />
              <span className="font-display font-bold text-sm text-[#064E3B] dark:text-[#E8EFEA] whitespace-nowrap">
                QUR&apos;AN &amp; HADIS
              </span>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-sm text-[#5A6572] dark:text-[#93A8A0]">
              <span className="font-medium text-[#1F2937] dark:text-[#E8EFEA]">
                {NAV_ITEMS.find((n) => n.id === currentPage)?.label || 'Detail Bacaan'}
              </span>
              <span aria-hidden="true">/</span>
              <span className="truncate">Al-Qur&apos;an Kemenag RI &amp; Kutubus Sittah</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
              title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
              className="p-2 rounded-xl border border-[#E7E5DC] dark:border-[#1E332D] bg-white dark:bg-[#111E1B] text-[#374151] dark:text-[#C5D5CE] hover:border-[#087A59] transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[#C6A45C]" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <button
                type="button"
                onClick={() => handleNavClick('collections')}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E7E5DC] dark:border-[#1E332D] bg-white dark:bg-[#111E1B] text-xs sm:text-sm font-medium text-[#1F2937] dark:text-[#E8EFEA] hover:border-[#087A59] transition-colors whitespace-nowrap"
              >
                <Bookmark className="w-4 h-4 text-[#087A59] dark:text-[#C6A45C]" />
                <span className="hidden sm:inline">Koleksi</span>
                <span className="tabular-nums text-[#087A59] dark:text-[#C6A45C] font-semibold">
                  {bookmarks.length}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#087A59] hover:bg-[#064E3B] text-white text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
              >
                Masuk
              </button>
            )}
          </div>
        </header>

        {/* Unverified Email Notice Banner (for Email/Password signups) */}
        {user && !isVerified && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 px-4 sm:px-6 lg:px-8 py-3">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <MailCheck className="w-4 h-4 shrink-0" />
                <span>
                  Email <strong>{user.email}</strong> belum terverifikasi. Verifikasi email Anda agar Koleksi &amp; Catatan tersimpan ke cloud.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => void resendVerificationEmail()}
                  className="px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-900 font-medium transition-colors"
                >
                  Kirim Ulang
                </button>
                <button
                  type="button"
                  onClick={() => void refreshVerificationStatus()}
                  className="px-3 py-1 rounded-lg bg-[#087A59] text-white hover:bg-[#064E3B] font-medium transition-colors"
                >
                  Sudah Verifikasi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Viewport Content */}
        <main
          className={`flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ${
            activeTrack ? 'pb-36 lg:pb-24' : 'pb-24 lg:pb-12'
          }`}
        >
          {children}
        </main>
      </div>

      {/* Persistent Murottal Audio Player Dock */}
      {activeTrack && (
        <div className="fixed bottom-16 lg:bottom-4 left-3 right-3 lg:left-[17rem] lg:right-6 z-40">
          <div className="max-w-3xl mx-auto rounded-2xl bg-[#064E3B] text-white border border-[#087A59] shadow-lg px-4 py-3 flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={toggleAudioPlay}
              aria-label={isAudioPlaying ? 'Jeda murottal' : 'Putar murottal'}
              className="w-10 h-10 rounded-xl bg-[#C6A45C] hover:bg-[#b8954c] text-[#064E3B] flex items-center justify-center shrink-0 transition-colors"
            >
              {isAudioPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <Volume2 className="w-3.5 h-3.5 text-[#C6A45C] shrink-0" />
                  <p className="text-xs sm:text-sm font-semibold truncate">{activeTrack.title}</p>
                  <span className="hidden sm:inline text-xs text-white/70 truncate">
                    · {activeTrack.subtitle}
                  </span>
                </div>
                <span className="text-[11px] tabular-nums text-white/80 shrink-0">
                  {formatSeconds(audioProgress)} / {formatSeconds(audioDuration)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={audioDuration || 100}
                value={audioProgress}
                onChange={(e) => seekAudio(Number(e.target.value))}
                aria-label="Progres audio murottal"
                className="w-full h-1.5 accent-[#C6A45C] cursor-pointer"
              />
            </div>
            <button
              type="button"
              onClick={stopAudio}
              aria-label="Tutup pemutar audio"
              className="p-2 rounded-lg text-white/75 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Compact <= 56px) */}
      <nav
        aria-label="Navigasi Bawah"
        className="lg:hidden fixed bottom-0 inset-x-0 h-14 bg-white/95 dark:bg-[#111E1B]/95 backdrop-blur-md border-t border-[#E7E5DC] dark:border-[#1E332D] z-30 grid grid-cols-5"
      >
        {MOBILE_BOTTOM_NAV.map((pageId) => {
          const item = NAV_ITEMS.find((n) => n.id === pageId)!;
          const Icon = item.icon;
          const active = currentPage === pageId;
          return (
            <button
              key={pageId}
              type="button"
              onClick={() => handleNavClick(pageId)}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                active
                  ? 'text-[#087A59] dark:text-[#C6A45C]'
                  : 'text-[#6B7280] dark:text-[#8CA39A]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed top-18 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)]"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`flex items-start justify-between gap-3 px-4 py-3 rounded-xl border shadow-md text-sm ${
                t.variant === 'error'
                  ? 'bg-red-50 dark:bg-red-950/90 border-red-200 dark:border-red-900 text-red-900 dark:text-red-100'
                  : t.variant === 'info'
                    ? 'bg-white dark:bg-[#162722] border-[#E7E5DC] dark:border-[#243B34] text-[#1F2937] dark:text-[#E8EFEA]'
                    : 'bg-[#064E3B] border-[#087A59] text-white'
              }`}
            >
              <span className="flex items-center gap-2 leading-snug">
                {t.variant === 'success' && <CheckCircle2 className="w-4 h-4 text-[#C6A45C] shrink-0" />}
                <span>{t.message}</span>
              </span>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="Tutup notifikasi"
                className="opacity-70 hover:opacity-100 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
