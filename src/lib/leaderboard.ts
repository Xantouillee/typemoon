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
