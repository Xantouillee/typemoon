import { seededRng, todayKey } from './rng';

export interface Language {
  code: string;
  name: string;
  /** keyboard layout used by the on-screen keyboard */
  layout: 'qwerty' | 'azerty' | 'qwertz';
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', layout: 'qwerty' },
  { code: 'fr', name: 'Français', layout: 'azerty' },
  { code: 'es', name: 'Español', layout: 'qwerty' },
  { code: 'de', name: 'Deutsch', layout: 'qwertz' },
];

export interface Passage {
  id: string;
  title: string;
  author: string;
  language: string;
  year: number;
  text: string;
}

// Fallback word pools so the app works even before the generated JSON loads.
const FALLBACK_WORDS: Record<string, string[]> = {
  en: 'the of and a to in is you that it he was for on are as with his they at be this have from'.split(' '),
  fr: 'le de un à être et en avoir que pour dans ce il qui ne sur se pas plus par grand'.split(' '),
  es: 'de la que el en y a los se del las un por con no una su para es'.split(' '),
  de: 'der die und in den von zu das mit sich des auf für ist im dem nicht ein eine als'.split(' '),
};

const FALLBACK_PASSAGES: Passage[] = [
  {
    id: 'austen-pride',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    language: 'en',
    year: 1813,
    text: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families.',
  },
];

const wordCache = new Map<string, string[]>();
let passageCache: Passage[] | null = null;

export async function loadWords(code: string): Promise<string[]> {
  if (wordCache.has(code)) return wordCache.get(code)!;
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}words/${code}.json`);
    if (!res.ok) throw new Error('missing');
    const data = await res.json();
    const words: string[] = Array.isArray(data) ? data : data.words;
    if (!words?.length) throw new Error('empty');
    wordCache.set(code, words);
    return words;
  } catch {
    return FALLBACK_WORDS[code] ?? FALLBACK_WORDS.en;
  }
}

export async function loadPassages(): Promise<Passage[]> {
  if (passageCache) return passageCache;
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}passages/pool.json`);
    if (!res.ok) throw new Error('missing');
    const data = await res.json();
    const list: Passage[] = Array.isArray(data) ? data : data.passages;
    if (!list?.length) throw new Error('empty');
    passageCache = list;
    return list;
  } catch {
    return FALLBACK_PASSAGES;
  }
}

function byLang(passages: Passage[], lang: string): Passage[] {
  const filtered = passages.filter((p) => p.language === lang);
  return filtered.length ? filtered : passages;
}

/** The same passage for everyone on a given calendar day. */
export function dailyPassage(passages: Passage[], lang: string): Passage {
  const pool = byLang(passages, lang);
  const rng = seededRng(todayKey() + lang);
  return pool[Math.floor(rng() * pool.length)];
}

export function randomPassage(passages: Passage[], lang: string): Passage {
  const pool = byLang(passages, lang);
  return pool[Math.floor(Math.random() * pool.length)];
}
