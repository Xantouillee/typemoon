import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TypingEngine } from './TypingEngine';
import { charsToWpm, accuracyFromStream, consistencyFromSeries } from './wpm';
import { generateWords } from './textGen';

// Drive performance.now() deterministically so timing-based metrics are testable.
let clock = 0;
beforeEach(() => {
  clock = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => clock);
});
afterEach(() => vi.restoreAllMocks());

function type(engine: TypingEngine, text: string, msPerChar = 100) {
  for (const ch of text) {
    clock += msPerChar;
    engine.press(ch);
  }
}

describe('charsToWpm', () => {
  it('computes standard WPM (chars/5 per minute)', () => {
    // 25 chars in 60s => 5 words => 5 wpm
    expect(charsToWpm(25, 60000)).toBeCloseTo(5);
    // 250 chars in 60s => 50 wpm
    expect(charsToWpm(250, 60000)).toBeCloseTo(50);
  });
  it('returns 0 for zero elapsed time', () => {
    expect(charsToWpm(10, 0)).toBe(0);
  });
});

describe('TypingEngine — perfect run', () => {
  it('marks all correct and finishes at end of target', () => {
    const engine = new TypingEngine('the quick');
    type(engine, 'the quick');
    expect(engine.finished).toBe(true);
    const r = engine.result();
    expect(r.correctChars).toBe(9);
    expect(r.incorrectChars).toBe(0);
    expect(r.accuracy).toBe(100);
  });

  it('computes WPM from elapsed time', () => {
    const engine = new TypingEngine('abcde'); // 5 chars = 1 word
    type(engine, 'abcde', 12000); // 5 * 12s = 60s total
    const r = engine.result();
    // first keystroke starts the clock, so elapsed = 4 * 12s = 48s
    expect(r.wpm).toBe(Math.round(charsToWpm(5, 48000)));
  });
});

describe('TypingEngine — errors and accuracy', () => {
  it('counts incorrect characters and lowers accuracy', () => {
    const engine = new TypingEngine('cat');
    type(engine, 'cot'); // middle char wrong
    const r = engine.result();
    expect(r.correctChars).toBe(2);
    expect(r.incorrectChars).toBe(1);
    expect(r.accuracy).toBeCloseTo((2 / 3) * 100, 1);
  });

  it('backspace clears state and restores accuracy on correction', () => {
    const engine = new TypingEngine('cat');
    clock += 100; engine.press('c');
    clock += 100; engine.press('o'); // wrong
    clock += 100; engine.backspace();
    clock += 100; engine.press('a'); // corrected
    clock += 100; engine.press('t');
    const snap = engine.snapshot();
    expect(snap.states).toEqual(['correct', 'correct', 'correct']);
    // accuracy is keystroke-based and unforgiving: 4 character presses (c,o,a,t),
    // 3 correct => 75%. Correcting the mistake fixes the text but not the accuracy.
    const r = engine.result();
    expect(r.accuracy).toBeCloseTo((3 / 4) * 100, 1);
  });
});

describe('TypingEngine — time limit', () => {
  it('finishes when the time limit is exceeded', () => {
    const engine = new TypingEngine('a b c d e f g h i j', { timeLimit: 1 });
    // 5 chars at 300ms => exceeds 1000ms during the run
    type(engine, 'a b c', 300);
    expect(engine.finished).toBe(true);
  });
});

describe('accuracyFromStream', () => {
  it('is 100 with no keystrokes', () => {
    expect(accuracyFromStream([])).toBe(100);
  });
});

describe('consistencyFromSeries', () => {
  it('is 100 for a perfectly even pace', () => {
    const series = [
      { t: 1, wpm: 40, raw: 40 },
      { t: 2, wpm: 40, raw: 40 },
      { t: 3, wpm: 40, raw: 40 },
    ];
    expect(consistencyFromSeries(series)).toBeCloseTo(100);
  });
  it('drops below 100 for an uneven pace', () => {
    const series = [
      { t: 1, wpm: 10, raw: 10 },
      { t: 2, wpm: 90, raw: 90 },
    ];
    expect(consistencyFromSeries(series)).toBeLessThan(100);
  });
});

