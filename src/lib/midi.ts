/**
 * A small MIDI reader, so any tune you already have can play on the keyboard.
 *
 * This is a tool, not a library of songs: it reads a file *you* choose, on your
 * machine, and the notes go into your browser's storage. Nothing is uploaded and
 * nothing is committed — same rule as the hand-written tunes in `melody.ts`.
 *
 * We only want a single line of melody, one note per keystroke, so a full
 * sequencer would be wasted here. What we do:
 *   · walk every track, collecting note-on events at absolute tick positions
 *   · drop channel 10 (index 9), which is percussion and would wreck the line
 *   · where several notes land together, keep the highest — in almost all music
 *     the top voice is the tune, and the rest is accompaniment
 */

/** MIDI note 60 is middle C, which is our zero. */
const MIDDLE_C = 60;

/** Percussion lives on channel 10, counted from one. */
const DRUM_CHANNEL = 9;

export interface MidiResult {
  /** semitone offsets from middle C, in playing order */
  notes: number[];
  /** a track name from the file, if it carried one */
  name?: string;
  /** set when the file could not be read; `notes` is then empty */
  error?: string;
}

class Reader {
  private i = 0;
  private readonly d: DataView;

  constructor(d: DataView) {
    this.d = d;
  }

  get done() {
    return this.i >= this.d.byteLength;
  }
  get offset() {
    return this.i;
  }
  seek(to: number) {
    this.i = to;
  }
  u8() {
    return this.d.getUint8(this.i++);
  }
  u16() {
    const v = this.d.getUint16(this.i);
    this.i += 2;
    return v;
  }
  u32() {
    const v = this.d.getUint32(this.i);
    this.i += 4;
    return v;
  }
  bytes(n: number) {
    const v = new Uint8Array(this.d.buffer, this.d.byteOffset + this.i, n);
    this.i += n;
    return v;
  }
  /** Four ASCII characters, as a chunk tag. */
  tag() {
    return String.fromCharCode(...this.bytes(4));
  }
  /** Variable-length quantity: seven bits per byte, high bit means "more". */
  vlq() {
    let v = 0;
    for (let n = 0; n < 4; n++) {
      const b = this.u8();
      v = (v << 7) | (b & 0x7f);
      if ((b & 0x80) === 0) break;
    }
    return v;
  }
}

interface Hit {
  tick: number;
  note: number;
}

/** How many bytes of data follow a channel status byte. */
function channelDataLength(status: number): number {
  const kind = status & 0xf0;
  return kind === 0xc0 || kind === 0xd0 ? 1 : 2;
}

/** Read one track, appending its note-ons to `hits`. */
function readTrack(r: Reader, end: number, hits: Hit[]): string | undefined {
  let tick = 0;
  let status = 0;
  let name: string | undefined;

  while (r.offset < end) {
    tick += r.vlq();
    let b = r.u8();

    // running status: a data byte here means "same event kind as last time"
    if (b < 0x80) {
      r.seek(r.offset - 1);
      b = status;
    } else if (b < 0xf0) {
      status = b;
    }

    if (b === 0xff) {
      const type = r.u8();
      const len = r.vlq();
      const data = r.bytes(len);
      // 0x03 is a track name — worth keeping as a label for the tune
      if (type === 0x03 && !name) name = String.fromCharCode(...data).trim() || undefined;
      if (type === 0x2f) break; // end of track
      continue;
    }

    if (b === 0xf0 || b === 0xf7) {
      r.bytes(r.vlq()); // sysex, of no interest here
      continue;
    }

    const kind = b & 0xf0;
    const channel = b & 0x0f;
    const len = channelDataLength(b);
    const d0 = len > 0 ? r.u8() : 0;
    const d1 = len > 1 ? r.u8() : 0;

    // a note-on with zero velocity is how most files write a note-off
    if (kind === 0x90 && d1 > 0 && channel !== DRUM_CHANNEL) {
      hits.push({ tick, note: d0 });
    }
  }

  return name;
}

/**
 * Read a standard MIDI file into a single melody line.
 * Never throws — a file we cannot make sense of comes back as an `error`.
 */
export function parseMidi(buffer: ArrayBuffer, maxNotes = 512): MidiResult {
  try {
    const r = new Reader(new DataView(buffer));
    if (r.tag() !== 'MThd') return { notes: [], error: 'not-midi' };

    const headerLength = r.u32();
    r.u16(); // format — we merge every track either way
    const trackCount = r.u16();
    r.u16(); // division — we only care about note order, not tempo
    r.seek(8 + headerLength);

    const hits: Hit[] = [];
    let name: string | undefined;

    for (let n = 0; n < trackCount && !r.done; n++) {
      if (r.tag() !== 'MTrk') break;
      const length = r.u32();
      const end = r.offset + length;
      const trackName = readTrack(r, end, hits);
      if (!name) name = trackName;
      r.seek(end);
    }

    if (hits.length === 0) return { notes: [], error: 'no-notes' };

    // Chords collapse to their top note: the tune is the voice on top.
    hits.sort((a, b) => a.tick - b.tick || b.note - a.note);
    const notes: number[] = [];
    let lastTick = -1;
    for (const h of hits) {
      if (h.tick === lastTick) continue;
      lastTick = h.tick;
      notes.push(h.note - MIDDLE_C);
      if (notes.length >= maxNotes) break;
    }

    return { notes, name };
  } catch {
    return { notes: [], error: 'unreadable' };
  }
}
