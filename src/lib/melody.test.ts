import { describe, expect, it } from 'vitest';
import { parseMelody } from './melody';

describe('parseMelody', () => {
  it('reads a plain scale as semitones from middle C', () => {
    expect(parseMelody('c d e f g a b').notes).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });

  it('is case-insensitive', () => {
    expect(parseMelody('C D E').notes).toEqual(parseMelody('c d e').notes);
  });

  it('reads sharps and flats', () => {
    expect(parseMelody('c# db f# gb').notes).toEqual([1, 1, 6, 6]);
  });

  // 'b' means both "the note B" and "a flat", which is the one place this
  // notation can trip over itself.
  it('tells the note b from a flat', () => {
    expect(parseMelody('b').notes).toEqual([11]);
    expect(parseMelody('bb').notes).toEqual([10]);
    expect(parseMelody('bb4').notes).toEqual([10]);
    expect(parseMelody('b4').notes).toEqual([11]);
  });

  it('stacks accidentals', () => {
    expect(parseMelody('c## ebb').notes).toEqual([2, 2]);
  });

  it('shifts by octave, with 4 as the octave of middle C', () => {
    expect(parseMelody('c4 c5 c3 a3').notes).toEqual([0, 12, -12, -3]);
  });

  it('accepts bare semitone offsets', () => {
    expect(parseMelody('0 4 7 -5 12').notes).toEqual([0, 4, 7, -5, 12]);
  });

  it('ignores bar lines, commas and newlines', () => {
    expect(parseMelody('c d | e f,\n g').notes).toEqual([0, 2, 4, 5, 7]);
  });

  it('reports what it could not read instead of throwing', () => {
    const { notes, rejected } = parseMelody('c hello d ??? e');
    expect(notes).toEqual([0, 2, 4]);
    expect(rejected).toEqual(['hello', '???']);
  });

  it('survives an empty or whitespace-only tune', () => {
    expect(parseMelody('').notes).toEqual([]);
    expect(parseMelody('   \n  ').notes).toEqual([]);
  });

  it('round-trips a real phrase', () => {
    // the opening of Ode to Joy, written the way a person would write it
    expect(parseMelody('e e f g | g f e d | c c d e').notes).toEqual([
      4, 4, 5, 7, 7, 5, 4, 2, 0, 0, 2, 4,
    ]);
  });
});
