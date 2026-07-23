import type { TestResult } from '../engine/types';
import type { RunRecord } from './db';
import { supabase } from './supabase';
import { useAuth } from '../store/auth';

/** The four windows a leaderboard can be read through. */
export type LeaderPeriod = 'today' | 'week' | 'month' | 'all';

export const PERIODS: LeaderPeriod[] = ['today', 'week', 'month', 'all'];

/** One ranked entry as the board renders it. */
export interface LeaderRow {
  user_id: string;
  username: string;
  avatar_url: string | null;
  wpm: number;
  accuracy: number;
  mode: string;
  language: string;
  created_at: string;
}

/**
 * The earliest instant a period includes, as an ISO string — or null for
 * all-time. "today" is the local calendar day, "week"/"month" are rolling
 * 7-/30-day windows, which is what people mean by a weekly board.
 */
export function periodSince(period: LeaderPeriod, now: number = Date.now()): string | null {
  if (period === 'all') return null;
  if (period === 'today') {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  const days = period === 'week' ? 7 : 30;
  return new Date(now - days * 86_400_000).toISOString();
}

/**
 * Record a finished run to the cloud, if — and only if — someone is signed in
 * and a backend exists. Silent no-op otherwise, so the caller can fire it after
 * every run without caring whether accounts are switched on. Failures are
 * swallowed: a leaderboard hiccup must never spoil the result screen.
 */
export async function submitScore(
  result: TestResult,
  mode: string,
  language: string,
): Promise<void> {
  const user = useAuth.getState().user;
  if (!supabase || !user) return;
  try {
    await supabase.from('scores').insert({
      user_id: user.id,
      wpm: Math.round(result.wpm),
      raw: Math.round(result.raw),
      accuracy: result.accuracy,
      consistency: result.consistency,
      mode,
      language,
      chars: result.charsTyped,
      time_seconds: result.timeSeconds,
    });
  } catch {
    // best effort — the local history already has the run
  }
}

/**
 * The best run per player within a window, ranked fastest first. All the
 * heavy lifting (one row per user, the join to profiles) is a SQL function so
 * the client just asks and renders.
 */
export async function fetchLeaderboard(
  period: LeaderPeriod,
  mode: string | null,
  language: string | null,
  limit = 100,
): Promise<LeaderRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('get_leaderboard', {
    p_since: periodSince(period),
    p_mode: mode,
    p_language: language,
    p_limit: limit,
  });
  if (error || !data) return [];
  return data as LeaderRow[];
}

/** Where a run stands in the field: the % of runs it beat, and how many it was measured against. */
export interface Percentile {
  pct: number;
  sample: number;
}

/**
 * How many comparable runs must exist before a percentile is worth showing.
 * Low enough that a fresh board surfaces it within a short session, high enough
 * that "faster than 100%" of a single run never appears. As the field fills the
 * figure quietly shifts from "better than your own recent runs" to a true global
 * standing — same sentence, steadily more meaning.
 */
export const MIN_PERCENTILE_SAMPLE = 5;

/**
 * How this run compares to the whole field — the share of recorded runs at the
 * same mode + language that were slower. Reads the global `scores` table, so it
 * works for any visitor once a backend exists, signed in or not. Returns null
 * when there is no backend or the sample is too thin to mean anything; call it
 * *before* submitting the run so it is not measured against itself.
 */
export async function fetchPercentile(
  wpm: number,
  mode: string,
  language: string,
): Promise<Percentile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('run_percentile', {
    p_wpm: Math.round(wpm),
    p_mode: mode,
    p_language: language,
    p_since: null, // all-time — the largest, steadiest sample while the field is young
  });
  const row = (data as Percentile[] | null)?.[0];
  if (error || !row || row.pct == null || row.sample < MIN_PERCENTILE_SAMPLE) return null;
  return { pct: row.pct, sample: row.sample };
}

/**
 * A signed-in player's 1-based rank on today's board for a given mode/language,
 * or null if they are not on it (not signed in, no run today, hidden, or no
 * backend). Used by the daily quest to say "#3 on today's page" right after a run.
 */
export async function fetchTodayRank(
  mode: string,
  language: string,
): Promise<{ rank: number; total: number } | null> {
  const user = useAuth.getState().user;
  if (!supabase || !user) return null;
  const rows = await fetchLeaderboard('today', mode, language, 500);
  const i = rows.findIndex((r) => r.user_id === user.id);
  return i === -1 ? null : { rank: i + 1, total: rows.length };
}

/**
 * A signed-in player's own runs from the cloud, shaped like the local
 * `RunRecord`s so the very same `aggregate()` can draw their portrait — which is
 * how the History tab shows the same numbers on every device they sign in on.
 */
export async function fetchMyRuns(limit = 2000): Promise<RunRecord[]> {
  const user = useAuth.getState().user;
  if (!supabase || !user) return [];
  const { data, error } = await supabase
    .from('scores')
    .select('wpm, raw, accuracy, consistency, mode, language, chars, time_seconds, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as CloudScore[]).map((r) => ({
    date: new Date(r.created_at).getTime(),
    mode: r.mode,
    language: r.language,
    wpm: r.wpm,
    raw: r.raw,
    accuracy: r.accuracy,
    consistency: r.consistency,
    timeSeconds: r.time_seconds,
    charsTyped: r.chars,
  }));
}

interface CloudScore {
  wpm: number;
  raw: number;
  accuracy: number;
  consistency: number;
  mode: string;
  language: string;
  chars: number;
  time_seconds: number;
  created_at: string;
}
