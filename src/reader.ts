import type { AnchorMode, Settings, Clock } from './types/reader.ts';

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
export const characters = (word: string): string[] => Array.from(segmenter.segment(word), (part) => part.segment);
export const tokenize = (text: string): string[] => text.trim().split(/\s+/u).filter(Boolean);

export function splitWord(word: string, mode: AnchorMode): [string, string, string] {
  const chars = characters(word);
  const letters = chars.flatMap((char, index) => (/[\p{L}\p{N}]/u.test(char) ? [index] : []));
  const target = mode === 'third' ? 2 : Math.floor(letters.length / 4);
  const pivot = letters[Math.min(target, letters.length - 1)] ?? 0;
  return [chars.slice(0, pivot).join(''), chars[pivot] ?? '', chars.slice(pivot + 1).join('')];
}

export function duration(word: string, settings: Settings): number {
  const base = 60_000 / Math.max(60, Math.min(1000, settings.wpm));
  const length = characters(word).filter((char) => /[\p{L}\p{N}]/u.test(char)).length;
  const punctuation = settings.punctuation ? (/[.!?…][”’"')\]}»]*$/u.test(word) ? 1 : /[,;:—–][”’"')\]}»]*$/u.test(word) ? 0.5 : 0) : 0;
  return base * (1 + punctuation + (settings.longWords && length > 8 ? 0.5 : 0));
}

const clock: Clock = {
  set: (callback, delay) => globalThis.setTimeout(callback, delay),
  clear: (id) => globalThis.clearTimeout(id as ReturnType<typeof setTimeout>),
};

export class Reader {
  words: string[] = [];
  index = 0;
  playing = false;
  completed = false;
  settings: Settings = { wpm: 300, punctuation: true, longWords: true };
  private timer: unknown;

  private readonly changed: () => void;
  private readonly scheduler: Clock;

  constructor(changed: () => void, scheduler: Clock = clock) {
    this.changed = changed;
    this.scheduler = scheduler;
  }

  load(text: string): void {
    this.cancel();
    this.words = tokenize(text);
    this.index = 0;
    this.completed = false;
    this.changed();
  }

  play(): void {
    if (!this.words.length || this.playing) return;
    if (this.completed) this.index = 0;
    this.completed = false;
    this.playing = true;
    this.changed();
    this.schedule();
  }

  pause(): void {
    this.cancel();
    this.changed();
  }

  restart(): void {
    this.seek(0);
  }

  seek(index: number): void {
    this.cancel();
    this.index = Math.max(0, Math.min(this.words.length - 1, Math.trunc(index)));
    this.completed = false;
    this.changed();
  }

  configure(settings: Settings): void {
    this.settings = settings;
    if (this.playing) {
      this.scheduler.clear(this.timer);
      this.schedule();
    }
  }

  private cancel(): void {
    this.scheduler.clear(this.timer);
    this.playing = false;
  }

  private schedule(): void {
    this.timer = this.scheduler.set(
      () => {
        if (this.index < this.words.length - 1) {
          this.index += 1;
          this.changed();
          this.schedule();
        } else {
          this.playing = false;
          this.completed = true;
          this.changed();
        }
      },
      duration(this.words[this.index] ?? '', this.settings),
    );
  }
}
