import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_SOUND_THEME,
  setCustomMelody,
  setSoundVolume,
  type ErrorSoundId,
  type SoundThemeId,
} from '../lib/sound';
import type { Confidence, Difficulty, StopOnError } from '../engine/types';
import { backgroundMeta, type BackgroundId } from '../lib/backgrounds';
import { parseMelody } from '../lib/melody';

export type Theme = 'light' | 'dark' | 'caramel';

/** Cycle order for the header toggle. */
export const THEMES: Theme[] = ['light', 'caramel', 'dark'];
export type Mode = 'time' | 'words' | 'quote' | 'daily' | 'zen';

/** How a mistyped character is revealed. */
export type IndicateTypos = 'off' | 'below' | 'replace';
export type CaretStyle = 'line' | 'block' | 'outline' | 'underline' | 'off';
export type SmoothCaret = 'off' | 'slow' | 'medium' | 'fast';
export type HighlightMode = 'off' | 'letter' | 'word';
export type TypedEffect = 'keep' | 'fade' | 'dots' | 'hide';
export type SpeedUnit = 'wpm' | 'cpm' | 'wps';

export const TIME_VALUES = [15, 30, 60, 120] as const;
export const WORD_VALUES = [10, 25, 50, 100] as const;
export const TIME_WARNINGS = [0, 1, 3, 5, 10] as const;

interface SettingsState {
  theme: Theme;
  language: string;
  mode: Mode;
  timeValue: number;
  wordsValue: number;
  punctuation: boolean;
  numbers: boolean;

  // sound
  sound: boolean;
  soundTheme: SoundThemeId;
  soundVolume: number;
  errorSound: ErrorSoundId;
  timeWarning: number;
  /**
   * A tune the user typed in themselves, in the notation `lib/melody.ts` reads.
   * Stored here and nowhere else: it never leaves the browser, and nothing that
   * ships with Typemoon depends on it.
   */
  customMelody: string;

  // typing behaviour
  difficulty: Difficulty;
  stopOnError: StopOnError;
  confidence: Confidence;
  freedom: boolean;
  lazy: boolean;
  indicateTypos: IndicateTypos;

  // appearance
  caretStyle: CaretStyle;
  smoothCaret: SmoothCaret;
  highlightMode: HighlightMode;
  typedEffect: TypedEffect;
  fontSize: number;
  speedUnit: SpeedUnit;
  capsWarning: boolean;

  // backdrop — applies to practice and the arcade alike
  bgId: BackgroundId;
  /** 0..1 page-colour cover over the image; floored so text stays legible */
  bgScrim: number;
  bgBlur: number;
  /** the eye: hide the backdrop everywhere without losing which one you picked */
  bgVisible: boolean;

  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setLanguage: (l: string) => void;
  setMode: (m: Mode) => void;
  setTimeValue: (v: number) => void;
  setWordsValue: (v: number) => void;
  togglePunctuation: () => void;
  toggleNumbers: () => void;
  toggleSound: () => void;
  setSoundTheme: (t: SoundThemeId) => void;
  /** Also resets the scrim to a level that suits that image's brightness. */
  setBg: (id: BackgroundId) => void;
  toggleBgVisible: () => void;
  /** Any other setting, by key — the settings page drives everything through this. */
  set: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  reset: () => void;
}

const DEFAULTS = {
  theme: 'light' as Theme,
  language: 'en',
  mode: 'time' as Mode,
  timeValue: 30,
  wordsValue: 25,
  punctuation: false,
  numbers: false,

  sound: true,
  soundTheme: DEFAULT_SOUND_THEME,
  soundVolume: 0.7,
  errorSound: 'voice' as ErrorSoundId,
  timeWarning: 0,
  customMelody: '',

  difficulty: 'normal' as Difficulty,
  stopOnError: 'off' as StopOnError,
  confidence: 'off' as Confidence,
  freedom: true,
  lazy: false,
  indicateTypos: 'off' as IndicateTypos,

  caretStyle: 'line' as CaretStyle,
  smoothCaret: 'medium' as SmoothCaret,
  highlightMode: 'off' as HighlightMode,
  typedEffect: 'keep' as TypedEffect,
  fontSize: 1,
  speedUnit: 'wpm' as SpeedUnit,
  capsWarning: true,

  bgId: 'none' as BackgroundId,
  bgScrim: 0.7,
  bgBlur: 3,
  bgVisible: true,
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((s) => ({ theme: THEMES[(THEMES.indexOf(s.theme) + 1) % THEMES.length] })),
      setLanguage: (language) => set({ language }),
      setMode: (mode) => set({ mode }),
      setTimeValue: (timeValue) => set({ timeValue }),
      setWordsValue: (wordsValue) => set({ wordsValue }),
      togglePunctuation: () => set((s) => ({ punctuation: !s.punctuation })),
      toggleNumbers: () => set((s) => ({ numbers: !s.numbers })),
      toggleSound: () => set((s) => ({ sound: !s.sound })),
      setSoundTheme: (soundTheme) => set({ soundTheme }),
      setBg: (bgId) =>
        set({ bgId, bgScrim: backgroundMeta(bgId).weight || 0.7, bgVisible: true }),
      toggleBgVisible: () => set((s) => ({ bgVisible: !s.bgVisible })),
      set: (key, value) => {
        if (key === 'soundVolume') setSoundVolume(value as number);
        // the audio layer holds the parsed notes; the store holds what you wrote
        if (key === 'customMelody') setCustomMelody(parseMelody(value as string).notes);
        set({ [key]: value } as Partial<SettingsState>);
      },
      reset: () => {
        setCustomMelody([]);
        set({ ...DEFAULTS });
      },
    }),
    {
      name: 'typemoon-settings',
      // v2 promoted the arcade-only backdrop to a site-wide one and renamed its keys.
      version: 2,
      migrate: (persisted, from) => {
        const s = persisted as Record<string, unknown>;
        if (from < 2) {
          return {
            ...s,
            bgId: s.arcadeBg ?? DEFAULTS.bgId,
            bgScrim: s.arcadeScrim ?? DEFAULTS.bgScrim,
            bgBlur: s.arcadeBlur ?? DEFAULTS.bgBlur,
            bgVisible: true,
          };
        }
        return s;
      },
      onRehydrateStorage: () => (state) => {
        // the audio graph is created lazily, so push the stored settings into it
        if (!state) return;
        setSoundVolume(state.soundVolume);
        setCustomMelody(parseMelody(state.customMelody ?? '').notes);
      },
    },
  ),
);

/** A short human label for the current mode, e.g. "time 30". */
export function modeLabel(s: Pick<SettingsState, 'mode' | 'timeValue' | 'wordsValue'>): string {
  if (s.mode === 'time') return `time ${s.timeValue}`;
  if (s.mode === 'words') return `words ${s.wordsValue}`;
  return s.mode;
}

/** Convert net WPM into whatever unit the user reads speed in. */
export function toSpeedUnit(wpm: number, unit: SpeedUnit): number {
  if (unit === 'cpm') return Math.round(wpm * 5);
  if (unit === 'wps') return Math.round((wpm / 60) * 10) / 10;
  return Math.round(wpm);
}
