# Typemoon 🌙

*A typing practice for people who love words.*

Typemoon is a typing-speed test with a literary soul. Where most typing sites feel like
utilitarian dashboards, Typemoon is built around one metaphor — **ink, paper, and the craft
of writing**:

- ✒️ **A pen-nib caret** that springs between letters with an ink glow.
- 🖊️ **Proofreader's-mark errors** — mistakes get a red editorial underline, not just red text.
- 📖 **The Daily Page** — a fresh passage from a public-domain classic every day (Austen,
  Dickens, Melville, Hugo, Cervantes, Kafka…), the same for everyone.
- 📊 **A colophon-style results reveal** — WPM counts up, your pace is drawn like a
  seismograph, and your slowest keys bloom across the keyboard as a heatmap.
- 🎹 **An interactive keyboard** that lights up as you type (QWERTY / AZERTY / QWERTZ).
- 🌍 **Multilingual** — English, Français, Español, Deutsch (both the text and the interface).
- 🎨 **Two themes** — *Ink on Cream* (light) and *Midnight Ink* (dark).
- 🔊 Optional synthesised typewriter feedback.

Everything runs in your browser. **No account, no server, no tracking** — your history is
saved locally via IndexedDB.

## Modes
`time` · `words` · `quote` · `daily page` · `zen`, with punctuation & numbers toggles.

## Tech
Vite · React · TypeScript · Tailwind CSS · Framer Motion · Zustand · Dexie.

## Develop
```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build → dist/
npx vitest run       # typing-engine unit tests
```

## Refreshing the daily passages
The daily/quote pool lives in `public/passages/pool.json`. Regenerate or extend it from
Project Gutenberg (public domain, no permission required) with:
```bash
npx tsx scripts/build-daily-pool.ts
```

## Roadmap
- **v2** — real-time head-to-head *VS* races (and/or racing a recorded "ghost").
- **v3** — optional accounts, cloud-synced history, and global/daily leaderboards.

---
Passages are sourced from [Project Gutenberg](https://www.gutenberg.org/) and are in the public domain.
