/// <reference types="vite/client" />

// The leaderboard talks to Supabase. Both values are safe to ship in a static
// bundle: the anon key only grants what Row-Level Security allows. When they are
// absent (e.g. a fork building on GitHub Pages without secrets) the whole
// account/leaderboard layer quietly switches off and the app still works.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
