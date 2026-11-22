import React from 'react';
import { Check, Copy, ExternalLink, MessageCircle, X } from 'lucide-react';
import { buildWhatsAppShareUrl, copyToClipboard } from '../lib/utils';
import { useApp } from '../context/AppContext';

export interface SharePayload {
  title: string;
  arabicText: string;
  translationText: string;
  reference: string;
  source: string;
}

interface ShareModalProps {
  payload: SharePayload | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ payload, onClose }) => {
  const { showToast } = useApp();
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  if (!payload) return null;

  const fullFormatted = `${payload.title}\n\n${payload.arabicText}\n\n"${payload.translationText}"\n\n— ${payload.reference}\nSumber: ${payload.source}`;

  const handleCopy = async (key: string, text: string, label: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      showToast(`${label} berhasil disalin.`, 'success');
      setTimeout(() => setCopiedKey(null), 2000);
    } else {
      showToast('Gagal menyalin teks ke clipboard.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#111E1B] border border-[#E7E5DC] dark:border-[#1E332D] shadow-2xl overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#E7E5DC] dark:border-[#1E332D]">
          <div>
            <h3 className="font-display font-bold text-base text-[#064E3B] dark:text-[#E8EFEA]">
              Salin &amp; Bagikan
            </h3>
            <p className="text-xs text-[#5A6572] dark:text-[#93A8A0]">{payload.reference}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F3F1E8] dark:hover:bg-[#182925]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Preview */}
          <div className="rounded-xl bg-[#FAF9F5] dark:bg-[#0D1815] border border-[#E7E5DC] dark:border-[#1E332D] p-4 max-h-48 overflow-y-auto space-y-2">
            <p className="font-arabic text-xl text-right text-[#1F2937] dark:text-[#E8EFEA] leading-loose">
              {payload.arabicText}
            </p>
            <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#B4C5BE] leading-relaxed">
              &ldquo;{payload.translationText}&rdquo;
            </p>
            <p className="text-[11px] text-[#6B7280] dark:text-[#8CA39A]">
              {payload.reference} · {payload.source}
            </p>
          </div>

          {/* Copy Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => void handleCopy('arabic', payload.arabicText, 'Teks Arab')}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[#D9D6CA] dark:border-[#243B34] hover:border-[#087A59] text-xs font-medium transition-colors"
            >
              {copiedKey === 'arabic' ? (
                <Check className="w-3.5 h-3.5 text-[#087A59]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>Salin Teks Arab</span>
            </button>

            <button
              type="button"
              onClick={() =>
                void handleCopy(
                  'translation',
                  `"${payload.translationText}" (${payload.reference})`,
                  'Terjemahan'
                )
              }
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[#D9D6CA] dark:border-[#243B34] hover:border-[#087A59] text-xs font-medium transition-colors"
            >
              {copiedKey === 'translation' ? (
                <Check className="w-3.5 h-3.5 text-[#087A59]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>Salin Terjemahan</span>
            </button>

            <button
              type="button"
              onClick={() => void handleCopy('full', fullFormatted, 'Teks Lengkap')}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[#D9D6CA] dark:border-[#243B34] hover:border-[#087A59] text-xs font-medium transition-colors"
            >
              {copiedKey === 'full' ? (
                <Check className="w-3.5 h-3.5 text-[#087A59]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>Salin Lengkap</span>
            </button>
          </div>

          {/* WhatsApp Share */}
          <a
            href={buildWhatsAppShareUrl(fullFormatted)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-[#087A59] hover:bg-[#064E3B] text-white text-sm font-semibold transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Bagikan ke WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        </div>
      </div>
    </div>
  );
};
