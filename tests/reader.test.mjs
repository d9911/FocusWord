import assert from 'node:assert/strict';
import test from 'node:test';
import { Reader, tokenize, splitWord, duration } from '../src/reader.ts';

function setup() {
  let pending;
  let delay;
  const reader = new Reader(() => {}, {
    set(callback, milliseconds) {
      pending = callback;
      delay = milliseconds;
      return callback;
    },
    clear() {
      pending = undefined;
    },
  });
  return {
    reader,
    delay: () => delay,
    pending: () => Boolean(pending),
    tick() {
      const callback = pending;
      pending = undefined;
      callback?.();
    },
  };
}

test('whitespace separates words without removing punctuation or Unicode', () => {
  assert.deepEqual(tokenize('  «Привет,»\nмир!\t👩‍💻  '), ['«Привет,»', 'мир!', '👩‍💻']);
  assert.deepEqual(tokenize(' \n\t'), []);
  assert.deepEqual(splitWord('«Привет,»', 'third'), ['«Пр', 'и', 'вет,»']);
  assert.deepEqual(splitWord('я!', 'third'), ['', 'я', '!']);
  assert.deepEqual(splitWord('длинноеслово', 'adaptive'), ['дли', 'н', 'ноеслово']);
  assert.deepEqual(splitWord('e\u0301lan', 'third'), ['e\u0301l', 'a', 'n']);
  assert.deepEqual(splitWord('👩‍💻', 'third'), ['', '👩‍💻', '']);
});

test('300 wpm is 200 ms; sentence and long-word delays are additive', () => {
  const settings = { wpm: 300, punctuation: true, longWords: true };
  assert.equal(duration('мир', settings), 200);
  assert.equal(duration('мир,', settings), 300);
  assert.equal(duration('«мир!»', settings), 400);
  assert.equal(duration('длинноеслово!', settings), 500);
  assert.equal(duration('длинноеслово!', { ...settings, punctuation: false, longWords: false }), 200);
});

test('every word including the last receives its full interval; replay starts at first', () => {
  const s = setup();
  s.reader.load('раз два');
  s.reader.play();
  assert.equal(s.reader.index, 0);
  assert.equal(s.delay(), 200);
  s.tick();
  assert.equal(s.reader.index, 1);
  assert.equal(s.reader.playing, true);
  assert.equal(s.reader.completed, false);
  s.tick();
  assert.equal(s.reader.completed, true);
  assert.equal(s.reader.playing, false);
  assert.equal(s.pending(), false);
  s.reader.play();
  assert.equal(s.reader.index, 0);
  assert.equal(s.reader.completed, false);
});

test('pause, seek, restart and text replacement cancel scheduled playback', () => {
  const s = setup();
  s.reader.load('one two three');
  s.reader.play();
  s.tick();
  s.reader.pause();
  s.tick();
  assert.equal(s.reader.index, 1);
  s.reader.play();
  s.reader.seek(99);
  s.tick();
  assert.equal(s.reader.index, 2);
  assert.equal(s.reader.playing, false);
  s.reader.seek(-1);
  assert.equal(s.reader.index, 0);
  s.reader.seek(1);
  s.reader.play();
  s.reader.restart();
  s.tick();
  assert.equal(s.reader.index, 0);
  s.reader.play();
  s.reader.load('replacement');
  s.tick();
  assert.deepEqual(s.reader.words, ['replacement']);
  assert.equal(s.reader.index, 0);
  s.reader.load('');
  s.reader.play();
  assert.equal(s.reader.playing, false);
  assert.equal(s.pending(), false);
});

test('speed change replaces the pending interval and single-word text completes', () => {
  const s = setup();
  s.reader.load('one');
  s.reader.play();
  s.reader.configure({ wpm: 600, punctuation: false, longWords: false });
  assert.equal(s.delay(), 100);
  s.tick();
  assert.equal(s.reader.completed, true);
  assert.equal(s.reader.index, 0);
});
