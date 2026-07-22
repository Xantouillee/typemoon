// "The Anthology" — the roguelite run structure: a sequence of Pages with rising
// score targets, punctuated by Boss Pages with gimmicks and a hard-word finale.

export type Gimmick = 'fog' | 'deadline' | 'featherweight' | 'silent';

export interface Page {
  /** score you must reach to clear the page */
  target: number;
  /** seconds on the clock */
  seconds: number;
  boss: boolean;
  final: boolean;
  /** pull from the hard-word pool */
  hardWords: boolean;
}

/** The fixed 6-page spine. Boss gimmicks are rolled per run for replayability. */
export const ANTHOLOGY: Page[] = [
  { target: 400, seconds: 30, boss: false, final: false, hardWords: false },
  { target: 950, seconds: 30, boss: false, final: false, hardWords: false },
  { target: 1700, seconds: 35, boss: true, final: false, hardWords: false },
  { target: 2700, seconds: 35, boss: false, final: false, hardWords: false },
  { target: 4000, seconds: 40, boss: false, final: false, hardWords: false },
  { target: 6200, seconds: 45, boss: true, final: true, hardWords: true },
];

export const GIMMICK_INFO: Record<Gimmick, { name: string; desc: string }> = {
  fog: { name: 'Fog', desc: 'The words ahead are blurred until you reach them.' },
  deadline: { name: 'Deadline', desc: 'The clock runs faster than it looks.' },
  featherweight: { name: 'Featherweight', desc: 'You start this page on a single heart.' },
  silent: { name: 'Silent', desc: 'No highlight on the word you are typing.' },
};

/** Boss gimmick for a page index, seeded so a run is consistent but varied. */
export function rollGimmick(pageIndex: number, seed: number): Gimmick | null {
  const page = ANTHOLOGY[pageIndex];
  if (!page?.boss) return null;
  if (page.final) return 'fog'; // the finale always fogs
  const pool: Gimmick[] = ['deadline', 'featherweight', 'silent'];
  return pool[(seed + pageIndex) % pool.length];
}

/** Long, rare-letter words for boss pages — genuinely hard to nail at speed. */
export const HARD_WORDS = [
  'labyrinth', 'quixotic', 'zephyr', 'juxtapose', 'kaleidoscope', 'onomatopoeia',
  'perpendicular', 'rhythmically', 'sphinx', 'awkwardly', 'bewilderment', 'cryptography',
  'exquisite', 'flabbergasted', 'gazebo', 'hyperbole', 'idiosyncrasy', 'jeopardize',
  'knapsack', 'liquefy', 'mnemonic', 'nauseous', 'obfuscate', 'paradoxical',
  'quagmire', 'razzmatazz', 'subjugate', 'twelfth', 'unequivocally', 'vortex',
  'wavelength', 'xylophone', 'yacht', 'zigzagging', 'jackpot', 'quizzical',
];

export interface RunState {
  pageIndex: number;
  totalScore: number;
  baseMult: number; // carried by Momentum
  quills: string[];
}
