import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { resetDevelopmentCache } from '../scripts/dev-cache.mjs';

test('development reset removes only the FocusWord worker and cache at the current scope', async () => {
  const scope = 'http://127.0.0.1:5174/';
  const unregistered = [];
  const removed = [];
  const registrations = [
    { scope, active: { scriptURL: scope + 'sw.js' }, unregister: async () => unregistered.push('focusword') },
    { scope: scope + 'other/', active: { scriptURL: scope + 'other/sw.js' }, unregister: async () => unregistered.push('other-scope') },
    { scope, active: { scriptURL: scope + 'unrelated.js' }, unregister: async () => unregistered.push('other-worker') },
  ];
  const context = vm.createContext({
    URL,
    location: { href: scope + '__focusword_dev__' },
    navigator: { serviceWorker: { getRegistrations: async () => registrations } },
    caches: {
      keys: async () => [`focusword:${scope}:old`, `focusword:${scope}other/:old`, 'unrelated'],
      delete: async (key) => removed.push(key),
    },
  });
  await vm.runInContext(`(${resetDevelopmentCache.toString()})()`, context);
  assert.deepEqual(unregistered, ['focusword']);
  assert.deepEqual(removed, [`focusword:${scope}:old`]);
});