describe('generateWords', () => {
  it('produces the requested word count', () => {
    const pool = ['the', 'quick', 'brown', 'fox'];
    const seeded = () => 0.42;
    const text = generateWords(pool, { count: 10, rng: seeded });
    expect(text.split(' ')).toHaveLength(10);
  });
});

describe('difficulty', () => {
  it('normal never fails on a mistake', () => {
    const e = new TypingEngine('cat dog');
    type(e, 'cxt dog');
    expect(e.failed).toBe(false);
  });

  it('master fails on the first wrong key', () => {
    const e = new TypingEngine('cat dog', { difficulty: 'master' });
    type(e, 'cx');
    expect(e.failed).toBe(true);
    expect(e.finished).toBe(true);
  });

  it('expert survives a bad letter but fails on submitting the word', () => {
    const e = new TypingEngine('cat dog', { difficulty: 'expert' });
    type(e, 'cx');
    expect(e.failed).toBe(false);
    type(e, 't ');
    expect(e.failed).toBe(true);
  });

  it('expert lets a corrected word through', () => {
    const e = new TypingEngine('cat dog', { difficulty: 'expert' });
    type(e, 'cx');
    e.backspace();
    type(e, 'at ');
    expect(e.failed).toBe(false);
  });
});

describe('stop on error', () => {
  it('letter mode swallows input until the typo is fixed', () => {
    const e = new TypingEngine('cat', { stopOnError: 'letter' });
    type(e, 'cx');
    expect(e.snapshot().blocked).toBe(true);
    type(e, 't');
    expect(e.snapshot().cursor).toBe(2); // 't' was rejected
    e.backspace();
    type(e, 'at');
    expect(e.snapshot().cursor).toBe(3);
  });

  it('word mode blocks only once a word carries an error', () => {
    const e = new TypingEngine('cat dog', { stopOnError: 'word' });
    type(e, 'cx');
    expect(e.snapshot().blocked).toBe(true);
  });

  it('off mode never blocks', () => {
    const e = new TypingEngine('cat', { stopOnError: 'off' });
    type(e, 'cxt');
    expect(e.snapshot().blocked).toBe(false);
    expect(e.snapshot().cursor).toBe(3);
  });
});

describe('lazy mode', () => {
  it('accepts a plain letter for an accented one', () => {
    const e = new TypingEngine('éa', { lazy: true });
    type(e, 'ea');
    expect(e.snapshot().states).toEqual(['correct', 'correct']);
  });

  it('rejects it when lazy mode is off', () => {
    const e = new TypingEngine('éa');
    type(e, 'ea');
    expect(e.snapshot().states[0]).toBe('incorrect');
  });
});

describe('backspace policy', () => {
  it('confidence max forbids backspace entirely', () => {
    const e = new TypingEngine('cat', { confidence: 'max' });
    type(e, 'cx');
    e.backspace();
    expect(e.snapshot().cursor).toBe(2);
  });

  it('confidence on pins you inside the current word', () => {
    const e = new TypingEngine('cat dog', { confidence: 'on' });
    type(e, 'cat ');
    e.backspace(); // at a word start — refused
    expect(e.snapshot().cursor).toBe(4);
  });

  it('freedom off commits correct characters', () => {
    const e = new TypingEngine('cat', { freedom: false });
    type(e, 'ca');
    e.backspace();
    expect(e.snapshot().cursor).toBe(2);
  });

  it('freedom on allows taking correct characters back', () => {
    const e = new TypingEngine('cat', { freedom: true });
    type(e, 'ca');
    e.backspace();
    expect(e.snapshot().cursor).toBe(1);
  });
});

describe('typed characters', () => {
  it('records what was actually pressed, for typo display', () => {
    const e = new TypingEngine('cat');
    type(e, 'cxt');
    expect(e.snapshot().typed).toEqual(['c', 'x', 't']);
  });
});
