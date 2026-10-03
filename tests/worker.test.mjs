import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('generated worker serves assets with Vary: Origin offline and preserves other scopes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'focusword-worker-'));
  try {
    for (const [name, body] of Object.entries({ 'index.html': 'reader shell', 'app.js': 'player code', LICENSE: 'author terms' })) {
      await writeFile(join(directory, name), body);
    }
    execFileSync(process.execPath, [fileURLToPath(new URL('../scripts/build-pwa.mjs', import.meta.url)), directory]);
    const scope = 'https://example.test/reader/';
    const handlers = {};
    const content = new Map();
    const deleted = [];
    const cache = {
      async addAll(urls) {
        for (const url of urls)
          content.set(url, new Response(await readFile(join(directory, new URL(url).pathname.split('/').at(-1))), { headers: { Vary: 'Origin' } }));
      },
      async match(request, options) {
        const origin = typeof request === 'string' ? null : request.headers.get('Origin');
        // A precache request did not contain Origin; a module request does.
        if (origin && !options?.ignoreVary) return undefined;
        return content.get(typeof request === 'string' ? request : request.url)?.clone();
      },
    };
    vm.runInNewContext(await readFile(join(directory, 'sw.js'), 'utf8'), {
      URL,
      self: {
        registration: { scope },
        clients: { async claim() {} },
        addEventListener(name, handler) {
          handlers[name] = handler;
        },
      },
      caches: {
        async open() {
          return cache;
        },
        async keys() {
          return [`focusword:${scope}:old`, 'focusword:https://example.test/another/:old', 'unrelated-app'];
        },
        async delete(key) {
          deleted.push(key);
        },
      },
      fetch: async () => {
        throw new Error('Network is offline');
      },
    });
    let pending;
    handlers.install({
      waitUntil(promise) {
        pending = promise;
      },
    });
    await pending;
    handlers.activate({
      waitUntil(promise) {
        pending = promise;
      },
    });
    await pending;
    assert.deepEqual(deleted, [`focusword:${scope}:old`]);
    async function response(request) {
      let result;
      handlers.fetch({
        request,
        respondWith(promise) {
          result = promise;
        },
      });
      return result ? await (await result).text() : undefined;
    }
    assert.equal(await response(new Request(`${scope}app.js`, { headers: { Origin: 'https://example.test' } })), 'player code');
    assert.equal(await response(new Request(`${scope}LICENSE`)), 'author terms');
    assert.equal(await response({ method: 'GET', url: scope, mode: 'navigate' }), 'reader shell');
    assert.equal(await response(new Request('https://example.test/another/app.js')), undefined);
    assert.equal(await response(new Request(`${scope}app.js`, { method: 'POST' })), undefined);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
