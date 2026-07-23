// Reconciling a soft-keyboard <input> into typing-engine events.
//
// On desktop we read discrete `keydown` events, but a mobile soft keyboard
// gives us nothing reliable there: Android GBoard sends a placeholder keyCode
// 229, autocorrect rewrites whole words, and predictive text commits several
// characters at once. The one thing we *can* trust is the input's `value`
// before and after each `input` event. So instead of interpreting keystrokes,
// we diff the value and translate the change into the same primitives the
// engine already understands: some number of backspaces, then some inserted
// text.
//
// This is deliberately dumb and total: it does not care *how* the value
// changed (a tap, an autocorrect replacement, a paste, an IME commit) — it
// only reconciles old → new, so every path funnels through one tested
// function.

export interface InputDelta {
  /** how many characters were removed from the end of the common prefix */
  backspaces: number;
  /** the characters that were newly inserted after that prefix */
  inserts: string;
}

/**
 * Diff two input values into engine primitives.
 *
 * We find the longest common prefix, treat everything after it in `prev` as
 * deleted (backspaces) and everything after it in `next` as typed (inserts).
 * A pure autocorrect replacement — "teh " → "the " — comes back as a few
 * backspaces followed by the corrected text, which is exactly how a person
 * would fix it by hand, so the engine sees an honest correction rather than a
 * teleport.
 */
export function diffInput(prev: string, next: string): InputDelta {
  const max = Math.min(prev.length, next.length);
  let p = 0;
  while (p < max && prev[p] === next[p]) p++;
  return { backspaces: prev.length - p, inserts: next.slice(p) };
}
