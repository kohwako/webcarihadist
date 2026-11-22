import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  FileText,
  Link2,
  LogIn,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StudyNoteDoc } from '../types/islamic';

interface NotesPageProps {
  draftLink?: { refKey: string; label: string } | null;
  onClearDraftLink: () => void;
  onOpenQuranDetail: (surah: number, ayah: number) => void;
  onOpenHadithDetail: (book: string, number: number) => void;
}

export const NotesPage: React.FC<NotesPageProps> = ({
  draftLink,
  onClearDraftLink,
  onOpenQuranDetail,
  onOpenHadithDetail,
}) => {
  const { user, setAuthModalOpen, notes, bookmarks, saveNote, deleteNote } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'quran' | 'hadith' | 'none'>('all');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [linkedType, setLinkedType] = useState<'none' | 'quran' | 'hadith'>('none');
  const [linkedRefKey, setLinkedRefKey] = useState('');
  const [linkedLabel, setLinkedLabel] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [saving, setSaving] = useState(false);

  // If navigated here via "Catat" on a Verse or Hadith card, pre-populate editor!
  useEffect(() => {
    if (!draftLink) return;
    setEditingId(undefined);
    setTitle(`Tadabbur ${draftLink.label}`);
    setContent('');
    if (draftLink.refKey.startsWith('quran:')) {
      setLinkedType('quran');
    } else if (draftLink.refKey.startsWith('hadith:')) {
      setLinkedType('hadith');
    } else {
      setLinkedType('none');
    }
    setLinkedRefKey(draftLink.refKey);
    setLinkedLabel(draftLink.label);
    setTagsText('');
    setEditorOpen(true);
    onClearDraftLink();
  }, [draftLink, onClearDraftLink]);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <div className="rounded-3xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-8 sm:p-10 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#087A59]/10 text-[#087A59] dark:text-[#C6A45C] flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#064E3B] dark:text-[#E8EFEA]">
            Catatan Tadabbur &amp; Kajian
          </h1>
          <p className="text-sm text-[#5A6572] dark:text-[#93A8A0] leading-relaxed">
            Masuk ke akun Anda untuk menulis catatan pribadi, menghubungkannya dengan ayat Al-Qur&apos;an atau hadis, dan mengaksesnya kapan saja.
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

  const openNewEditor = () => {
    setEditingId(undefined);
    setTitle('');
    setContent('');
    setLinkedType('none');
    setLinkedRefKey('');
    setLinkedLabel('');
    setTagsText('');
    setEditorOpen(true);
  };

  const openEditEditor = (note: StudyNoteDoc) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setLinkedType(note.linkedType);
    setLinkedRefKey(note.linkedRefKey);
    setLinkedLabel(note.linkedLabel);
    setTagsText((note.tags || []).join(', '));
    setEditorOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectBookmarkRef = (refKey: string) => {
    if (!refKey) {
      setLinkedType('none');
      setLinkedRefKey('');
      setLinkedLabel('');
      return;
    }
    const bm = bookmarks.find((b) => b.refKey === refKey);
    if (bm) {
      setLinkedType(bm.type);
      setLinkedRefKey(bm.refKey);
      setLinkedLabel(bm.title);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const tags = tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 8);
      await saveNote({
        id: editingId,
        title,
        content,
        linkedType,
        linkedRefKey: linkedType === 'none' ? '' : linkedRefKey,
        linkedLabel: linkedType === 'none' ? '' : linkedLabel,
        tags,
      });
      setEditorOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenLinkedRef = (note: StudyNoteDoc) => {
    if (note.linkedType === 'quran' && note.linkedRefKey.startsWith('quran:')) {
      const [, s, a] = note.linkedRefKey.split(':');
      if (Number(s) && Number(a)) onOpenQuranDetail(Number(s), Number(a));
    } else if (note.linkedType === 'hadith' && note.linkedRefKey.startsWith('hadith:')) {
      const [, book, num] = note.linkedRefKey.split(':');
      if (book && Number(num)) onOpenHadithDetail(book, Number(num));
    }
  };

  const filteredNotes = notes.filter((n) => {
    if (filterType !== 'all' && n.linkedType !== filterType) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.linkedLabel.toLowerCase().includes(q) ||
      (n.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#064E3B] dark:text-[#E8EFEA]">
            Catatan Pribadi
          </h1>
          <p className="text-sm text-[#5A6572] dark:text-[#93A8A0] mt-1">
            Catat hikmah kajian, renungan ayat, dan pelajaran hadis dalam satu ruang yang rapi.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewEditor}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#087A59] hover:bg-[#064E3B] text-white text-xs sm:text-sm font-semibold transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Catatan</span>
        </button>
      </div>

      {/* Note Editor Form */}
      {editorOpen && (
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="rounded-2xl bg-white dark:bg-[#111E1B] border border-[#087A59]/50 p-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-bold text-base text-[#064E3B] dark:text-[#E8EFEA]">
              {editingId ? 'Edit Catatan' : 'Catatan Baru'}
            </h2>
            <button
              type="button"
              onClick={() => setEditorOpen(false)}
              className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F3F1E8] dark:hover:bg-[#182925]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5A6572] dark:text-[#93A8A0] mb-1">
              Judul Catatan
            </label>
            <input
              type="text"
              required
              maxLength={160}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mis. Pelajaran Kesabaran dari QS. Al-Baqarah: 153"
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#0E1916] border border-[#E7E5DC] dark:border-[#1E332D] text-sm focus:outline-none focus:border-[#087A59]"
            />
          </div>

          {/* Link to Ayat or Hadith */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#5A6572] dark:text-[#93A8A0] mb-1">
                Hubungkan Referensi
              </label>
              <select
                value={linkedType}
                onChange={(e) => {
                  const val = e.target.value as 'none' | 'quran' | 'hadith';
                  setLinkedType(val);
                  if (val === 'none') {
                    setLinkedRefKey('');
                    setLinkedLabel('');
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#0E1916] border border-[#E7E5DC] dark:border-[#1E332D] text-sm focus:outline-none focus:border-[#087A59]"
              >
                <option value="none">Tanpa Referensi Khusus</option>
                <option value="quran">Ayat Al-Qur&apos;an</option>
                <option value="hadith">Hadis</option>
              </select>
            </div>

            {bookmarks.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-[#5A6572] dark:text-[#93A8A0] mb-1">
                  Pilih dari Koleksi Tersimpan
                </label>
                <select
                  value={bookmarks.some((b) => b.refKey === linkedRefKey) ? linkedRefKey : ''}
                  onChange={(e) => handleSelectBookmarkRef(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#0E1916] border border-[#E7E5DC] dark:border-[#1E332D] text-sm focus:outline-none focus:border-[#087A59]"
                >
                  <option value="">— Pilih bookmark —</option>
                  {bookmarks.map((b) => (
                    <option key={b.id} value={b.refKey}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {linkedType !== 'none' && (
              <div>
                <label className="block text-xs font-medium text-[#5A6572] dark:text-[#93A8A0] mb-1">
                  Label Referensi
                </label>
                <input
                  type="text"
                  maxLength={200}
                  value={linkedLabel}
                  onChange={(e) => setLinkedLabel(e.target.value)}
                  placeholder={
                    linkedType === 'quran'
                      ? 'Mis. QS. Al-Baqarah : 153'
                      : 'Mis. HR. Shahih Bukhari No. 1'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#0E1916] border border-[#E7E5DC] dark:border-[#1E332D] text-sm focus:outline-none focus:border-[#087A59]"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5A6572] dark:text-[#93A8A0] mb-1">
              Isi Catatan
            </label>
            <textarea
              required
              rows={5}
              maxLength={10000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tuliskan renungan, ringkasan kajian, atau poin pengamalan Anda di sini..."
              className="w-full px-4 py-3 rounded-xl bg-[#FAF9F5] dark:bg-[#0E1916] border border-[#E7E5DC] dark:border-[#1E332D] text-sm leading-relaxed focus:outline-none focus:border-[#087A59]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5A6572] dark:text-[#93A8A0] mb-1">
              Label Topik (pisahkan dengan koma, maksimal 8)
            </label>
            <input
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="Mis. sabar, kajian subuh, keluarga"
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#0E1916] border border-[#E7E5DC] dark:border-[#1E332D] text-sm focus:outline-none focus:border-[#087A59]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditorOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5A6572] hover:bg-[#F3F1E8] dark:hover:bg-[#182925]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#087A59] hover:bg-[#064E3B] text-white text-xs sm:text-sm font-semibold disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan Catatan'}
            </button>
          </div>
        </form>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari judul, isi catatan, atau topik..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] text-sm focus:outline-none focus:border-[#087A59]"
          />
        </div>

        <div className="inline-flex p-1 rounded-xl bg-[#EFECE2] dark:bg-[#162722] self-start">
          {(
            [
              { id: 'all', label: 'Semua' },
              { id: 'quran', label: "Al-Qur'an" },
              { id: 'hadith', label: 'Hadis' },
              { id: 'none', label: 'Umum' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                filterType === tab.id
                  ? 'bg-white dark:bg-[#087A59] text-[#064E3B] dark:text-white shadow-xs'
                  : 'text-[#5A6572] dark:text-[#93A8A0]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-12 text-center space-y-3">
          <FileText className="w-8 h-8 text-[#9CA3AF] mx-auto" />
          <h3 className="font-display font-semibold text-base text-[#1F2937] dark:text-[#E8EFEA]">
            Belum ada catatan
          </h3>
          <p className="text-sm text-[#5A6572] dark:text-[#93A8A0] max-w-md mx-auto">
            Mulai tulis catatan tadabbur pertama Anda atau klik tombol &ldquo;Catat&rdquo; pada ayat dan hadis yang sedang Anda baca.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => {
            const hasNavigableLink =
              (note.linkedType === 'quran' && note.linkedRefKey.startsWith('quran:')) ||
              (note.linkedType === 'hadith' && note.linkedRefKey.startsWith('hadith:'));
            return (
              <article
                key={note.id}
                className="rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display font-bold text-base text-[#064E3B] dark:text-[#E8EFEA] leading-snug">
                      {note.title}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditEditor(note)}
                        aria-label="Edit catatan"
                        className="p-1.5 rounded-lg text-[#5A6572] hover:bg-[#F3F1E8] dark:hover:bg-[#182925] hover:text-[#087A59]"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteNote(note.id)}
                        aria-label="Hapus catatan"
                        className="p-1.5 rounded-lg text-[#5A6572] hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {note.linkedLabel && (
                    <div className="flex items-center gap-1.5 text-xs text-[#087A59] dark:text-[#C6A45C] font-medium">
                      <Link2 className="w-3.5 h-3.5 shrink-0" />
                      {hasNavigableLink ? (
                        <button
                          type="button"
                          onClick={() => handleOpenLinkedRef(note)}
                          className="inline-flex items-center gap-1 hover:underline text-left"
                        >
                          <span>{note.linkedLabel}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span>{note.linkedLabel}</span>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-[#374151] dark:text-[#D4E2DC] leading-relaxed whitespace-pre-line">
                    {note.content}
                  </p>
                </div>

                {note.tags && note.tags.length > 0 && (
                  <p className="pt-3 border-t border-[#EFECE2] dark:border-[#1B2E28] text-xs text-[#6B7280] dark:text-[#8CA39A]">
                    Topik: {note.tags.join(' · ')}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
