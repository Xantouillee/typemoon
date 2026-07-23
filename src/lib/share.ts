// Sharing a run. Everything here is client-side and backend-free: a score is
// encoded into the hash-route URL, and the card people see is an SVG drawn from
// that same payload. Open the link → see the card → "beat it" drops you into the
// exact same mode. No server, no accounts, no stored state.

export interface ScorePayload {
  /** net words-per-minute */
  wpm: number;
  /** accuracy, 0–100 */
  acc: number;
  /** consistency, 0–100 (optional) */
  cons?: number;
  /** seconds the run took (optional) */
  secs?: number;
  /** 'time' | 'words' | 'quote' | 'daily' | 'zen' */
  mode: string;
  /** time seconds or word count, for time/words modes */
  val?: number;
  /** typing language code */
  lang: string;
  /** downsampled per-second wpm, for the card's seismograph */
  series?: number[];
}

import type { TestResult } from '../engine/types';

/** Assemble a shareable payload from a finished run and its mode/language. */
export function payloadFromResult(
  result: TestResult,
  mode: string,
  val: number | undefined,
  lang: string,
): ScorePayload {
  return {
    wpm: result.wpm,
    acc: result.accuracy,
    cons: result.consistency,
    secs: result.timeSeconds,
    mode,
    val,
    lang,
    series: result.series.map((s) => s.wpm),
  };
}

const num = (v: string | null): number | undefined => {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/** Encode a score into a compact query string (no leading `?`). */
export function encodeScore(p: ScorePayload): string {
  const q = new URLSearchParams();
  q.set('w', String(Math.round(p.wpm)));
  q.set('a', String(Math.round(p.acc)));
  if (p.cons != null) q.set('c', String(Math.round(p.cons)));
  if (p.secs != null) q.set('t', String(Math.round(p.secs)));
  q.set('m', p.mode);
  if (p.val != null) q.set('v', String(p.val));
  q.set('l', p.lang);
  if (p.series?.length) q.set('s', downsample(p.series, 24).map((v) => Math.round(v)).join('.'));
  return q.toString();
}

/** Decode a score from URL params. Returns null when the essentials are absent. */
export function decodeScore(params: URLSearchParams): ScorePayload | null {
  const wpm = num(params.get('w'));
  const acc = num(params.get('a'));
  const mode = params.get('m');
  if (wpm == null || acc == null || !mode) return null;
  const series = params
    .get('s')
    ?.split('.')
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x));
  return {
    wpm,
    acc,
    cons: num(params.get('c')),
    secs: num(params.get('t')),
    mode,
    val: num(params.get('v')),
    lang: params.get('l') || 'en',
    series: series?.length ? series : undefined,
  };
}

/** The human mode label, matching the desktop `modeLabel` grouping. */
export function payloadModeLabel(p: Pick<ScorePayload, 'mode' | 'val'>): string {
  if (p.mode === 'time' && p.val != null) return `time ${p.val}`;
  if (p.mode === 'words' && p.val != null) return `words ${p.val}`;
  return p.mode;
}

/** Absolute, shareable link to the score card. `base` is e.g. `https://host/`. */
export function buildShareUrl(base: string, p: ScorePayload): string {
  const b = base.endsWith('/') ? base : base + '/';
  return `${b}#/score?${encodeScore(p)}`;
}

/** The text that rides along in the share sheet / tweet. */
export function buildShareText(p: ScorePayload): string {
  return `I hit ${Math.round(p.wpm)} wpm (${Math.round(p.acc)}% accuracy) on Typemoon — can you beat it?`;
}

/** Keep a series short enough for a tidy URL by evenly sampling it. */
function downsample(series: number[], max: number): number[] {
  if (series.length <= max) return series;
  const out: number[] = [];
  for (let i = 0; i < max; i++) out.push(series[Math.round((i / (max - 1)) * (series.length - 1))]);
  return out;
}

// ---------------------------------------------------------------------------
// The card. One pinned look (the signature Ink-on-Cream), so a shared score
// reads the same in everyone's feed regardless of the theme it was typed in.
// ---------------------------------------------------------------------------

const CARD = { w: 1200, h: 630 };
const C = {
  paper: '#F2ECDD',
  paper2: '#E7DFCB',
  ink: '#201B14',
  soft: '#6B6152',
  faint: '#A89E8A',
  accent: '#BE3D2D',
  gold: '#B08D4C',
};
const DISPLAY = "'Fraunces', Georgia, 'Times New Roman', serif";
const SANS = "'Hanken Grotesk', system-ui, -apple-system, sans-serif";

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Dimensions, so callers can size a wrapper without hard-coding them. */
export const SCORE_CARD_SIZE = CARD;

/**
 * The score card as a self-contained SVG string. Used both on-screen (where the
 * page's real fonts render it) and rasterised to PNG for download — hence the
 * font stack falls back to Georgia so it still looks composed without the web
 * font. Deliberately no external refs, so it rasterises cleanly.
 */
