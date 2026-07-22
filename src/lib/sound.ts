// A tiny WebAudio instrument for the keyboard — no audio files, everything synthesised.
//
// Three ideas make a synthesised keystroke feel physical rather than beeped:
//   1. press and release are separate sounds (this is most of the effect)
//   2. a key's pitch is stable — `a` always sounds like `a`, and unlike `l`
//   3. keys are placed in stereo by their column, so typing moves across the head
//
// Every theme below is built from the same two primitives: a filtered noise burst
// (the impact) and a pitched body (the resonance).

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let dry: GainNode | null = null;
let wetBus: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let volume = 0.7;

/** Master volume, 0..1. Applies immediately and survives context creation. */
export function setSoundVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  if (master && ctx) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.01);
}

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }
  const Ctor = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor() as AudioContext;

  master = ctx.createGain();
  master.gain.value = volume;
  master.connect(ctx.destination);

  dry = ctx.createGain();
  dry.connect(master);

  // A procedural room: exponentially-decaying stereo noise used as an impulse
  // response. Cheaper than shipping an IR file and good enough for short hits.
  const verb = ctx.createConvolver();
  const len = Math.floor(ctx.sampleRate * 1.1);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  verb.buffer = ir;
  wetBus = ctx.createGain();
  wetBus.connect(verb);
  verb.connect(master);

  // one reusable noise buffer, looped and gated per hit
  const nlen = Math.floor(ctx.sampleRate * 0.5);
  noiseBuf = ctx.createBuffer(1, nlen, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nlen; i++) nd[i] = Math.random() * 2 - 1;

  return ctx;
}

/** Send a voice's output to the dry bus, and optionally into the room. */
function route(a: AudioContext, node: AudioNode, pan: number, wet: number) {
  const p = a.createStereoPanner();
  p.pan.value = pan;
  node.connect(p);
  p.connect(dry!);
  if (wet > 0) {
    const s = a.createGain();
    s.gain.value = wet;
    p.connect(s);
    s.connect(wetBus!);
  }
}

interface NoiseOpts {
  freq: number;
  dur: number;
  gain: number;
  type?: BiquadFilterType;
  sweepTo?: number;
  q?: number;
  attack?: number;
  pan?: number;
  wet?: number;
}

/** A filtered noise burst — the impact half of a physical sound. */
function noise(o: NoiseOpts) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime;
  const src = a.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = a.createBiquadFilter();
  f.type = o.type ?? 'lowpass';
  f.frequency.setValueAtTime(o.freq, t);
  if (o.sweepTo) f.frequency.exponentialRampToValueAtTime(o.sweepTo, t + o.dur);
  f.Q.value = o.q ?? 1;
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.gain, t + (o.attack ?? 0.002));
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  src.connect(f).connect(g);
  route(a, g, o.pan ?? 0, o.wet ?? 0);
  src.start(t);
  src.stop(t + o.dur + 0.03);
}

interface ToneOpts {
  freq: number;
  dur: number;
  gain: number;
  type?: OscillatorType;
  to?: number;
  /** an arbitrary pitch contour across the decay, instead of a single ramp */
  curve?: number[];
  /** amplitude modulation — the buzz of a membrane, rather than a clean tone */
  flutter?: { rate: number; depth: number; type?: OscillatorType };
  attack?: number;
  pan?: number;
  wet?: number;
}

/** A pitched body — the resonance half. `to` bends the pitch across the decay. */
function tone(o: ToneOpts) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime;
  const osc = a.createOscillator();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.freq, t);
  if (o.curve) osc.frequency.setValueCurveAtTime(Float32Array.from(o.curve), t, o.dur);
  else if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.gain, t + (o.attack ?? 0.004));
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);

  // An LFO summed into the gain param rides on top of the envelope, turning a
  // clean tone into a buzzing one.
  if (o.flutter) {
    const lfo = a.createOscillator();
    lfo.type = o.flutter.type ?? 'sine';
    lfo.frequency.value = o.flutter.rate;
    const depth = a.createGain();
    depth.gain.value = o.gain * o.flutter.depth;
    lfo.connect(depth).connect(g.gain);
    lfo.start(t);
    lfo.stop(t + o.dur + 0.03);
  }

  osc.connect(g);
  route(a, g, o.pan ?? 0, o.wet ?? 0);
  osc.start(t);
  osc.stop(t + o.dur + 0.03);
}

/** The original simple oscillator hit — still the basis of the arcade sfx. */
function blip(freq: number, dur: number, gain: number, type: OscillatorType = 'triangle') {
  tone({ freq, dur, gain, type });
}

// ---- key → pitch + stereo position ----------------------------------------
// Derived from the physical keyboard, and stable: the same key always sounds
// the same. Randomising per press is the thing that makes synth keyboards
// sound broken, so it is deliberately avoided.

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

interface KeyInfo {
  pan: number;
  detune: number;
}

const keyCache = new Map<string, KeyInfo>();

