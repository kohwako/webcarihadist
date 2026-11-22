import React, { useState } from 'react';
import {
  ArrowUpRight,
  Bookmark,
  BookMarked,
  BookOpen,
  FileText,
  Folder,
  FolderPlus,
  LogIn,
  Pencil,
  Share2,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getArabicSizeClass } from '../lib/utils';
import { BookmarkDoc, NavPage } from '../types/islamic';
import { SharePayload } from '../components/ShareModal';

interface CollectionsPageProps {
  onOpenQuranDetail: (surah: number, ayah: number) => void;
  onOpenHadithDetail: (book: string, number: number) => void;
  onShare: (payload: SharePayload) => void;
  onNavigate: (page: NavPage) => void;
}

export const CollectionsPage: React.FC<CollectionsPageProps> = ({
  onOpenQuranDetail,
  onOpenHadithDetail,
  onShare,
  onNavigate,
}) => {
  const {
    user,
    setAuthModalOpen,
    folders,
    bookmarks,
    notes,
    arabicFontSize,
    createFolder,
    updateFolder,
    deleteFolder,
    moveBookmarkFolder,
    removeBookmark,
  } = useApp();

  const [selectedFolderId, setSelectedFolderId] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<'all' | 'quran' | 'hadith'>('all');
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderDesc, setFolderDesc] = useState('');

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <div className="rounded-3xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-8 sm:p-10 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#087A59]/10 text-[#087A59] dark:text-[#C6A45C] flex items-center justify-center">
            <Bookmark className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#064E3B] dark:text-[#E8EFEA]">
            Koleksi Saya
          </h1>
          <p className="text-sm text-[#5A6572] dark:text-[#93A8A0] leading-relaxed">
            Masuk ke akun Anda untuk menyimpan ayat favorit, hadis pilihan, folder koleksi pribadi, dan catatan referensi secara permanen di cloud.
          </p>
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#087A59] hover:bg-[#064E3B] text-white text-sm font-semibold transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk / Daftar Sekarang</span>
          </button>
        </div>
      </div>
    );
  }

  const handleSaveFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    if (editingFolderId) {
      await updateFolder(editingFolderId, folderName, folderDesc);
    } else {
      await createFolder(folderName, folderDesc);
    }
    setFolderName('');
    setFolderDesc('');
    setEditingFolderId(null);
    setShowFolderForm(false);
  };

  const filteredBookmarks = bookmarks.filter((bm) => {
    if (typeFilter !== 'all' && bm.type !== typeFilter) return false;
    if (selectedFolderId === 'ALL') return true;
    if (selectedFolderId === 'UNASSIGNED') return !bm.folderId;
    return bm.folderId === selectedFolderId;
  });

  const handleOpenBookmark = (bm: BookmarkDoc) => {
    if (bm.type === 'quran' && bm.surahNumber && bm.ayahNumber) {
      onOpenQuranDetail(bm.surahNumber, bm.ayahNumber);
    } else if (bm.type === 'hadith' && bm.hadithBook && bm.hadithNumber) {
      onOpenHadithDetail(bm.hadithBook, bm.hadithNumber);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#064E3B] dark:text-[#E8EFEA]">
            Koleksi Saya
          </h1>
          <p className="text-sm text-[#5A6572] dark:text-[#93A8A0] mt-1">
            <span className="tabular-nums">{bookmarks.length}</span> referensi tersimpan ·{' '}
            <span className="tabular-nums">{folders.length}</span> folder ·{' '}
            <button
              type="button"
              onClick={() => onNavigate('notes')}
              className="text-[#087A59] dark:text-[#C6A45C] font-medium hover:underline"
            >
              <span className="tabular-nums">{notes.length}</span> catatan pribadi
            </button>
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingFolderId(null);
            setFolderName('');
            setFolderDesc('');
            setShowFolderForm((v) => !v);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#087A59] hover:bg-[#064E3B] text-white text-xs sm:text-sm font-semibold transition-colors self-start"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Buat Folder Baru</span>
        </button>
      </div>

      {/* Create / Edit Folder Form */}
      {showFolderForm && (
        <form
          onSubmit={(e) => void handleSaveFolder(e)}
          className="rounded-2xl bg-white dark:bg-[#111E1B] border border-[#087A59]/50 p-5 space-y-3"
        >
          <h2 className="font-display font-bold text-sm text-[#064E3B] dark:text-[#E8EFEA]">
            {editingFolderId ? 'Ubah Folder Koleksi' : 'Folder Koleksi Baru'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              maxLength={80}
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Nama folder (mis. Doa Harian, Ayat Kesabaran)"
              className="px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#0E1916] border border-[#E7E5DC] dark:border-[#1E332D] text-sm focus:outline-none focus:border-[#087A59]"
            />
            <input
              type="text"
              maxLength={240}
              value={folderDesc}
              onChange={(e) => setFolderDesc(e.target.value)}
              placeholder="Deskripsi singkat (opsional)"
              className="px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#0E1916] border border-[#E7E5DC] dark:border-[#1E332D] text-sm focus:outline-none focus:border-[#087A59]"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowFolderForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5A6572] hover:bg-[#F3F1E8] dark:hover:bg-[#182925]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#087A59] hover:bg-[#064E3B] text-white text-xs font-semibold"
            >
              Simpan Folder
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Folders Sidebar Panel */}
        <aside className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-4 space-y-1.5">
          <p className="px-3 py-1.5 text-xs font-semibold text-[#6B7280] dark:text-[#8CA39A]">
            Folder Koleksi
          </p>
          <button
            type="button"
            onClick={() => setSelectedFolderId('ALL')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              selectedFolderId === 'ALL'
                ? 'bg-[#087A59] text-white'
                : 'hover:bg-[#F3F1E8] dark:hover:bg-[#182925]'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Bookmark className="w-4 h-4" />
              <span>Semua Tersimpan</span>
            </span>
            <span className="text-xs tabular-nums opacity-80">{bookmarks.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFolderId('UNASSIGNED')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              selectedFolderId === 'UNASSIGNED'
                ? 'bg-[#087A59] text-white'
                : 'hover:bg-[#F3F1E8] dark:hover:bg-[#182925]'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Folder className="w-4 h-4" />
              <span>Tanpa Folder</span>
            </span>
            <span className="text-xs tabular-nums opacity-80">
              {bookmarks.filter((b) => !b.folderId).length}
            </span>
          </button>

          {folders.map((fld) => {
            const count = bookmarks.filter((b) => b.folderId === fld.id).length;
            const active = selectedFolderId === fld.id;
            return (
              <div
                key={fld.id}
                className={`group flex items-center justify-between rounded-xl px-3 py-2 transition-colors ${
                  active
                    ? 'bg-[#087A59] text-white'
                    : 'hover:bg-[#F3F1E8] dark:hover:bg-[#182925]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedFolderId(fld.id)}
                  className="flex-1 flex items-center gap-2.5 text-left min-w-0"
                >
                  <Folder className="w-4 h-4 shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-sm font-medium truncate">{fld.name}</span>
                    {fld.description && (
                      <span
                        className={`block text-[11px] truncate ${
                          active ? 'text-white/75' : 'text-[#6B7280] dark:text-[#8CA39A]'
                        }`}
                      >
                        {fld.description}
                      </span>
                    )}
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className="text-xs tabular-nums opacity-80 mr-1">{count}</span>
                  <button
                    type="button"
                    aria-label={`Ubah folder ${fld.name}`}
                    onClick={() => {
                      setEditingFolderId(fld.id);
                      setFolderName(fld.name);
                      setFolderDesc(fld.description);
                      setShowFolderForm(true);
                    }}
                    className="p-1 rounded-lg opacity-70 hover:opacity-100"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Hapus folder ${fld.name}`}
                    onClick={() => {
                      if (selectedFolderId === fld.id) setSelectedFolderId('ALL');
                      void deleteFolder(fld.id);
                    }}
                    className="p-1 rounded-lg opacity-70 hover:opacity-100 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="pt-3 mt-2 border-t border-[#EFECE2] dark:border-[#1B2E28]">
            <button
              type="button"
              onClick={() => onNavigate('notes')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-[#064E3B] dark:text-[#C6A45C] hover:bg-[#F3F1E8] dark:hover:bg-[#182925]"
            >
              <span className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>Catatan Pribadi</span>
              </span>
              <span className="text-xs tabular-nums">{notes.length}</span>
            </button>
          </div>
        </aside>

        {/* Bookmarks Main Column */}
        <section className="lg:col-span-8 space-y-4">
          {/* Type Filter Segmented Control */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="inline-flex p-1 rounded-xl bg-[#EFECE2] dark:bg-[#162722]">
              {(
                [
                  { id: 'all', label: 'Semua' },
                  { id: 'quran', label: "Ayat Al-Qur'an" },
                  { id: 'hadith', label: 'Hadis' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypeFilter(t.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    typeFilter === t.id
                      ? 'bg-white dark:bg-[#087A59] text-[#064E3B] dark:text-white shadow-xs'
                      : 'text-[#5A6572] dark:text-[#93A8A0]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-[#5A6572] dark:text-[#93A8A0] tabular-nums">
              {filteredBookmarks.length} item ditampilkan
            </span>
          </div>

          {filteredBookmarks.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-12 text-center space-y-3">
              <Bookmark className="w-8 h-8 text-[#9CA3AF] mx-auto" />
              <h3 className="font-display font-semibold text-base text-[#1F2937] dark:text-[#E8EFEA]">
                Belum ada referensi di folder ini
              </h3>
              <p className="text-sm text-[#5A6572] dark:text-[#93A8A0] max-w-md mx-auto">
                Klik tombol &ldquo;Simpan&rdquo; pada ayat Al-Qur&apos;an atau hadis mana saja untuk menambahkannya ke Koleksi Saya.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('quran')}
                  className="px-4 py-2 rounded-xl bg-[#087A59] text-white text-xs font-semibold"
                >
                  Jelajahi Al-Qur&apos;an
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('hadith')}
                  className="px-4 py-2 rounded-xl border border-[#E7E5DC] dark:border-[#1E332D] text-xs font-semibold"
                >
                  Jelajahi Hadis
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookmarks.map((bm) => (
                <article
                  key={bm.id}
                  className="rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-5 sm:p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#EFECE2] dark:border-[#1B2E28]">
                    <div>
                      <div className="flex items-center gap-2">
                        {bm.type === 'quran' ? (
                          <BookOpen className="w-4 h-4 text-[#087A59] dark:text-[#C6A45C]" />
                        ) : (
                          <BookMarked className="w-4 h-4 text-[#087A59] dark:text-[#C6A45C]" />
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenBookmark(bm)}
                          className="font-display font-bold text-sm sm:text-base text-[#064E3B] dark:text-[#E8EFEA] hover:text-[#087A59] dark:hover:text-[#C6A45C]"
                        >
                          {bm.title}
                        </button>
                      </div>
                      {bm.subtitle && (
                        <p className="text-xs text-[#5A6572] dark:text-[#93A8A0] mt-0.5">
                          {bm.subtitle}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={bm.folderId || ''}
                        onChange={(e) => void moveBookmarkFolder(bm.id, e.target.value)}
                        aria-label="Pindahkan ke folder"
                        className="px-2.5 py-1.5 rounded-lg bg-[#FAF9F5] dark:bg-[#0E1916] border border-[#E7E5DC] dark:border-[#1E332D] text-xs focus:outline-none focus:border-[#087A59]"
                      >
                        <option value="">Tanpa Folder</option>
                        {folders.map((f) => (
                          <option key={f.id} value={f.id}>
                            Folder: {f.name}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => handleOpenBookmark(bm)}
                        title="Buka detail"
                        className="p-1.5 rounded-lg text-[#5A6572] hover:bg-[#F3F1E8] dark:hover:bg-[#182925]"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p
                    className={`font-arabic text-right text-[#1F2937] dark:text-[#F2F7F4] ${getArabicSizeClass(
                      arabicFontSize
                    )}`}
                    lang="ar"
                  >
                    {bm.arabicText}
                  </p>

                  <p className="text-sm text-[#374151] dark:text-[#D4E2DC] leading-relaxed">
                    &ldquo;{bm.translationText}&rdquo;
                  </p>

                  <div className="pt-3 border-t border-[#EFECE2] dark:border-[#1B2E28] flex items-center justify-between gap-3">
                    <span className="text-[11px] text-[#6B7280] dark:text-[#8CA39A]">
                      Sumber: {bm.sourceLabel}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          onShare({
                            title: bm.title,
                            arabicText: bm.arabicText,
                            translationText: bm.translationText,
                            reference: bm.title,
                            source: bm.sourceLabel,
                          })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#374151] dark:text-[#C5D5CE] hover:bg-[#F3F1E8] dark:hover:bg-[#182925]"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Bagikan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => void removeBookmark(bm.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
