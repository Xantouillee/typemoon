import { useCallback, useEffect, useRef, useState } from 'react';
import { TypingEngine, charMatches } from '../engine/TypingEngine';
import type { EngineSnapshot, TestResult } from '../engine/types';
import { baseKey } from '../components/Keyboard/layouts';
import {
  DEFAULT_SOUND_THEME,
  ding,
  errorKey,
  pressKey,
  releaseKey,
  resetMelodies,
  timeWarning as playTimeWarning,
  type ErrorSoundId,
  type SoundThemeId,
} from '../lib/sound';
import type { EngineOptions } from '../engine/TypingEngine';

interface Options extends EngineOptions {
  sound?: boolean;
  soundTheme?: SoundThemeId;
  errorSound?: ErrorSoundId;
  /** seconds-remaining mark that triggers the warning tick (0 = off) */
  timeWarning?: number;
  onFinish?: (result: TestResult) => void;
}

/** The engine-relevant slice of the options, so the engine rebuilds when they change. */
function engineOpts(o: Options): EngineOptions {
  return {
    timeLimit: o.timeLimit,
    difficulty: o.difficulty,
    stopOnError: o.stopOnError,
    confidence: o.confidence,
    freedom: o.freedom,
    lazy: o.lazy,
  };
}

export interface TypingApi {
  snapshot: EngineSnapshot;
  activeKey: string | null;
  wrongKey: boolean;
  finished: boolean;
  /** seconds remaining in Time mode, else null */
  remaining: number | null;
  restart: () => void;
  focusProps: {
    ref: React.RefObject<HTMLDivElement | null>;
    tabIndex: number;
    /** styling hook: kills the focus ring, and grounds the words over a backdrop */
    'data-typing-surface': string;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onKeyUp: (e: React.KeyboardEvent) => void;
    onFocus: () => void;
    onBlur: () => void;
  };
  focused: boolean;
  focus: () => void;
}

export function useTypingTest(target: string, opts: Options): TypingApi {
  const engineRef = useRef<TypingEngine>(new TypingEngine(target, engineOpts(opts)));
  const [, force] = useState(0);
  const rerender = useCallback(() => force((n) => n + 1), []);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [wrongKey, setWrongKey] = useState(false);
  const [focused, setFocused] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(
    opts.timeLimit ?? null,
  );
  const ref = useRef<HTMLDivElement>(null);
  const finishedNotified = useRef(false);
  const clearActive = useRef<number | null>(null);
  const warned = useRef(false);

  // Rebuild the engine whenever the text or time limit changes.
  const engineKey = JSON.stringify(engineOpts(opts));
  useEffect(() => {
    engineRef.current = new TypingEngine(target, engineOpts(opts));
    finishedNotified.current = false;
    warned.current = false;
    // a melody voice plays across the whole run — a new run starts the tune over
    resetMelodies();
    setRemaining(opts.timeLimit ?? null);
    setActiveKey(null);
    rerender();
    // Auto-focus so the very first keystroke starts the test — no click needed.
    if (target) requestAnimationFrame(() => ref.current?.focus());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, engineKey]);

  const settle = useCallback(() => {
    const engine = engineRef.current;
    if (engine.finished && !finishedNotified.current) {
      finishedNotified.current = true;
      if (opts.sound) ding();
      opts.onFinish?.(engine.result());
    }
    rerender();
  }, [opts, rerender]);

  // Live clock for Time mode (drives countdown + time-expiry finish).
  useEffect(() => {
    if (opts.timeLimit == null) return;
    const id = window.setInterval(() => {
      const engine = engineRef.current;
      if (!engine.started || engine.finished) return;
      const left = Math.max(0, opts.timeLimit! - engine.elapsedMs() / 1000);
      setRemaining(Math.ceil(left));
      const mark = opts.timeWarning ?? 0;
      if (mark > 0 && !warned.current && left <= mark) {
        warned.current = true;
        if (opts.sound) playTimeWarning();
      }
      if (left <= 0) {
        engine.finish();
        settle();
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [opts.timeLimit, settle]);

  const flashKey = useCallback((key: string, wrong: boolean) => {
    setActiveKey(key);
    setWrongKey(wrong);
    if (clearActive.current) window.clearTimeout(clearActive.current);
    clearActive.current = window.setTimeout(() => setActiveKey(null), 120);
  }, []);

  // Which physical keys are currently down. Keeps a held key from machine-gunning
  // the press sound, and tells us what to release on the way back up.
  const held = useRef<Set<string>>(new Set());
  const soundTheme = opts.soundTheme ?? DEFAULT_SOUND_THEME;

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const engine = engineRef.current;
      if (engine.finished) return;

      const fresh = !held.current.has(e.code);
      held.current.add(e.code);

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (opts.sound && fresh) pressKey(soundTheme, ' ', true);
        if (e.ctrlKey || e.altKey) engine.backspaceWord();
        else engine.backspace();
        rerender();
        return;
      }
      if (e.key === ' ') e.preventDefault();
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;

      const expected = engine.snapshot().target[engine.snapshot().cursor];
      const correct = charMatches(e.key, expected, opts.lazy);
      flashKey(e.key === ' ' ? ' ' : baseKey(e.key), !correct);
      if (opts.sound && fresh) {
        if (correct) pressKey(soundTheme, e.key, e.key === ' ');
        else errorKey(soundTheme, opts.errorSound ?? 'voice');
      }
      engine.press(e.key);
      settle();
    },
    [flashKey, opts.sound, soundTheme, rerender, settle],
  );

  const onKeyUp = useCallback(
    (e: React.KeyboardEvent) => {
      if (!held.current.delete(e.code)) return;
      if (!opts.sound) return;
      if (e.key === 'Backspace') return releaseKey(soundTheme, ' ');
      if (e.key.length !== 1) return;
      releaseKey(soundTheme, e.key);
    },
    [opts.sound, soundTheme],
  );

  const restart = useCallback(() => {
    // NB: must carry the full option set. Rebuilding with only the time limit
    // silently dropped difficulty, stop-on-error, confidence, freedom and lazy
    // mode the moment anyone pressed Tab.
    engineRef.current = new TypingEngine(target, engineOpts(opts));
    finishedNotified.current = false;
    warned.current = false;
    resetMelodies();
    setRemaining(opts.timeLimit ?? null);
    setActiveKey(null);
    rerender();
    ref.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, engineKey, rerender]);

  const focus = useCallback(() => ref.current?.focus(), []);

  const snapshot = engineRef.current.snapshot();

  return {
    snapshot,
    activeKey,
    wrongKey,
    finished: snapshot.finished,
    remaining,
    restart,
    focused,
    focus,
    focusProps: {
      ref,
      tabIndex: 0,
      'data-typing-surface': '',
      onKeyDown,
      onKeyUp,
      onFocus: () => setFocused(true),
      onBlur: () => {
        // a key held while focus leaves would otherwise never release
        held.current.clear();
        setFocused(false);
      },
    },
  };
}