function keyInfo(ch: string): KeyInfo {
  const c = ch.toLowerCase();
  const hit = keyCache.get(c);
  if (hit) return hit;
  let info: KeyInfo = { pan: 0, detune: 0 };
  for (let r = 0; r < ROWS.length; r++) {
    const i = ROWS[r].indexOf(c);
    if (i >= 0) {
      const span = ROWS[r].length - 1;
      info = {
        pan: (i / span - 0.5) * 1.25, // −0.62 … +0.62
        detune: (r - 1) * 0.055 + (i / span - 0.5) * 0.11,
      };
      break;
    }
  }
  keyCache.set(c, info);
  return info;
}

const v = (base: number, d: number) => base * (1 + d);

/**
 * A small random multiplier around 1, for round-robin variation.
 *
 * Sampled keyboards ship 5-10 recordings per key and cycle them, which is why
 * they never sound machine-gunned. The tactile voices get their variety from
 * per-key pitch instead, but the joke voices genuinely want to differ press to
 * press — a fart that repeats exactly is not funny twice.
 */
const rr = (spread: number) => 1 + (Math.random() * 2 - 1) * spread;

// ---- the themes ------------------------------------------------------------

export type SoundThemeId =
  | 'classic'
  | 'thock'
  | 'petrichor'
  | 'gloop'
  | 'nib'
  | 'wrap'
  | 'typewriter'
  | 'pentatonic'
  | 'hitmarker'
  | 'bonk'
  | 'coin'
  | 'fart'
  | 'ode'
  | 'elise'
  | 'twinkle'
  | 'saints'
  | 'canon'
  | 'greensleeves'
  | 'nachtmusik'
  | 'fate'
  | 'sirocco'
  | 'custom';

interface SoundTheme {
  id: SoundThemeId;
  /** `big` marks space / enter / backspace — deeper and longer. */
  press(k: string, big: boolean): void;
  release(k: string): void;
  error(): void;
}

/**
 * Melody voices: each keystroke plays the next note of a tune, so typing a
 * sentence performs the piece. This deliberately breaks the stable-pitch-per-key
 * rule the tactile voices follow — here the sequence *is* the point.
 *
 * Every tune below is long out of copyright: Beethoven died in 1827, and the
 * other two are traditional. Nothing here is licensed from anyone.
 */
const MELODIES: Record<string, { title: string; notes: number[] }> = {
  // semitone offsets from C4; negatives drop below it
  ode: {
    title: 'Ode to Joy · Beethoven',
    notes: [
      4, 4, 5, 7, 7, 5, 4, 2, 0, 0, 2, 4, 4, 2, 2,
      4, 4, 5, 7, 7, 5, 4, 2, 0, 0, 2, 4, 2, 0, 0,
    ],
  },
  elise: {
    title: 'Für Elise · Beethoven',
    notes: [
      16, 15, 16, 15, 16, 11, 14, 12, 9, 0, 4, 9, 11, 4, 8, 11, 12,
      16, 15, 16, 15, 16, 11, 14, 12, 9, 0, 4, 9, 11, 4, 12, 11, 9,
    ],
  },
  twinkle: {
    title: 'Twinkle, Twinkle · traditional',
    notes: [
      0, 0, 7, 7, 9, 9, 7, 5, 5, 4, 4, 2, 2, 0,
      7, 7, 5, 5, 4, 4, 2, 7, 7, 5, 5, 4, 4, 2,
      0, 0, 7, 7, 9, 9, 7, 5, 5, 4, 4, 2, 2, 0,
    ],
  },
  saints: {
    title: 'When the Saints · traditional',
    notes: [
      0, 4, 5, 7, 0, 4, 5, 7, 0, 4, 5, 7, 4, 0, 4, 2,
      4, 4, 2, 0, 0, 4, 7, 7, 5, 4, 5, 4, 0, 2, 0,
    ],
  },
  canon: {
    title: 'Canon in D · Pachelbel',
    notes: [
      18, 16, 14, 13, 11, 9, 11, 13,
      14, 13, 11, 9, 7, 6, 7, 4,
      6, 2, 4, 1, 2, 6, 9, 7,
      18, 16, 14, 13, 11, 9, 11, 13,
      14, 13, 11, 9, 7, 6, 7, 6, 2,
    ],
  },
  greensleeves: {
    title: 'Greensleeves · traditional',
    notes: [
      -3, 0, 2, 4, 5, 4, 2, -1, -5, -3, -1, 0, -3, -3, -4, -3,
      -1, -4, -8, -3, 0, 2, 4, 5, 4, 2, -1, -5, -3, -1, 0, -3,
      -1, -4, -3, -3,
      7, 7, 5, 4, 2, -1, -5, -3, -1, 0, -3, -3, -4, -3, -1, -4, -8, -3,
    ],
  },
  nachtmusik: {
    title: 'Eine kleine Nachtmusik · Mozart',
    notes: [
      -5, -10, -5, -10, -5, -1, 2,
      0, -3, 0, -3, 0, 4, -3,
      2, 2, 2, 4, 6, 7, 7,
      9, 9, 9, 11, 12, 14, 14,
      -5, -10, -5, -10, -5, -1, 2,
      0, -3, 0, -3, 0, 4, -3,
    ],
  },
  fate: {
    title: 'Symphony No. 5 · Beethoven',
    notes: [
      7, 7, 7, 3, 5, 5, 5, 2,
      7, 7, 7, 3, 5, 5, 5, 2,
      10, 10, 10, 7, 8, 8, 8, 3,
      12, 12, 12, 8, 10, 10, 10, 7,
      15, 15, 15, 12, 14, 14, 14, 10,
      7, 7, 7, 3,
    ],
  },
  /**
   * Not a transcription of anything — an original line written for this app, in
   * E Phrygian dominant (E F G# A B C D), the scale that makes flamenco guitar
   * sound like flamenco guitar. Rising figure, turn, cascade, Andalusian cadence.
   *
   * It exists because the desert-guitar *idiom* is nobody's property, while any
   * particular tune in it very much is.
   */
  sirocco: {
    title: 'Sirocco · original',
    notes: [
      16, 17, 20, 21, 23, 21, 20, 17, 16,
      16, 17, 16, 14, 12, 14, 16, 17, 20,
      24, 23, 21, 20, 17, 16, 17, 16, 14, 12,
      21, 20, 17, 16, 20, 17, 16, 12, 16, 17, 16,
    ],
  },
  /**
   * Your own tune. Empty until you type one into the settings page; the notes
   * are filled in by `setCustomMelody` and live only in your browser.
   */
  custom: { title: 'Your own tune', notes: [] },
};

