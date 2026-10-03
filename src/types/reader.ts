export type AnchorMode = 'third' | 'adaptive';
export interface Settings {
  wpm: number;
  punctuation: boolean;
  longWords: boolean;
}
export interface Clock {
  set: (callback: () => void, delay: number) => unknown;
  clear: (id: unknown) => void;
}
