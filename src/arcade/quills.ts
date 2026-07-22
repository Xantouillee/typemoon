// Quills — the roguelite augments picked between Pages of an Anthology run.
// Metadata + pure effect helpers (unit-tested) that the game hook applies.

export type QuillId =
  | 'serifed'
  | 'rarity'
  | 'golden'
  | 'momentum'
  | 'softLanding'
  | 'secondWind'
  | 'inkjacket'
  | 'staccato'
  | 'quickQuill'
  | 'overdrive';

export type Archetype = 'Economy' | 'Multiplier' | 'Survival' | 'Flow';

export interface Quill {
  id: QuillId;
  name: string;
  archetype: Archetype;
  glyph: string;
  blurb: string;
}

export const QUILLS: Quill[] = [
  { id: 'serifed', name: 'Serifed', archetype: 'Economy', glyph: 'e', blurb: 'Every vowel in a clean word grants +3 bonus chips.' },
  { id: 'rarity', name: 'Rarity Hunter', archetype: 'Economy', glyph: 'Q', blurb: 'Words containing j, k, q, x or z score ×2 chips.' },
  { id: 'golden', name: 'Golden Word', archetype: 'Economy', glyph: '★', blurb: 'Every 20th clean word is golden: ×4 chips.' },
  { id: 'momentum', name: 'Momentum', archetype: 'Multiplier', glyph: '↑', blurb: 'Every 10-word streak permanently raises your base multiplier by +0.5.' },
  { id: 'softLanding', name: 'Soft Landing', archetype: 'Multiplier', glyph: '↓', blurb: 'A mistake subtracts a flat −1.5 from your multiplier instead of halving it.' },
  { id: 'secondWind', name: 'Second Wind', archetype: 'Survival', glyph: '♥', blurb: '+2 max hearts, refilled at the start of every Page.' },
  { id: 'inkjacket', name: 'Inkjacket', archetype: 'Survival', glyph: '⛊', blurb: 'The first mistake on each Page is forgiven — no heart, no multiplier drop.' },
  { id: 'staccato', name: 'Staccato', archetype: 'Flow', glyph: '·', blurb: 'More short words appear, and clean words of 4 letters or fewer give a double multiplier tick.' },
  { id: 'quickQuill', name: 'Quick Quill', archetype: 'Flow', glyph: '»', blurb: 'Double-tap space to skip the current word. 8-second cooldown.' },
  { id: 'overdrive', name: 'Overdrive', archetype: 'Flow', glyph: '⚡', blurb: 'Fast words grant +2 multiplier — but words typed slowly cost −0.5.' },
];

export const QUILL_BY_ID: Record<QuillId, Quill> = Object.fromEntries(
  QUILLS.map((q) => [q.id, q]),
) as Record<QuillId, Quill>;

export interface QuillFlags {
  serifed: boolean;
  rarity: boolean;
  golden: boolean;
  momentum: boolean;
  softLanding: boolean;
  secondWind: boolean;
  inkjacket: boolean;
  staccato: boolean;
  quickQuill: boolean;
  overdrive: boolean;
}

export function quillFlags(ids: QuillId[]): QuillFlags {
  const has = (id: QuillId) => ids.includes(id);
  return {
    serifed: has('serifed'),
    rarity: has('rarity'),
    golden: has('golden'),
    momentum: has('momentum'),
    softLanding: has('softLanding'),
    secondWind: has('secondWind'),
    inkjacket: has('inkjacket'),
    staccato: has('staccato'),
    quickQuill: has('quickQuill'),
    overdrive: has('overdrive'),
  };
}

const VOWELS = /[aeiouyàâäéèêëïîôöùûü]/gi;
const RARE = /[jkqxz]/i;

/** Is this the golden word? (1-based clean-word index, every 20th.) */
export function isGolden(f: QuillFlags, cleanIndex: number): boolean {
  return f.golden && cleanIndex > 0 && cleanIndex % 20 === 0;
}

/** Apply chip-side Quill effects (Serifed, Rarity Hunter, Golden Word). */
export function modChips(
  f: QuillFlags,
  word: string,
  baseChips: number,
  cleanIndex: number,
): number {
  let chips = baseChips;
  if (f.serifed) {
    const vowels = (word.match(VOWELS) ?? []).length;
    chips += vowels * 3;
  }
  if (f.rarity && RARE.test(word)) chips *= 2;
  if (isGolden(f, cleanIndex)) chips *= 4;
  return Math.round(chips);
}

/** Apply mult-step Quill effects (Staccato, Overdrive) to a clean word's tick. */
export function modMultStep(
  f: QuillFlags,
  word: string,
  fast: boolean,
  baseStep: number,
): number {
  if (f.overdrive) return fast ? 2 : -0.5; // Overdrive overrides the normal tick
  let step = baseStep;
  if (f.staccato && word.length <= 4) step *= 2;
  return Math.round(step * 100) / 100;
}

/** The multiplier after a mistake, respecting Soft Landing and the base-mult floor. */
export function modMistakeMult(f: QuillFlags, mult: number, floor: number): number {
  const dropped = f.softLanding ? mult - 1.5 : mult * 0.5;
  return Math.max(floor, Math.round(dropped * 100) / 100);
}