/**
 * Install a tune the user entered themselves.
 *
 * Everything Typemoon *ships* is public domain, deliberately. This is the other
 * side of that line: whatever you put here stays in your own browser storage, is
 * never uploaded and is never committed to the repository.
 */
export function setCustomMelody(notes: number[]) {
  MELODIES.custom.notes = notes.slice(0, 512);
  melodyStep.custom = 0;
}

/** How many notes the custom tune currently holds. */
export function customMelodyLength(): number {
  return MELODIES.custom.notes.length;
}

/**
 * Where each melody voice has got to.
 *
 * Advancing is the whole instrument, so the counter deliberately survives spaces:
 * the tune plays across the whole run, not once per word. Only a fresh test winds
 * it back to the first note (see `resetMelodies`), and a mistake merely stumbles
 * back a couple of notes — a full reset on every typo would mean nobody ever
 * hears past the opening bar, which is exactly the bug this design fixes.
 */
const melodyStep: Record<string, number> = {};

/** Wind every tune back to its first note. Called when a run starts over. */
export function resetMelodies() {
  for (const id of Object.keys(MELODIES)) melodyStep[id] = 0;
}

/** Build a voice that walks a tune, one note per keystroke. */
function melodyVoice(id: SoundThemeId): SoundTheme {
  const tune = MELODIES[id];
  return {
    id,
    press(k, big) {
      const { pan } = keyInfo(k);
      // A space is a breath, not a bar line: it sounds a soft low rest and leaves
      // the phrase exactly where it stands, so the next word carries the tune on.
      if (big) {
        tone({ freq: 196, dur: 0.12, gain: 0.04, type: 'sine', pan, wet: 0.4 });
        return;
      }
      // the custom tune is empty until someone writes one — a soft tick beats
      // both silence (which reads as broken) and NaN (which reads as a crash)
      if (tune.notes.length === 0) {
        tone({ freq: 330, dur: 0.1, gain: 0.05, type: 'triangle', pan, wet: 0.4 });
        return;
      }
      const i = (melodyStep[id] ?? 0) % tune.notes.length;
      melodyStep[id] = (i + 1) % tune.notes.length;
      const freq = 261.63 * Math.pow(2, tune.notes[i] / 12);
      tone({ freq, dur: 0.42, gain: 0.11, type: 'triangle', attack: 0.006, pan, wet: 0.5 });
      tone({ freq: freq * 2, dur: 0.14, gain: 0.028, type: 'sine', pan, wet: 0.5 });
    },
    release() {
      /* a struck note rings out on its own */
    },
    error() {
      // a sour semitone clash, and the player stumbles two notes back
      melodyStep[id] = Math.max(0, (melodyStep[id] ?? 0) - 2);
      tone({ freq: 233, dur: 0.2, gain: 0.09, type: 'triangle', wet: 0.4 });
      tone({ freq: 247, dur: 0.2, gain: 0.07, type: 'triangle', wet: 0.4 });
    },
  };
}

