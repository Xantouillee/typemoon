// On-screen keyboard row definitions per layout.
// Only the character rows are modelled (the part that lights up while typing).

export type Layout = 'qwerty' | 'azerty' | 'qwertz';

export const LAYOUTS: Record<Layout, string[][]> = {
  qwerty: [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ],
  azerty: [
    ['a', 'z', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['q', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm'],
    ['w', 'x', 'c', 'v', 'b', 'n'],
  ],
  qwertz: [
    ['q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['y', 'x', 'c', 'v', 'b', 'n', 'm'],
  ],
};

/** Map an accented character back to its base key for highlighting. */
export function baseKey(ch: string): string {
  const map: Record<string, string> = {
    é: 'e', è: 'e', ê: 'e', ë: 'e',
    à: 'a', â: 'a', ä: 'a',
    ï: 'i', î: 'i',
    ô: 'o', ö: 'o',
    ù: 'u', û: 'u', ü: 'u',
    ç: 'c', ñ: 'n', ß: 's',
  };
  const lower = ch.toLowerCase();
  return map[lower] ?? lower;
}
