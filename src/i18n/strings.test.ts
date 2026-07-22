import { describe, expect, it } from 'vitest';
import { DICTS, ordinal, t, tf } from './strings';

const LANGS = Object.keys(DICTS);

describe('dictionaries', () => {
  const enKeys = Object.keys(DICTS.en).sort();

  // A flat dictionary falls back to English silently, so a translator dropping a
  // key produces an English word in a French sentence that nobody notices.
  it.each(LANGS)('%s covers every key English has', (lang) => {
    expect(Object.keys(DICTS[lang]).sort()).toEqual(enKeys);
  });

  it.each(LANGS)('%s leaves no value empty', (lang) => {
    for (const [key, value] of Object.entries(DICTS[lang])) {
      expect(value.trim(), `${lang}.${key}`).not.toBe('');
    }
  });

  it('falls back to English for an unknown language', () => {
    expect(t('jp', 'practice')).toBe('practice');
  });

  it('returns the key itself when nothing knows it', () => {
    expect(t('en', 'no-such-key')).toBe('no-such-key');
  });
});

describe('tf', () => {
  it('substitutes every placeholder', () => {
    expect(tf('en', 'verdictFirst', { mode: 'time 30' })).toBe(
      'First run at time 30. This is the mark to beat.',
    );
  });

  it('leaves a placeholder alone when no value is supplied', () => {
    expect(tf('en', 'verdictRank', { rank: '3rd' })).toContain('{mode}');
  });

  it('substitutes in every language', () => {
    for (const lang of LANGS) {
      expect(tf(lang, 'verdictFirst', { mode: 'X' })).not.toContain('{');
    }
  });
});

describe('ordinal', () => {
  it('handles the English irregulars', () => {
    expect(['1st', '2nd', '3rd', '4th']).toEqual([1, 2, 3, 4].map((n) => ordinal('en', n)));
  });

  it('does not say 11st, 12nd or 13rd', () => {
    expect([11, 12, 13].map((n) => ordinal('en', n))).toEqual(['11th', '12th', '13th']);
  });

  it('resumes after the teens', () => {
    expect([21, 22, 23, 111].map((n) => ordinal('en', n))).toEqual([
      '21st',
      '22nd',
      '23rd',
      '111th',
    ]);
  });

  it('follows each language’s own convention', () => {
    expect(ordinal('fr', 1)).toBe('1re');
    expect(ordinal('fr', 3)).toBe('3e');
    expect(ordinal('es', 3)).toBe('3.ª');
    expect(ordinal('de', 3)).toBe('3.');
  });
});