const THEMES: Record<SoundThemeId, SoundTheme> = {
  ode: melodyVoice('ode'),
  elise: melodyVoice('elise'),
  twinkle: melodyVoice('twinkle'),
  saints: melodyVoice('saints'),
  canon: melodyVoice('canon'),
  greensleeves: melodyVoice('greensleeves'),
  nachtmusik: melodyVoice('nachtmusik'),
  fate: melodyVoice('fate'),
  sirocco: melodyVoice('sirocco'),
  custom: melodyVoice('custom'),

  /** The original dry wooden tick, kept so v1 still sounds like v1. */
  classic: {
    id: 'classic',
    press() {
      blip(150 + Math.random() * 60, 0.045, 0.14, 'triangle');
    },
    release() {
      /* the original had no release */
    },
    error() {
      blip(92, 0.09, 0.12, 'sawtooth');
    },
  },

  /** Lubed linears in a heavy case: dull impact, low body, almost no room. */
  thock: {
    id: 'thock',
    press(k, big) {
      const { pan, detune } = keyInfo(k);
      noise({
        freq: big ? 900 : 1350,
        type: 'lowpass',
        dur: big ? 0.05 : 0.036,
        gain: 0.15,
        attack: 0.001,
        pan,
        wet: 0.06,
      });
      tone({
        freq: v(big ? 78 : 132, detune),
        to: v(big ? 62 : 108, detune),
        dur: big ? 0.085 : 0.055,
        gain: big ? 0.3 : 0.22,
        type: 'triangle',
        pan,
        wet: 0.05,
      });
    },
    release(k) {
      const { pan, detune } = keyInfo(k);
      noise({ freq: 2600, type: 'lowpass', dur: 0.022, gain: 0.055, attack: 0.001, pan, wet: 0.04 });
      tone({ freq: v(210, detune), dur: 0.025, gain: 0.05, type: 'triangle', pan });
    },
    error() {
      noise({ freq: 700, type: 'lowpass', dur: 0.06, gain: 0.14, attack: 0.001 });
      tone({ freq: 74, to: 58, dur: 0.1, gain: 0.2, type: 'triangle' });
    },
  },

  /** A drop into a still pool: the bubble shrinks, so the pitch rises as it dies. */
  petrichor: {
    id: 'petrichor',
    press(k, big) {
      const { pan, detune } = keyInfo(k);
      const f = v(big ? 380 : 620, detune);
      noise({ freq: 5200, type: 'highpass', dur: 0.012, gain: 0.05, pan, wet: 0.3 });
      tone({
        freq: f,
        to: f * 1.85,
        dur: big ? 0.16 : 0.11,
        gain: big ? 0.2 : 0.15,
        type: 'sine',
        pan,
        wet: 0.55,
      });
    },
    release(k) {
      const { pan, detune } = keyInfo(k);
      const f = v(1180, detune);
      tone({ freq: f, to: f * 1.5, dur: 0.05, gain: 0.028, type: 'sine', pan, wet: 0.5 });
    },
    error() {
      // a flat slap on the surface instead of a clean drop
      noise({ freq: 900, type: 'lowpass', dur: 0.09, gain: 0.12, wet: 0.4 });
      tone({ freq: 220, to: 150, dur: 0.12, gain: 0.1, type: 'sine', wet: 0.4 });
    },
  },

  /** Wet and stretchy: a squelch down on press, a suction pop on release. */
  gloop: {
    id: 'gloop',
    press(k, big) {
      const { pan, detune } = keyInfo(k);
      const hi = v(big ? 1500 : 1900, detune);
      noise({
        freq: hi,
        sweepTo: hi * 0.22,
        type: 'bandpass',
        q: 7,
        dur: big ? 0.16 : 0.11,
        gain: 0.16,
        attack: 0.006,
        pan,
        wet: 0.16,
      });
      tone({
        freq: v(big ? 70 : 96, detune),
        to: v(big ? 52 : 68, detune),
        dur: 0.1,
        gain: 0.13,
        type: 'sine',
        pan,
        wet: 0.1,
      });
    },
    release(k) {
      const { pan, detune } = keyInfo(k);
      const f = v(430, detune);
      tone({ freq: f, to: f * 2.6, dur: 0.045, gain: 0.075, type: 'sine', pan, wet: 0.14 });
      noise({ freq: 2400, type: 'bandpass', q: 3, dur: 0.02, gain: 0.05, pan });
    },
    error() {
      noise({ freq: 600, sweepTo: 140, type: 'bandpass', q: 9, dur: 0.2, gain: 0.16, attack: 0.01 });
      tone({ freq: 80, to: 44, dur: 0.22, gain: 0.14, type: 'sine' });
    },
  },

  /** A steel nib catching the tooth of cotton paper; the spacebar turns the page. */
  nib: {
    id: 'nib',
    press(k, big) {
      const { pan, detune } = keyInfo(k);
      if (big) {
        noise({
          freq: 1100,
          sweepTo: 3600,
          type: 'bandpass',
          q: 0.8,
          dur: 0.17,
          gain: 0.085,
          attack: 0.02,
          pan,
          wet: 0.3,
        });
        return;
      }
      noise({
        freq: v(3100, detune),
        type: 'highpass',
        dur: 0.019,
        gain: 0.075,
        attack: 0.002,
        pan,
        wet: 0.22,
      });
      noise({ freq: v(1750, detune), type: 'bandpass', q: 4.5, dur: 0.03, gain: 0.055, pan, wet: 0.22 });
    },
    release(k) {
      const { pan } = keyInfo(k);
      noise({ freq: 5200, type: 'highpass', dur: 0.011, gain: 0.026, pan, wet: 0.2 });
    },
    error() {
      // the nib catches and spatters
      noise({ freq: 800, type: 'bandpass', q: 2, dur: 0.11, gain: 0.1, attack: 0.004, wet: 0.3 });
      tone({ freq: 150, to: 96, dur: 0.13, gain: 0.08, type: 'triangle', wet: 0.25 });
    },
  },

  /** A mechanical typebar striking the platen; the bell rings on a new line. */
  typewriter: {
    id: 'typewriter',
    press(k, big) {
      const { pan, detune } = keyInfo(k);
      noise({ freq: 2800, type: 'bandpass', q: 1.4, dur: 0.014, gain: 0.14, attack: 0.001, pan, wet: 0.12 });
      tone({ freq: v(190, detune), to: v(120, detune), dur: 0.05, gain: 0.16, type: 'square', pan, wet: 0.1 });
      if (big) {
        // carriage return: the bell, then the slide back
        tone({ freq: 1480, dur: 0.42, gain: 0.09, type: 'sine', pan: -0.3, wet: 0.6 });
        noise({ freq: 1600, sweepTo: 500, type: 'bandpass', q: 1.2, dur: 0.2, gain: 0.06, attack: 0.02, pan: -0.2, wet: 0.3 });
      }
    },
    release(k) {
      const { pan } = keyInfo(k);
      noise({ freq: 3400, type: 'highpass', dur: 0.012, gain: 0.035, pan, wet: 0.08 });
    },
    error() {
      noise({ freq: 500, type: 'lowpass', dur: 0.13, gain: 0.13, attack: 0.003 });
      tone({ freq: 120, to: 78, dur: 0.15, gain: 0.12, type: 'square' });
    },
  },

  /**
   * Every key is a degree of a major pentatonic scale, so a word plays a melody
   * — and the same word always plays the same one.
   */
  pentatonic: {
    id: 'pentatonic',
    press(k, big) {
      const { pan } = keyInfo(k);
      const c = k.toLowerCase();
      let deg = 0;
      for (let r = 0; r < ROWS.length; r++) {
        const i = ROWS[r].indexOf(c);
        if (i >= 0) {
          deg = (2 - r) * 5 + (i % 5); // low row = low notes, left = low
          break;
        }
      }
      const step = PENTA[Math.min(deg, PENTA.length - 1)];
      const f = (big ? 165 : 330) * Math.pow(2, step / 12);
      tone({ freq: f, dur: big ? 0.5 : 0.36, gain: 0.1, type: 'triangle', attack: 0.008, pan, wet: 0.5 });
      tone({ freq: f * 2, dur: 0.16, gain: 0.03, type: 'sine', pan, wet: 0.5 }); // bell overtone
    },
    release() {
      /* a struck note rings on its own — a release would muddy it */
    },
    error() {
      tone({ freq: 233, dur: 0.22, gain: 0.09, type: 'triangle', wet: 0.4 });
      tone({ freq: 247, dur: 0.22, gain: 0.07, type: 'triangle', wet: 0.4 }); // a semitone apart: sour
    },
  },

  /**
   * The shooter hit-confirm: not one tick but *two*, a few milliseconds apart,
   * built from inharmonic partials so it rings like struck metal rather than a
   * tuned note. The doubling is what the ear recognises.
   */
  hitmarker: {
    id: 'hitmarker',
    press(k, big) {
      const { pan } = keyInfo(k);
      const scale = big ? 0.8 : 1;
      const hit = (delay: number, gain: number) => {
        window.setTimeout(() => {
          noise({ freq: 7000, type: 'highpass', dur: 0.005, gain: gain * 1.1, attack: 0.0005, pan });
          // deliberately non-integer ratios — integer ones would sound like a chord
          [2450, 3610, 5230].forEach((f, i) =>
            tone({
              freq: f * scale * rr(0.03),
              dur: 0.024 - i * 0.005,
              gain: gain * (0.55 - i * 0.13),
              type: 'square',
              attack: 0.0006,
              pan,
              wet: 0.12,
            }),
          );
        }, delay);
      };
      hit(0, 0.1);
      hit(38, 0.07);
    },
    release() {
      /* the double tick is the whole event */
    },
    error() {
      tone({ freq: 320, to: 150, dur: 0.16, gain: 0.13, type: 'square' });
      noise({ freq: 1400, type: 'lowpass', dur: 0.1, gain: 0.08 });
    },
  },

  /**
   * Cartoon mallet: a hard click, then a hollow body whose pitch falls through
   * more than three octaves. The size of that fall is the entire joke.
   */
  bonk: {
    id: 'bonk',
    press(k, big) {
      const { pan, detune } = keyInfo(k);
      const top = v(big ? 520 : 760, detune) * rr(0.06);
      noise({ freq: 3000, type: 'lowpass', dur: 0.008, gain: 0.13, attack: 0.0006, pan });
      tone({
        freq: top,
        to: top * 0.11,
        dur: big ? 0.2 : 0.15,
        gain: 0.22,
        type: 'triangle',
        attack: 0.002,
        pan,
        wet: 0.2,
      });
      // a touch of hollow wooden body under the sweep
      tone({ freq: top * 0.5, to: top * 0.09, dur: 0.11, gain: 0.09, type: 'sine', pan, wet: 0.2 });
    },
    release() {
      /* one knock per key */
    },
    error() {
      tone({ freq: 300, to: 48, dur: 0.26, gain: 0.2, type: 'triangle' });
    },
  },

  /** A bright two-note pickup — the sound of a number going up. */
  coin: {
    id: 'coin',
    press(k, big) {
      const { pan, detune } = keyInfo(k);
      const base = v(big ? 784 : 988, detune * 0.5);
      tone({ freq: base, dur: 0.055, gain: 0.09, type: 'square', pan, wet: 0.2 });
      window.setTimeout(() => {
        tone({ freq: base * 1.335, dur: 0.14, gain: 0.085, type: 'square', pan, wet: 0.25 });
      }, 55);
    },
    release() {
      /* the second note is the tail */
    },
    error() {
      tone({ freq: 300, to: 120, dur: 0.2, gain: 0.12, type: 'square' });
    },
  },

  /**
   * Exactly what it says. The thing that makes it read as a fart rather than a
   * buzzy bass note is the *flutter* — a flapping membrane, i.e. amplitude
   * modulation in the 20-40 Hz range — over a sagging pitch.
   */
  fart: {
    id: 'fart',
    press(k, big) {
      const { pan, detune } = keyInfo(k);
      const base = v(big ? 82 : 112, detune) * rr(0.12);
      const dur = big ? 0.34 : 0.22;
      // the pitch sags and wavers as it goes
      const curve: number[] = [];
      const n = 14;
      for (let i = 0; i < n; i++) {
        const sag = 1 - (i / n) * 0.5;
        curve.push(base * sag * (0.88 + Math.random() * 0.24));
      }
      tone({
        freq: base,
        curve,
        dur,
        gain: 0.2,
        type: 'sawtooth',
        attack: 0.006,
        flutter: { rate: 24 + Math.random() * 18, depth: 0.85, type: 'square' },
        pan,
        wet: 0.08,
      });
      noise({ freq: 500, sweepTo: 160, type: 'lowpass', dur, gain: 0.06, attack: 0.012, pan, wet: 0.08 });
    },
    release() {
      /* mercifully, none */
    },
    error() {
      tone({
        freq: 96,
        curve: [96, 78, 100, 64, 84, 50],
        dur: 0.45,
        gain: 0.21,
        type: 'sawtooth',
        attack: 0.01,
        flutter: { rate: 19, depth: 0.9, type: 'square' },
      });
      noise({ freq: 380, sweepTo: 110, type: 'lowpass', dur: 0.45, gain: 0.07, attack: 0.02 });
    },
  },

  /** Film stretched to its limit and let go. Pitch spread is deliberately wide. */
  wrap: {
    id: 'wrap',
    press(k, big) {
      const { pan, detune } = keyInfo(k);
      const f = v(big ? 420 : 880, detune * 5.5); // exaggerated: no two keys alike
      noise({ freq: 7000, type: 'highpass', dur: 0.006, gain: 0.11, attack: 0.0008, pan, wet: 0.14 });
      noise({
        freq: f * 1.6,
        type: 'bandpass',
        q: 5,
        dur: big ? 0.07 : 0.045,
        gain: 0.13,
        attack: 0.001,
        pan,
        wet: 0.16,
      });
      tone({ freq: f, to: f * 0.55, dur: big ? 0.08 : 0.05, gain: 0.12, type: 'sine', pan, wet: 0.12 });
    },
    release(k) {
      const { pan } = keyInfo(k);
      noise({ freq: 4200, type: 'highpass', dur: 0.009, gain: 0.022, pan });
    },
    error() {
      // a dud: the bubble folds instead of bursting
      noise({ freq: 1200, sweepTo: 300, type: 'bandpass', q: 4, dur: 0.12, gain: 0.12, attack: 0.006 });
      tone({ freq: 190, to: 110, dur: 0.14, gain: 0.1, type: 'sine' });
    },
  },
};

