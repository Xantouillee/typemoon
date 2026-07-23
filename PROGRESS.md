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

## v3.1 — share your score — BUILT (pending sign-off)
A backend-free share loop: a run encodes into a hash-route URL, the recipient
opens a slick card and a "beat it" button drops them into the exact same run.

- [x] **`lib/share.ts`** (pure, **10 tests**) — encode/decode a score into a
      compact query string; `buildScoreCardSvg()` draws the signature Ink-on-Cream
      card (hero WPM, accuracy/consistency/time, a seismograph sparkline from the
      run's series, wordmark, "beat this at …" CTA). Self-contained SVG so it both
      renders on-screen with the real fonts and rasterises to PNG for download.
- [x] **`/score` landing** — the card + a loud "Try to beat it" that sets the
      shared mode/length/language and sends the visitor into a run (→ `/play` on a
      phone, `/` on desktop). This is the loop.
- [x] **`ShareBar`** — the native share sheet when the browser has it (covers
      Messenger/Discord/WhatsApp in one tap on a phone), a universal copy-link, a
      PNG "download card", and one-click hand-offs to X / WhatsApp / Telegram /
      Reddit. Wired into both the mobile results overlay and the desktop Results.
- [x] **Open Graph / Twitter** meta + a generated `public/og.png`. A static host
      can't render a *per-score* preview (the hash never reaches the server), so
      pasted links show one polished generic card; the personalised card is the
      in-app one people post directly. Decision, not a bug.
- [x] Failed/empty runs don't get a share button — nothing to brag about.

Gates: `tsc -b` clean · **117/117** tests · `vite build` ~209 kB gzip.

## v4.0 — accounts, global leaderboard & lifetime stats — SHIPPED (2026-07-23)
**Switched on and merged to `main`.** A live Supabase project is wired
(`mbjhrmhgyiykliiuvfnh`), GitHub **and** Google OAuth both work, and sign-in →
run → leaderboard row → synced History was verified locally. One real bug fixed
during switch-on: newer Supabase projects no longer grant the `anon`/
`authenticated` roles access to public tables, so every read was a bare
"permission denied" before RLS ran — `schema.sql` now `GRANT`s explicitly
(SELECT both roles, INSERT scores / UPDATE profiles for authenticated).
Local dev uses `.env.local` (gitignored). **Remaining to go live:** add repo
secrets `SUPABASE_URL` / `SUPABASE_ANON_KEY` and re-run the Pages deploy.

The first backend track. An **optional** Supabase layer adds Google/GitHub accounts,
cross-device stats, and a global leaderboard — while the site stays a static GitHub Pages
build and, with no keys configured, byte-for-byte the old no-account app. Everything gates
on `isSupabaseConfigured` (presence of the two `VITE_SUPABASE_*` env vars). Backend choice:
**Supabase** (Postgres + Auth + RLS, free tier, client SDK from the static site, no lock-in
— just Postgres for when we deploy a real server later). Sign-in: **Google + GitHub OAuth**.

Local, no-backend (works today, ships regardless of Supabase):
- [x] **`lib/aggregate.ts`** (pure, **12 tests**) — rolls the run history into lifetime
      numbers: current & longest **streak** (local-calendar day runs), **keys tapped**
      (Σ charsTyped), **time typed**, **days active**, avg WPM/accuracy, best WPM, favourite
      mode. `formatCount` / `formatDuration` helpers.
- [x] **History tab redesigned** (`pages/StatsPage.tsx`) — 8-tile lifetime grid (streak tile
      accented) + longest-streak/favourite caption, on top of the existing sparkline + recent
      list. Reads local runs when signed out, cloud runs when signed in (so stats follow you
      across devices).

Cloud, Supabase-gated:
- [x] **`lib/supabase.ts`** — env-gated client, **PKCE flow** (deliberate: returns `?code=`
      in the query string, not a `#access_token` fragment, which would collide with the
      HashRouter). `isSupabaseConfigured`, `authRedirectTo()`. Client is `null` when unconfigured.
- [x] **`store/auth.ts`** — Zustand auth store subscribing to `onAuthStateChange`; Google/
      GitHub sign-in, sign out, `setUsername`, `displayName`/`avatarUrl` helpers. Self-inits
      only when configured.
- [x] **`components/Chrome/AccountMenu.tsx`** — header account dropdown (sign-in choices, or
      avatar + rename + sign out + leaderboard link). Renders `null` when unconfigured.
- [x] **`lib/leaderboard.ts`** — `submitScore` (fires after every finished run; no-op unless
      signed in), `fetchLeaderboard` (best-run-per-user via the `get_leaderboard` RPC),
      `fetchMyRuns` (own cloud runs mapped to `RunRecord` so the *same* `aggregate()` draws
      them). Periods: today / week / month / all, filterable by mode + language.
- [x] **`pages/LeaderboardPage.tsx`** + `/leaderboard` route + header nav link — period tabs,
      mode/language filter chips, ranked rows with own-row highlight; "warming up" when
      unconfigured, "sign in to compete" when signed out.
- [x] **Score submission** wired into `TestPage` and `MobilePage` `onFinish`.
- [x] **`supabase/schema.sql`** — `profiles` + `scores` tables, RLS (read-all, write-own),
      a `handle_new_user` trigger that mints a unique username on sign-up, and the
      `get_leaderboard(since, mode, language, limit)` SQL function. Idempotent.
- [x] **Docs & wiring** — `SUPABASE_SETUP.md` (step-by-step), `.env.example`, deploy workflow
      passes optional `SUPABASE_URL` / `SUPABASE_ANON_KEY` repo secrets, README updated. All
      four UI languages carry the ~28 new strings (strings-parity test enforces it).

Mobile follow-up (the phone overlay covers the desktop header, so account/history/leaderboard
were unreachable there):
- [x] **Mobile settings sheet** (`components/Mobile/MobileSettings.tsx`) opens with a nav row
      (practice/history/leaderboard) + an account block (OAuth sign-in / profile + sign out).
- [x] **Mobile top bar** (`pages/MobilePage.tsx`) gains an account button (avatar or person
      icon) that opens the sheet — sign-in discoverable at a glance.
- [x] **`TouchRedirect`** now sends a phone to `/play` **every time** it hits `/` (dropped the
      once-per-session guard) so the shared header logo reliably means "back to typing" from
      the history/leaderboard pages instead of stranding it on the desktop surface.

Gates: `tsc -b` clean · **129/129** tests · `vite build` ~237 kB gzip (Supabase SDK adds weight).

### ▶ TO CONTINUE THIS FEATURE (read first when resuming)
**Branch:** `claude/leaderboard-feature-architecture-e8r5xl` — pushed, **not merged to `main`**.
GitHub Pages deploys from `main`, so none of this is live yet.

**Why sign-in still looks "missing":** the account UI only appears once Supabase is configured.
Until the env keys exist it is hidden on **every** device by design — nothing is broken.

**What the USER must do (I can't — needs your Supabase account):** follow `SUPABASE_SETUP.md`:
1. Create a free Supabase project.
2. Run `supabase/schema.sql` in its SQL editor.
3. Enable Google + GitHub providers; add redirect URLs (localhost + the Pages URL).
4. Add keys — `.env.local` for dev (`cp .env.example .env.local`), and repo secrets
   `SUPABASE_URL` / `SUPABASE_ANON_KEY` for the live build.
5. Merge the branch to `main` to ship it (or open a PR first).

**Known follow-ups (not yet done):**
- **Anti-cheat** — scores POST straight from the browser; a determined user can fake one. Fine
  for launch/friends. For a competitive public board, move the insert behind a Supabase Edge
  Function that re-validates a run and tighten the `scores` insert policy. Schema is ready.
- **Bundle weight** — the Supabase SDK loads eagerly (Header → AccountMenu → store → client).
  Could lazy-load the whole account layer to keep the typing page featherweight (~+150 kB gzip).
- Rename/username edit exists on desktop; mobile sheet only shows sign-out (add rename if wanted).

## v4.1 — percentile + leaderboard privacy — SHIPPED (2026-07-23)
Two small features on top of the live board, both verified against the real Supabase project.

- [x] **"Faster than X% of runs"** — a `run_percentile(wpm, mode, language, since)` SQL function
      returns the share of recorded runs (same mode + language) that were slower, plus the sample
      it measured against. Read in `onFinish` **before** the run's own insert lands (so it is never
      measured against itself), shown under the verdict on desktop + mobile results, all four
      languages. Hidden until `MIN_PERCENTILE_SAMPLE` (5) comparable runs exist, so "faster than
      100%" of one run never appears. All-time window for now (biggest steady sample while the
      field is young); trivially switchable to weekly later. Degrades to nothing with no backend.
      The point: turns the board's data into a line **every** player gets, not just the fast few.
