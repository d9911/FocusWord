import assert from 'node:assert/strict';
import test from 'node:test';
import { readLocal, saveLocal, resolveLanguage, resolveTheme } from '../src/storage.ts';

test('first visit follows browser language and defaults to the system theme; valid saved choices take priority', () => {
  assert.equal(resolveLanguage(null, ['fr-FR', 'es-MX', 'en-US']), 'es');
  assert.equal(resolveLanguage(null, ['RU-ru']), 'ru');
  assert.equal(resolveLanguage('es', ['ru-RU']), 'es');
  assert.equal(resolveLanguage('invalid', ['ja-JP']), 'en');
  assert.equal(resolveTheme(null), 'system');
  assert.equal(resolveTheme('invalid'), 'system');
  assert.equal(resolveTheme('system'), 'system');
  assert.equal(resolveTheme('dark'), 'dark');
});

test('text, including whitespace and empty edits, survives reload reads; unavailable storage fails without crashing', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map();
  try {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
      },
    });
    const draft = '  «Привет!»\n👩‍💻 café  ';
    assert.equal(saveLocal('text', draft), true);
    assert.equal(readLocal('text'), draft);
    assert.equal(values.get('focusword:text'), draft);
    saveLocal('text', '');
    assert.equal(readLocal('text'), '');
    values.clear();
    assert.equal(readLocal('text'), null);
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('Storage is blocked');
      },
    });
    assert.equal(readLocal('text'), null);
    assert.equal(saveLocal('text', draft), false);
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => null,
        setItem: () => {
          throw new Error('Quota exceeded');
        },
      },
    });
    assert.equal(saveLocal('text', draft), false);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else delete globalThis.localStorage;
  }
});