/**
 * Grouped for the picker — a flat list of twelve reads as a wall, and these
 * three groups genuinely want different things from you.
 */
export const SOUND_TIERS: { id: string; voices: SoundThemeId[] }[] = [
  { id: 'tactile', voices: ['thock', 'petrichor', 'gloop', 'nib', 'wrap', 'typewriter', 'classic'] },
  { id: 'musical', voices: ['pentatonic', 'coin'] },
  {
    id: 'melody',
    voices: [
      'ode',
      'elise',
      'canon',
      'greensleeves',
      'nachtmusik',
      'fate',
      'sirocco',
      'twinkle',
      'saints',
      'custom',
    ],
  },
  { id: 'joke', voices: ['hitmarker', 'bonk', 'fart'] },
];

export const SOUND_THEME_IDS: SoundThemeId[] = SOUND_TIERS.flatMap((t) => t.voices);

/**
 * How each voice presents itself: the name, the material it is made of, and a
 * waveform signature drawn in the picker. `wave` takes 0..1 and returns −1..1.
 */
export const VOICE_META: Record<
  SoundThemeId,
  { name: string; material: string; wave: (x: number) => number }
> = {
  thock: {
    name: 'Thock',
    material: 'resin · dense case',
    wave: (x) => Math.exp(-x * 11) * Math.sin(x * 30),
  },
  petrichor: {
    name: 'Petrichor',
    material: 'water · still pool',
    wave: (x) => Math.exp(-x * 4.2) * Math.sin(x * 26 + x * x * 22),
  },
  gloop: {
    name: 'Gloop',
    material: 'gel · suction',
    wave: (x) => Math.exp(-x * 3.4) * Math.sin(x * 40 - x * x * 30) * (1 - x * 0.3),
  },
  nib: {
    name: 'Nib & Tooth',
    material: 'steel nib · paper',
    wave: (x) => Math.exp(-x * 9) * Math.sin(x * 90 + Math.sin(x * 220) * 3),
  },
  wrap: {
    name: 'Bubble Wrap',
    material: 'film · burst',
    wave: (x) => Math.exp(-x * 14) * Math.sin(x * 18 + x * x * 40),
  },
  typewriter: {
    name: 'Typewriter',
    material: 'typebar · platen',
    wave: (x) => Math.exp(-x * 12) * Math.sin(x * 34) + Math.exp(-x * 2.2) * Math.sin(x * 96) * 0.25,
  },
  classic: {
    name: 'Classic',
    material: 'wood · dry tick',
    wave: (x) => Math.exp(-x * 13) * Math.sin(x * 22),
  },
  pentatonic: {
    name: 'Pentatonic',
    material: 'struck bell · scale',
    wave: (x) => Math.exp(-x * 2.4) * Math.sin(x * 44),
  },
  coin: {
    name: 'Coin',
    material: 'two-note pickup',
    wave: (x) => (x < 0.35 ? Math.sin(x * 60) : Math.exp(-(x - 0.35) * 3) * Math.sin(x * 80)),
  },
  hitmarker: {
    name: 'Hitmarker',
    material: 'metallic · confirm',
    wave: (x) => Math.exp(-x * 18) * Math.sin(x * 70),
  },
  bonk: {
    name: 'Bonk',
    material: 'mallet · hollow',
    wave: (x) => Math.exp(-x * 10) * Math.sin(x * 16 + x * x * 30),
  },
  fart: {
    name: 'Fart',
    material: 'regrettable · wobble',
    wave: (x) => Math.exp(-x * 3) * Math.sin(x * 28 + Math.sin(x * 60) * 4),
  },
  ode: {
    name: 'Ode to Joy',
    material: 'Beethoven · 1824',
    wave: (x) => Math.exp(-x * 1.8) * Math.sin(x * 30),
  },
  elise: {
    name: 'Für Elise',
    material: 'Beethoven · 1810',
    wave: (x) => Math.exp(-x * 1.8) * Math.sin(x * 42),
  },
  twinkle: {
    name: 'Twinkle, Twinkle',
    material: 'traditional',
    wave: (x) => Math.exp(-x * 1.8) * Math.sin(x * 22),
  },
  saints: {
    name: 'The Saints',
    material: 'traditional',
    wave: (x) => Math.exp(-x * 1.8) * Math.sin(x * 26),
  },
  canon: {
    name: 'Canon in D',
    material: 'Pachelbel · 1680',
    wave: (x) => Math.exp(-x * 1.6) * Math.sin(x * 36 - x * x * 14),
  },
  greensleeves: {
    name: 'Greensleeves',
    material: 'traditional · 1580',
    wave: (x) => Math.exp(-x * 1.7) * Math.sin(x * 20 + x * x * 16),
  },
  nachtmusik: {
    name: 'Eine kleine Nachtmusik',
    material: 'Mozart · 1787',
    wave: (x) => Math.exp(-x * 1.9) * Math.sin(x * 34) * (1 - x * 0.2),
  },
  fate: {
    name: 'Fate (Symphony No. 5)',
    material: 'Beethoven · 1808',
    wave: (x) => Math.exp(-x * 2.6) * Math.sin(x * 18 + Math.sin(x * 46) * 2),
  },
  sirocco: {
    name: 'Sirocco',
    material: 'original · phrygian',
    wave: (x) => Math.exp(-x * 1.5) * Math.sin(x * 52 - x * x * 26),
  },
  custom: {
    name: 'Your own tune',
    material: 'yours · never uploaded',
    wave: (x) => Math.exp(-x * 1.8) * Math.sin(x * 28) * Math.cos(x * 6),
  },
};

