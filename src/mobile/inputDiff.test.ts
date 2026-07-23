import { describe, expect, it } from 'vitest';
import { diffInput } from './inputDiff';

describe('diffInput', () => {
  it('reports a single appended character', () => {
    expect(diffInput('the', 'them')).toEqual({ backspaces: 0, inserts: 'm' });
  });

  it('reports several characters committed at once (predictive text)', () => {
    expect(diffInput('the ', 'the quick')).toEqual({ backspaces: 0, inserts: 'quick' });
  });

  it('reports a single backspace', () => {
    expect(diffInput('them', 'the')).toEqual({ backspaces: 1, inserts: '' });
  });

  it('reports several backspaces', () => {
    expect(diffInput('typing', 'ty')).toEqual({ backspaces: 4, inserts: '' });
  });

  it('reads an autocorrect replacement as delete-then-retype', () => {
    // "teh " becomes "the " — first two chars differ from index 1
    expect(diffInput('teh ', 'the ')).toEqual({ backspaces: 3, inserts: 'he ' });
  });

  it('handles a whole-word autocomplete swap', () => {
    // common prefix "th", the rest is replaced
    expect(diffInput('th', 'the')).toEqual({ backspaces: 0, inserts: 'e' });
    expect(diffInput('recieve', 'receive')).toEqual({ backspaces: 4, inserts: 'eive' });
  });

  it('is a no-op when nothing changed', () => {
    expect(diffInput('stable', 'stable')).toEqual({ backspaces: 0, inserts: '' });
  });

  it('clears the whole field', () => {
    expect(diffInput('gone', '')).toEqual({ backspaces: 4, inserts: '' });
  });

  it('fills an empty field', () => {
    expect(diffInput('', 'hello')).toEqual({ backspaces: 0, inserts: 'hello' });
  });

  it('applying the delta reproduces `next` from `prev`', () => {
    // property: for any pair, prev minus backspaces plus inserts === next
    const cases: [string, string][] = [
      ['the', 'them'],
      ['them', 'the'],
      ['teh ', 'the '],
      ['recieve', 'receive'],
      ['', 'abc'],
      ['abc', ''],
      ['quick brown', 'quick brownx'],
    ];
    for (const [prev, next] of cases) {
      const { backspaces, inserts } = diffInput(prev, next);
      const rebuilt = prev.slice(0, prev.length - backspaces) + inserts;
      expect(rebuilt).toBe(next);
    }
  });
});
