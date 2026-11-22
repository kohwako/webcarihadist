import { ArabicFontSize } from '../types/islamic';

export function getArabicSizeClass(size: ArabicFontSize, isDetail = false): string {
  if (isDetail) {
    switch (size) {
      case 'sm':
        return 'text-2xl sm:text-3xl';
      case 'md':
        return 'text-3xl sm:text-4xl';
      case 'lg':
        return 'text-4xl sm:text-[2.6rem]';
      case 'xl':
        return 'text-[2.5rem] sm:text-5xl';
    }
  }
  switch (size) {
    case 'sm':
      return 'text-xl sm:text-2xl';
    case 'md':
      return 'text-2xl sm:text-[1.75rem]';
    case 'lg':
      return 'text-[1.75rem] sm:text-3xl';
    case 'xl':
      return 'text-3xl sm:text-[2.15rem]';
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function buildWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Generates a Firestore-safe document ID strictly matching ^[a-zA-Z0-9_\-]+$ (<= 128 chars).
 */
export function makeSafeDocId(prefix: string, rawKey?: string): string {
  const sanitized = rawKey
    ? rawKey.replace(/[^a-zA-Z0-9_-]/g, '_')
    : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const combined = `${prefix}_${sanitized}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  return combined.slice(0, 120);
}

export function clampStr(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