export const DEFAULT_SOUND_THEME: SoundThemeId = 'thock';

function theme(id: SoundThemeId): SoundTheme {
  return THEMES[id] ?? THEMES[DEFAULT_SOUND_THEME];
}

/** Key went down. `big` for space / enter / backspace. */
export function pressKey(id: SoundThemeId, key: string, big = false) {
  theme(id).press(key.length === 1 ? key : ' ', big);
}

/** Key came back up — the other half of the feel. */
export function releaseKey(id: SoundThemeId, key: string) {
  theme(id).release(key.length === 1 ? key : ' ');
}

/** What a mistake sounds like. `voice` keeps it in the keyboard's own material. */
export type ErrorSoundId = 'voice' | 'off' | 'damage' | 'punch' | 'buzz';

export const ERROR_SOUND_IDS: ErrorSoundId[] = ['voice', 'damage', 'punch', 'buzz', 'off'];

/** A wrong character. Falls back to the keyboard voice's own error sound. */
export function errorKey(id: SoundThemeId, error: ErrorSoundId = 'voice') {
  switch (error) {
    case 'off':
      return;
    case 'damage':
      tone({ freq: 220, to: 90, dur: 0.22, gain: 0.16, type: 'sawtooth' });
      noise({ freq: 1200, type: 'lowpass', dur: 0.12, gain: 0.09 });
      return;
    case 'punch':
      noise({ freq: 700, sweepTo: 160, type: 'lowpass', dur: 0.16, gain: 0.18, attack: 0.002 });
      tone({ freq: 105, to: 52, dur: 0.18, gain: 0.16, type: 'triangle' });
      return;
    case 'buzz':
      tone({ freq: 148, dur: 0.16, gain: 0.13, type: 'square' });
      tone({ freq: 155, dur: 0.16, gain: 0.1, type: 'square' });
      return;
    default:
      theme(id).error();
  }
}

