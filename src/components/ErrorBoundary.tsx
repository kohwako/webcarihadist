import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    let readable = 'Terjadi kesalahan saat memuat bagian ini.';
    try {
      const parsed = JSON.parse(error.message) as { error?: string; operationType?: string };
      if (parsed?.error) {
        readable = `Akses data (${parsed.operationType || 'operasi'}) gagal: ${parsed.error}`;
      }
    } catch {
      if (error?.message) readable = error.message;
    }
    return { hasError: true, errorMessage: readable };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] dark:bg-[#0B1412] p-6">
          <div className="max-w-md w-full rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] p-8 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#1F2937] dark:text-[#E8EFEA] mb-2">
              Terjadi Gangguan Aplikasi
            </h2>
            <p className="text-sm text-[#5A6572] dark:text-[#93A8A0] mb-6 leading-relaxed">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '' });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#087A59] hover:bg-[#064E3B] text-white text-sm font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
