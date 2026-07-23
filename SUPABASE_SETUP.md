# Turning on accounts & the global leaderboard

Typemoon stays a no-account, runs-in-your-browser app until you connect a
[Supabase](https://supabase.com) project. Supabase gives you Google/GitHub
sign-in, a Postgres database, and Row-Level Security — on a free tier, callable
straight from the static GitHub Pages site. Nothing else needs deploying.

Until the two environment variables below are set, the leaderboard link hides
itself and everything works exactly as before.

## 1. Create a project

1. Sign in at [supabase.com](https://supabase.com) and **New project** (the free
   tier is plenty to start).
2. Pick a name, a strong database password, and a region near your players.

## 2. Create the tables

Open **SQL Editor → New query**, paste the contents of
[`supabase/schema.sql`](./supabase/schema.sql), and **Run**. It creates the
`profiles` and `scores` tables, the Row-Level-Security policies, a trigger that
mints a profile on sign-up, and the `get_leaderboard` function the app calls. The
script is idempotent — safe to re-run after edits.

## 3. Enable Google and GitHub sign-in

Under **Authentication → Providers**, enable **Google** and **GitHub** and paste
in the OAuth client id/secret each one gives you:

- **Google** — create an OAuth client at
  [console.cloud.google.com](https://console.cloud.google.com/apis/credentials).
- **GitHub** — create an OAuth app at
  [github.com/settings/developers](https://github.com/settings/developers).

For each provider, set the **Authorized redirect URI** to the callback Supabase
shows on that provider's settings page — it looks like
`https://<your-project-ref>.supabase.co/auth/v1/callback`.

Then, under **Authentication → URL Configuration**, add your app's URLs to
**Site URL** and **Redirect URLs** so Supabase will return users to them:

- `http://localhost:5173` (local dev)
- `https://<your-github-username>.github.io/<repo>/` (GitHub Pages)
- your custom domain, once you have one

## 4. Wire the keys into the app

Copy the two values from **Project Settings → API**:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon public** key → `VITE_SUPABASE_ANON_KEY`

Both are safe to ship in a browser bundle — the anon key only ever grants what
your RLS policies allow.

**Local development** — copy `.env.example` to `.env.local` and paste them in:

```bash
cp .env.example .env.local
# then edit .env.local
npm run dev
```

**GitHub Pages** — add them as repository secrets under
**Settings → Secrets and variables → Actions**, named `SUPABASE_URL` and
`SUPABASE_ANON_KEY`. The deploy workflow already reads them into the build; the
next push to `main` ships the leaderboard live.

## How it fits together

- Every finished run is saved locally (as always) **and**, when you are signed
  in, sent to the `scores` table.
- The **History** tab draws your streak, keys tapped, time typed and averages
  from your runs — from this browser when signed out, from the cloud (so it
  follows you between devices) when signed in.
- The **Leaderboard** ranks the best run per player by day / week / month /
  all-time, filterable by mode and language.

## A note on trust

Scores are submitted straight from the browser, so a determined cheater could
POST a fake result. That is fine for friends and an honest launch; when you want
a public, competitive board, add server-side validation (an Edge Function that
re-checks a run before inserting) as the next step. The schema is ready for it —
just move the insert behind a function and tighten the `scores` insert policy.