/** Seconds-left warning in timed modes — two dry ticks, deliberately plain. */
export function timeWarning() {
  tone({ freq: 880, dur: 0.09, gain: 0.09, type: 'sine', wet: 0.3 });
  window.setTimeout(() => tone({ freq: 880, dur: 0.12, gain: 0.08, type: 'sine', wet: 0.3 }), 150);
}

// Auditioning is click-only, but a melody preview runs for two seconds and people
// click faster than that — so a preview always cancels the one before it.
let previewTimers: number[] = [];

function clearPreview() {
  previewTimers.forEach((id) => window.clearTimeout(id));
  previewTimers = [];
}

let lastPreview = { id: '' as string, at: 0 };

/**
 * Two keystrokes, for auditioning a voice in the picker. Re-auditioning the same
 * voice within a moment is a no-op, so a double click does not fire the sound
 * twice on top of itself.
 */
export function previewTheme(id: SoundThemeId) {
  const now = Date.now();
  if (lastPreview.id === id && now - lastPreview.at < 320) return;
  lastPreview = { id, at: now };

  clearPreview();
  const t = theme(id);

  // A melody needs enough notes to be recognised, and has to start at the top of
  // the phrase — two notes from somewhere in the middle identify nothing.
  if (MELODIES[id]) {
    melodyStep[id] = 0;
    for (let i = 0; i < 10; i++) {
      previewTimers.push(window.setTimeout(() => t.press('t', false), i * 205));
    }
    // leave the tune parked at its first note, so typing picks it up from the top
    previewTimers.push(
      window.setTimeout(() => {
        melodyStep[id] = 0;
      }, 10 * 205),
    );
    return;
  }

  t.press('t', false);
  previewTimers.push(
    window.setTimeout(() => t.release('t'), 90),
    window.setTimeout(() => t.press('o', false), 150),
    window.setTimeout(() => t.release('o'), 240),
  );
}

