# Typemoon — build progress

A slick typing-speed website with a literary soul. Design metaphor: **ink, paper, and the
craft of writing** — proofreader's-mark errors, a pen-nib caret, a colophon-style results reveal.

**Stack:** Vite · React 19 · TypeScript · Tailwind · Framer Motion · Zustand · Dexie (IndexedDB)

## v1 — solo, local-first (no backend, no accounts)

- [x] **0. Project tracker** — this file + README
- [x] **1. Scaffold** — Vite + React + TS + Tailwind + design tokens (two themes)
- [x] **2. Typing engine** — pure TS, 11 unit tests passing (WPM/raw/accuracy/consistency/backspace/time-limit)
- [x] **3. Core Time/Words UI** — char states, pen-nib caret, live WPM, input handling
- [x] **4. Results screen** — cinematic count-up, seismograph WPM chart, local history (Dexie)
- [x] **5. Interactive keyboard** — live key lighting + post-run slowest-key heatmap
- [x] **6. Themes + settings** — Ink on Cream / Midnight Ink, punctuation/numbers/sound toggles, persisted
- [x] **7. Multilanguage** — EN/FR/ES/DE typing content (200-word lists) + localised UI + AZERTY/QWERTY/QWERTZ
- [x] **8. Daily book** — public-domain passages (16, via Gutendex) + `scripts/build-daily-pool.ts`; Daily & Quote modes
- [x] **9. Polish** — grain texture, spring motion, sound design, reduced-motion + focus states
- [x] **Visual sign-off** — reviewed by user 2026-07-21: "v1 is slick, the feeling of typing is nice" ✅

**v1 SHIPPED.** Solo, local-first typing experience complete and approved.

## Quality gates (all green)
- `npx tsc -b` — clean
- `npx vitest run` — 11/11 passing
- `npm run build` — bundles (~159 kB gzip)

## Modes
`time` (15/30/60/120s) · `words` (10/25/50/100) · `quote` · `daily page` · `zen`

## v2 — "Ink Rush" arcade (Balatro-inspired) — BUILT (pending visual sign-off)
A **front-end-first, high-juice, ADHD/zoomer** scoring game at `/arcade`. Full plan:
`PLAN-v2-inkrush.md`.

- [x] **1. Scoring core** — `src/arcade/letterValues.ts` + `scoring.ts` (chips, mult steps,
      halving, speed bonus, milestones, tension tiers), **20 unit tests passing**
- [x] **2. Game hook** — `src/arcade/useInkRush.ts`: endless word stream on top of the
      keystroke model; clean words score `chips × mult`, first mistake in a word **halves
      the mult + costs a heart**, combo streak heals; backspace disabled (locked-in feel)
- [x] **3. Playable loop** — `ArcadePage` (menu → run → cash-out) + `ArcadeStage` + `ScoreHUD`
- [x] **4. Reactive gauges** — `Hearts` (beat faster/hotter with tension) + `MultMeter`
      (fragile multiplier, crumble on break, progress to next milestone)
- [x] **5. Juice** — `JuiceLayer`: spring count-up w/ overshoot, floating combat text,
      ink-fleck bursts, red break flash, stamped milestone callouts, screen shake (∝ gain)
- [x] **6. Audio** — pentatonic arpeggio-by-combo, fast-word sparkle, crack, escalating
      heartbeat, cash-out flourish (extends `src/lib/sound.ts`)
- [x] **7. Persistence** — `arcadeScores` Dexie table + best/high-score helpers; cash-out
      shows per-mode leaderboard, "new best" badge
- [x] **8. Tension polish** — vignette + heat tint + subtle zoom by mult tier; full
      `prefers-reduced-motion` fallback; new **Arcade** nav link (v1 Practice untouched)
- [ ] **Visual sign-off** — awaiting user review in browser

### Post-v2 UX fixes (from user review)
- [x] **Auto-start** — Practice auto-focuses on load/new test; just start typing (no "click here")
- [x] **Practice menu clarity** — rebuilt as labeled MODE / LENGTH segmented controls + on/off
      toggles; fixed the shared-`layoutId` bug that made the highlight fly around
