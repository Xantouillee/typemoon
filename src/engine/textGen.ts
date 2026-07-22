// Deterministic-friendly text generation for Time/Words modes.

export interface GenOptions {
  count: number;
  punctuation?: boolean;
  numbers?: boolean;
  /** optional seeded RNG (0..1). Defaults to Math.random. */
  rng?: () => number;
}

const OPENERS = ['"', '(', "'"];
const CLOSERS = ['."', '.', '!', '?', ',', ';', ':', '...'];

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Build a space-separated string of `count` words drawn from `pool`,
 * optionally sprinkling punctuation and numbers in a natural-ish way.
 */
export function generateWords(pool: string[], opts: GenOptions): string {
  const rng = opts.rng ?? Math.random;
  if (pool.length === 0) return '';
  const out: string[] = [];
  let sentenceStart = true;

  for (let i = 0; i < opts.count; i++) {
    let word = pick(pool, rng);

    if (opts.numbers && rng() < 0.06) {
      word = String(Math.floor(rng() * 990) + 1);
    }

    if (opts.punctuation) {
      if (sentenceStart) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
        sentenceStart = false;
      }
      if (rng() < 0.04) word = pick(OPENERS, rng) + word;
      if (rng() < 0.16 && i < opts.count - 1) {
        const mark = pick(CLOSERS, rng);
        word += mark;
        if (/[.!?]/.test(mark)) sentenceStart = true;
      }
    }
    out.push(word);
  }
  return out.join(' ');
}

/** Normalise an arbitrary passage into a clean typing target. */
export function cleanPassage(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[—–]/g, '-')
    .trim();
}
