import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { todayKey } from '../lib/rng';
import { advanceDaily, isDoneToday, liveStreak, type DailyProgress } from '../lib/daily';

interface DailyStore extends DailyProgress {
  /** Record a completed daily for today. Idempotent within the day. */
  markDone: () => void;
}

/**
 * The daily-quest streak, kept in its own localStorage bucket rather than the
 * settings store — it is progress, not a preference, and does not want to ride
 * the settings migration. All the actual rules live in `lib/daily.ts`.
 */
export const useDaily = create<DailyStore>()(
  persist(
    (set) => ({
      lastDate: null,
      streak: 0,
      bestStreak: 0,
      markDone: () => set((s) => advanceDaily(s, todayKey())),
    }),
    { name: 'typemoon-daily' },
  ),
);

/** Reactive: is today's daily already done? */
export function useDoneToday(): boolean {
  return useDaily((s) => isDoneToday(s, todayKey()));
}

/** Reactive: the streak as it should read today (alive or broken). */
export function useLiveStreak(): number {
  return useDaily((s) => liveStreak(s, todayKey()));
}
