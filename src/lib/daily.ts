import { todayKey } from './rng';

/**
 * The daily-quest streak. Deliberately tiny and pure: the store and the UI both
 * lean on these three functions so the "did I keep my streak?" rule lives in one
 * tested place rather than scattered across components.
 */
export interface DailyProgress {
  /** local ISO day of the last completed daily, or null if never */
  lastDate: string | null;
  /** consecutive days completed, ending on lastDate */
  streak: number;
  /** the longest such run ever reached */
  bestStreak: number;
}

export const EMPTY_DAILY: DailyProgress = { lastDate: null, streak: 0, bestStreak: 0 };

/** The calendar day before a given `YYYY-MM-DD` key, honouring month/year rollover. */
export function prevDayKey(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  return todayKey(dt);
}

/**
 * Record that the daily was completed on `today`.
 *
 * - already done today → unchanged (a second run must not inflate the streak)
 * - done yesterday → the streak grows by one
 * - any older, or never → the streak restarts at one
 */
export function advanceDaily(p: DailyProgress, today: string): DailyProgress {
  if (p.lastDate === today) return p;
  const streak = p.lastDate === prevDayKey(today) ? p.streak + 1 : 1;
  return { lastDate: today, streak, bestStreak: Math.max(p.bestStreak, streak) };
}

/** Has today's daily already been completed? */
export function isDoneToday(p: DailyProgress, today: string = todayKey()): boolean {
  return p.lastDate === today;
}

/**
 * The streak as it stands *for display today*. A streak completed yesterday is
 * still alive (you can extend it today); one that ended two-or-more days ago is
 * broken, and showing its old length would be a lie — so it reads as zero until
 * the next completion revives it.
 */
export function liveStreak(p: DailyProgress, today: string = todayKey()): number {
  if (p.lastDate === today || p.lastDate === prevDayKey(today)) return p.streak;
  return 0;
}