- [x] **Arcade word flow** — active word highlighted, distant words recede, top/bottom edge fade
      so words visibly stream through

## v2.1 — "The Anthology" roguelite run — BUILT (pending visual sign-off)
A 6-Page roguelite run inside Arcade. Rising score targets, a **1-of-3 Quill** pick between
pages, boss gimmicks, and a hard-word final boss.

- [x] **Quills** — `src/arcade/quills.ts`: 10 augments (Serifed, Rarity Hunter, Golden Word,
      Momentum, Soft Landing, Second Wind, Inkjacket, Staccato, Quick Quill, Overdrive) with
      pure, unit-tested effect math (**13 tests**)
- [x] **Run structure** — `src/arcade/anthology.ts`: 6 pages, rolled boss gimmicks
      (Fog / Deadline / Featherweight / Silent), hard-word boss pool
- [x] **Engine** — `useInkRush` refactored to config-driven + Quill-aware: score targets,
      momentum floor, inkjacket forgiveness, soft-landing decay, overdrive/staccato mult,
      golden words, double-tap-space skip with cooldown, deadline time-scale
- [x] **UI** — `AnthologyPage` (intro → page → Quill pick → boss → win/lose), `QuillPick`
      cards (1/2/3 to choose), `QuillTray` with live Quick-Quill cooldown, target-progress
      bar in the HUD, page pips, gimmick banners, Fog/Silent stage effects
- [x] **Persistence** — run totals saved to `arcadeScores` under mode `anthology`
- [ ] **Visual sign-off** — awaiting user review

### Quality gates
- `npx tsc -b` — clean · `npx vitest run` — **44/44** (11 engine + 20 scoring + 13 quills)
  · `vite build` — 173 kB gzip

## v2.3 — ASMR keystroke voices — BUILT (pending sign-off)
Six selectable keyboard voices, all synthesised in WebAudio (no audio files shipped).
Picked from the ♪ menu in the header; applies to Practice, Arcade and Anthology alike.

- [x] **Synth core** (`src/lib/sound.ts`) — noise-burst + resonant-body primitives, a
      procedural convolution room, shared master bus
- [x] **The feel mechanics** — *press and release are separate sounds*; pitch is **stable per
      key** (`a` always sounds like `a`); keys **panned by keyboard column**; space/enter/
      backspace are deeper "big" hits; held keys never machine-gun
