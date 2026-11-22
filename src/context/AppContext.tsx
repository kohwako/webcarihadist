import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { clampStr, makeSafeDocId } from '../lib/utils';
import {
  ArabicFontSize,
  AudioTrack,
  BookmarkDoc,
  CollectionFolderDoc,
  QariId,
  SearchHistoryDoc,
  StudyNoteDoc,
  UserProfileDoc,
} from '../types/islamic';

export interface ToastMessage {
  id: string;
  message: string;
  variant: 'success' | 'info' | 'error';
}

export interface BookmarkInput {
  type: 'quran' | 'hadith';
  refKey: string;
  folderId?: string;
  title: string;
  subtitle: string;
  arabicText: string;
  translationText: string;
  sourceLabel: string;
  surahNumber?: number;
  ayahNumber?: number;
  hadithBook?: string;
  hadithNumber?: number;
}

export interface NoteInput {
  id?: string;
  title: string;
  content: string;
  linkedType: 'none' | 'quran' | 'hadith';
  linkedRefKey: string;
  linkedLabel: string;
  tags: string[];
}

interface AppContextValue {
  // Auth
  user: User | null;
  authReady: boolean;
  isVerified: boolean;
  profile: UserProfileDoc | null;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshVerificationStatus: () => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserDisplayName: (displayName: string) => Promise<void>;

  // Preferences
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  arabicFontSize: ArabicFontSize;
  setArabicFontSize: (size: ArabicFontSize) => void;
  qariId: QariId;
  setQariId: (qari: QariId) => void;

