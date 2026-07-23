import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Whether a Supabase project is wired up. Everything account-shaped keys off
 * this: with no config the client is `null`, the leaderboard shows a "warming
 * up" note instead of failing, and Typemoon stays the same no-account,
 * runs-in-your-browser app it has always been.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * A single shared client, or `null` when unconfigured.
 *
 * We use the PKCE flow deliberately: it returns from the OAuth provider with a
 * `?code=` in the query string rather than a `#access_token` in the URL
 * fragment, which matters because Typemoon routes with a HashRouter and the
 * fragment is already spoken for.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null;

/** Where the OAuth provider should send the user back to — the app's own base. */
export function authRedirectTo(): string {
  return window.location.origin + import.meta.env.BASE_URL;
}
