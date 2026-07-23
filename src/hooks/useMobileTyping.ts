import { useCallback, useEffect, useRef, useState } from 'react';
import { TypingEngine, charMatches } from '../engine/TypingEngine';
import type { EngineSnapshot, TestResult } from '../engine/types';
import {
  DEFAULT_SOUND_THEME,
  ding,
  errorKey,
  pressKey,
  releaseKey,
  resetMelodies,
  type ErrorSoundId,
  type SoundThemeId,
} from '../lib/sound';
import { diffInput } from '../mobile/inputDiff';

/** Where a run is in its life: waiting to begin, live, or over. */
export type RunPhase = 'ready' | 'running' | 'done';

interface Options {
  /** hard time limit in seconds; undefined for a fixed-length (words) run */
  timeLimit?: number;
  sound?: boolean;
  soundTheme?: SoundThemeId;
  errorSound?: ErrorSoundId;
  lazy?: boolean;
  onFinish?: (result: TestResult) => void;
}

export interface MobileTypingApi {
  snapshot: EngineSnapshot;
  phase: RunPhase;
  /** seconds left in a timed run, else null */
  remaining: number | null;
  /** true while the hidden field holds keyboard focus */
  keyboardUp: boolean;
  /** raise the soft keyboard — must be called inside a user gesture (a tap) */
  start: () => void;
  /** end the current run now and surface the result */
  stop: () => void;
  /** wipe the run and start the same text over, keyboard still up */
  restart: () => void;
  /** props spread onto the hidden <input> that captures typing */
  inputProps: {
    ref: React.RefObject<HTMLInputElement | null>;
    onInput: (e: React.FormEvent<HTMLInputElement>) => void;
    onFocus: () => void;
    onBlur: () => void;
  };
}

/**
 * The mobile counterpart to `useTypingTest`. A soft keyboard can't be read
 * through `keydown`, so this drives an off-screen <input> instead and turns its
 * value changes into engine primitives via `diffInput`. The engine, content and
 * scoring are all shared with the desktop path — only the input road is new.
 *
 * Run options are kept permissive on purpose (freedom on, no confidence lock, no
 * stop-on-error): the input field is the source of truth for what has been
 * typed, so the engine must always accept the backspaces the field reports or
 * the two would drift apart.
 */
export function useMobileTyping(target: string, opts: Options): MobileTypingApi {
  const engineRef = useRef<TypingEngine>(new TypingEngine(target, { timeLimit: opts.timeLimit, lazy: opts.lazy }));
  const inputRef = useRef<HTMLInputElement>(null);
  /** last value we reconciled, so the next `input` event diffs against it */
  const prevValue = useRef('');
  const finishedNotified = useRef(false);

  const [, force] = useState(0);
  const rerender = useCallback(() => force((n) => n + 1), []);
  const [remaining, setRemaining] = useState<number | null>(opts.timeLimit ?? null);
  const [keyboardUp, setKeyboardUp] = useState(false);

  const soundTheme = opts.soundTheme ?? DEFAULT_SOUND_THEME;

  // A fresh target (new run / mode change) rebuilds the engine and clears the
  // field so nothing bleeds across from the last run. Keyed on the target text
  // itself — two different passages of equal length must still rebuild.
  useEffect(() => {
    engineRef.current = new TypingEngine(target, { timeLimit: opts.timeLimit, lazy: opts.lazy });
    prevValue.current = '';
    finishedNotified.current = false;
    resetMelodies();
    setRemaining(opts.timeLimit ?? null);
    if (inputRef.current) inputRef.current.value = '';
    rerender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, opts.timeLimit, opts.lazy]);

  const settle = useCallback(() => {
    const engine = engineRef.current;
    if (engine.finished && !finishedNotified.current) {
      finishedNotified.current = true;
      if (opts.sound) ding();
      // the run is over — let the keyboard fall away so results are unobstructed
      inputRef.current?.blur();
      opts.onFinish?.(engine.result());
    }
    rerender();
  }, [opts, rerender]);

  // Live clock for timed runs. Mirrors the desktop hook: the engine measures
  // elapsed time from the first keystroke; this only drives the countdown and
  // the time-expiry finish.
  useEffect(() => {
    if (opts.timeLimit == null) return;
    const id = window.setInterval(() => {
      const engine = engineRef.current;
      if (!engine.started || engine.finished) return;
      const left = Math.max(0, opts.timeLimit! - engine.elapsedMs() / 1000);
      setRemaining(Math.ceil(left));
      if (left <= 0) {
        engine.finish();
        settle();
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [opts.timeLimit, settle]);

  /** Play the tactile press+release for one committed character. */
  const voice = useCallback(
    (char: string, correct: boolean) => {
      if (!opts.sound) return;
      if (!correct) {
        errorKey(soundTheme, opts.errorSound ?? 'voice');
        return;
      }
      const big = char === ' ';
      pressKey(soundTheme, char, big);
      // there is no physical key-up on a touchscreen; fake a quick one so
      // press-and-release voices get both halves of their sound
      window.setTimeout(() => releaseKey(soundTheme, char), 55);
    },
    [opts.sound, opts.errorSound, soundTheme],
  );

  const onInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const engine = engineRef.current;
      const next = (e.target as HTMLInputElement).value;
      const { backspaces, inserts } = diffInput(prevValue.current, next);
      prevValue.current = next;
      if (engine.finished) return;

      for (let i = 0; i < backspaces; i++) engine.backspace();

      for (const ch of inserts) {
        // a soft keyboard's return key can smuggle in a newline; the target is
        // one flowing line, so drop it rather than score it as a miss
        if (ch === '\n' || ch === '\r' || ch === '\t') continue;
        const snap = engine.snapshot();
        const expected = snap.target[snap.cursor];
        const correct = expected != null && charMatches(ch, expected, opts.lazy);
        if (!engine.finished) voice(ch, correct);
        engine.press(ch);
        if (engine.finished) break;
      }
      settle();
    },
    [voice, settle, opts.lazy],
  );

  const start = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const stop = useCallback(() => {
    const engine = engineRef.current;
    if (engine.finished) return;
    // nothing typed yet? then there is no run to end — just drop the keyboard
    if (!engine.started) {
      inputRef.current?.blur();
      rerender();
      return;
    }
    engine.finish();
    settle();
  }, [settle, rerender]);

  const restart = useCallback(() => {
    engineRef.current = new TypingEngine(target, { timeLimit: opts.timeLimit, lazy: opts.lazy });
    prevValue.current = '';
    finishedNotified.current = false;
    resetMelodies();
    setRemaining(opts.timeLimit ?? null);
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
    rerender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, opts.timeLimit, opts.lazy, rerender]);

  const snapshot = engineRef.current.snapshot();
  const phase: RunPhase = snapshot.finished ? 'done' : snapshot.started ? 'running' : 'ready';

  return {
    snapshot,
    phase,
    remaining,
    keyboardUp,
    start,
    stop,
    restart,
    inputProps: {
      ref: inputRef,
      onInput,
      onFocus: () => setKeyboardUp(true),
      onBlur: () => setKeyboardUp(false),
    },
  };
}
