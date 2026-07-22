import { describe, expect, it } from 'vitest';
import { parseMidi } from './midi';

/** Build a standard MIDI file byte by byte, so the tests own their fixtures. */
function midi(events: number[], { tracks = 1 } = {}): ArrayBuffer {
  const header = [
    0x4d, 0x54, 0x68, 0x64, // "MThd"
    0, 0, 0, 6,
    0, 0, // format 0
    0, tracks,
    0, 0x60, // 96 ticks per quarter note
  ];
  const len = events.length;
  const track = [
    0x4d, 0x54, 0x72, 0x6b, // "MTrk"
    (len >> 24) & 0xff, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff,
    ...events,
  ];
  return Uint8Array.from([...header, ...track]).buffer;
}

const END = [0x00, 0xff, 0x2f, 0x00];

describe('parseMidi', () => {
  it('reads note-ons as semitones from middle C', () => {
    // C4 then E4 — middle C is MIDI 60, so 0 then 4
    const file = midi([
      0x00, 0x90, 60, 0x40,
      0x60, 0x80, 60, 0x00,
      0x00, 0x90, 64, 0x40,
      0x60, 0x80, 64, 0x00,
      ...END,
    ]);
    expect(parseMidi(file).notes).toEqual([0, 4]);
  });

  // Most files write a note-off as a note-on with zero velocity; counting those
  // as notes would double every melody.
  it('does not count a zero-velocity note-on as a note', () => {
    const file = midi([
      0x00, 0x90, 60, 0x40,
      0x60, 0x90, 60, 0x00,
      0x00, 0x90, 67, 0x40,
      ...END,
    ]);
    expect(parseMidi(file).notes).toEqual([0, 7]);
  });

  it('understands running status', () => {
    // the second and third notes omit the 0x90 status byte
    const file = midi([
      0x00, 0x90, 60, 0x40,
      0x60, 62, 0x40,
      0x60, 64, 0x40,
      ...END,
    ]);
    expect(parseMidi(file).notes).toEqual([0, 2, 4]);
  });

  it('keeps the top note of a chord — the tune sits on top', () => {
    const file = midi([
      0x00, 0x90, 60, 0x40,
      0x00, 0x90, 64, 0x40,
      0x00, 0x90, 67, 0x40,
      ...END,
    ]);
    expect(parseMidi(file).notes).toEqual([7]);
  });

  it('ignores percussion on channel 10', () => {
    const file = midi([
      0x00, 0x99, 38, 0x40, // snare, channel 10
      0x60, 0x90, 72, 0x40,
      ...END,
    ]);
    expect(parseMidi(file).notes).toEqual([12]);
  });

  it('skips over control changes and pitch bends', () => {
    const file = midi([
      0x00, 0xb0, 0x07, 0x64, // volume
      0x00, 0xe0, 0x00, 0x40, // pitch bend
      0x00, 0xc0, 0x18, // program change (one data byte, not two)
      0x00, 0x90, 60, 0x40,
      ...END,
    ]);
    expect(parseMidi(file).notes).toEqual([0]);
  });

  it('picks up a track name', () => {
    const file = midi([
      0x00, 0xff, 0x03, 0x04, 0x54, 0x75, 0x6e, 0x65, // "Tune"
      0x00, 0x90, 60, 0x40,
      ...END,
    ]);
    expect(parseMidi(file).name).toBe('Tune');
  });

  it('respects the note cap', () => {
    const events: number[] = [];
    for (let i = 0; i < 40; i++) events.push(0x10, 0x90, 60 + (i % 12), 0x40);
    expect(parseMidi(midi([...events, ...END]), 10).notes).toHaveLength(10);
  });

  it('reports a file that is not MIDI instead of throwing', () => {
    const junk = Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]).buffer;
    expect(parseMidi(junk).error).toBe('not-midi');
  });

  it('reports a MIDI file with no notes in it', () => {
    expect(parseMidi(midi([...END])).error).toBe('no-notes');
  });

  it('reports a truncated file instead of throwing', () => {
    const file = midi([0x00, 0x90, 60, 0x40, ...END]);
    expect(parseMidi(file.slice(0, 15)).error).toBeTruthy();
  });
});