- [x] **Show me on the leaderboard** toggle — a `profiles.visible` flag (default true), a switch
      in the account menu (desktop) and the mobile settings sheet. `get_leaderboard` joins on
      `p.visible`, so opting out drops your **named row** — but your runs still feed the anonymous
      percentile, so hiding costs nothing. Optimistic toggle, reverts on write failure. Opt-OUT by
      default (visible unless you turn it off); flip the column default for opt-in if wanted.
- [x] **Schema** grew `run_percentile`, the `visible` column (+ idempotent `alter`), and the
      `p.visible` filter — all applied to the live DB and re-verified with direct RPC calls.

## v3 ROADMAP — from the user's list of 2026-07-22 (agreed, not yet built)
Six ideas from the user, assessed rather than accepted wholesale. Recommended order below;
the reasoning is kept because it is the kind of thing that gets re-argued later.

### A. Caret flicker — FIXED ✅
**Diagnosed:** `index.css:136` `caretPulse` fades the caret 1 → 0.35 → 1 on a 1.1 s loop and
runs **continuously while focused**, never suppressed during typing. Typing fast means the
caret is mid-fade *and* mid-spring-flight between letters at once → reads as flicker.
**Fixed:** the caret only pulses once typing has stopped (`REST_AFTER_MS = 900`, reset on every
cursor move). Practice only — the arcade caret never had a pulse, which is why the arcade never
flickered.

