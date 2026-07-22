// Pure metric helpers — no state, fully unit-testable.
import type { Keystroke, WpmSample, PerKeyStat } from './types';

/** Standard WPM: (chars / 5) normalised to one minute. */
export function charsToWpm(chars: number, ms: number): number {
  if (ms <= 0) return 0;
  const minutes = ms / 60000;
  return (chars / 5) / minutes;
}

/** Accuracy from the raw keypress stream (excludes backspaces). */
export function accuracyFromStream(strokes: Keystroke[]): number {
  const typed = strokes.filter((s) => !s.backspace);
  if (typed.length === 0) return 100;
  const correct = typed.filter((s) => s.correct).length;
  return (correct / typed.length) * 100;
}

/**
 * Per-second WPM/raw series, built from the keystroke stream.
 * Net counts only strokes that were correct; raw counts every character stroke.
 */
export function buildSeries(strokes: Keystroke[], totalMs: number): WpmSample[] {
  const seconds = Math.max(1, Math.ceil(totalMs / 1000));
  const samples: WpmSample[] = [];
  const typed = strokes.filter((s) => !s.backspace);
  for (let sec = 1; sec <= seconds; sec++) {
    const cutoff = sec * 1000;
    const upTo = typed.filter((s) => s.t <= cutoff);
    const correct = upTo.filter((s) => s.correct).length;
    const all = upTo.length;
    const ms = Math.min(cutoff, totalMs) || cutoff;
    samples.push({
      t: sec,
      wpm: Math.round(charsToWpm(correct, ms)),
      raw: Math.round(charsToWpm(all, ms)),
    });
  }
  return samples;
}

/**
 * Consistency as a coefficient-of-variation score over per-second raw WPM.
 * 100 = perfectly even pace. Mirrors the intuition behind Monkeytype's metric.
 */
export function consistencyFromSeries(series: WpmSample[]): number {
  const vals = series.map((s) => s.raw).filter((v) => v > 0);
  if (vals.length < 2) return 100;
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  if (mean === 0) return 0;
  const variance =
    vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
  const cv = Math.sqrt(variance) / mean;
  return Math.max(0, Math.min(100, (1 - cv) * 100));
}

/** Aggregate per-key stats for the keyboard heatmap. */
export function perKeyStats(strokes: Keystroke[]): PerKeyStat[] {
  const map = new Map<string, { presses: number; errors: number; lat: number; latN: number }>();
  for (const s of strokes) {
    if (s.backspace || s.expected === ' ' || s.expected === '') continue;
    const k = s.expected.toLowerCase();
    const e = map.get(k) ?? { presses: 0, errors: 0, lat: 0, latN: 0 };
    e.presses += 1;
    if (!s.correct) e.errors += 1;
    if (s.correct && s.latency > 0 && s.latency < 2000) {
      e.lat += s.latency;
      e.latN += 1;
    }
    map.set(k, e);
  }
  return [...map.entries()].map(([key, e]) => ({
    key,
    presses: e.presses,
    errors: e.errors,
    avgLatency: e.latN ? Math.round(e.lat / e.latN) : 0,
  }));
}
