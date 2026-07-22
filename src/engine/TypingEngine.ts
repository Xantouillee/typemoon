import type {
  CharState,
  Confidence,
  Difficulty,
  EngineSnapshot,
  Keystroke,
  StopOnError,
  TestResult,
} from './types';
import {
  accuracyFromStream,
  buildSeries,
  charsToWpm,
  consistencyFromSeries,
  perKeyStats,
} from './wpm';

export interface EngineOptions {
  /** hard time limit in seconds (Time mode). 0 = untimed (Words/Quote). */
  timeLimit?: number;
  /** expert fails on submitting a bad word, master on any bad key */
  difficulty?: Difficulty;
  /** block input after a mistake until it is corrected */
  stopOnError?: StopOnError;
  /** 'on' forbids returning to earlier words, 'max' forbids backspace entirely */
  confidence?: Confidence;
  /** allow deleting characters that were already typed correctly */
  freedom?: boolean;
  /** treat accented characters as their plain equivalents */
  lazy?: boolean;
}

/** Strip diacritics so `é` accepts `e` — the "lazy mode" comparison. */
function plain(ch: string): string {
  return ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Character-index typing engine.
 * The cursor walks the target string; each printable keypress is compared to the
 * expected character. Backspace steps the cursor back and clears that slot.
 * All timing is captured for post-run analytics (series, heatmap, consistency).
 */
export class TypingEngine {
  readonly target: string;
  private readonly opts: EngineOptions;

  private states: CharState[];
  private typed: (string | null)[];
  private cursor = 0;
  private strokes: Keystroke[] = [];
  private startTime = 0;
  private lastStrokeTime = 0;
  private _started = false;
  private _finished = false;
  private _failed = false;

  constructor(target: string, opts: EngineOptions = {}) {
    this.target = target;
    this.opts = opts;
    this.states = new Array(target.length).fill('untyped');
    this.typed = new Array(target.length).fill(null);
  }

  get failed() {
    return this._failed;
  }

  /** Does the character the user pressed count as the one we expected? */
  private matches(char: string, expected: string): boolean {
    if (char === expected) return true;
    return this.opts.lazy === true && plain(char) === plain(expected);
  }

  /** Index just after the last space before `i` — the start of that word. */
  private wordStart(i: number): number {
    let j = i;
    while (j > 0 && this.target[j - 1] !== ' ') j--;
    return j;
  }

  /** True when any character of the word ending at `end` was typed wrong. */
  private wordHasErrors(end: number): boolean {
    for (let i = this.wordStart(end); i < end; i++) {
      if (this.states[i] === 'incorrect') return true;
    }
    return false;
  }

  /**
   * Stop-on-error blocks input while an uncorrected mistake stands:
   * 'letter' blocks immediately, 'word' blocks only at the word boundary.
   */
  private isBlocked(): boolean {
    const mode = this.opts.stopOnError ?? 'off';
    if (mode === 'off' || this.cursor === 0) return false;
    if (mode === 'letter') return this.states[this.cursor - 1] === 'incorrect';
    return this.wordHasErrors(this.cursor);
  }

  get started() {
    return this._started;
  }
  get finished() {
    return this._finished;
  }

  private now() {
    return performance.now();
  }

  /** ms elapsed since the first keystroke. */
  elapsedMs(): number {
    if (!this._started) return 0;
    const end = this._finished ? this.lastStrokeTime : this.now();
    return end - this.startTime;
  }

  /** Feed a single printable character. Returns true if the test just finished. */
  press(char: string): boolean {
    if (this._finished || this.cursor >= this.target.length) return this._finished;
    // an uncorrected mistake swallows further input until it is fixed
    if (this.isBlocked()) return this._finished;

    const time = this.now();
    if (!this._started) {
      this._started = true;
      this.startTime = time;
      this.lastStrokeTime = time;
    }
    const expected = this.target[this.cursor];
    const correct = this.matches(char, expected);
    this.states[this.cursor] = correct ? 'correct' : 'incorrect';
    this.typed[this.cursor] = char;

    // Expert ends the run on submitting a flawed word; Master on any bad key.
    const difficulty = this.opts.difficulty ?? 'normal';
    if (difficulty === 'master' && !correct) this._failed = true;
    else if (difficulty === 'expert' && char === ' ' && this.wordHasErrors(this.cursor)) {
      this._failed = true;
    }

    this.strokes.push({
      t: time - this.startTime,
      key: char,
      expected,
      correct,
      latency: time - this.lastStrokeTime,
      backspace: false,
    });
    this.lastStrokeTime = time;
    this.cursor += 1;

    if (this._failed || this.cursor >= this.target.length) this.finish();
    else this.checkTime();
    return this._finished;
  }

  /**
   * How far back the user may delete. Confidence 'max' forbids backspace
   * outright, 'on' pins them inside the current word, and without freedom mode
   * a correctly-typed character is already committed.
   */
  private canBackspace(): boolean {
    if (this._finished || !this._started || this.cursor === 0) return false;
    const confidence = this.opts.confidence ?? 'off';
    if (confidence === 'max') return false;
    if (confidence === 'on' && this.cursor === this.wordStart(this.cursor)) return false;
    if (this.opts.freedom === false && this.states[this.cursor - 1] === 'correct') return false;
    return true;
  }

  /** Backspace: step back one character and clear it. */
  backspace(): void {
    if (!this.canBackspace()) return;
    const time = this.now();
    this.cursor -= 1;
    this.states[this.cursor] = 'untyped';
    this.typed[this.cursor] = null;
    this.strokes.push({
      t: time - this.startTime,
      key: '',
      expected: this.target[this.cursor],
      correct: false,
      latency: time - this.lastStrokeTime,
      backspace: true,
    });
    this.lastStrokeTime = time;
  }

  /** Word-boundary backspace (Ctrl/Alt+Backspace): clear back to previous word start. */
  backspaceWord(): void {
    if (this._finished || this.cursor === 0 || !this.canBackspace()) return;
    // skip trailing spaces, then the word
    while (this.cursor > 0 && this.target[this.cursor - 1] === ' ') this.backspace();
    while (this.cursor > 0 && this.target[this.cursor - 1] !== ' ') this.backspace();
  }

  private checkTime() {
    if (this.opts.timeLimit && this.elapsedMs() >= this.opts.timeLimit * 1000) {
      this.finish();
    }
  }

  /** Force-finish (time expiry driven from the UI clock). */
  finish(): void {
    if (this._finished) return;
    this._finished = true;
    if (this.lastStrokeTime <= this.startTime) this.lastStrokeTime = this.now();
  }

  private counts() {
    let correct = 0;
    let incorrect = 0;
    for (let i = 0; i < this.cursor; i++) {
      if (this.states[i] === 'correct') correct++;
      else if (this.states[i] === 'incorrect') incorrect++;
    }
    return { correct, incorrect };
  }

  snapshot(): EngineSnapshot {
    const ms = this.elapsedMs();
    const { correct } = this.counts();
    return {
      target: this.target,
      states: this.states,
      typed: this.typed,
      cursor: this.cursor,
      started: this._started,
      finished: this._finished,
      failed: this._failed,
      blocked: this.isBlocked(),
      wpm: Math.round(charsToWpm(correct, ms)),
      accuracy: Math.round(accuracyFromStream(this.strokes)),
      elapsedMs: ms,
    };
  }

  result(): TestResult {
    const ms = this.elapsedMs();
    const { correct, incorrect } = this.counts();
    const series = buildSeries(this.strokes, ms);
    const typedStrokes = this.strokes.filter((s) => !s.backspace).length;
    return {
      wpm: Math.round(charsToWpm(correct, ms)),
      raw: Math.round(charsToWpm(typedStrokes, ms)),
      accuracy: Math.round(accuracyFromStream(this.strokes) * 10) / 10,
      consistency: Math.round(consistencyFromSeries(series) * 10) / 10,
      timeSeconds: Math.round((ms / 1000) * 10) / 10,
      correctChars: correct,
      incorrectChars: incorrect,
      totalKeystrokes: this.strokes.length,
      series,
      perKey: perKeyStats(this.strokes),
      charsTyped: this.cursor,
    };
  }
}
