// Arcade backdrops.
//
// Readability is the constraint, not decoration: text sits on top of these, so
// every backdrop declares how hard it fights the words. `weight` drives the
// default scrim — a busy, bright image gets covered more than a dark quiet one.

export type BackgroundId = 'none' | 'rain' | 'harbour' | 'mountain' | 'jungle';

export interface BackgroundMeta {
  id: BackgroundId;
  name: string;
  /** what you are looking at */
  scene: string;
  file: string | null;
  /**
   * How much this image interferes with text, 0..1. Used as the default scrim
   * so a bright, busy scene starts more covered than a dark still one.
   */
  weight: number;
  /** roughly how heavy the download is, shown in the picker */
  kb: number;
}

export const BACKGROUNDS: BackgroundMeta[] = [
  { id: 'none', name: 'None', scene: 'plain paper', file: null, weight: 0, kb: 0 },
  {
    id: 'rain',
    name: 'Downpour',
    scene: 'ruined city, night rain',
    file: 'rain.gif',
    weight: 0.62,
    kb: 293,
  },
  {
    id: 'harbour',
    name: 'Harbour',
    scene: 'river at sunset',
    file: 'harbour.gif',
    weight: 0.72,
    kb: 307,
  },
  {
    id: 'mountain',
    name: 'Campfire',
    scene: 'mountain lake, dusk',
    file: 'mountain.gif',
    weight: 0.74,
    kb: 194,
  },
  {
    id: 'jungle',
    name: 'Cascades',
    scene: 'jungle waterfalls',
    file: 'jungle.gif',
    weight: 0.82,
    kb: 1198,
  },
];

export function backgroundMeta(id: BackgroundId): BackgroundMeta {
  return BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0];
}

/**
 * Resolve an asset URL against the deploy base. GitHub Pages serves the site
 * from /<repo>/, so a bare "/backgrounds/x.gif" would 404 there.
 */
export function backgroundUrl(file: string): string {
  return `${import.meta.env.BASE_URL}backgrounds/${file}`;
}

/**
 * The floor on the scrim. Below this, light-theme text over a bright frame of
 * the jungle stops being legible — so the slider simply cannot go there.
 */
export const MIN_SCRIM = 0.45;
export const MAX_SCRIM = 0.95;
