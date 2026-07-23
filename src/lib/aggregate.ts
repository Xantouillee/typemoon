import type { RunRecord } from './db';

/**
 * A portrait of a typist drawn from their whole history — the numbers that only
 * mean something once you have typed a while: how many keys you have tapped, how
 * long you have spent, and how many days in a row you have shown up.
 *
 * These are all derived from the same `RunRecord`s the History tab already has,
 * so they need no server. When an account is connected the very same shape is
 * computed from the runs stored in the cloud, so the two never disagree.
 */
export interface AccountStats {
  totalRuns: number;
  bestWpm: number;
  avgWpm: number;
  /** mean accuracy, one decimal */
  avgAcc: number;
  /** every character actually typed across every run — "keys tapped" */
  totalChars: number;
  /** total seconds spent typing */
  totalSeconds: number;
  /** distinct calendar days with at least one run */
  daysActive: number;
  /** consecutive days up to today (or yesterday) with a run */
  currentStreak: number;
  /** the longest such run of consecutive days, ever */
  longestStreak: number;
  /** the mode label typed most often, or '' when there is no history */
  favoriteMode: string;
}

export const EMPTY_STATS: AccountStats = {
  totalRuns: 0,
  bestWpm: 0,
  avgWpm: 0,
  avgAcc: 0,
  totalChars: 0,
  totalSeconds: 0,
  daysActive: 0,
  currentStreak: 0,
  longestStreak: 0,
  favoriteMode: '',
};

/**
 * Which local calendar day an instant falls on, as an integer day-count. Using
 * the local day (not UTC) is what makes a streak match the calendar the typist
 * actually lives by — a run at 11pm and one at 1am are two different days.
 */
export function localDayIndex(ms: number): number {
  const d = new Date(ms);
  return Math.floor(
    (ms - d.getTimezoneOffset() * 60_000) / 86_400_000,
  );
}

/** The single most-used value in a list, ties broken by first-seen. */
function mostCommon(values: string[]): string {
  const counts = new Map<string, number>();
  let best = '';
  let bestN = 0;
  for (const v of values) {
    const n = (counts.get(v) ?? 0) + 1;
    counts.set(v, n);
    if (n > bestN) {
      bestN = n;
      best = v;
    }
  }
  return best;
}

/**
 * Longest and current run of consecutive active days.
 *
 * `current` is measured from today: it only counts if the most recent active day
 * is today or yesterday, so an untyped morning does not instantly wipe a streak,
 * but a forgotten week does.
 */
export function streaks(
  dayIndices: number[],
  now: number = Date.now(),
): { current: number; longest: number } {
  if (dayIndices.length === 0) return { current: 0, longest: 0 };

  const days = [...new Set(dayIndices)].sort((a, b) => a - b);

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = days[i] === days[i - 1] + 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  const today = localDayIndex(now);
  const last = days[days.length - 1];
  let current = 0;
  if (last === today || last === today - 1) {
    current = 1;
    for (let i = days.length - 1; i > 0; i--) {
      if (days[i] === days[i - 1] + 1) current++;
      else break;
    }
  }

  return { current, longest };
}

/** Roll a whole history up into the numbers the History tab shows. */
export function aggregate(runs: RunRecord[], now: number = Date.now()): AccountStats {
  if (runs.length === 0) return EMPTY_STATS;

  const totalChars = runs.reduce((a, r) => a + (r.charsTyped || 0), 0);
  const totalSeconds = runs.reduce((a, r) => a + (r.timeSeconds || 0), 0);
  const bestWpm = Math.max(...runs.map((r) => r.wpm));
  const avgWpm = runs.reduce((a, r) => a + r.wpm, 0) / runs.length;
  const avgAcc = runs.reduce((a, r) => a + r.accuracy, 0) / runs.length;

  const dayIndices = runs.map((r) => localDayIndex(r.date));
  const { current, longest } = streaks(dayIndices, now);

  return {
    totalRuns: runs.length,
    bestWpm,
    avgWpm: Math.round(avgWpm),
    avgAcc: Math.round(avgAcc * 10) / 10,
    totalChars,
    totalSeconds: Math.round(totalSeconds),
    daysActive: new Set(dayIndices).size,
    currentStreak: current,
    longestStreak: longest,
    favoriteMode: mostCommon(runs.map((r) => r.mode)),
  };
}

/** "12,480" — a big count made readable. */
export function formatCount(n: number): string {
  return n.toLocaleString('en-US');
}

/** Seconds → a compact "3h 12m" / "12m" / "48s". */
export function formatDuration(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}
