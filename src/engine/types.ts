// Framework-agnostic typing-engine types.
// Kept free of React so the engine can be unit-tested and reused (e.g. v2 VS mode).

export type CharState = 'untyped' | 'correct' | 'incorrect';

/** How harshly a mistake is punished. */
export type Difficulty = 'normal' | 'expert' | 'master';

/** Whether input is blocked after a mistake, and at what granularity. */
export type StopOnError = 'off' | 'letter' | 'word';

/** How much of what you already typed you are allowed to take back. */
export type Confidence = 'off' | 'on' | 'max';

export interface Keystroke {
  /** ms since the first keystroke of the test */
  t: number;
  /** the character the user pressed ('' for backspace) */
  key: string;
  /** the target character at the cursor when pressed */
  expected: string;
  /** whether the pressed key matched the expected character */
  correct: boolean;
  /** ms since the previous keystroke (for per-key latency / heatmap) */
  latency: number;
  /** true when this event was a backspace */
  backspace: boolean;
}

export interface PerKeyStat {
  key: string;
  presses: number;
  errors: number;
  /** average latency in ms across correct presses */
  avgLatency: number;
}

export interface WpmSample {
  /** second index (1..n) */
  t: number;
  /** net wpm at this moment */
  wpm: number;
  /** raw wpm at this moment */
  raw: number;
}

export interface TestResult {
  wpm: number;
  raw: number;
  accuracy: number;
  consistency: number;
  timeSeconds: number;
  correctChars: number;
  incorrectChars: number;
  totalKeystrokes: number;
  series: WpmSample[];
  perKey: PerKeyStat[];
  /** count of characters in the target that were actually reached */
  charsTyped: number;
  /** the run was cut short by Expert/Master rather than reaching its end */
  failed: boolean;
}

export interface EngineSnapshot {
  target: string;
  states: CharState[];
  /** what the user actually pressed at each index (for "indicate typos") */
  typed: (string | null)[];
  cursor: number;
  started: boolean;
  finished: boolean;
  /** true when a difficulty rule ended the test early */
  failed: boolean;
  /** set while stop-on-error is blocking further input */
  blocked: boolean;
  /** live net wpm */
  wpm: number;
  /** live accuracy 0-100 */
  accuracy: number;
  elapsedMs: number;
}
