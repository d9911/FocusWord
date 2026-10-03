import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { dependencyState } from '../scripts/ensure-deps.mjs';

async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'focusword-deps-'));
  try {
    await writeFile(join(root, 'package.json'), JSON.stringify({ devDependencies: { vite: '8.3.2' } }));
    await writeFile(join(root, 'package-lock.json'), JSON.stringify({ packages: { 'node_modules/vite': { version: '8.3.2' } } }));
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function installed(root) {
  const state = await dependencyState(root);
  await mkdir(join(root, 'node_modules/vite'), { recursive: true });
  await writeFile(join(root, 'node_modules/vite/package.json'), JSON.stringify({ version: '8.3.2' }));
  await writeFile(join(root, 'node_modules/.focusword-install.json'), JSON.stringify({ fingerprint: state.fingerprint }));
}

test('launcher requires installation when modules are missing and reuses a matching installation', async () =>
  fixture(async (root) => {
    assert.equal((await dependencyState(root)).ready, false);
    await installed(root);
    assert.equal((await dependencyState(root)).ready, true);
    await rm(join(root, 'node_modules/vite'), { recursive: true });
    assert.equal((await dependencyState(root)).ready, false);
  }));

test('launcher detects stale dependency versions, changed locks and malformed markers', async () =>
  fixture(async (root) => {
    await installed(root);
    await writeFile(join(root, 'node_modules/vite/package.json'), JSON.stringify({ version: '8.0.0' }));
    assert.equal((await dependencyState(root)).ready, false);
    await installed(root);
    await writeFile(join(root, 'package-lock.json'), JSON.stringify({ packages: { 'node_modules/vite': { version: '8.3.3' } } }));
    assert.equal((await dependencyState(root)).ready, false);
    await writeFile(join(root, 'node_modules/.focusword-install.json'), '{');
    assert.equal((await dependencyState(root)).ready, false);
  }));
