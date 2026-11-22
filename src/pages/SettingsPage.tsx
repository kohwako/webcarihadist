import React, { useState } from 'react';
import {
  CheckCircle2,
  LogIn,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
  Trash2,
  User as UserIcon,
  Volume2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getArabicSizeClass } from '../lib/utils';
import { ArabicFontSize, QARI_OPTIONS, QariId } from '../types/islamic';

const FONT_SIZES: Array<{ id: ArabicFontSize; label: string }> = [
  { id: 'sm', label: 'Kecil' },
  { id: 'md', label: 'Sedang' },
  { id: 'lg', label: 'Besar' },
  { id: 'xl', label: 'Sangat Besar' },
];

export const SettingsPage: React.FC = () => {
  const {
    user,
    isVerified,
    profile,
    setAuthModalOpen,
    logout,
    updateUserDisplayName,
    theme,
    toggleTheme,
    arabicFontSize,
    setArabicFontSize,
    qariId,
    setQariId,
    searchHistory,
    clearSearchHistory,
  } = useApp();

  const [nameInput, setNameInput] = useState(
    profile?.displayName || user?.displayName || ''
  );
  const [savingProfile, setSavingProfile] = useState(false);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setSavingProfile(true);
    try {
      await updateUserDisplayName(nameInput);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#064E3B] dark:text-[#E8EFEA]">
          Pengaturan &amp; Profil
        </h1>
        <p className="text-sm text-[#5A6572] dark:text-[#93A8A0] mt-1">
          Sesuaikan tampilan bacaan Al-Qur&apos;an, qari murottal, mode gelap, dan profil akun Anda.
        </p>
      </div>

      {/* Account Profile Section */}
      <section className="rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#064E3B] text-[#FAF9F5] flex items-center justify-center">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-[#064E3B] dark:text-[#E8EFEA]">
                Profil Pengguna
              </h2>
              <p className="text-xs text-[#5A6572] dark:text-[#93A8A0]">
                {user
                  ? `${user.email} · ${isVerified ? 'Email terverifikasi' : 'Menunggu verifikasi email'}`
                  : 'Anda sedang menjelajah sebagai tamu'}
              </p>
            </div>
          </div>

          {user ? (
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E7E5DC] dark:border-[#1E332D] text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#087A59] hover:bg-[#064E3B] text-white text-xs font-semibold"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk / Daftar</span>
            </button>
          )}
        </div>

        {user && (
          <form onSubmit={(e) => void handleSaveName(e)} className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <input
              type="text"
              maxLength={120}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Nama tampilan Anda"
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#0E1916] border border-[#E7E5DC] dark:border-[#1E332D] text-sm focus:outline-none focus:border-[#087A59]"
            />
            <button
              type="submit"
              disabled={savingProfile || !isVerified}
              className="px-5 py-2.5 rounded-xl bg-[#087A59] hover:bg-[#064E3B] text-white text-xs sm:text-sm font-semibold disabled:opacity-50"
            >
              {savingProfile ? 'Menyimpan...' : 'Perbarui Nama'}
            </button>
          </form>
        )}
      </section>

      {/* Reading & Display Preferences */}
      <section className="rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-6 space-y-6">
        <h2 className="font-display font-bold text-base text-[#064E3B] dark:text-[#E8EFEA]">
          Kenyamanan Membaca
        </h2>

        {/* Theme Switch */}
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-[#EFECE2] dark:border-[#1B2E28]">
          <div>
            <p className="text-sm font-semibold text-[#1F2937] dark:text-[#E8EFEA]">
              Tema Tampilan
            </p>
            <p className="text-xs text-[#5A6572] dark:text-[#93A8A0]">
              Pilih Mode Terang (Cream White) atau Mode Gelap yang nyaman di mata saat malam hari.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E7E5DC] dark:border-[#1E332D] bg-[#FAF9F5] dark:bg-[#0E1916] text-xs font-semibold hover:border-[#087A59] transition-colors shrink-0"
          >
            {theme === 'dark' ? (
              <>
                <Moon className="w-4 h-4 text-[#C6A45C]" />
                <span>Mode Gelap</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-[#087A59]" />
                <span>Mode Terang</span>
              </>
            )}
          </button>
        </div>

        {/* Arabic Font Size */}
        <div className="space-y-3 pb-5 border-b border-[#EFECE2] dark:border-[#1B2E28]">
          <div>
            <p className="text-sm font-semibold text-[#1F2937] dark:text-[#E8EFEA]">
              Ukuran Huruf Arab
            </p>
            <p className="text-xs text-[#5A6572] dark:text-[#93A8A0]">
              Berlaku pada tampilan ayat Al-Qur&apos;an dan teks hadis.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FONT_SIZES.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setArabicFontSize(opt.id)}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                  arabicFontSize === opt.id
                    ? 'bg-[#087A59] border-[#087A59] text-white'
                    : 'bg-[#FAF9F5] dark:bg-[#0E1916] border-[#E7E5DC] dark:border-[#1E332D] text-[#374151] dark:text-[#C5D5CE] hover:border-[#087A59]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="rounded-xl bg-[#FAF9F5] dark:bg-[#0D1815] border border-[#E7E5DC] dark:border-[#1E332D] p-4">
            <p
              className={`font-arabic text-right text-[#1F2937] dark:text-[#F2F7F4] ${getArabicSizeClass(
                arabicFontSize
              )}`}
              lang="ar"
            >
              بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
            </p>
          </div>
        </div>

        {/* Qari Audio Preference */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#087A59] dark:text-[#C6A45C]" />
            <p className="text-sm font-semibold text-[#1F2937] dark:text-[#E8EFEA]">
              Qari Murottal Pilihan
            </p>
          </div>
          <select
            value={qariId}
            onChange={(e) => setQariId(e.target.value as QariId)}
            className="w-full sm:max-w-sm px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#0E1916] border border-[#E7E5DC] dark:border-[#1E332D] text-sm focus:outline-none focus:border-[#087A59]"
          >
            {(Object.entries(QARI_OPTIONS) as Array<[QariId, string]>).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Search History & Verified Sources */}
      <section className="rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-6 space-y-5">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#EFECE2] dark:border-[#1B2E28]">
          <div>
            <h2 className="font-display font-bold text-base text-[#064E3B] dark:text-[#E8EFEA]">
              Riwayat Pencarian
            </h2>
            <p className="text-xs text-[#5A6572] dark:text-[#93A8A0]">
              Tersimpan <span className="tabular-nums">{searchHistory.length}</span> kata kunci pencarian terakhir.
            </p>
          </div>
          <button
            type="button"
            disabled={searchHistory.length === 0}
            onClick={() => void clearSearchHistory()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E7E5DC] dark:border-[#1E332D] text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Bersihkan Riwayat</span>
          </button>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-[#064E3B] dark:text-[#C6A45C]">
            <ShieldCheck className="w-4 h-4" />
            <h2 className="font-display font-bold text-base">
              Sumber Data Terverifikasi
            </h2>
          </div>
          <ul className="space-y-1.5 text-xs sm:text-sm text-[#4B5563] dark:text-[#B5C7C0]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#087A59] shrink-0 mt-0.5" />
              <span>
                <strong>Al-Qur&apos;an, Transliterasi, Terjemahan &amp; Tafsir:</strong> Kementerian Agama Republik Indonesia melalui EQuran.id API v2 dan indeks pencarian penuh AlQuran.cloud.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#087A59] shrink-0 mt-0.5" />
              <span>
                <strong>Hadis Kutubus Sittah:</strong> Shahih Bukhari, Shahih Muslim, Sunan Abu Dawud, Jami&apos; At-Tirmidzi, Sunan An-Nasa&apos;i, dan Sunan Ibnu Majah melalui Hadis API Indonesia &amp; MyQuran API v2.
              </span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};
