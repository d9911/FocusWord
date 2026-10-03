// Optional artwork tool; Sharp is used only to rasterize our SVG, not by the app.
// Usage: node scripts/generate-icons.mjs /absolute/path/to/sharp/entry.js
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const modulePath = process.argv[2];
const { default: sharp } = await import(modulePath ? pathToFileURL(modulePath).href : 'sharp');
const root = new URL('../public/', import.meta.url);
const svg = await readFile(new URL('favicon.svg', root));
const sizes = [16, 32, 48, 72, 96, 128, 144, 152, 180, 192, 256, 384, 512, 1024];
await mkdir(new URL('icons/', root), { recursive: true });
const buffers = new Map();
for (const size of sizes) {
  const buffer = await sharp(svg).resize(size, size).png().toBuffer();
  await writeFile(new URL(`icons/icon-${size}x${size}.png`, root), buffer);
  buffers.set(size, buffer);
}
const paths = svg
  .toString()
  .replace(/<svg[^>]*>/, '')
  .replace('</svg>', '');
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#191c22"/><g transform="translate(8.96 8.96) scale(.72)">${paths}</g></svg>`;
await writeFile(new URL('icons/maskable.svg', root), maskable);
await sharp(Buffer.from(maskable)).resize(512, 512).png().toFile(new URL('icons/maskable-512x512.png', root).pathname);
// ICO container with 16/32/48 PNG images.
const icoSizes = [16, 32, 48];
const header = Buffer.alloc(6 + icoSizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icoSizes.length, 4);
let offset = header.length;
icoSizes.forEach((size, index) => {
  const data = buffers.get(size);
  const position = 6 + index * 16;
  header[position] = header[position + 1] = size;
  header.writeUInt16LE(1, position + 4);
  header.writeUInt16LE(32, position + 6);
  header.writeUInt32LE(data.length, position + 8);
  header.writeUInt32LE(offset, position + 12);
  offset += data.length;
});
await writeFile(new URL('favicon.ico', root), Buffer.concat([header, ...icoSizes.map((size) => buffers.get(size))]));
const manifest = {
  name: 'FocusWord',
  short_name: 'FocusWord',
  description: 'A word-by-word reader with adjustable speed and a fixed focal letter.',
  id: './',
  start_url: './',
  scope: './',
  display: 'standalone',
  background_color: '#f4f3ed',
  theme_color: '#252723',
  lang: 'en',
  icons: [
    ...sizes.map((size) => ({ src: `./icons/icon-${size}x${size}.png`, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any' })),
    { src: './icons/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};
await writeFile(new URL('manifest.webmanifest', root), JSON.stringify(manifest, null, 2) + '\n');
console.log('Created PNG icons, maskable artwork, ICO and FocusWord manifest.');
