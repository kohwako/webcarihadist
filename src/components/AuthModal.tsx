import React, { useState } from 'react';
import { AlertCircle, Lock, Mail, User as UserIcon, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { IslamicBrandMark } from './Layout';

export const AuthModal: React.FC = () => {
  const { authModalOpen, setAuthModalOpen, loginWithGoogle, loginWithEmail, registerWithEmail } =
    useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showProviderGuide, setShowProviderGuide] = useState(false);

  if (!authModalOpen) return null;

  const mapAuthError = (err: unknown) => {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/operation-not-allowed') {
      setShowProviderGuide(true);
      return 'Metode Email & Password belum diaktifkan di Firebase Console proyek Anda. Anda dapat langsung menggunakan Masuk dengan Google di bawah, atau aktifkan Email/Password di Firebase Console.';
    }
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'Email atau kata sandi tidak sesuai. Periksa kembali data masuk Anda.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'Email ini sudah terdaftar. Silakan beralih ke tab Masuk.';
    }
    if (code === 'auth/weak-password') {
      return 'Kata sandi minimal terdiri dari 6 karakter.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Jendela masuk Google ditutup sebelum selesai.';
    }
    return (err as Error)?.message || 'Gagal memproses autentikasi. Silakan coba lagi.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setShowProviderGuide(false);
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        if (!name.trim()) {
          setErrorMsg('Nama lengkap wajib diisi.');
          setLoading(false);
          return;
        }
        await registerWithEmail(name, email, password);
      }
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setErrorMsg(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setErrorMsg(null);
    setShowProviderGuide(false);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setErrorMsg(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={() => setAuthModalOpen(false)}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4 border-b border-[#E7E5DC] dark:border-[#1E332D]">
          <div className="flex items-center gap-3">
            <IslamicBrandMark className="w-9 h-9 shrink-0" />
            <div>
              <h2 className="font-display text-lg font-bold text-[#064E3B] dark:text-[#E8EFEA]">
                {mode === 'login' ? 'Masuk ke Akun Anda' : 'Buat Akun Baru'}
              </h2>
              <p className="text-xs text-[#5A6572] dark:text-[#93A8A0]">
                Simpan ayat favorit, hadis, folder koleksi, dan catatan pribadi.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAuthModalOpen(false)}
            aria-label="Tutup jendela masuk"
            className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F3F1E8] dark:hover:bg-[#182925]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#F3F1E8] dark:bg-[#182925]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`py-2 text-sm font-medium rounded-lg transition-colors ${
                mode === 'login'
                  ? 'bg-white dark:bg-[#087A59] text-[#064E3B] dark:text-white shadow-xs'
                  : 'text-[#5A6572] dark:text-[#93A8A0]'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`py-2 text-sm font-medium rounded-lg transition-colors ${
                mode === 'register'
                  ? 'bg-white dark:bg-[#087A59] text-[#064E3B] dark:text-white shadow-xs'
                  : 'text-[#5A6572] dark:text-[#93A8A0]'
              }`}
            >
              Registrasi
            </button>
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-3.5 text-xs text-red-800 dark:text-red-200 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
              {showProviderGuide && (
                <p className="pl-6 text-[11px] text-red-700/90 dark:text-red-300/90">
                  Panduan: Buka Firebase Console → Authentication → Sign-in method → Tambahkan provider <strong>Email/Password</strong> lalu klik Enable.
                </p>
              )}
            </div>
          )}

          {/* Google Sign-In (Ready Out of the Box) */}
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleGoogle()}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-[#D9D6CA] dark:border-[#264038] bg-white dark:bg-[#162722] hover:bg-[#FAF9F5] dark:hover:bg-[#1C322B] text-sm font-medium text-[#1F2937] dark:text-[#E8EFEA] transition-colors disabled:opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.54-5.17 3.54-8.87Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.95H1.28v3.09A12 12 0 0 0 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.29A7.18 7.18 0 0 1 4.9 12c0-.79.14-1.56.38-2.29V6.62H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.38l4-3.09Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.77c1.76 0 3.34.61 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l4 3.09c.95-2.84 3.6-4.94 6.72-4.94Z"
              />
            </svg>
            <span>Lanjutkan dengan Google</span>
          </button>

          <div className="relative flex items-center">
            <div className="flex-1 border-t border-[#E7E5DC] dark:border-[#1E332D]" />
            <span className="px-3 text-xs text-[#6B7280] dark:text-[#8CA39A]">
              atau dengan email &amp; kata sandi
            </span>
            <div className="flex-1 border-t border-[#E7E5DC] dark:border-[#1E332D]" />
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-[#374151] dark:text-[#C5D5CE] mb-1.5">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ahmad Fauzi"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D9D6CA] dark:border-[#243B34] bg-[#FAF9F5] dark:bg-[#0E1916] text-sm focus:outline-none focus:border-[#087A59]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#374151] dark:text-[#C5D5CE] mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D9D6CA] dark:border-[#243B34] bg-[#FAF9F5] dark:bg-[#0E1916] text-sm focus:outline-none focus:border-[#087A59]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] dark:text-[#C5D5CE] mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D9D6CA] dark:border-[#243B34] bg-[#FAF9F5] dark:bg-[#0E1916] text-sm focus:outline-none focus:border-[#087A59]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#087A59] hover:bg-[#064E3B] text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {loading
                ? 'Memproses...'
                : mode === 'login'
                  ? 'Masuk dengan Email'
                  : 'Daftar Akun Baru'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
