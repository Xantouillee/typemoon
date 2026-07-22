import { useCallback, useEffect, useRef, useState } from 'react';
import type { CharState } from '../engine/types';
import {
  HEAL_STREAK,
  crossedMilestone,
  isFast,
  multIncrement,
  wordChipTotal,
  wordGain,
} from './scoring';
import {
  modChips,
  modMistakeMult,
  modMultStep,
  quillFlags,
  type QuillId,
} from './quills';
import {
  DEFAULT_SOUND_THEME,
  pressKey,
  releaseKey,
  resetMelodies,
  type SoundThemeId,
} from '../lib/sound';

export type ArcadeMode = 'sprint30' | 'sprint60' | 'endless';

export const ARCADE_MODES: Record<ArcadeMode, { label: string; seconds: number | null }> = {
  sprint30: { label: 'Sprint · 30s', seconds: 30 },
  sprint60: { label: 'Sprint · 60s', seconds: 60 },
  endless: { label: 'Endless', seconds: null },
};

/** Everything a single run/page needs to configure itself. */
export interface RushConfig {
  seconds: number | null;
  /** score to reach to clear (Anthology page); null = play to the clock/hearts */
  target: number | null;
  startHearts: number;
  maxHearts: number;
  baseMult: number;
  wordPool: string[];
  quills: QuillId[];
  /** boss hard-word pool, mixed in when present */
  hardPool?: string[];
  /** deadline gimmick — clock runs this much faster (default 1) */
  timeScale?: number;
  /** keystroke sound — the scoring sfx are separate and always on */
  sound?: boolean;
  soundTheme?: SoundThemeId;
}

export interface ScoreEvent {
  gain: number;
  chips: number;
  mult: number;
  combo: number;
  fast: boolean;
  golden: boolean;
  milestone: number | null;
  healed: boolean;
}

export interface MistakeEvent {
  prevMult: number;
  mult: number;
  heartsLeft: number;
  /** Inkjacket forgave this one — no heart, no drop */
  forgiven: boolean;
}

export interface RunSummary {
  score: number;
  cleared: boolean;
  peakMult: number;
  words: number;
  wpm: number;
  accuracy: number;
}

interface Callbacks {
  onScore?: (e: ScoreEvent) => void;
  onMistake?: (e: MistakeEvent) => void;
  onOver?: (s: RunSummary) => void;
  onClear?: (s: RunSummary) => void;
  onMomentum?: (newBase: number) => void;
}

export interface InkRushView {
  running: boolean;
  over: boolean;
  cleared: boolean;
  started: boolean;
  score: number;
  mult: number;
  combo: number;
  hearts: number;
  peakMult: number;
  words: number;
  remaining: number | null;
  target: number | null;
  progress: number | null;
  skipEquipped: boolean;
  skipReady: boolean;
  skipRemaining: number;
  stream: string;
  states: CharState[];
  cursor: number;
}

interface GameState {
  stream: string;
  states: CharState[];
  cursor: number;
  wordStart: number;
  wordStartTime: number;
  wordDirty: boolean;
  startTime: number;
  started: boolean;
  running: boolean;
  over: boolean;
  cleared: boolean;
  score: number;
  mult: number;
  floor: number;
  combo: number;
  cleanCount: number;
  hearts: number;
  peakMult: number;
  words: number;
  correctChars: number;
  totalChars: number;
  endTime: number;
  forgiveUsed: boolean;
  skipCooldownUntil: number;
}

const BUFFER_TARGET = 260;
const TRIM_BEHIND = 160;

function fresh(cfg: RushConfig): GameState {
  return {
    stream: '',
    states: [],
    cursor: 0,
    wordStart: 0,
    wordStartTime: 0,
    wordDirty: false,
    startTime: 0,
    started: false,
    running: false,
    over: false,
    cleared: false,
    score: 0,
    mult: cfg.baseMult,
    floor: cfg.baseMult,
    combo: 0,
    cleanCount: 0,
    hearts: cfg.startHearts,
    peakMult: cfg.baseMult,
    words: 0,
    correctChars: 0,
    totalChars: 0,
    endTime: 0,
    forgiveUsed: false,
    skipCooldownUntil: 0,
  };
}

