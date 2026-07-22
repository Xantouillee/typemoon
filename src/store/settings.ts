import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_SOUND_THEME,
  setSoundVolume,
  type ErrorSoundId,
  type SoundThemeId,
} from '../lib/sound';
import type { Confidence, Difficulty, StopOnError } from '../engine/types';

export type Theme = 'light' | 'dark';
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
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      setLanguage: (language) => set({ language }),
      setMode: (mode) => set({ mode }),
      setTimeValue: (timeValue) => set({ timeValue }),
      setWordsValue: (wordsValue) => set({ wordsValue }),
      togglePunctuation: () => set((s) => ({ punctuation: !s.punctuation })),
      toggleNumbers: () => set((s) => ({ numbers: !s.numbers })),
      toggleSound: () => set((s) => ({ sound: !s.sound })),
      setSoundTheme: (soundTheme) => set({ soundTheme }),
      set: (key, value) => {
        if (key === 'soundVolume') setSoundVolume(value as number);
        set({ [key]: value } as Partial<SettingsState>);
      },
      reset: () => set({ ...DEFAULTS }),
    }),
    {
      name: 'typemoon-settings',
      onRehydrateStorage: () => (state) => {
        // the audio graph is created lazily, so push the stored volume into it
        if (state) setSoundVolume(state.soundVolume);
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
