import './style.css';
import { setupUI, t } from './ui.ts';
import { setupPWA } from './pwa.ts';
import { Reader, splitWord } from './reader.ts';
import type { AnchorMode } from './types/reader.ts';

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing element: ${id}`);
  return found as T;
}
const text = element<HTMLTextAreaElement>('text');
const progress = element<HTMLInputElement>('progress');
const play = element<HTMLButtonElement>('play');
const stage = element('stage');
const speed = element<HTMLInputElement>('speed');
const speedRange = element<HTMLInputElement>('speed-range');
const size = element<HTMLInputElement>('size');
const anchor = element<HTMLSelectElement>('anchor');
const punctuation = element<HTMLInputElement>('punctuation');
const longWords = element<HTMLInputElement>('long-words');
const before = element('before');
const pivot = element('pivot');
const after = element('after');
const back = element<HTMLButtonElement>('back');
const next = element<HTMLButtonElement>('next');
const restart = element<HTMLButtonElement>('restart');
const count = element('count');
const status = element('status');

const reader = new Reader(render);
function render(): void {
  const word = reader.words[reader.index] ?? '';
  const parts = splitWord(word, anchor.value as AnchorMode);
  before.textContent = parts[0];
  pivot.textContent = parts[1] || '·';
  after.textContent = parts[2];
  stage.setAttribute('aria-label', word ? `${t('word')}: ${word}` : t('empty'));
  progress.max = String(Math.max(0, reader.words.length - 1));
  progress.value = String(reader.index);
  progress.disabled = reader.words.length < 2;
  count.textContent = `${reader.words.length ? reader.index + 1 : 0} / ${reader.words.length}`;
  status.textContent = reader.completed ? t('completed') : reader.playing ? t('reading') : reader.words.length ? t('paused') : t('empty');
  play.textContent = reader.playing ? t('pause') : reader.completed ? t('replay') : t('play');
  play.disabled = restart.disabled = !reader.words.length;
  back.disabled = !reader.words.length || reader.index === 0;
  next.disabled = !reader.words.length || reader.index === reader.words.length - 1;
  document.querySelector('.reader-panel')?.classList.toggle('playing', reader.playing);
  fitWord();
}

function bounded(input: HTMLInputElement, fallback: number): number {
  const value = input.valueAsNumber;
  return Number.isFinite(value) ? Math.min(Number(input.max), Math.max(Number(input.min), value)) : fallback;
}
function configure(): void {
  const wpm = Math.round(bounded(speed, 300));
  speed.value = speedRange.value = String(wpm);
  reader.configure({ wpm, punctuation: punctuation.checked, longWords: longWords.checked });
}
function fitWord(): void {
  const requested = bounded(size, 48);
  stage.style.setProperty('--word-size', `${requested}px`);
  const left = before.getBoundingClientRect().width;
  const right = after.getBoundingClientRect().width;
  const middle = pivot.getBoundingClientRect().width;
  const available = Math.max(1, stage.clientWidth / 2 - 20);
  const extent = Math.max(left, right) + middle / 2;
  if (extent > available) stage.style.setProperty('--word-size', `${(requested * available) / extent}px`);
}
const toggle = (): void => (reader.playing ? reader.pause() : reader.play());
play.addEventListener('click', toggle);
back.addEventListener('click', () => reader.seek(reader.index - 1));
next.addEventListener('click', () => reader.seek(reader.index + 1));
restart.addEventListener('click', () => reader.restart());
progress.addEventListener('input', () => reader.seek(progress.valueAsNumber));
text.addEventListener('input', () => reader.load(text.value));
speed.addEventListener('input', () => {
  if (Number.isFinite(speed.valueAsNumber) && speed.valueAsNumber >= 60 && speed.valueAsNumber <= 1000) configure();
});
speed.addEventListener('change', configure);
speed.addEventListener('blur', configure);
speedRange.addEventListener('input', () => {
  speed.value = speedRange.value;
  configure();
});
element('speed-down').addEventListener('click', () => {
  speed.value = String(bounded(speed, 300) - 10);
  configure();
});
element('speed-up').addEventListener('click', () => {
  speed.value = String(bounded(speed, 300) + 10);
  configure();
});
punctuation.addEventListener('change', configure);
longWords.addEventListener('change', configure);
size.addEventListener('input', fitWord);
const normalizeSize = (): void => {
  size.value = String(bounded(size, 48));
  fitWord();
};
size.addEventListener('change', normalizeSize);
size.addEventListener('blur', normalizeSize);
anchor.addEventListener('change', render);
new ResizeObserver(fitWord).observe(stage);
element('example').addEventListener('click', () => {
  text.value = t('exampleText');
  reader.load(text.value);
});
document.addEventListener('keydown', (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && (target.closest('input, textarea, select, button, a, details') || target.isContentEditable)) return;
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.code === 'Space') {
    event.preventDefault();
    toggle();
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    reader.seek(reader.index + (event.key === 'ArrowLeft' ? -1 : 1));
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && reader.playing) reader.pause();
});
setupUI(render);
setupPWA();
render();

if (new URLSearchParams(location.search).get('demo') === '1') {
  text.value = t('exampleText');
  reader.load(text.value);
}
