// Pure scoring rules for "Ink Rush" — the Balatro-style chips × mult game.
// No React, no DOM: fully unit-testable. The hook (useInkRush) orchestrates these.
import { wordChips } from './letterValues';

export { wordChips, letterValue } from './letterValues';

// ---- tunable constants -----------------------------------------------------
export const START_HEARTS = 3;
export const MAX_HEARTS = 3;
/** clean-word streak that heals one heart */
export const HEAL_STREAK = 15;
/** base multiplier gain per clean word */
export const MULT_STEP = 0.2;
/** words-per-minute a word must beat to earn the speed bonus */
export const SPEED_WPM = 55;
/** extra flat chips when a word is typed fast */
export const SPEED_CHIP_BONUS = 3;
/** extra mult tick when a word is typed fast */
export const SPEED_MULT_BONUS = 0.1;
/** multiplier tiers that trigger a stamped callout */
export const MULT_MILESTONES = [3, 5, 8, 12, 16, 20, 30] as const;

// ---- word speed ------------------------------------------------------------
/** WPM for a single word: (chars / 5) normalised to a minute. */
export function wordWpm(chars: number, ms: number): number {
  if (ms <= 0) return 0;
  return (chars / 5) / (ms / 60000);
}

export function isFast(chars: number, ms: number): boolean {
  return wordWpm(chars, ms) >= SPEED_WPM;
}

// ---- clean-word rewards ----------------------------------------------------
/** Multiplier increment earned by completing a clean word. Longer + fast = more. */
export function multIncrement(word: string, fast: boolean): number {
  let step = MULT_STEP;
  const len = word.length;
  if (len >= 5) step += 0.1;
  if (len >= 8) step += 0.1;
  if (fast) step += SPEED_MULT_BONUS;
  return Math.round(step * 100) / 100;
}

/** Chip value of a completed word, including the speed bonus when earned. */
export function wordChipTotal(word: string, fast: boolean): number {
  return wordChips(word) + (fast ? SPEED_CHIP_BONUS : 0);
}

/** Points a scored word slams into the total: chips × mult, rounded. */
export function wordGain(chips: number, mult: number): number {
  return Math.round(chips * mult);
}

// ---- failure ---------------------------------------------------------------
/** A mistake halves the multiplier, never dropping below ×1. */
export function halveMult(mult: number): number {
  return Math.max(1, Math.round(mult * 0.5 * 100) / 100);
}

/** The highest milestone this multiplier has newly crossed, or null. */
export function crossedMilestone(prev: number, next: number): number | null {
  let hit: number | null = null;
  for (const m of MULT_MILESTONES) {
    if (prev < m && next >= m) hit = m;
  }
  return hit;
}

// ---- stream navigation -----------------------------------------------------
/**
 * Index of the space ending the word `cursor` sits in, or the end of the stream
 * when it is the last word.
 *
 * Both ways of leaving a word early need this: the Quick Quill skip (proactive,
 * on a cooldown) and the release of a word that has just broken. Shared because
 * the off-by-one around the space is the exact mistake that would go unnoticed —
 * landing *on* the space instead of past it silently ruins the next word.
 */
export function wordEndAt(stream: string, cursor: number): number {
  const i = stream.indexOf(' ', cursor);
  return i === -1 ? stream.length : i;
}

/** Where the cursor lands after abandoning the word at `cursor`: past its space. */
export function afterWord(stream: string, cursor: number): number {
  return Math.min(stream.length, wordEndAt(stream, cursor) + 1);
}

/** Visual tension tier (0..4) from the current multiplier — drives juice intensity. */
export function tensionTier(mult: number): number {
  if (mult >= 16) return 4;
  if (mult >= 10) return 3;
  if (mult >= 6) return 2;
  if (mult >= 3) return 1;
  return 0;
}
