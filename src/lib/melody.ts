/**
 * A tiny note-name parser, so anyone can put their own tune on the keyboard.
 *
 * Why this exists: every melody voice that ships with Typemoon is public domain,
 * and that is a deliberate line (see PROGRESS.md — audio licensing). But it is
 * *your* keyboard. A tune you type in here lives in your browser's storage, is
 * never uploaded, and is never committed — so what you play on your own machine
 * is your business, exactly like the text you type into a word processor.
 *
 * Notation, kept as forgiving as possible:
 *   c d e f g a b     — note names, case-insensitive, octave 4 by default
 *   c# db             — sharps and flats, stackable (c##, ebb)
 *   a3 c5 f#5         — an explicit octave, where 4 is the octave of middle C
 *   0 4 7 -5          — a bare number is a semitone offset from middle C
 *   | , and newlines  — bar lines and separators, ignored
 */

const SCALE: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };

const NOTE = /^([a-g])([#b]*)(-?\d+)?$/;
const NUMBER = /^-?\d+$/;

export interface ParsedMelody {
  /** semitone offsets from middle C, in playing order */
  notes: number[];
  /** tokens that could not be read, in the order they appeared */
  rejected: string[];
}

/**
 * Read a tune. Never throws: unreadable tokens are reported rather than fatal,
 * so a single typo in the middle of forty notes does not silence the keyboard.
 */
export function parseMelody(text: string): ParsedMelody {
  const notes: number[] = [];
  const rejected: string[] = [];

  // bar lines and commas are punctuation for the human, not for us
  for (const raw of text.split(/[\s,|]+/)) {
    const token = raw.trim();
    if (!token) continue;

    if (NUMBER.test(token)) {
      notes.push(Number(token));
      continue;
    }

    const m = NOTE.exec(token.toLowerCase());
    if (!m) {
      rejected.push(token);
      continue;
    }

    const [, letter, accidentals, octave] = m;
    // 'b' is both a note and a flat, so accidentals are counted, not switched on
    let value = SCALE[letter];
    for (const a of accidentals) value += a === '#' ? 1 : -1;
    if (octave) value += (Number(octave) - 4) * 12;

    notes.push(value);
  }

  return { notes, rejected };
}

/** Longest tune we will hold — well past any melody, short of a memory leak. */
export const MAX_MELODY_NOTES = 512;