export function buildScoreCardSvg(p: ScorePayload): string {
  const { w, h } = CARD;
  const pad = 64;
  const wpm = Math.round(p.wpm);
  const mode = payloadModeLabel(p).toUpperCase();

  // --- right-hand stat stack
  const stats: [string, string][] = [[`${Math.round(p.acc)}%`, 'accuracy']];
  if (p.cons != null) stats.push([`${Math.round(p.cons)}%`, 'consistency']);
  if (p.secs != null) stats.push([`${Math.round(p.secs)}s`, 'time']);

  const statsX = 760;
  const statsTop = 198;
  const statRows = stats
    .map(([val, label], i) => {
      const y = statsTop + i * 104;
      return `
      <text x="${statsX}" y="${y}" font-family="${DISPLAY}" font-weight="700" font-size="62" fill="${C.ink}">${esc(val)}</text>
      <text x="${statsX}" y="${y + 32}" font-family="${SANS}" font-weight="600" font-size="20" letter-spacing="3" fill="${C.soft}">${esc(label.toUpperCase())}</text>`;
    })
    .join('');

  // --- seismograph sparkline in its own band below all the text
  const spark = sparkline(p.series ?? [], pad, 476, w - pad, 92);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Typemoon score: ${wpm} wpm">
  <rect width="${w}" height="${h}" fill="${C.paper}"/>
  <rect x="0" y="0" width="${w}" height="8" fill="${C.accent}"/>
  <!-- letterpress double frame -->
  <rect x="26" y="26" width="${w - 52}" height="${h - 52}" fill="none" stroke="${C.ink}" stroke-opacity="0.14" stroke-width="2"/>
  <rect x="34" y="34" width="${w - 68}" height="${h - 68}" fill="none" stroke="${C.ink}" stroke-opacity="0.08" stroke-width="1"/>

  <!-- wordmark -->
  <text x="${pad}" y="112" font-family="${DISPLAY}" font-weight="900" font-size="46" fill="${C.ink}">Type<tspan fill="${C.accent}">moon</tspan></text>
  <!-- mode, top-right -->
  <text x="${w - pad}" y="108" text-anchor="end" font-family="${SANS}" font-weight="700" font-size="22" letter-spacing="4" fill="${C.soft}">${esc(mode)}</text>
  <line x1="${pad}" y1="140" x2="${w - pad}" y2="140" stroke="${C.ink}" stroke-opacity="0.12" stroke-width="1.5"/>

  <!-- hero WPM -->
  <text x="${pad - 6}" y="360" font-family="${DISPLAY}" font-weight="900" font-size="248" fill="${C.accent}">${wpm}</text>
  <text x="${pad + 4}" y="410" font-family="${SANS}" font-weight="700" font-size="26" letter-spacing="8" fill="${C.ink}">WORDS PER MINUTE</text>

  ${statRows}
  ${spark}

  <!-- tagline -->
  <text x="${w / 2}" y="${h - 46}" text-anchor="middle" font-family="${DISPLAY}" font-style="italic" font-size="25" fill="${C.faint}">a typing practice for people who love words</text>
</svg>`;
}

/** A little area+line seismograph, or a flat baseline when there is no series. */
function sparkline(series: number[], x: number, y: number, x2: number, hgt: number): string {
  const wdt = x2 - x;
  if (series.length < 2) {
    return `<line x1="${x}" y1="${y + hgt}" x2="${x2}" y2="${y + hgt}" stroke="${C.ink}" stroke-opacity="0.12" stroke-width="2"/>`;
  }
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const pts = series.map((v, i) => {
    const px = x + (i / (series.length - 1)) * wdt;
    const py = y + hgt - ((v - min) / span) * hgt;
    return [px, py] as const;
  });
  const line = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
  const area = `M${x},${y + hgt} ${pts.map(([px, py]) => `L${px.toFixed(1)},${py.toFixed(1)}`).join(' ')} L${x2},${y + hgt} Z`;
  return `
  <line x1="${x}" y1="${y + hgt}" x2="${x2}" y2="${y + hgt}" stroke="${C.ink}" stroke-opacity="0.1" stroke-width="1.5"/>
  <path d="${area}" fill="${C.accent}" fill-opacity="0.08"/>
  <path d="${line}" fill="none" stroke="${C.accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/**
 * Rasterise an SVG string to a PNG blob at 2× for crisp downloads. Browser-only
 * (uses Image + canvas); returns null if the browser blocks the draw.
 */
export async function svgToPngBlob(svg: string, w = CARD.w, h = CARD.h): Promise<Blob | null> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = new Image();
    img.width = w;
    img.height = h;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('svg load failed'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = w * 2;
    canvas.height = h * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0, w, h);
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
