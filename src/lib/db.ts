import Dexie, { type Table } from 'dexie';
import type { TestResult } from '../engine/types';

export interface RunRecord {
  id?: number;
  date: number; // epoch ms
  mode: string; // e.g. "time 30" / "words 25" / "daily" / "quote"
  language: string;
  wpm: number;
  raw: number;
  accuracy: number;
  consistency: number;
  timeSeconds: number;
  charsTyped: number;
}

export interface ArcadeRecord {
  id?: number;
  date: number; // epoch ms
  mode: string; // 'sprint30' | 'sprint60' | 'endless'
  language: string;
  score: number;
  peakMult: number;
  words: number;
  wpm: number;
  accuracy: number;
}

class TypeMoonDB extends Dexie {
  runs!: Table<RunRecord, number>;
  arcadeScores!: Table<ArcadeRecord, number>;
  constructor() {
    super('typemoon');
    this.version(1).stores({
      runs: '++id, date, mode, language, wpm',
    });
    this.version(2).stores({
      runs: '++id, date, mode, language, wpm',
      arcadeScores: '++id, date, mode, language, score',
    });
  }
}

export const db = new TypeMoonDB();

export async function saveRun(
  result: TestResult,
  mode: string,
  language: string,
): Promise<void> {
  await db.runs.add({
    date: Date.now(),
    mode,
    language,
    wpm: result.wpm,
    raw: result.raw,
    accuracy: result.accuracy,
    consistency: result.consistency,
    timeSeconds: result.timeSeconds,
    charsTyped: result.charsTyped,
  });
}

export async function getRuns(limit = 500): Promise<RunRecord[]> {
  return db.runs.orderBy('date').reverse().limit(limit).toArray();
}

export async function saveArcadeScore(
  s: { score: number; mode: string; peakMult: number; words: number; wpm: number; accuracy: number },
  language: string,
): Promise<void> {
  await db.arcadeScores.add({ date: Date.now(), language, ...s });
}

/** Top arcade scores, highest first (optionally filtered by mode). */
export async function getArcadeScores(mode?: string, limit = 8): Promise<ArcadeRecord[]> {
  let rows = await db.arcadeScores.orderBy('score').reverse().toArray();
  if (mode) rows = rows.filter((r) => r.mode === mode);
  return rows.slice(0, limit);
}

/** Best score for a given mode, or 0 if none. */
export async function bestArcadeScore(mode: string): Promise<number> {
  const rows = await db.arcadeScores.where('mode').equals(mode).toArray();
  return rows.reduce((m, r) => Math.max(m, r.score), 0);
}

/** How a finished run stands against everything you have typed before. */
export interface RunVerdict {
  /** 1 = your best ever, counting this run. */
  rank: number;
  /** how many runs it is ranked among, this one included */
  total: number;
  /** best wpm before this run */
  previousBest: number;
  /** mean of the ten runs before this one */
  recentAvg: number;
  /** wpm minus recentAvg, rounded */
  delta: number;
  isPersonalBest: boolean;
  /** nothing comparable in the history — the first run of its kind */
  first: boolean;
}

/**
 * Rank a run against its own kind. Comparing a 30-second English sprint with a
 * hundred words of German would be meaningless, so the cohort is the same mode
 * in the same language — and if there is no such cohort yet, we say so instead
 * of inventing a comparison.
 *
 * Call this *before* saving the run, so the run does not compete with itself.
 */
export async function judgeRun(
  wpm: number,
  mode: string,
  language: string,
): Promise<RunVerdict> {
  const prior = (await db.runs.where('mode').equals(mode).toArray()).filter(
    (r) => r.language === language,
  );

  if (prior.length === 0) {
    return {
      rank: 1,
      total: 1,
      previousBest: 0,
      recentAvg: 0,
      delta: 0,
      isPersonalBest: false,
      first: true,
    };
  }

  const previousBest = Math.max(...prior.map((r) => r.wpm));
  const recent = [...prior].sort((a, b) => b.date - a.date).slice(0, 10);
  const recentAvg = recent.reduce((a, r) => a + r.wpm, 0) / recent.length;

  return {
    rank: prior.filter((r) => r.wpm > wpm).length + 1,
    total: prior.length + 1,
    previousBest,
    recentAvg: Math.round(recentAvg),
    delta: Math.round(wpm - recentAvg),
    isPersonalBest: wpm > previousBest,
    first: false,
  };
}

export interface HistoryStats {
  total: number;
  bestWpm: number;
  avgWpm: number;
  avgAcc: number;
}

export function summarise(runs: RunRecord[]): HistoryStats {
  if (runs.length === 0) return { total: 0, bestWpm: 0, avgWpm: 0, avgAcc: 0 };
  const bestWpm = Math.max(...runs.map((r) => r.wpm));
  const avgWpm = runs.reduce((a, r) => a + r.wpm, 0) / runs.length;
  const avgAcc = runs.reduce((a, r) => a + r.accuracy, 0) / runs.length;
  return {
    total: runs.length,
    bestWpm,
    avgWpm: Math.round(avgWpm),
    avgAcc: Math.round(avgAcc * 10) / 10,
  };
}
