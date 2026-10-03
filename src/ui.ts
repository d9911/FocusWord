import { readLocal, saveLocal, resolveLanguage, resolveTheme } from './storage.ts';
import { setupDropdown } from './dropdown.ts';
import { en, es, ru } from './locales.ts';
import type { Language, Theme, TranslationKey } from './types/ui.ts';

const translations = { en, es, ru };
export const languageNames = { en: 'English', es: 'Español', ru: 'Русский' };
let language: Language = 'ru';
export const t = (key: TranslationKey): string => translations[language][key];

export function setupUI(changed: () => void): void {
  const requestedLanguage = new URLSearchParams(location.search).get('lang');
  const demo = new URLSearchParams(location.search).get('demo') === '1';
  language = resolveLanguage(requestedLanguage ?? readLocal('language'), navigator.languages.length ? navigator.languages : [navigator.language]);
  if (!demo) saveLocal('language', language);
  const dropdown = document.querySelector<HTMLDetailsElement>('#language-menu')!;
  const choices = Array.from(dropdown.querySelectorAll<HTMLButtonElement>('[data-language]'));
  function translate(): void {
    document.documentElement.lang = language;
    document.title = t('title');
    document.querySelector<HTMLMetaElement>('meta[name="description"]')!.content = t('description');
    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
      el.textContent = t(el.dataset.i18n as TranslationKey);
    });
    document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((el) => {
      el.setAttribute('aria-label', t(el.dataset.i18nAria as TranslationKey));
    });
    document.querySelector<HTMLTextAreaElement>('#text')!.placeholder = t('placeholder');
    document.querySelector('#language-current')!.textContent = languageNames[language];
    choices.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
    document.querySelector('#theme-current')!.textContent = t(theme);
    changed();
  }
  setupDropdown(dropdown, '[data-language]', (value) => {
    language = value as Language;
    saveLocal('language', language);
    translate();
  });
  const themeMenu = document.querySelector<HTMLDetailsElement>('#theme-menu')!;
  let theme: Theme = resolveTheme(readLocal('theme'));
  saveLocal('theme', theme);
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  function applyTheme(): void {
    const effective = theme === 'system' ? (systemTheme.matches ? 'dark' : 'light') : theme;
    document.documentElement.dataset.theme = effective;
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')!.content = effective === 'dark' ? '#15171b' : '#f4f3ed';
    document.querySelector('#theme-current')!.textContent = t(theme);
    themeMenu.querySelectorAll<HTMLButtonElement>('[data-theme-choice]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme));
    });
  }
  setupDropdown(themeMenu, '[data-theme-choice]', (value) => {
    theme = value as Theme;
    saveLocal('theme', theme);
    applyTheme();
  });
  systemTheme.addEventListener('change', applyTheme);
  applyTheme();
  translate();

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!demo && !reducedMotion.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.1 },
    );
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      el.classList.add('reveal-ready');
      observer.observe(el);
    });
  }
  let frame = false;
  const scrollProgress = (): void => {
    const distance = document.documentElement.scrollHeight - innerHeight;
    document.documentElement.style.setProperty('--scroll-progress', String(distance > 0 ? scrollY / distance : 0));
    frame = false;
  };
  addEventListener(
    'scroll',
    () => {
      if (!frame) {
        frame = true;
        requestAnimationFrame(scrollProgress);
      }
    },
    { passive: true },
  );
  addEventListener('resize', scrollProgress);
  scrollProgress();
  document.querySelector('#copyright-year')!.textContent = String(new Date().getFullYear());
}
