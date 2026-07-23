import { describe, expect, it } from 'vitest';
import { advanceDaily, EMPTY_DAILY, isDoneToday, liveStreak, prevDayKey } from './daily';

describe('prevDayKey', () => {
  it('steps back one day', () => {
    expect(prevDayKey('2026-07-23')).toBe('2026-07-22');
  });
  it('rolls over a month boundary', () => {
    expect(prevDayKey('2026-08-01')).toBe('2026-07-31');
  });
  it('rolls over a year boundary', () => {
    expect(prevDayKey('2026-01-01')).toBe('2025-12-31');
  });
});

describe('advanceDaily', () => {
  it('starts a streak at one on the first ever completion', () => {
    expect(advanceDaily(EMPTY_DAILY, '2026-07-23')).toEqual({
      lastDate: '2026-07-23',
      streak: 1,
      bestStreak: 1,
    });
  });

  it('grows the streak when yesterday was done', () => {
    const p = { lastDate: '2026-07-22', streak: 4, bestStreak: 4 };
    expect(advanceDaily(p, '2026-07-23')).toEqual({
      lastDate: '2026-07-23',
      streak: 5,
      bestStreak: 5,
    });
  });

  it('is idempotent within the same day', () => {
    const p = { lastDate: '2026-07-23', streak: 5, bestStreak: 7 };
    expect(advanceDaily(p, '2026-07-23')).toBe(p);
  });

  it('restarts the streak after a gap but keeps the best', () => {
    const p = { lastDate: '2026-07-20', streak: 9, bestStreak: 9 };
    expect(advanceDaily(p, '2026-07-23')).toEqual({
      lastDate: '2026-07-23',
      streak: 1,
      bestStreak: 9,
    });
  });
});

describe('isDoneToday / liveStreak', () => {
  it('knows when today is done', () => {
    expect(isDoneToday({ lastDate: '2026-07-23', streak: 1, bestStreak: 1 }, '2026-07-23')).toBe(true);
    expect(isDoneToday({ lastDate: '2026-07-22', streak: 1, bestStreak: 1 }, '2026-07-23')).toBe(false);
  });

  it('keeps a streak alive the day after, and zeroes a broken one', () => {
    const done = { lastDate: '2026-07-23', streak: 6, bestStreak: 6 };
    const yesterday = { lastDate: '2026-07-22', streak: 6, bestStreak: 6 };
    const stale = { lastDate: '2026-07-20', streak: 6, bestStreak: 6 };
    expect(liveStreak(done, '2026-07-23')).toBe(6);
    expect(liveStreak(yesterday, '2026-07-23')).toBe(6); // still extendable today
    expect(liveStreak(stale, '2026-07-23')).toBe(0); // broken
  });
});