// ---- legacy single-sound API (kept so nothing else has to change) ----------

/** A dry keystroke in the original voice. */
export function clickKey() {
  THEMES.classic.press('a', false);
}

/** A distinct error tick in the original voice. */
export function clickError() {
  THEMES.classic.error();
}

/** Carriage-return flourish for finishing a test. */
export function ding() {
  blip(1180, 0.18, 0.1, 'sine');
  setTimeout(() => blip(1570, 0.22, 0.07, 'sine'), 60);
}

// ---- Ink Rush (arcade) sfx -------------------------------------------------
// Shared across every keystroke theme: the scoring layer keeps one voice so the
// game reads the same however you have the keyboard tuned.

const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26]; // pentatonic steps

/** A rising arpeggio note whose pitch climbs with the combo — the dopamine ladder. */
export function arpeggioStep(combo: number) {
  const step = PENTA[Math.min(combo, PENTA.length - 1)];
  const freq = 330 * Math.pow(2, step / 12);
  blip(freq, 0.09, 0.09, 'triangle');
}

/** A brighter chime layered on top when a word is typed fast. */
export function sparkle() {
  blip(2093, 0.12, 0.05, 'sine');
}

/** The break: a dissonant crack when a mistake shatters the streak. */
export function crack() {
  blip(140, 0.16, 0.16, 'sawtooth');
  setTimeout(() => blip(96, 0.22, 0.12, 'square'), 24);
}

/** A stamped milestone hit (×5, ×10 …). */
export function stamp() {
  blip(196, 0.05, 0.16, 'square');
  setTimeout(() => blip(392, 0.2, 0.12, 'triangle'), 40);
}

/** A soft heartbeat thump — pitch/urgency rises with tension tier (0..4). */
export function heartbeat(tier = 0) {
  const base = 60 + tier * 8;
  blip(base, 0.12, 0.09 + tier * 0.01, 'sine');
  setTimeout(() => blip(base * 0.85, 0.14, 0.06, 'sine'), 130);
}

/** End-of-run cash-out flourish. */
export function cashOut() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((f, i) => setTimeout(() => blip(f, 0.28, 0.09, 'triangle'), i * 90));
}
