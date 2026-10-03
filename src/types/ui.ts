export type Language = 'en' | 'es' | 'ru';
export type Theme = 'system' | 'light' | 'dark';
export type TranslationKey = keyof typeof import('../locales.ts').en;
