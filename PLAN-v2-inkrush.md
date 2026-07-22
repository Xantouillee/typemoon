# V2 Plan — "Ink Rush" (gamified arcade mode)

## Context
v1 shipped: a calm, literary, local-first typing practice the user approved ("v1 is slick,
the feeling of typing is nice"). v2 adds a **front-end-first, high-juice, ADHD/zoomer** scoring
game — the **Balatro feeling of a number growing under a fragile multiplier**. It lives
alongside v1, not replacing it. Explicitly NOT the outdated "cars racing" trope.

### Decisions (from the user, 2026-07-21)
- **Scope:** *recommended by me* → **score-attack first**, roguelite meta later. Rationale: the
  addictive core (chips × mult + juice) is 90% of the wow and ships fast; we dial the feel in
  before investing in Quills/shop/pages. Roguelite becomes v2.1.
- **Failure feel:** a mistake **reduces the multiplier (halves it, not full reset)** AND a
  **visible "heart" reacts** — a heart/health element takes a hit with strong visual feedback.
  (User: "show a visual thing for heart and reduce the multiplier.")
- **Placement:** a **new "Arcade" section** in the nav — v1's zen practice stays intact; Arcade
  is the louder, more intense sibling. Two moods, one app.

## The feel we are chasing
Balatro's dopamine: a fragile multiplier you nurse higher and higher, a score that **explodes**
in animated chunks (chips → ×mult → SLAM into total), and escalating audio-visual stress the
bigger it gets, so protecting a huge streak is genuinely nerve-wracking.

---

## Core scoring (the game rules)
Reuses v1's `TypingEngine` for text/cursor/per-keystroke correctness; a new scoring layer sits
on top and reacts to the keystroke stream.

- **Letterpress values** — each letter has a chip value (Scrabble-ish): common `e a i o n s t`
  = 1, mid `d g l` = 2, spicy `b c m p` = 3, rare `f h v w y` = 4, luxury `j k q x z` = 5.
  Longer + rarer words = bigger chip stacks. (`src/arcade/letterValues.ts`.)
- **MULT** starts at ×1 and **ticks up on every clean word** (+0.2 base, larger for long/fast
  words). No cap — chase ×10, ×20…
- **Scoring event = on word completion:** `gain = wordChips × MULT`, animated as chips tally
  (rising arpeggio) then × mult SLAM into the score. `combo` (clean-word streak) increments.
- **Speed bonus:** if a word is typed above a WPM threshold, +bonus chips and an extra mult tick
  — rewards clean *flow*, not just care.
- **Mistake (wrong keystroke):**
  - `MULT = max(1, MULT × 0.5)` (halve, never below 1),
  - the current word forfeits its clean bonus,
  - **−1 heart**, combo resets,
  - trigger the "break" juice (crack SFX, red flash, hard shake, crumbling mult number).
- **Hearts (the visual stress/health):** start with **3 hearts**; a clean streak of 15 words
  restores one (cap 3). **0 hearts ends the run** — even in timed modes, so a bad patch has real
  stakes. Hearts **beat faster/glow hotter as MULT climbs** (visual tension).
- **Modes:** `Sprint 30s`, `Sprint 60s`, `Endless` (runs until hearts hit 0). Final score = the
  big number; a "cash out" summary + local high-score table.

---

## Juice spec (where "video-worthy" is won)
Built with Framer Motion + CSS + a lightweight canvas/particle layer + WebAudio (extend v1's
`src/lib/sound.ts`).
- **Growing number:** the score uses a fast spring count-up that *overshoots + settles*, scaling
  up briefly on each gain; floating `+247`-style combat text drifts off each scored word.
- **Screen shake** proportional to `gain` (small taps → tiny; a ×12 monster word → violent).
- **Escalating tension by MULT tier:** rising audio pitch per combo step, a deepening vignette,
  paper tint drifting toward hot vermilion, a subtle zoom-in, quickening heartbeat SFX.
- **The break:** on mistake — glass-crack, red screen flash, hard shake, the MULT digits
  physically crumble/fall, heart shatters.
- **Particles:** ink-fleck bursts on big words / mult milestones; confetti of tiny glyphs at
  new personal bests.
- **Milestone callouts:** punchy stamped labels at ×5 / ×10 / ×15 ("ON FIRE", "INKED", etc.).
- All gated behind `prefers-reduced-motion` (calmer fallback) and the existing sound toggle.

---

## Reuse from v1 (don't rebuild)
- `src/engine/TypingEngine.ts` — text/cursor/correctness + keystroke timing stream.
- `src/engine/textGen.ts` + `src/lib/content.ts` — word generation & multilanguage word lists.
- `src/lib/sound.ts` — extend with arcade SFX (arpeggio step, crack, heartbeat, cash-out).
- `src/components/Keyboard/*`, themes/tokens in `src/index.css`, `useSettings` store, Dexie `db`.

## New files (planned)
```
src/arcade/
  letterValues.ts        # chip value per letter
  scoring.ts             # pure scoring fns (word chips, mult step, speed bonus) + unit tests
  useInkRush.ts          # game hook: wraps TypingEngine, owns score/mult/hearts/combo/events
src/components/Arcade/
  ArcadeStage.tsx        # the typing surface, arcade-styled (bigger, hotter)
  ScoreHUD.tsx           # animated score, MULT meter, hearts, combo, timer
  MultMeter.tsx          # the fragile multiplier, tension states
  Hearts.tsx             # reactive heart/health visual
  JuiceLayer.tsx         # screen shake, floating numbers, particles, flashes
  CashOut.tsx            # end-of-run summary + local high scores
src/pages/ArcadePage.tsx # mode select (30/60/endless) + run orchestration
```
- Persistence: add an `arcadeScores` table to `src/lib/db.ts` (score, mode, mult peak, language,
  date) + best-score helpers.
- Nav: add "Arcade" route/link in `src/components/Chrome/Header.tsx` and `src/App.tsx`.
- Scoring is **pure and unit-tested** (like the v1 engine): chip totals, mult steps, halving,
  heart transitions, speed bonus.

## Build order
1. `letterValues.ts` + `scoring.ts` (pure) **+ vitest tests**.
2. `useInkRush.ts` game hook on top of `TypingEngine`.
3. `ArcadePage` + `ArcadeStage` + basic `ScoreHUD` — playable, no juice yet.
4. `MultMeter` + `Hearts` with reactive states.
5. `JuiceLayer`: count-up, shake, floating numbers, break effect, milestone stamps.
6. Audio: arpeggio-by-combo, crack, heartbeat, cash-out flourish.
7. `CashOut` + `arcadeScores` persistence + high-score table.
8. Tension polish (vignette/tint/zoom by mult tier), reduced-motion fallback, mobile check.

## Deferred to v2.1 (roguelite layer)
- **Quills** (Joker-equivalent passive modifiers), **Pages/blinds** with escalating target
  scores, a **shop** to spend earned ink, **boss pages** with gimmicks (fog/blur, shrinking
  time). Designed to sit on top of the same scoring core.

## Verification
- `npx vitest run` — new scoring unit tests + existing engine tests all green.
- `npx tsc -b` clean, `npm run build` bundles.
- Manual: play each mode; confirm mult climbs on clean words, **halves + costs a heart** on
  mistakes, hearts deplete → run ends, score count-up/shake/audio escalate, cash-out saves a
  high score that persists across refresh. Verify calm fallback under reduced-motion.
- Confirm v1 Practice modes are untouched.
