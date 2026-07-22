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
