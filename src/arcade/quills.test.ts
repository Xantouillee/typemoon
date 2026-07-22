import { describe, expect, it } from 'vitest';
import {
  isGolden,
  modChips,
  modMistakeMult,
  modMultStep,
  quillFlags,
} from './quills';

const none = quillFlags([]);

describe('quillFlags', () => {
  it('sets only the flags for owned quills', () => {
    const f = quillFlags(['serifed', 'overdrive']);
    expect(f.serifed).toBe(true);
    expect(f.overdrive).toBe(true);
    expect(f.rarity).toBe(false);
  });
});

describe('modChips', () => {
  it('is a no-op with no quills', () => {
    expect(modChips(none, 'cat', 10, 1)).toBe(10);
  });
  it('Serifed adds +3 per vowel', () => {
    const f = quillFlags(['serifed']);
    // "audio" has a,u,i,o = 4 vowels → +12
    expect(modChips(f, 'audio', 10, 1)).toBe(22);
  });
  it('Rarity Hunter doubles chips for rare-letter words', () => {
    const f = quillFlags(['rarity']);
    expect(modChips(f, 'quiz', 10, 1)).toBe(20);
    expect(modChips(f, 'cat', 10, 1)).toBe(10);
  });
  it('Golden Word quadruples every 20th clean word', () => {
    const f = quillFlags(['golden']);
    expect(modChips(f, 'cat', 10, 20)).toBe(40);
    expect(modChips(f, 'cat', 10, 19)).toBe(10);
  });
  it('stacks Serifed then Rarity then Golden', () => {
    const f = quillFlags(['serifed', 'rarity', 'golden']);
    // quiz: base 10 +3 (one vowel u? 'quiz' vowels: u,i =2 → +6) =16, rare ×2 =32, golden ×4 =128
    expect(modChips(f, 'quiz', 10, 20)).toBe(128);
  });
});

describe('isGolden', () => {
  it('is true only every 20th clean word when equipped', () => {
    const f = quillFlags(['golden']);
    expect(isGolden(f, 20)).toBe(true);
    expect(isGolden(f, 40)).toBe(true);
    expect(isGolden(f, 21)).toBe(false);
    expect(isGolden(none, 20)).toBe(false);
  });
});

describe('modMultStep', () => {
  it('is unchanged with no quills', () => {
    expect(modMultStep(none, 'cat', false, 0.2)).toBeCloseTo(0.2, 5);
  });
  it('Staccato doubles the tick for short words only', () => {
    const f = quillFlags(['staccato']);
    expect(modMultStep(f, 'cat', false, 0.2)).toBeCloseTo(0.4, 5); // len 3
    expect(modMultStep(f, 'planet', false, 0.3)).toBeCloseTo(0.3, 5); // len 6, unchanged
  });
  it('Overdrive overrides: +2 fast, −0.5 slow', () => {
    const f = quillFlags(['overdrive']);
    expect(modMultStep(f, 'cat', true, 0.2)).toBe(2);
    expect(modMultStep(f, 'cat', false, 0.2)).toBe(-0.5);
  });
});

describe('modMistakeMult', () => {
  it('halves by default, clamped to the floor', () => {
    expect(modMistakeMult(none, 8, 1)).toBe(4);
    expect(modMistakeMult(none, 1.4, 1)).toBe(1);
  });
  it('Soft Landing subtracts a flat 1.5, clamped to the floor', () => {
    const f = quillFlags(['softLanding']);
    expect(modMistakeMult(f, 8, 1)).toBe(6.5);
    expect(modMistakeMult(f, 2, 1)).toBe(1); // 0.5 < floor
  });
  it('respects a raised floor from Momentum', () => {
    expect(modMistakeMult(none, 4, 2.5)).toBe(2.5); // half of 4 is 2 < floor 2.5
  });
});
