import { describe, expect, it } from 'vitest';
import {
  aggregate,
  formatCount,
  formatDuration,
  localDayIndex,
  streaks,
  EMPTY_STATS,
} from './aggregate';
import type { RunRecord } from './db';

const DAY = 86_400_000;

/** A run on `dayIndex` days after an anchor, with the fields aggregate reads. */
function run(dayFromAnchor: number, over: Partial<RunRecord> = {}): RunRecord {
  // Noon avoids any timezone pulling the instant across a day boundary.
  const anchor = new Date(2026, 0, 1, 12, 0, 0).getTime();
  return {
    date: anchor + dayFromAnchor * DAY,
    mode: 'time 30',
    language: 'en',
    wpm: 80,
    raw: 85,
    accuracy: 96,
    consistency: 70,
    timeSeconds: 30,
    charsTyped: 200,
    ...over,
  };
}

describe('localDayIndex', () => {
  it('gives the same index for two instants on the same local day', () => {
    const morning = new Date(2026, 5, 10, 1, 0, 0).getTime();
    const night = new Date(2026, 5, 10, 23, 30, 0).getTime();
    expect(localDayIndex(morning)).toBe(localDayIndex(night));
  });

  it('gives adjacent indices for consecutive days', () => {
    const a = new Date(2026, 5, 10, 12).getTime();
    const b = new Date(2026, 5, 11, 12).getTime();
    expect(localDayIndex(b) - localDayIndex(a)).toBe(1);
  });
});

describe('streaks', () => {
  it('is zero for no days', () => {
    expect(streaks([])).toEqual({ current: 0, longest: 0 });
  });

  it('counts a consecutive run once, ignoring repeats within a day', () => {
    const today = localDayIndex(Date.now());
    expect(streaks([today, today, today - 1, today - 2])).toEqual({
      current: 3,
      longest: 3,
    });
  });

  it('keeps the current streak alive if the last day was yesterday', () => {
    const today = localDayIndex(Date.now());
    expect(streaks([today - 1, today - 2]).current).toBe(2);
  });

  it('resets the current streak after a gap but keeps the longest', () => {
    const today = localDayIndex(Date.now());
    const s = streaks([today - 10, today - 9, today - 8, today]);
    expect(s.current).toBe(1);
    expect(s.longest).toBe(3);
  });
});

describe('aggregate', () => {
  it('is the empty portrait for no runs', () => {
    expect(aggregate([])).toEqual(EMPTY_STATS);
  });

  it('sums keys and time across runs', () => {
    const stats = aggregate([
      run(0, { charsTyped: 100, timeSeconds: 30 }),
      run(1, { charsTyped: 250, timeSeconds: 60 }),
    ]);
    expect(stats.totalChars).toBe(350);
    expect(stats.totalSeconds).toBe(90);
    expect(stats.totalRuns).toBe(2);
    expect(stats.daysActive).toBe(2);
  });

  it('takes the best and averages the rest', () => {
    const stats = aggregate([
      run(0, { wpm: 60, accuracy: 90 }),
      run(1, { wpm: 100, accuracy: 100 }),
    ]);
    expect(stats.bestWpm).toBe(100);
    expect(stats.avgWpm).toBe(80);
    expect(stats.avgAcc).toBe(95);
  });

  it('picks the most-typed mode as the favourite', () => {
    const stats = aggregate([
      run(0, { mode: 'words 25' }),
      run(1, { mode: 'time 30' }),
      run(2, { mode: 'time 30' }),
    ]);
    expect(stats.favoriteMode).toBe('time 30');
  });
});

describe('formatting', () => {
  it('groups thousands', () => {
    expect(formatCount(12480)).toBe('12,480');
  });

  it('reads durations compactly', () => {
    expect(formatDuration(48)).toBe('48s');
    expect(formatDuration(12 * 60)).toBe('12m');
    expect(formatDuration(3 * 3600 + 12 * 60)).toBe('3h 12m');
  });
});