/**
 * Ink Rush game engine. Owns an endless word stream and reacts to each keystroke:
 * clean words score chips × mult; the first mistake in a word halves the mult and
 * costs a heart. Config-driven so the same engine powers plain Sprint/Endless runs
 * and the Quill-modified, target-based Pages of an Anthology run.
 */
export function useInkRush(config: RushConfig, cb: Callbacks) {
  const cfgRef = useRef(config);
  cfgRef.current = config;
  const cbRef = useRef(cb);
  cbRef.current = cb;

  const g = useRef<GameState>(fresh(config));
  const lastSpace = useRef(0);
  const held = useRef<Set<string>>(new Set());

  const [, force] = useState(0);
  const rerender = useCallback(() => force((n) => n + 1), []);
  const [remaining, setRemaining] = useState<number | null>(config.seconds);

  const flags = useCallback(() => quillFlags(cfgRef.current.quills), []);

  const randWord = useCallback(() => {
    const c = cfgRef.current;
    const f = quillFlags(c.quills);
    const useHard = !!c.hardPool?.length && Math.random() < 0.7;
    const pool = useHard ? c.hardPool! : c.wordPool.length ? c.wordPool : ['ink'];
    let w = pool[Math.floor(Math.random() * pool.length)];
    if (f.staccato && !useHard && Math.random() < 0.6) {
      for (let i = 0; i < 2; i++) {
        const cand = pool[Math.floor(Math.random() * pool.length)];
        if (cand.length < w.length) w = cand;
      }
    }
    return w;
  }, []);

  const refill = useCallback(
    (s: GameState) => {
      while (s.stream.length - s.cursor < BUFFER_TARGET) {
        const add = (s.stream.length ? ' ' : '') + randWord();
        s.stream += add;
        for (let i = 0; i < add.length; i++) s.states.push('untyped');
      }
    },
    [randWord],
  );

  const trim = useCallback((s: GameState) => {
    if (s.wordStart <= TRIM_BEHIND) return;
    const cut = s.stream.indexOf(' ', s.wordStart - TRIM_BEHIND);
    if (cut <= 0 || cut >= s.wordStart) return;
    const shift = cut + 1;
    s.stream = s.stream.slice(shift);
    s.states = s.states.slice(shift);
    s.cursor -= shift;
    s.wordStart -= shift;
  }, []);

  const summary = useCallback((s: GameState): RunSummary => {
    const ms = (s.endTime || performance.now()) - s.startTime;
    const wpm = ms > 0 ? Math.round((s.correctChars / 5) / (ms / 60000)) : 0;
    const accuracy =
      s.totalChars > 0
        ? Math.round((s.correctChars / s.totalChars) * 1000) / 10
        : 100;
    return {
      score: s.score,
      cleared: s.cleared,
      peakMult: Math.round(s.peakMult * 100) / 100,
      words: s.words,
      wpm,
      accuracy,
    };
  }, []);

  const finishRun = useCallback(
    (s: GameState, cleared: boolean) => {
      if (s.over) return;
      s.running = false;
      s.over = true;
      s.cleared = cleared;
      s.endTime = performance.now();
      const sum = summary(s);
      rerender();
      if (cleared) cbRef.current.onClear?.(sum);
      else cbRef.current.onOver?.(sum);
    },
    [rerender, summary],
  );

  const finishWord = useCallback(
    (s: GameState, spaceIndex: number) => {
      const word = s.stream.slice(s.wordStart, spaceIndex);
      const now = performance.now();
      const f = quillFlags(cfgRef.current.quills);
      if (!s.wordDirty && word.length > 0) {
        s.combo += 1;
        s.cleanCount += 1;
        s.words += 1;
        const chars = word.length + 1;
        const fast = isFast(chars, now - s.wordStartTime);
        const baseChips = wordChipTotal(word, fast);
        const chips = modChips(f, word, baseChips, s.cleanCount);
        const golden = f.golden && s.cleanCount % 20 === 0;
        const gain = wordGain(chips, s.mult);
        const prevMult = s.mult;
        s.score += gain;
        const step = modMultStep(f, word, fast, multIncrement(word, fast));
        s.mult = Math.max(s.floor, Math.round((s.mult + step) * 100) / 100);
        if (s.mult > s.peakMult) s.peakMult = s.mult;

        // Momentum: every 10 clean words lifts the floor (and current mult) for good
        if (f.momentum && s.cleanCount % 10 === 0) {
          s.floor = Math.round((s.floor + 0.5) * 100) / 100;
          s.mult = Math.round((s.mult + 0.5) * 100) / 100;
          if (s.mult > s.peakMult) s.peakMult = s.mult;
          cbRef.current.onMomentum?.(s.floor);
        }

        const milestone = crossedMilestone(prevMult, s.mult);
        let healed = false;
        if (s.combo > 0 && s.combo % HEAL_STREAK === 0 && s.hearts < cfgRef.current.maxHearts) {
          s.hearts += 1;
          healed = true;
        }
        cbRef.current.onScore?.({ gain, chips, mult: s.mult, combo: s.combo, fast, golden, milestone, healed });
      } else if (word.length > 0) {
        s.words += 1;
      }
      s.wordDirty = false;
      s.wordStart = s.cursor;
      s.wordStartTime = now;

      const target = cfgRef.current.target;
      if (target != null && s.score >= target && !s.over) finishRun(s, true);
    },
    [finishRun],
  );

  const applyMistake = useCallback((s: GameState) => {
    const f = quillFlags(cfgRef.current.quills);
    if (f.inkjacket && !s.forgiveUsed) {
      s.forgiveUsed = true;
      cbRef.current.onMistake?.({ prevMult: s.mult, mult: s.mult, heartsLeft: s.hearts, forgiven: true });
      return;
    }
    const prevMult = s.mult;
    s.mult = modMistakeMult(f, s.mult, s.floor);
    s.combo = 0;
    s.hearts -= 1;
    cbRef.current.onMistake?.({ prevMult, mult: s.mult, heartsLeft: s.hearts, forgiven: false });
    if (s.hearts <= 0) finishRun(s, false);
  }, [finishRun]);

  const press = useCallback(
    (char: string) => {
      const s = g.current;
      if (!s.running || s.over || s.cursor >= s.stream.length) return;
      const now = performance.now();
      if (!s.started) {
        s.started = true;
        s.startTime = now;
        s.wordStartTime = now;
      }
      const expected = s.stream[s.cursor];
      const correct = char === expected;
      s.states[s.cursor] = correct ? 'correct' : 'incorrect';
      s.totalChars += 1;
      if (correct) s.correctChars += 1;
      else {
        const wasClean = !s.wordDirty;
        s.wordDirty = true;
        if (wasClean) applyMistake(s);
      }
      const wasSpace = expected === ' ';
      s.cursor += 1;
      if (wasSpace && !s.over) finishWord(s, s.cursor - 1);
      if (!s.over) {
        refill(s);
        trim(s);
      }
      rerender();
    },
    [applyMistake, finishWord, refill, trim, rerender],
  );

  const skipWord = useCallback(
    (s: GameState) => {
      if (!s.running || s.over || s.cursor >= s.stream.length) return;
      let end = s.stream.indexOf(' ', s.cursor);
      if (end === -1) end = s.stream.length;
      s.cursor = Math.min(s.stream.length, end + 1);
      s.wordStart = s.cursor;
      s.wordStartTime = performance.now();
      s.wordDirty = false;
      s.skipCooldownUntil = performance.now() + 8000;
      refill(s);
      trim(s);
      rerender();
    },
    [refill, trim, rerender],
  );

  const start = useCallback(() => {
    const s = fresh(cfgRef.current);
    g.current = s;
    s.running = true;
    // a melody voice plays across the whole run — a new run starts the tune over
    resetMelodies();
    lastSpace.current = 0;
    refill(s);
    setRemaining(cfgRef.current.seconds);
    rerender();
  }, [refill, rerender]);

  // keep the displayed clock in sync with config before a run starts
  useEffect(() => {
    if (!g.current.started) setRemaining(config.seconds);
  }, [config.seconds]);

  // countdown clock (respects the deadline time-scale)
  useEffect(() => {
    const seconds = config.seconds;
    if (seconds == null) return;
    const scale = config.timeScale ?? 1;
    const id = window.setInterval(() => {
      const s = g.current;
      if (!s.running || !s.started || s.over) return;
      const elapsed = ((performance.now() - s.startTime) / 1000) * scale;
      const left = Math.max(0, seconds - elapsed);
      setRemaining(Math.ceil(left));
      if (left <= 0) finishRun(s, false);
    }, 100);
    return () => window.clearInterval(id);
  }, [config.seconds, config.timeScale, finishRun]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const s = g.current;
      if (!s.running || s.over) return;

      // The keyboard sounds the same whether you are right or wrong — the
      // scoring layer's crack is what tells you a word broke.
      if (!held.current.has(e.code)) {
        held.current.add(e.code);
        const cfg = cfgRef.current;
        if (cfg.sound && (e.key.length === 1 || e.key === 'Backspace')) {
          const big = e.key === ' ' || e.key === 'Backspace';
          pressKey(cfg.soundTheme ?? DEFAULT_SOUND_THEME, big ? ' ' : e.key, big);
        }
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        return; // locked-in
      }
      if (e.key === ' ') {
        e.preventDefault();
        const f = flags();
        if (f.quickQuill) {
          const now = performance.now();
          const doubled = now - lastSpace.current < 260;
          lastSpace.current = now;
          const ready = s.skipCooldownUntil <= now;
          if (doubled && ready) {
            skipWord(s);
            return;
          }
          // with Quick Quill, a mid-word space is a harmless no-op (not an error)
          if (s.stream[s.cursor] !== ' ') return;
        }
        press(' ');
        return;
      }
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
      press(e.key);
    },
    [press, skipWord, flags],
  );

  const onKeyUp = useCallback((e: React.KeyboardEvent) => {
    if (!held.current.delete(e.code)) return;
    const cfg = cfgRef.current;
    if (!cfg.sound) return;
    if (e.key.length !== 1 && e.key !== 'Backspace') return;
    releaseKey(cfg.soundTheme ?? DEFAULT_SOUND_THEME, e.key === 'Backspace' ? ' ' : e.key);
  }, []);

  /** Focus can leave with keys still down; drop them so they never hang. */
  const releaseAll = useCallback(() => held.current.clear(), []);

  const s = g.current;
  const now = performance.now();
  const target = config.target;
  const f = quillFlags(config.quills);
  const view: InkRushView = {
    running: s.running,
    over: s.over,
    cleared: s.cleared,
    started: s.started,
    score: s.score,
    mult: s.mult,
    combo: s.combo,
    hearts: s.hearts,
    peakMult: s.peakMult,
    words: s.words,
    remaining,
    target,
    progress: target != null ? Math.min(1, s.score / target) : null,
    skipEquipped: f.quickQuill,
    skipReady: f.quickQuill && s.skipCooldownUntil <= now,
    skipRemaining: f.quickQuill ? Math.max(0, (s.skipCooldownUntil - now) / 8000) : 0,
    stream: s.stream,
    states: s.states,
    cursor: s.cursor,
  };

  return { view, start, onKeyDown, onKeyUp, onBlur: releaseAll };
}