### B. Release a broken word — DONE ✅
Was: first mistake sets `wordDirty`, backspace is disabled, and **the player must still type
out a word that can no longer score**. Dead time with no upside.
**Not** "skip as a reward for failing" — that would soften the penalty the multiplier depends
on. Instead: once broken, the word is *released*; you have already taken the hit and should not
also be made to finish a corpse. The **Quick Quill** skip stays a distinct, proactive power
(dodge a word you have not broken yet). Two different powers, both earn their place.

**What "smooth" turned out to require**, beyond the jump itself:
- **A 220 ms grace window** where keystrokes are swallowed. Without it the feature actively
  *hurts*: at 100 wpm a character lands every ~120 ms, so a fast typist has two keys already
  committed to the word we just took away. Letting them land would break the next word too —
  one mistake cascading into a second. Swallowed keys count as neither hits nor mistakes.
- **The abandoned letters stay on screen, struck through in faded red**, so the jump reads as a
  consequence rather than a glitch.
- **No new sound.** `crack()`, the red flash and the shake already fire on the same keystroke;
  a second cue 0 ms later would be mush.
- **Never released on the run's last mistake** — the run ends, rather than yanking the player
  forward into a stream they can no longer type.
- Word-boundary math extracted to `wordEndAt` / `afterWord` in `scoring.ts`, shared with the
  Quick Quill skip, **5 new tests**. The off-by-one around the space (landing *on* it rather
  than past it) silently ruins the next word and would not have been caught by eye.

### B2. Melodies play the whole piece — DONE ✅
Asked for alongside A and B. The built-in tunes were 30–52-note fragments that looped before
arriving anywhere. Now **62–89 notes each**: full phrase structure, second sections and real
endings — Ode to Joy has all four phrases including the B section, Für Elise reaches the
C-major middle and returns, Canon in D gets the running-quaver variation, Symphony No. 5 drives
its motif through the whole rising sequence. Sirocco (the original) gained a second half up a
fourth plus an Andalusian cadence home. *Twinkle stayed at 42 — already the complete song.*

Cost of roughly doubling every tune: **+0.4 kB gzip.** Still nothing licensed; everything
shipped remains public domain.

### C. Responsive pass — all PC screen sizes
Overdue. Hardcoded sizing in `TypingArea` (`height: 10.5rem`, `maxWidth: 52rem`) does nothing
for 1440p or a 13" laptop. Straightforward, high payoff.

### D. Pixel-art intro — also closes audit #1
The real fix for "no orientation on landing", the worst finding in the audit.
**Hard rule: not GIFs.** We already have this bug (audit #16 — the 1.2 MB jungle that pops in).
Pixel art is the cheapest art form there is as a small spritesheet or canvas draw, and one of
the most expensive as exported animated GIFs. Target ~30 kB, 60 fps, never blocking first
paint. Shown once, remembered, skippable on any key — a mandatory intro on the fifth visit is
a tax.

### E. Accounts + leaderboards (day / week / month, top X%) — biggest, last
User's instinct that they do not want a heavy user DB is **correct, and achievable**:
**Supabase** — Postgres with Discord + Google OAuth built in, free tier, no server to run.
Two tables: `profiles`, `scores`.

**The catch that decides whether this is worth building: a public typing leaderboard attracts
fake scores.** Anyone can POST "300 wpm" from devtools. Monkeytype runs real anti-cheat and
still fights it. Naive leaderboard → top spots are bots → feature is worse than absent.
**Mitigation, budgeted as part of the feature, not later polish:** submit the keystroke timing
log with each run and validate server-side (reject inhuman consistency, impossible intervals,
runs with no plausible rhythm). Does not make cheating impossible; makes it annoying, which is
enough at this scale. **Day/week/month scoping is itself a defence** — a fake score pollutes
one week, then evaporates.

**"Top X%" is the strongest idea in the list** and should not be treated as a sub-feature of
the leaderboard: "68 wpm" means nothing, "faster than 82% of runs this week" means something,
it is cheap once the data exists, and it rewards *everyone* rather than only the ten people
fast enough to reach a top-100 board.

Privacy: users pick a display name. Never auto-publish someone's Discord handle.

### F. Mobile — split the question honestly
- **Chrome responsive everywhere** (menus, settings, results, history, intro): yes.
- **Practice on a phone:** workable with real fixes — `autocorrect=off`, `autocapitalize=none`,
  virtual-keyboard viewport handling.
- **Arcade on a phone: no, and say so.** Ink Rush needs sustained fast typing; on thumbs it
  would feel broken, and a broken arcade costs more than an honest "this one wants a keyboard".
- Thumb-typed WPM measures a different skill from touch-typed WPM, so **mobile scores cannot
  share a leaderboard with desktop scores** (interacts with E).

**Recommended order:** A + B bundled (small, one is a live bug) → C → D (C and D together fix
how the product reads on arrival) → E last: the only item adding a backend, ongoing cost and an
abuse surface, and it deserves undivided attention.

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
- ~~Accounts, cloud sync, global/daily leaderboards~~ → **BUILT in v4.0** (needs Supabase
  setup to switch on; see that section). Remaining: server-side score validation.
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
