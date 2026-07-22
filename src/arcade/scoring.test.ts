import { describe, expect, it } from 'vitest';
import { letterValue, wordChips } from './letterValues';
import {
  crossedMilestone,
  halveMult,
  isFast,
  multIncrement,
  tensionTier,
  wordChipTotal,
  wordGain,
  wordWpm,
} from './scoring';

describe('letterValue', () => {
  it('scores common letters as 1', () => {
    for (const ch of 'eaionsrtu') expect(letterValue(ch)).toBe(1);
  });
  it('scores luxury letters as 5', () => {
    for (const ch of 'jkqxz') expect(letterValue(ch)).toBe(5);
  });
  it('is case-insensitive and folds accents to the base key', () => {
    expect(letterValue('Q')).toBe(5);
    expect(letterValue('é')).toBe(letterValue('e'));
    expect(letterValue('ü')).toBe(letterValue('u'));
  });
  it('treats digits as 1', () => {
    expect(letterValue('7')).toBe(1);
  });
});

describe('wordChips', () => {
  it('sums letter values', () => {
    // q(5)+u(1)+i(1)+z(5) = 12
    expect(wordChips('quiz')).toBe(12);
  });
  it('ignores punctuation and spaces', () => {
    expect(wordChips('cat!')).toBe(wordChips('cat'));
    expect(wordChips('a a')).toBe(2); // two common letters, space ignored
  });
});

describe('wordWpm / isFast', () => {
  it('computes wpm from chars and elapsed ms', () => {
    // 5 chars in 1000ms → 1 word in 1/60 min → 60 wpm
    expect(wordWpm(5, 1000)).toBeCloseTo(60, 5);
  });
  it('flags a fast word above threshold', () => {
    expect(isFast(5, 900)).toBe(true); // ~66 wpm
    expect(isFast(5, 2000)).toBe(false); // ~30 wpm
  });
  it('never divides by zero', () => {
    expect(wordWpm(5, 0)).toBe(0);
  });
});

describe('multIncrement', () => {
  it('is the base step for a short slow word', () => {
    expect(multIncrement('cat', false)).toBeCloseTo(0.2, 5);
  });
  it('adds length bonuses', () => {
    expect(multIncrement('planet', false)).toBeCloseTo(0.3, 5); // len 6 ≥5
    expect(multIncrement('elephants', false)).toBeCloseTo(0.4, 5); // len 9 ≥8
  });
  it('adds a speed bonus when fast', () => {
    expect(multIncrement('cat', true)).toBeCloseTo(0.3, 5);
  });
});

describe('wordChipTotal / wordGain', () => {
  it('adds the flat speed bonus only when fast', () => {
    expect(wordChipTotal('cat', false)).toBe(wordChips('cat'));
    expect(wordChipTotal('cat', true)).toBe(wordChips('cat') + 3);
  });
  it('multiplies chips by mult and rounds', () => {
    expect(wordGain(10, 2.5)).toBe(25);
    expect(wordGain(7, 1.3)).toBe(9); // 9.1 → 9
  });
});

describe('halveMult', () => {
  it('halves the multiplier', () => {
    expect(halveMult(8)).toBe(4);
    expect(halveMult(5)).toBe(2.5);
  });
  it('never drops below 1', () => {
    expect(halveMult(1)).toBe(1);
    expect(halveMult(1.4)).toBe(1);
  });
});

describe('crossedMilestone', () => {
  it('reports a newly crossed milestone', () => {
    expect(crossedMilestone(2.8, 3.1)).toBe(3);
    expect(crossedMilestone(4.9, 5.2)).toBe(5);
  });
  it('returns the highest milestone when several are crossed at once', () => {
    expect(crossedMilestone(2, 9)).toBe(8);
  });
  it('returns null when none crossed', () => {
    expect(crossedMilestone(3.2, 3.6)).toBeNull();
  });
});

describe('tensionTier', () => {
  it('escalates with the multiplier', () => {
    expect(tensionTier(1)).toBe(0);
    expect(tensionTier(3)).toBe(1);
    expect(tensionTier(6)).toBe(2);
    expect(tensionTier(10)).toBe(3);
    expect(tensionTier(16)).toBe(4);
  });
});
