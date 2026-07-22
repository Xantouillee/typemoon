// Letterpress chip values — each letter is worth a number of "chips" (Scrabble-ish).
// Rarer letters are worth more, so longer + spicier words build bigger chip stacks.
import { baseKey } from '../components/Keyboard/layouts';

// tiers → value
const TIERS: Record<number, string> = {
  1: 'eaionsrtu', // common
  2: 'dgl', // mid
  3: 'bcmp', // spicy
  4: 'fhvwy', // rare
  5: 'jkqxz', // luxury
};

const VALUE: Record<string, number> = {};
for (const [val, letters] of Object.entries(TIERS)) {
  for (const ch of letters) VALUE[ch] = Number(val);
}

/** Chip value of a single character (accents fold to their base key; digits = 1). */
export function letterValue(ch: string): number {
  const lower = ch.toLowerCase();
  if (lower >= '0' && lower <= '9') return 1;
  const base = baseKey(lower);
  return VALUE[base] ?? 1;
}

const SCORABLE = /[a-z0-9à-ÿß]/i;

/** Sum of chip values across the letters of a word (punctuation/spaces contribute 0). */
export function wordChips(word: string): number {
  let sum = 0;
  for (const ch of word) {
    if (SCORABLE.test(ch)) sum += letterValue(ch);
  }
  return sum;
}
