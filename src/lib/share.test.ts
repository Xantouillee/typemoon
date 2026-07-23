import { describe, expect, it } from 'vitest';
import {
  buildScoreCardSvg,
  buildShareUrl,
  buildShareText,
  decodeScore,
  encodeScore,
  payloadModeLabel,
  type ScorePayload,
} from './share';

const base: ScorePayload = {
  wpm: 98.4,
  acc: 97.2,
  cons: 91,
  secs: 30,
  mode: 'time',
  val: 30,
  lang: 'en',
  series: [40, 60, 72, 85, 98],
};

describe('encode/decode', () => {
  it('round-trips a full payload (rounding the floats)', () => {
    const decoded = decodeScore(new URLSearchParams(encodeScore(base)));
    expect(decoded).toEqual({
      wpm: 98,
      acc: 97,
      cons: 91,
      secs: 30,
      mode: 'time',
      val: 30,
      lang: 'en',
      series: [40, 60, 72, 85, 98],
    });
  });

  it('round-trips a passage mode with no length value', () => {
    const p: ScorePayload = { wpm: 70, acc: 99, mode: 'quote', lang: 'fr' };
    const decoded = decodeScore(new URLSearchParams(encodeScore(p)));
    expect(decoded?.mode).toBe('quote');
    expect(decoded?.val).toBeUndefined();
    expect(decoded?.lang).toBe('fr');
  });

  it('returns null when the essentials are missing', () => {
    expect(decodeScore(new URLSearchParams('a=90&m=time'))).toBeNull(); // no wpm
    expect(decodeScore(new URLSearchParams('w=90&m=time'))).toBeNull(); // no accuracy
    expect(decodeScore(new URLSearchParams('w=90&a=97'))).toBeNull(); // no mode
  });

  it('defaults language to en when absent', () => {
    const decoded = decodeScore(new URLSearchParams('w=90&a=97&m=zen'));
    expect(decoded?.lang).toBe('en');
  });

  it('caps the series length in the URL', () => {
    const long = Array.from({ length: 200 }, (_, i) => i);
    const q = new URLSearchParams(encodeScore({ ...base, series: long }));
    expect(q.get('s')!.split('.').length).toBeLessThanOrEqual(24);
  });
});

describe('labels and links', () => {
  it('formats the mode label like the desktop grouping', () => {
    expect(payloadModeLabel({ mode: 'time', val: 30 })).toBe('time 30');
    expect(payloadModeLabel({ mode: 'words', val: 25 })).toBe('words 25');
    expect(payloadModeLabel({ mode: 'daily' })).toBe('daily');
  });

  it('builds a hash-route share URL with a single slash', () => {
    expect(buildShareUrl('https://host.io', base)).toMatch(/^https:\/\/host\.io\/#\/score\?/);
    expect(buildShareUrl('https://host.io/', base)).toMatch(/^https:\/\/host\.io\/#\/score\?/);
  });

  it('writes share text with the rounded score', () => {
    expect(buildShareText(base)).toBe(
      'I hit 98 wpm (97% accuracy) on Typemoon — can you beat it?',
    );
  });
});

describe('score card svg', () => {
  it('is a self-contained svg carrying the numbers', () => {
    const svg = buildScoreCardSvg(base);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('>98<'); // hero wpm
    expect(svg).toContain('97%'); // accuracy
    expect(svg).toContain('TIME 30'); // mode
    // no external resource references (the xmlns namespace URL is fine)
    expect(svg).not.toContain('<image');
    expect(svg).not.toContain('href');
  });

  it('draws a flat baseline instead of a line when there is no series', () => {
    const svg = buildScoreCardSvg({ wpm: 50, acc: 90, mode: 'zen', lang: 'en' });
    expect(svg).toContain('<line'); // baseline present
    expect(svg).not.toContain('fill-opacity="0.08"'); // no area fill
  });
});