  // Collections & Notes & History
  folders: CollectionFolderDoc[];
  bookmarks: BookmarkDoc[];
  notes: StudyNoteDoc[];
  searchHistory: SearchHistoryDoc[];
  isBookmarked: (refKey: string) => boolean;
  getBookmarkByRef: (refKey: string) => BookmarkDoc | undefined;
  toggleBookmark: (input: BookmarkInput) => Promise<boolean>;
  moveBookmarkFolder: (bookmarkId: string, folderId: string) => Promise<void>;
  removeBookmark: (bookmarkId: string) => Promise<void>;
  createFolder: (name: string, description: string) => Promise<void>;
  updateFolder: (folderId: string, name: string, description: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  saveNote: (input: NoteInput) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  recordSearchHistory: (queryText: string, scope: 'all' | 'quran' | 'hadith') => Promise<void>;
  deleteSearchHistoryItem: (id: string) => Promise<void>;
  clearSearchHistory: () => Promise<void>;

  // Audio Player
  activeTrack: AudioTrack | null;
  isAudioPlaying: boolean;
  audioProgress: number;
  audioDuration: number;
  playTrack: (track: AudioTrack) => void;
  toggleAudioPlay: () => void;
  seekAudio: (seconds: number) => void;
  stopAudio: () => void;

  // Toasts
  toasts: ToastMessage[];
  showToast: (message: string, variant?: 'success' | 'info' | 'error') => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const LOCAL_HISTORY_KEY = 'qh_guest_search_history_v1';
const LOCAL_THEME_KEY = 'qh_theme_v1';
const LOCAL_FONT_KEY = 'qh_arabic_font_v1';
const LOCAL_QARI_KEY = 'qh_qari_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfileDoc | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(LOCAL_THEME_KEY);
    return saved === 'dark' ? 'dark' : 'light';
  });
  const [arabicFontSize, setArabicFontSizeState] = useState<ArabicFontSize>(() => {
    const saved = localStorage.getItem(LOCAL_FONT_KEY) as ArabicFontSize | null;
    return saved && ['sm', 'md', 'lg', 'xl'].includes(saved) ? saved : 'md';
  });
  const [qariId, setQariIdState] = useState<QariId>(() => {
    const saved = localStorage.getItem(LOCAL_QARI_KEY) as QariId | null;
    return saved && ['01', '02', '03', '04', '05', '06'].includes(saved) ? saved : '05';
  });

  const [folders, setFolders] = useState<CollectionFolderDoc[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkDoc[]>([]);
  const [notes, setNotes] = useState<StudyNoteDoc[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryDoc[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
      return raw ? (JSON.parse(raw) as SearchHistoryDoc[]) : [];
    } catch {
      return [];
    }
  });

  // Audio player state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeTrack, setActiveTrack] = useState<AudioTrack | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // Toast state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (message: string, variant: 'success' | 'info' | 'error' = 'success') => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(LOCAL_THEME_KEY, theme);
  }, [theme]);

  // Setup persistent HTMLAudioElement
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audioRef.current = audio;

    const onTimeUpdate = () => setAudioProgress(audio.currentTime || 0);
    const onLoadedMetadata = () => setAudioDuration(audio.duration || 0);
    const onEnded = () => {
      setIsAudioPlaying(false);
      setAudioProgress(0);
    };
    const onError = () => {
      setIsAudioPlaying(false);
      showToast('Audio murottal tidak dapat diputar saat ini.', 'error');
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [showToast]);

  const playTrack = useCallback(
    (track: AudioTrack) => {
      const audio = audioRef.current;
      if (!audio || !track.url) return;

      if (activeTrack?.id === track.id) {
        if (isAudioPlaying) {
          audio.pause();
          setIsAudioPlaying(false);
        } else {
          void audio.play().then(() => setIsAudioPlaying(true)).catch(() => {
            showToast('Gagal memutar audio murottal.', 'error');
          });
        }
        return;
      }

      audio.pause();
      audio.src = track.url;
      audio.currentTime = 0;
      setActiveTrack(track);
      setAudioProgress(0);
      setAudioDuration(0);
      void audio
        .play()
        .then(() => setIsAudioPlaying(true))
        .catch(() => {
          setIsAudioPlaying(false);
          showToast('Gagal memulai pemutaran murottal.', 'error');
        });
    },
    [activeTrack, isAudioPlaying, showToast]
  );

  const toggleAudioPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !activeTrack) return;
    if (isAudioPlaying) {
      audio.pause();
      setIsAudioPlaying(false);
    } else {
      void audio.play().then(() => setIsAudioPlaying(true)).catch(() => {
        showToast('Gagal melanjutkan pemutaran murottal.', 'error');
      });
    }
  }, [activeTrack, isAudioPlaying, showToast]);

  const seekAudio = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setAudioProgress(seconds);
  }, []);

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsAudioPlaying(false);
    setActiveTrack(null);
    setAudioProgress(0);
    setAudioDuration(0);
  }, []);

  // Ensure parent user document exists in Firestore (required by Master Gate rules)
  const ensureUserProfile = useCallback(
    async (firebaseUser: User): Promise<boolean> => {
      if (!firebaseUser.emailVerified) return false;
      const userPath = `users/${firebaseUser.uid}`;
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      try {
        const snap = await getDoc(userDocRef);
        if (!snap.exists()) {
          const payload: Record<string, unknown> = {
            uid: firebaseUser.uid,
            displayName: clampStr(
              firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Pengguna',
              120
            ),
            email: clampStr(firebaseUser.email || 'user@example.com', 254),
            theme,
            arabicFontSize,
            qariId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          if (firebaseUser.photoURL) {
            payload.photoURL = clampStr(firebaseUser.photoURL, 500);
          }
          await setDoc(userDocRef, payload);
        }
        return true;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, userPath);
      }
    },
    [arabicFontSize, qariId, theme]
  );

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setUser(fbUser);
      setAuthReady(true);
      if (fbUser && fbUser.emailVerified) {
        void ensureUserProfile(fbUser).catch((err) => {
          console.error('Ensure profile failed:', err);
        });
      }
      if (!fbUser) {
        setProfile(null);
        setFolders([]);
        setBookmarks([]);
        setNotes([]);
        try {
          const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
          setSearchHistory(raw ? (JSON.parse(raw) as SearchHistoryDoc[]) : []);
        } catch {
          setSearchHistory([]);
        }
      }
    });
    return () => unsub();
  }, [ensureUserProfile]);

  // Real-time Firestore listeners (attached strictly when authReady && user)
  useEffect(() => {
    if (!authReady || !user) return;
    const uid = user.uid;

    const userPath = `users/${uid}`;
    const unsubProfile = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserProfileDoc;
          setProfile(data);
          if (data.theme === 'light' || data.theme === 'dark') {
            setThemeState(data.theme);
          }
          if (data.arabicFontSize && ['sm', 'md', 'lg', 'xl'].includes(data.arabicFontSize)) {
            setArabicFontSizeState(data.arabicFontSize);
          }
          if (data.qariId && ['01', '02', '03', '04', '05', '06'].includes(data.qariId)) {
            setQariIdState(data.qariId);
          }
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, userPath);
      }
    );

    const foldersPath = `users/${uid}/folders`;
    const unsubFolders = onSnapshot(
      query(collection(db, foldersPath), where('userId', '==', uid)),
      (snap) => {
        const list: CollectionFolderDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CollectionFolderDoc, 'id'>),
        }));
        setFolders(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, foldersPath);
      }
    );

    const bookmarksPath = `users/${uid}/bookmarks`;
    const unsubBookmarks = onSnapshot(
      query(collection(db, bookmarksPath), where('userId', '==', uid)),
      (snap) => {
        const list: BookmarkDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<BookmarkDoc, 'id'>),
        }));
        list.sort((a, b) => {
          const tA = (a.createdAt as { seconds?: number } | undefined)?.seconds || 0;
          const tB = (b.createdAt as { seconds?: number } | undefined)?.seconds || 0;
          return tB - tA;
        });
        setBookmarks(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, bookmarksPath);
      }
    );

    const notesPath = `users/${uid}/notes`;
    const unsubNotes = onSnapshot(
      query(collection(db, notesPath), where('userId', '==', uid)),
      (snap) => {
        const list: StudyNoteDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<StudyNoteDoc, 'id'>),
        }));
        list.sort((a, b) => {
          const tA = (a.updatedAt as { seconds?: number } | undefined)?.seconds || 0;
          const tB = (b.updatedAt as { seconds?: number } | undefined)?.seconds || 0;
          return tB - tA;
        });
        setNotes(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, notesPath);
      }
    );

    const historyPath = `users/${uid}/searchHistory`;
    const unsubHistory = onSnapshot(
      query(collection(db, historyPath), where('userId', '==', uid)),
      (snap) => {
        const list: SearchHistoryDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<SearchHistoryDoc, 'id'>),
        }));
        list.sort((a, b) => {
          const tA = (a.createdAt as { seconds?: number } | undefined)?.seconds || 0;
          const tB = (b.createdAt as { seconds?: number } | undefined)?.seconds || 0;
          return tB - tA;
        });
        setSearchHistory(list.slice(0, 20));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, historyPath);
      }
    );

    return () => {
      unsubProfile();
      unsubFolders();
      unsubBookmarks();
      unsubNotes();
      unsubHistory();
    };
  }, [authReady, user]);

  // Auth Actions
  const loginWithGoogle = useCallback(async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    await ensureUserProfile(cred.user);
    setAuthModalOpen(false);
    showToast(`Assalamu'alaikum, ${cred.user.displayName || 'Selamat datang'}!`, 'success');
  }, [ensureUserProfile, showToast]);

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (cred.user.emailVerified) {
        await ensureUserProfile(cred.user);
      }
      setAuthModalOpen(false);
      showToast('Berhasil masuk ke akun Anda.', 'success');
    },
    [ensureUserProfile, showToast]
  );

  const registerWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: clampStr(name, 120) });
      await sendEmailVerification(cred.user);
      setAuthModalOpen(false);
      showToast(
        'Akun berhasil dibuat. Cek kotak masuk email Anda untuk verifikasi agar penyimpanan cloud aktif.',
        'info'
      );
    },
    [showToast]
  );

  const resendVerificationEmail = useCallback(async () => {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser);
    showToast('Tautan verifikasi email telah dikirim ulang.', 'info');
  }, [showToast]);

  const refreshVerificationStatus = useCallback(async () => {
    if (!auth.currentUser) return false;
    await reload(auth.currentUser);
    const refreshed = auth.currentUser;
    setUser(refreshed ? ({ ...refreshed } as User) : null);
    if (refreshed?.emailVerified) {
      await ensureUserProfile(refreshed);
      showToast('Email Anda telah terverifikasi! Penyimpanan koleksi aktif.', 'success');
      return true;
    }
    showToast('Email belum terverifikasi. Silakan klik tautan pada email Anda.', 'info');
    return false;
  }, [ensureUserProfile, showToast]);

  const logout = useCallback(async () => {
    await signOut(auth);
    showToast('Anda telah keluar dari akun.', 'info');
  }, [showToast]);

  const syncPreferences = useCallback(
    async (next: { theme: 'light' | 'dark'; arabicFontSize: ArabicFontSize; qariId: QariId }) => {
      if (!auth.currentUser || !auth.currentUser.emailVerified) return;
      const uid = auth.currentUser.uid;
      const path = `users/${uid}`;
      try {
        await ensureUserProfile(auth.currentUser);
        await updateDoc(doc(db, 'users', uid), {
          theme: next.theme,
          arabicFontSize: next.arabicFontSize,
          qariId: next.qariId,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [ensureUserProfile]
  );

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      void syncPreferences({ theme: nextTheme, arabicFontSize, qariId }).catch(() => {});
      return nextTheme;
    });
  }, [arabicFontSize, qariId, syncPreferences]);

  const setArabicFontSize = useCallback(
    (size: ArabicFontSize) => {
      setArabicFontSizeState(size);
      localStorage.setItem(LOCAL_FONT_KEY, size);
      void syncPreferences({ theme, arabicFontSize: size, qariId }).catch(() => {});
    },
    [qariId, syncPreferences, theme]
  );

  const setQariId = useCallback(
    (qari: QariId) => {
      setQariIdState(qari);
      localStorage.setItem(LOCAL_QARI_KEY, qari);
      void syncPreferences({ theme, arabicFontSize, qariId: qari }).catch(() => {});
    },
    [arabicFontSize, syncPreferences, theme]
  );

  const updateUserDisplayName = useCallback(
    async (displayName: string) => {
      if (!auth.currentUser || !auth.currentUser.emailVerified) {
        showToast('Silakan masuk dan verifikasi akun terlebih dahulu.', 'error');
        return;
      }
      const cleanName = clampStr(displayName, 120);
      if (!cleanName) return;
      const uid = auth.currentUser.uid;
      const path = `users/${uid}`;
      try {
        await updateProfile(auth.currentUser, { displayName: cleanName });
        await ensureUserProfile(auth.currentUser);
        await updateDoc(doc(db, 'users', uid), {
          displayName: cleanName,
          updatedAt: serverTimestamp(),
        });
        showToast('Profil berhasil diperbarui.', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [ensureUserProfile, showToast]
  );

  // Guard helper for Firestore writes
  const requireVerifiedUser = useCallback((): User | null => {
    if (!auth.currentUser) {
      setAuthModalOpen(true);
      showToast('Masuk ke akun Anda untuk menyimpan koleksi dan catatan secara permanen.', 'info');
      return null;
    }
    if (!auth.currentUser.emailVerified) {
      showToast('Verifikasi email Anda terlebih dahulu untuk menyimpan data.', 'info');
      return null;
    }
    return auth.currentUser;
  }, [showToast]);

  // Bookmark operations
  const isBookmarked = useCallback(
    (refKey: string) => bookmarks.some((b) => b.refKey === refKey),
    [bookmarks]
  );

  const getBookmarkByRef = useCallback(
    (refKey: string) => bookmarks.find((b) => b.refKey === refKey),
    [bookmarks]
  );

  const toggleBookmark = useCallback(
    async (input: BookmarkInput): Promise<boolean> => {
      const currentUser = requireVerifiedUser();
      if (!currentUser) return false;

      const uid = currentUser.uid;
      const existing = bookmarks.find((b) => b.refKey === input.refKey);
      const docId = existing ? existing.id : makeSafeDocId('bm', input.refKey);
      const docPath = `users/${uid}/bookmarks/${docId}`;

      try {
        await ensureUserProfile(currentUser);
        if (existing) {
          await deleteDoc(doc(db, `users/${uid}/bookmarks`, existing.id));
          showToast('Dihapus dari Koleksi Saya.', 'info');
          return false;
        }

        const payload: Record<string, unknown> = {
          userId: uid,
          type: input.type,
          refKey: clampStr(input.refKey, 120),
          folderId: clampStr(input.folderId || '', 128),
          title: clampStr(input.title, 160),
          subtitle: clampStr(input.subtitle || '', 200),
          arabicText: clampStr(input.arabicText, 8000),
          translationText: clampStr(input.translationText, 8000),
          sourceLabel: clampStr(input.sourceLabel, 160),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        if (typeof input.surahNumber === 'number') payload.surahNumber = input.surahNumber;
        if (typeof input.ayahNumber === 'number') payload.ayahNumber = input.ayahNumber;
        if (input.hadithBook) payload.hadithBook = clampStr(input.hadithBook, 40);
        if (typeof input.hadithNumber === 'number') payload.hadithNumber = input.hadithNumber;

        await setDoc(doc(db, `users/${uid}/bookmarks`, docId), payload);
        showToast('Disimpan ke Koleksi Saya.', 'success');
        return true;
      } catch (err) {
        handleFirestoreError(err, existing ? OperationType.DELETE : OperationType.CREATE, docPath);
      }
    },
    [bookmarks, ensureUserProfile, requireVerifiedUser, showToast]
  );

  const moveBookmarkFolder = useCallback(
    async (bookmarkId: string, folderId: string) => {
      const currentUser = requireVerifiedUser();
      if (!currentUser) return;
      const uid = currentUser.uid;
      const docPath = `users/${uid}/bookmarks/${bookmarkId}`;
      try {
        await updateDoc(doc(db, `users/${uid}/bookmarks`, bookmarkId), {
          folderId: clampStr(folderId, 128),
          updatedAt: serverTimestamp(),
        });
        showToast('Folder koleksi diperbarui.', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, docPath);
      }
    },
    [requireVerifiedUser, showToast]
  );

  const removeBookmark = useCallback(
    async (bookmarkId: string) => {
      const currentUser = requireVerifiedUser();
      if (!currentUser) return;
      const uid = currentUser.uid;
      const docPath = `users/${uid}/bookmarks/${bookmarkId}`;
      try {
        await deleteDoc(doc(db, `users/${uid}/bookmarks`, bookmarkId));
        showToast('Bookmark dihapus.', 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, docPath);
      }
    },
    [requireVerifiedUser, showToast]
  );

  // Folder operations
  const createFolder = useCallback(
    async (name: string, description: string) => {
      const currentUser = requireVerifiedUser();
      if (!currentUser) return;
      const cleanName = clampStr(name, 80);
      if (!cleanName) return;
      const uid = currentUser.uid;
      const folderId = makeSafeDocId('fld');
      const docPath = `users/${uid}/folders/${folderId}`;
      try {
        await ensureUserProfile(currentUser);
        await setDoc(doc(db, `users/${uid}/folders`, folderId), {
          userId: uid,
          name: cleanName,
          description: clampStr(description, 240),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast(`Folder "${cleanName}" berhasil dibuat.`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, docPath);
      }
    },
    [ensureUserProfile, requireVerifiedUser, showToast]
  );

  const updateFolder = useCallback(
    async (folderId: string, name: string, description: string) => {
      const currentUser = requireVerifiedUser();
      if (!currentUser) return;
      const cleanName = clampStr(name, 80);
      if (!cleanName) return;
      const uid = currentUser.uid;
      const docPath = `users/${uid}/folders/${folderId}`;
      try {
        await updateDoc(doc(db, `users/${uid}/folders`, folderId), {
          name: cleanName,
          description: clampStr(description, 240),
          updatedAt: serverTimestamp(),
        });
        showToast('Folder berhasil diperbarui.', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, docPath);
      }
    },
    [requireVerifiedUser, showToast]
  );

  const deleteFolder = useCallback(
    async (folderId: string) => {
      const currentUser = requireVerifiedUser();
      if (!currentUser) return;
      const uid = currentUser.uid;
      const docPath = `users/${uid}/folders/${folderId}`;
      try {
        // Unassign bookmarks in this folder first
        const affected = bookmarks.filter((b) => b.folderId === folderId);
        await Promise.all(
          affected.map((b) =>
            updateDoc(doc(db, `users/${uid}/bookmarks`, b.id), {
              folderId: '',
              updatedAt: serverTimestamp(),
            })
          )
        );
        await deleteDoc(doc(db, `users/${uid}/folders`, folderId));
        showToast('Folder dihapus. Item di dalamnya tetap tersimpan di Koleksi Saya.', 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, docPath);
      }
    },
    [bookmarks, requireVerifiedUser, showToast]
  );

  // Note operations
  const saveNote = useCallback(
    async (input: NoteInput) => {
      const currentUser = requireVerifiedUser();
      if (!currentUser) return;
      const cleanTitle = clampStr(input.title, 160);
      const cleanContent = clampStr(input.content, 10000);
      if (!cleanTitle || !cleanContent) {
        showToast('Judul dan isi catatan wajib diisi.', 'error');
        return;
      }

      const cleanTags = input.tags
        .map((t) => clampStr(t, 40))
        .filter(Boolean)
        .slice(0, 8);

      const uid = currentUser.uid;
      const noteId = input.id || makeSafeDocId('note');
      const docPath = `users/${uid}/notes/${noteId}`;

      try {
        await ensureUserProfile(currentUser);
        if (input.id) {
          await updateDoc(doc(db, `users/${uid}/notes`, noteId), {
            title: cleanTitle,
            content: cleanContent,
            linkedType: input.linkedType,
            linkedRefKey: clampStr(input.linkedRefKey, 120),
            linkedLabel: clampStr(input.linkedLabel, 200),
            tags: cleanTags,
            updatedAt: serverTimestamp(),
          });
          showToast('Catatan diperbarui.', 'success');
        } else {
          await setDoc(doc(db, `users/${uid}/notes`, noteId), {
            userId: uid,
            title: cleanTitle,
            content: cleanContent,
            linkedType: input.linkedType,
            linkedRefKey: clampStr(input.linkedRefKey, 120),
            linkedLabel: clampStr(input.linkedLabel, 200),
            tags: cleanTags,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          showToast('Catatan baru disimpan.', 'success');
        }
      } catch (err) {
        handleFirestoreError(err, input.id ? OperationType.UPDATE : OperationType.CREATE, docPath);
      }
    },
    [ensureUserProfile, requireVerifiedUser, showToast]
  );

  const deleteNote = useCallback(
    async (noteId: string) => {
      const currentUser = requireVerifiedUser();
      if (!currentUser) return;
      const uid = currentUser.uid;
      const docPath = `users/${uid}/notes/${noteId}`;
      try {
        await deleteDoc(doc(db, `users/${uid}/notes`, noteId));
        showToast('Catatan dihapus.', 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, docPath);
      }
    },
    [requireVerifiedUser, showToast]
  );

  // Search history
  const recordSearchHistory = useCallback(
    async (queryText: string, scope: 'all' | 'quran' | 'hadith') => {
      const cleanQ = clampStr(queryText, 200);
      if (!cleanQ) return;

      if (!auth.currentUser || !auth.currentUser.emailVerified) {
        setSearchHistory((prev) => {
          const filtered = prev.filter(
            (item) => item.query.toLowerCase() !== cleanQ.toLowerCase()
          );
          const next: SearchHistoryDoc[] = [
            {
              id: makeSafeDocId('hist'),
              userId: 'guest',
              query: cleanQ,
              scope,
              createdAt: new Date().toISOString(),
            },
            ...filtered,
          ].slice(0, 15);
          localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(next));
          return next;
        });
        return;
      }

      const uid = auth.currentUser.uid;
      const histId = makeSafeDocId('hist', `${scope}_${cleanQ.toLowerCase().slice(0, 40)}`);
      const docPath = `users/${uid}/searchHistory/${histId}`;
      try {
        await ensureUserProfile(auth.currentUser);
        await deleteDoc(doc(db, `users/${uid}/searchHistory`, histId)).catch(() => {});
        await setDoc(doc(db, `users/${uid}/searchHistory`, histId), {
          userId: uid,
          query: cleanQ,
          scope,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        // Non-blocking history recording
        console.error('Failed to record search history:', err, docPath);
      }
    },
    [ensureUserProfile]
  );

  const deleteSearchHistoryItem = useCallback(async (id: string) => {
    if (!auth.currentUser || !auth.currentUser.emailVerified) {
      setSearchHistory((prev) => {
        const next = prev.filter((item) => item.id !== id);
        localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(next));
        return next;
      });
      return;
    }
    const uid = auth.currentUser.uid;
    const docPath = `users/${uid}/searchHistory/${id}`;
    try {
      await deleteDoc(doc(db, `users/${uid}/searchHistory`, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
  }, []);

  const clearSearchHistory = useCallback(async () => {
    if (!auth.currentUser || !auth.currentUser.emailVerified) {
      setSearchHistory([]);
      localStorage.removeItem(LOCAL_HISTORY_KEY);
      showToast('Riwayat pencarian dibersihkan.', 'info');
      return;
    }
    const uid = auth.currentUser.uid;
    try {
      await Promise.all(
        searchHistory.map((item) =>
          deleteDoc(doc(db, `users/${uid}/searchHistory`, item.id))
        )
      );
      showToast('Riwayat pencarian dibersihkan.', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}/searchHistory`);
    }
  }, [searchHistory, showToast]);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      authReady,
      isVerified: Boolean(user?.emailVerified),
      profile,
      authModalOpen,
      setAuthModalOpen,
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      resendVerificationEmail,
      refreshVerificationStatus,
      logout,
      updateUserDisplayName,
      theme,
      toggleTheme,
      arabicFontSize,
      setArabicFontSize,
      qariId,
      setQariId,
      folders,
      bookmarks,
      notes,
      searchHistory,
      isBookmarked,
      getBookmarkByRef,
      toggleBookmark,
      moveBookmarkFolder,
      removeBookmark,
      createFolder,
      updateFolder,
      deleteFolder,
      saveNote,
      deleteNote,
      recordSearchHistory,
      deleteSearchHistoryItem,
      clearSearchHistory,
      activeTrack,
      isAudioPlaying,
      audioProgress,
      audioDuration,
      playTrack,
      toggleAudioPlay,
      seekAudio,
      stopAudio,
      toasts,
      showToast,
      dismissToast,
    }),
    [
      activeTrack,
      arabicFontSize,
      audioDuration,
      audioProgress,
      authModalOpen,
      authReady,
      bookmarks,
      clearSearchHistory,
      createFolder,
      deleteFolder,
      deleteNote,
      deleteSearchHistoryItem,
      dismissToast,
      folders,
      getBookmarkByRef,
      isAudioPlaying,
      isBookmarked,
      loginWithEmail,
      loginWithGoogle,
      logout,
      moveBookmarkFolder,
      notes,
      playTrack,
      profile,
      qariId,
      recordSearchHistory,
      refreshVerificationStatus,
      registerWithEmail,
      removeBookmark,
      resendVerificationEmail,
      saveNote,
      searchHistory,
      seekAudio,
      setArabicFontSize,
      setQariId,
      showToast,
      stopAudio,
      theme,
      toasts,
      toggleAudioPlay,
      toggleBookmark,
      toggleTheme,
      updateFolder,
      updateUserDisplayName,
      user,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