- [x] **Six voices** — `Thock` (resin, default) · `Petrichor` (water droplet, pitch rises) ·
      `Gloop` (squelch + suction release) · `Nib & Tooth` (nib on paper, on-brand) ·
      `Bubble Wrap` (burst, wide pitch spread) · `Classic` (v1's original tick)
- [x] **Themed error sound** per voice, so a mistake stays in the same material
- [x] **`SoundMenu`** — header popover: master switch + voice list with drawn waveform
      signatures, auditions on hover, persisted via Zustand
- [ ] **Sign-off** — awaiting user review

Arcade scoring sfx (arpeggio/crack/stamp/heartbeat) stay **shared across all voices** so the
game reads the same however the keyboard is tuned. Per-voice arcade sfx = deferred.
Audition booth used to pick these: `PLAN-v3-sound.html` (artifact).

## v2.4 — twelve voices + a real settings page — BUILT (pending sign-off)
Audited `monkeytype.com/settings` with Playwright (all 8 sections) and cherry-picked. We do
**not** chase their 26-strong sample library: everything here stays synthesised, so twelve
voices cost ~7 kB total and work offline.

- [x] **Six new voices** → 12, grouped into three tiers so the picker never reads as a wall:
      **tactile** (Thock · Petrichor · Gloop · Nib & Tooth · Bubble Wrap · **Typewriter** ·
      Classic) · **musical** (**Pentatonic** — key maps to a scale degree, so a word plays a
      melody and always the same one; **Coin**) · **joke** (**Hitmarker** · **Bonk** · **Fart**)
- [x] **Volume slider**, **error-sound choice** (voice/damage/punch/buzz/off), **time warning**
      (off/1/3/5/10s)
- [x] **Engine rules** (`TypingEngine`, all opt-in, defaults unchanged): `difficulty`
      normal/expert/master · `stopOnError` off/letter/word · `confidence` off/on/max ·
      `freedom` · `lazy` (accent-insensitive — **fixes a real FR/ES/DE gap**) ·
      per-slot `typed[]` for typo display. **14 new unit tests.**
- [x] **Appearance**: caret style (nib/block/outline/underline/off), caret motion
      (snap/slow/medium/fast), highlight (off/letter/word), typed effect (keep/fade/dots/hide),
      text size, speed unit (wpm/cpm/wps), caps-lock warning
- [x] **`/settings` page** — section nav w/ scroll-spy, and a **live preview you can type in**
      that reflects every setting instantly (the thing Monkeytype's settings page lacks)
- [ ] **Sign-off** — awaiting user review

### Quality gates
- `npx tsc -b` — clean · `npx vitest run` — **58/58** · `vite build` — 183 kB gzip

### Known gap
Settings-page labels/descriptions are **English only**; the rest of the chrome is EN/FR/ES/DE.

## v2.5 — arcade backdrops — BUILT (pending sign-off)
Four user-supplied pixel-art GIFs as **arcade-only** backdrops (`public/backgrounds/`).
Practice mode is deliberately untouched.

- [x] **`ArcadeBackdrop`** — four stacked layers, readability enforced in code rather than
      left to the image: `cover`-fitted GIF (blurred + desaturated) → flat scrim in the page
      colour → **radial scrim heaviest at the centre where the words are, lightest at the
      edges** so the art still reads at the periphery → vignette
- [x] **Scrim floor** — `MIN_SCRIM = 0.45`; the slider physically cannot reach a value where
      light-theme text over a bright jungle frame stops being legible
- [x] **Per-image defaults** — each backdrop declares a `weight` (how hard it fights text);
      picking one auto-sets the scrim. Downpour 0.62 → Cascades 0.82
- [x] **`.on-backdrop` text halo** — a paper-coloured `text-shadow` on arcade text, so small
      type keeps local separation even over the waterfalls' white water
- [x] **Lazy** — GIFs are static files fetched only when selected; the 1.2 MB jungle costs
      nothing until chosen. Cards in the picker show the real image under the real scrim
- [x] **Settings → Arcade** — backdrop picker, Cover slider, Blur slider
- [ ] **Sign-off** — awaiting user review

Backdrops: `Downpour` (rain city) · `Harbour` (sunset river) · `Campfire` (mountain lake) ·
`Cascades` (jungle waterfalls). Source files kept in `Image for theme/`.

## v2.6 — melody voices → 16 total — BUILT (pending sign-off)
- [x] **Melody tier** — `Ode to Joy` · `Für Elise` (Beethoven) · `Twinkle, Twinkle` ·
      `The Saints` (traditional). Each keystroke plays the **next note of the tune**, so a
      sentence performs the piece; space rests and resets the phrase so every word starts
      recognisably. Auditioning plays 7 notes from the top, not 2 from the middle.
      Deliberately breaks the stable-pitch-per-key rule — here the *sequence* is the
      instrument.
- [x] Fixed: arcade first-line clipping (stage masks its top 22%; line 1 rendered inside the
      fade — added a one-line lead-in)
- [x] Fixed: keystroke sound judged "correct" independently of the engine, so in **lazy mode**
      typing `e` for `é` scored correct but played the error sound. Both now use
      `charMatches()` exported from `TypingEngine`.
- [x] Fixed: error sound + time warning had **no audition** — five option words with no way to
      know what they meant. They now play on selection.
- [x] Fixed: backdrops over a light ground get **+12% cover** (dark art under a cream scrim
      lands in the muddy midtones where dark ink loses contrast)
- [x] **Burnt Caramel** third theme — toffee ground `#EACDA6`, cocoa ink `#2E1C10`,
      caramelised accent `#B04A1E`, ~11:1 contrast. Header icon cycles light → caramel → dark.

## v2.7 — the user's own list — BUILT (pending sign-off)
Worked from the user's message of 2026-07-22, which cherry-picked from the 16-point audit
and added three of their own. All eight items done.

1. **Melody voices now play the whole song.** The bug: `melodyStep` reset on every space, so
   the tune restarted each word and you only ever heard as many notes as the word was long.
   Now the counter survives spaces (a space is a soft low rest), an error stumbles back two
   notes rather than resetting, and only a fresh run winds the tune back (`resetMelodies()`,
   called from `useTypingTest` and from the arcade's `start`). Every melody was also extended
   to a full phrase (30–52 notes).
2. **Four new public-domain songs** — Canon in D (Pachelbel), Greensleeves (traditional),
   Eine kleine Nachtmusik (Mozart), Fate / Symphony No. 5 (Beethoven). Melody tier is now 8;
   20 voices in total. Still synthesised, still nothing licensed. See the decision log below.
3. **Click to audition, never hover.** Sweeping a mouse across the grid used to fire a dozen
   voices on top of each other. Removed from both the settings picker and the header popover.
4. **Backdrops now cover practice as well as the arcade**, with an **eye toggle** in the
   header (`bgVisible`) that hides the scene without forgetting which one you chose.
   Store keys renamed `arcade*` → `bg*` with a persist `migrate` (version 2).
   `ArcadeBackdrop` → `components/Backdrop/Backdrop.tsx`, store-connected, plus
   `useBackdropClass()`.
5. **Readability, properly solved** (audit #4, but not the way the audit proposed). Rather
   than forcing a dark ground, the *typing surface itself* now carries a near-solid sheet of
   paper over a backdrop (`.on-backdrop [data-typing-surface]`), and untyped ink strengthens
   via `--untyped-alpha`. Because the words no longer depend on the scrim, the light-ground
   boost dropped 0.12 → 0.06 and **the scene is finally visible**. Also killed a stray focus
   ring around the whole passage.
6. **The live preview can now demonstrate the rules it could not** (audit #6). Longer
   localised sample (with accents, so lazy mode is demonstrable), its own 20-second clock so
   the time warning actually fires, and a status band that says in words what just happened:
   blocked / Expert / Master / time warning. Failures hold on screen 2.4 s before looping.
7. **Results now say whether you did well** (audit #7). `judgeRun()` ranks a run against the
   same mode in the same language — computed *before* the save, so it never competes with
   itself. Yields "First run at words 10", "Personal best — 12 wpm above your old best of 64",
   or "Your 3rd best at time 30 · 5 wpm above your recent average". Ordinals are per-language.
8. **Difficulty failure is explained** (audit #8). An "ENDED EARLY" strip on the results
   screen names the rule that stopped the run, plus a live "fix that letter to carry on" chip
   for stop-on-error. A failed run is **neither saved nor ranked** — it is not an attempt at
   the mode, and recording it would poison the average it would then be judged against.
9. **Everything translated** (audit #3). New typed `i18n/copy.ts` for the settings page: a
   missing translation is a compile error, not a silent English fallback. Every row also
   gained a `tip` — a concrete example for the settings that are hard to picture. Arcade
   menu, Anthology summary and the footer went through `strings.ts`. New test proves all four
   dictionaries carry identical keys with no empty values.

Also fixed: `restart()` rebuilt the engine with only `timeLimit`, silently dropping
difficulty, stop-on-error, confidence, freedom and lazy mode every time anyone pressed Tab.

Gates: `tsc -b` clean · **75/75** tests · build ~196 kB gzip.

Audit items now closed: **#3, #4, #6, #7, #8** (and #5 partly — auditioning is fixed,
"play all" is not built). Still open: #1, #2, #9, #10, and all six minor ones.

## DECISION LOG — audio licensing (settled 2026-07-22, do not relitigate)
The user pushed hard to lift sounds from Monkeytype and osu!. Researched rather than assumed;
the conclusions and the resulting policy:

- **Monkeytype** ships **recorded `.wav` samples, 5–10 round-robin variants per pack**
  (`frontend/static/sounds/clickN/`, e.g. `click17` has 10 files). Their hitmarker is Call of
  Duty audio, the osu pack is osu! audio, keyboard packs are recordings of undocumented
  provenance. Their AGPL covers **code**, and cannot grant rights to third-party audio they do
  not hold.
- **osu!** — `ppy/osu` (code) really is **MIT**; the user was right that osu! is open source.
  But `ppy/osu-resources`, where the **audio** lives, is **CC-BY-NC 4.0**: attribution
  required, **non-commercial only**, and "osu!"/"ppy" branding is separately trademarked.
- **Policy chosen:** the repo is **public**, so committing any of the above makes the user the
  redistributor, and CC-BY-NC would permanently bar ever monetising the site — a heavy,
  invisible constraint in exchange for one sound effect. **Everything shipped stays
  synthesised.** "Famous songs" are served instead by **public-domain melodies** (Beethoven
  d. 1827 + traditional), which cost 0 kB and need no attribution.
- **The escape hatch (agreed, not yet built):** a **custom sample-pack import** — user drops
  `.wav`/`.mp3` into the app, stored locally in IndexedDB, round-robin variants, **never
  committed**. Any osu! sample or CC0 fart is then fine because it lives on their machine, not
  in a public repo. Freesound has genuine CC0 farts but needs an account to download, so the
  user must supply the files. **~1h of work. This ends the argument permanently.**
- Also declined earlier, same reasoning: sourcing pornographic ("ahegao") audio rips.

## v2.8 — your own tune, and one original — BUILT (pending sign-off)
Asked for Gerudo Valley (Koji Kondo, 1998, Nintendo). Declined, and this is the
precedent for every future "can you add <song>":

- The **composition** is the copyrighted work here, not just a recording. Encoding a
  melody as semitone offsets is still reproducing the melody, and melody is the most
  strongly protected element of a musical work. This is *not* the osu case, where the
  code was genuinely MIT and only the audio assets were encumbered — there is no
  clean half to take.
- Nintendo enforces against fan arrangements harder than almost any rights holder.
- Both reasons bite specifically because the repo is public and may be monetised.

Built instead, in the same session:

1. **`custom` voice — "Your own tune".** A note-name parser (`lib/melody.ts`) and a
   text field in the sound settings. Notation: `c d e f g a b`, `c# eb`, octaves
   `a3 c5` (4 = middle C), bare integers as semitone offsets, bars/commas ignored.
   Reports what it read and what it could not (`15 notes read · not understood: oops`)
   rather than failing silently. Stored in `localStorage` via the settings store,
   parsed into the audio layer on rehydrate. **Never uploaded, never committed** —
   this is the escape hatch agreed in the licensing decision below, now real.
   Whatever the user plays on their own machine is their business; what Typemoon
   *ships* stays public domain.
2. **`sirocco` — an original.** Not a transcription. Written for this app in E
   Phrygian dominant (E F G# A B C D), the scale that makes flamenco guitar sound
   like flamenco guitar: rising figure, turn, cascade, Andalusian cadence. The
   desert-guitar *idiom* is nobody's property; any particular tune in it is.

22 voices now. `tsc` clean · **86/86** tests (11 new, all on the parser — the `b`
note vs `b` flat ambiguity is the one place the notation can trip over itself).

## v2.9 — bring your own MIDI — BUILT (pending sign-off)
The "your own tune" field asked people to hand-type note names. Most tunes worth playing
already exist as a `.mid` somewhere on disk, so now you can just drop one in.

- [x] **`lib/midi.ts`** — a small standard-MIDI reader written for this one job, not a
      sequencer. Walks every track, keeps note-ons, drops **channel 10** (percussion would
      wreck the line), and where several notes land on the same tick keeps the **highest** —
      in almost all music the top voice is the tune and the rest is accompaniment. Handles
      running status, VLQ deltas, meta and sysex events; picks up the track name as a label.
      Never throws: an unreadable file comes back as a typed `error`, not an exception.
- [x] **Drop zone** in Settings → Sound, next to the note-name field. Dropping a file fills
      the field, switches to the `custom` voice, unmutes if needed, and auditions it.
- [x] **Local, always.** The file is read with `arrayBuffer()` in the browser; only the note
      offsets reach `localStorage`, and the file itself is discarded. Nothing uploaded,
      nothing committed — this is exactly the escape hatch from the licensing decision.
      Whatever tune you drop is your business; what Typemoon *ships* stays public domain.
- [x] **Errors say which** (`not-midi` / `no-notes` / `unreadable`), translated EN/FR/ES/DE.
- [x] **11 parser tests** — header/track walking, running status, chord-collapse, drum-channel
      rejection, zero-velocity note-offs, junk input.

Gates: `tsc -b` clean · **97/97** tests · build ~200 kB gzip.

## v3.0 — a touch-first mode for phones — BUILT (pending sign-off)
The whole app read input from physical `keydown` events on a focusable `<div>` — which a
phone soft keyboard cannot drive (a div never raises the keyboard, and Android GBoard sends
keyCode 229 with no usable `key`). So mobile got a **separate input road** at `/play`, while
the engine, word lists, themes and history stay shared.

- [x] **`mobile/inputDiff.ts`** — a pure reconciler. A soft keyboard's only trustworthy
      signal is the field's `value` before and after each `input` event, so instead of reading
      keystrokes we diff old → new into `{backspaces, inserts}`. Autocorrect, predictive
      multi-char commits, and paste all funnel through one function that turns "teh " → "the "
      into delete-then-retype — an honest correction the engine already understands.
      **10 unit tests**, including a property check that the delta rebuilds `next` from `prev`.
- [x] **`useMobileTyping`** — the mobile twin of `useTypingTest`: an off-screen `<input>`
      (16px so iOS doesn't zoom, every autocorrect affordance stripped) feeds the shared
      `TypingEngine` through `inputDiff`. Correctness is asked of the engine's exported
      `charMatches` — never re-decided locally, the bug this repo already warned about. Owns a
      `ready → running → done` state machine, the countdown clock, and start/stop/restart.
      A touchscreen has no key-up, so a quick `releaseKey` is faked 55 ms after each press so
      press-and-release voices still get both halves.
- [x] **`useViewportHeight`** — sizes the app to `visualViewport.height`, the one measure that
      excludes the space the keyboard covers, so **the panel and controls always sit above the
      keyboard** rather than behind it (the "panel at the correct size" problem `100vh` causes).
- [x] **`MobilePage` + `MobileTypingArea`** — a full-height, self-contained experience: mode
      chips (25 words · 30s · 60s), a live WPM/timer readout, a big tap-to-scroll typing panel
      with a solid current-character highlight (no measured caret to misfire on reflow), and
      thumb-sized Start / Stop / Restart controls with a safe-area inset. Results overlay shows
      WPM, accuracy, time and the same history-ranked verdict as desktop; runs save to the same
      Dexie table under `words 25` / `time 30` / `time 60` so they group with desktop history.
- [x] **Discovery** — a touch visitor on `/` is sent to `/play` once per session (coarse
      pointer + narrow screen only, so desktop is untouched and the logo still navigates back);
      a phone icon in the header reaches it from anywhere.
- [x] **Verified in a real (phone-emulated) browser** — auto-redirect, per-keystroke typing, a
      mistake corrected by backspace staying in sync (99.2%), a clean run (100%), and restart
      via "again" — no console errors.

Follow-ups (same track, pending sign-off):
- [x] **Tap-to-type** — the input is a transparent overlay over the words, so
      tapping the text focuses a real field and the keyboard rises natively.
- [x] **Settings sheet** — a gear opens a bottom-sheet: theme swatches, sound +
      volume, the full keyboard-voice picker with tap-to-audition, punctuation/
      numbers, text size. All on the shared store, so choices sync with desktop.
- [x] **Mode parity** — the phone now drives the same `mode`/`timeValue`/
      `wordsValue` store as desktop: time (15/30/60/120), words (10/25/50/100),
      quote, daily, zen, in a two-row selector (category, then length) that
      scrolls rather than crowds. Runs group with desktop history via `modeLabel`.
- [x] Removed the desktop header's phone-mode icon (touch visitors are already
      redirected; the icon did nothing useful on a computer).

Gates: `tsc -b` clean · **107/107** tests · `vite build` ~205 kB gzip.

## UX AUDIT — 16 findings (2026-07-22) — THE WORK QUEUE
Full walkthrough as a new user. **Next task: work through these.**
User's stated priority = readability and a slick, self-evident experience.

### Severe
1. **No orientation on landing.** You arrive mid-test — no title, no "start typing", no
   explanation of modes. Auto-start is right, but *frictionless* ≠ *unexplained*. Fix: one
   line that fades on first keystroke.
2. **Arcade is invisible.** Ink Rush / Anthology / Quills / leaderboards — the most
   distinctive work in the product — hide behind one lowercase nav word. Most visitors never
   find them.
3. **Settings page is English-only** while the rest of the chrome is EN/FR/ES/DE. User is
   French; most visible inconsistency in the product.
4. **Backdrops still fight text on light grounds.** +12% helped but did not solve it.
   **Recommended fix: when a backdrop is on, the arcade forces its own dark ground**
   regardless of site theme — it is already a separate visual world.

### Moderate
5. **16 voices, met one hover at a time** — no "play all", no comparison. The audition
   artifact built for the proposal is a better interface than what shipped.
6. **Settings live preview is a fixed 62-char line** — cannot demonstrate `stopOnError`,
   `difficulty` or the time warning, i.e. exactly the settings hardest to imagine.
7. **Results never say whether you did well.** No comparison to own history. "68 wpm" alone
   means nothing; "68 wpm — your third best" means something. Data is already in IndexedDB.
8. **Difficulty failure is silent** — expert/master end the test with no explanation; it just
   looks broken.
9. **No keyboard route through settings.** A typing site's settings should be mouse-free.
   Monkeytype solves this with `ctrl+shift+P`; we have nothing.
10. **History is a dead end** — no "beat this", no link back into a matching test.

### Minor
11. Zen mode has no visible way to stop.
12. Nav gives Practice / Arcade / History equal weight though usage is wildly unequal.
13. No empty state on History before the first run.
14. Caps-lock warning shifts the layout when it appears.
15. Sound on by default at 70% — a public visitor gets noise unprompted.
16. Jungle backdrop (1.2 MB) has no loading indicator; it pops in.

### Kept (genuinely good — do not "fix")
Auto-start/auto-focus · press+release keystroke sound · the live-preview concept ·
daily public-domain passage · arcade juice · the scrim floor that makes an unreadable
setting unreachable.

**Top 3 by impact:** #2, #3, #4 — together they change how the product reads more than the
other thirteen combined.

### Deferred from the Monkeytype audit
**Pace caret** (ghost racing your PB/average — their best feature, wants its own pass) ·
tape mode · funbox modes · font family picker · ~100 preset themes (our two hand-made
themes beat generated ones) · opposite-shift, min-burst, code mode.

### Arcade contents
Score attack: `Sprint · 30s` · `Sprint · 60s` · `Endless` · **The Anthology** (roguelite run)

### Deferred → later
A shop to spend earned ink between pages; more Quills & boss gimmicks; VS multiplayer; accounts.

## Deferred (later / other tracks)
- Real-time VS multiplayer (WebSocket rooms) or async "ghost" race
- Accounts, cloud sync, global/daily leaderboards
- More languages, Dvorak/Colemak, Keybr-style adaptive weak-key drills

## Run it
```
cd typemoon
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle in dist/
npx vitest run     # engine tests
npx tsx scripts/build-daily-pool.ts   # refresh the daily passage pool from Gutenberg
```
