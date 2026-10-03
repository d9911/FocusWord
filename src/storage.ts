import type { StorageKey } from './types/storage.ts';
import type { Language, Theme } from './types/ui.ts';

export function readLocal(key: StorageKey): string | null {
  try {
    return localStorage.getItem(`focusword:${key}`);
  } catch {
    return null;
  }
}
export function saveLocal(key: StorageKey, value: string): boolean {
  try {
    localStorage.setItem(`focusword:${key}`, value);
    return true;
  } catch {
    return false;
  }
}
export function resolveLanguage(stored: string | null, browserLanguages: readonly string[]): Language {
  if (stored === 'en' || stored === 'es' || stored === 'ru') return stored;
  for (const locale of browserLanguages) {
    const base = locale.toLowerCase().split('-')[0];
    if (base === 'en' || base === 'es' || base === 'ru') return base;
  }
  return 'en';
}
export function resolveTheme(stored: string | null): Theme {
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}
