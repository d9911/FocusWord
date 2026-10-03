// Optional screenshot task. Uses a local Chrome/Chromium executable, no npm dependencies.
import { createServer } from 'node:http';
import { readFile, mkdir, mkdtemp, rm, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve, extname, join, sep } from 'node:path';
import { tmpdir } from 'node:os';

const candidates = [
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
].filter(Boolean);
let executable;
for (const candidate of candidates) {
  try {
    await access(candidate);
    executable = candidate;
    break;
  } catch {
    /* Try the next installed browser. */
  }
}
if (!executable) throw new Error('Set CHROME_BIN to your installed Chrome/Chromium executable.');
const root = resolve('dist');
await access(join(root, 'index.html'));
const output = resolve('docs/images/app.png');
await mkdir(resolve('docs/images'), { recursive: true });
const profile = await mkdtemp(join(tmpdir(), 'focusword-screenshot-'));
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
};
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + sep)) {
      response.writeHead(403).end();
      return;
    }
    const bytes = await readFile(file);
    response.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' });
    response.end(bytes);
  } catch {
    response.writeHead(404).end();
  }
});
try {
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const { port } = server.address();
  const child = spawn(
    executable,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${profile}`,
      '--window-size=1440,1100',
      '--hide-scrollbars',
      '--virtual-time-budget=3000',
      `--screenshot=${output}`,
      `http://127.0.0.1:${port}/?demo=1&lang=en`,
    ],
    { stdio: 'ignore' },
  );
  await new Promise((done, reject) => {
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? done() : reject(new Error(`Chrome exited with ${code}`))));
  });
  console.log(`Saved ${output}`);
} finally {
  await new Promise((done) => server.close(done));
  await rm(profile, { recursive: true, force: true });
}
