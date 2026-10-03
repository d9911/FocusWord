import { en, es, ru } from './locales.ts';
import type { Language, Theme, TranslationKey } from './types/ui.ts';

const translations = { en, es, ru };
export const languageNames = { en: 'English', es: 'Español', ru: 'Русский' };
let language: Language = 'ru';
export const t = (key: TranslationKey): string => translations[language][key];

function readPreference(key: string): string | null {
  try {
    return localStorage.getItem(`focusword:${key}`);
  } catch {
    return null;
  }
}
function savePreference(key: string, value: string): void {
  try {
    localStorage.setItem(`focusword:${key}`, value);
  } catch {
    /* Preferences still work when storage is unavailable. */
  }
}
export function setupUI(changed: () => void): void {
  const requestedLanguage = new URLSearchParams(location.search).get('lang');
  const stored = requestedLanguage && ['en', 'es', 'ru'].includes(requestedLanguage) ? requestedLanguage : readPreference('language');
  const browserLanguage = navigator.language.slice(0, 2);
  language =
    stored && ['en', 'es', 'ru'].includes(stored) ? (stored as Language) : ['en', 'es', 'ru'].includes(browserLanguage) ? (browserLanguage as Language) : 'en';
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
    savePreference('language', language);
    translate();
  });
  const themeMenu = document.querySelector<HTMLDetailsElement>('#theme-menu')!;
  const preference = readPreference('theme');
  let theme: Theme = preference === 'light' || preference === 'dark' ? preference : 'system';
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
    savePreference('theme', theme);
    applyTheme();
  });
  systemTheme.addEventListener('change', applyTheme);
  applyTheme();
  translate();

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
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

function setupDropdown(menu: HTMLDetailsElement, selector: string, selected: (value: string) => void): void {
  const summary = menu.querySelector('summary')!;
  const choices = Array.from(menu.querySelectorAll<HTMLButtonElement>(selector));
  choices.forEach((button) =>
    button.addEventListener('click', () => {
      selected(button.dataset.language ?? button.dataset.themeChoice ?? 'system');
      menu.open = false;
      summary.focus();
    }),
  );
  menu.addEventListener('toggle', () => {
    summary.setAttribute('aria-expanded', String(menu.open));
    if (menu.open)
      document.querySelectorAll<HTMLDetailsElement>('.language-menu').forEach((other) => {
        if (other !== menu) other.open = false;
      });
  });
  menu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      menu.open = false;
      summary.focus();
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      menu.open = true;
      const index = choices.indexOf(document.activeElement as HTMLButtonElement);
      const next =
        index < 0 ? (event.key === 'ArrowDown' ? 0 : choices.length - 1) : (index + (event.key === 'ArrowDown' ? 1 : -1) + choices.length) % choices.length;
      choices[next]?.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (event.target instanceof Node && !menu.contains(event.target)) menu.open = false;
  });
}
