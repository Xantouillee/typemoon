import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { authRedirectTo, isSupabaseConfigured, supabase } from '../lib/supabase';

export type AuthStatus = 'loading' | 'anon' | 'signed-in';
export type OAuthProvider = 'google' | 'github';

/** The public face of an account — what a leaderboard row shows. */
export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface AuthState {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  /** a friendly error to surface in the account menu, cleared on the next action */
  error: string | null;

  signIn: (provider: OAuthProvider) => Promise<void>;
  signOut: () => Promise<void>;
  /** Rename the account; returns an error message, or null on success. */
  setUsername: (name: string) => Promise<string | null>;
}

/** profile.username ?? provider name ?? email local-part ?? a gentle default. */
export function displayName(user: User | null, profile: Profile | null): string {
  if (profile?.username) return profile.username;
  const m = user?.user_metadata ?? {};
  return (
    (m.full_name as string) ||
    (m.name as string) ||
    (m.user_name as string) ||
    user?.email?.split('@')[0] ||
    'Typist'
  );
}

export function avatarUrl(user: User | null, profile: Profile | null): string | null {
  if (profile?.avatar_url) return profile.avatar_url;
  const m = user?.user_metadata ?? {};
  return (m.avatar_url as string) || (m.picture as string) || null;
}

export const useAuth = create<AuthState>((set, get) => ({
  status: isSupabaseConfigured ? 'loading' : 'anon',
  user: null,
  session: null,
  profile: null,
  error: null,

  signIn: async (provider) => {
    if (!supabase) return;
    set({ error: null });
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: authRedirectTo() },
    });
    if (error) set({ error: error.message });
    // On success the browser navigates away to the provider; nothing else to do.
  },

  signOut: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    set({ status: 'anon', user: null, session: null, profile: null, error: null });
  },

  setUsername: async (name) => {
    const trimmed = name.trim();
    const user = get().user;
    if (!supabase || !user) return 'Not signed in.';
    if (trimmed.length < 2 || trimmed.length > 24) {
      return 'Pick a name of 2–24 characters.';
    }
    const { error } = await supabase
      .from('profiles')
      .update({ username: trimmed })
      .eq('id', user.id);
    if (error) {
      // 23505 = unique_violation: someone already flies that flag.
      return error.code === '23505' ? 'That name is taken.' : error.message;
    }
    set((s) => ({ profile: s.profile ? { ...s.profile, username: trimmed } : s.profile }));
    return null;
  },
}));

/** Read the row the sign-up trigger created for this user (best effort). */
async function loadProfile(user: User): Promise<Profile | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .eq('id', user.id)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

async function adopt(session: Session | null): Promise<void> {
  if (!session?.user) {
    useAuth.setState({ status: 'anon', user: null, session: null, profile: null });
    return;
  }
  const profile = await loadProfile(session.user);
  useAuth.setState({
    status: 'signed-in',
    user: session.user,
    session,
    profile,
  });
}

// Bring any existing session back on load, then follow every change (sign-in,
// sign-out, token refresh, the OAuth redirect landing). Guarded so the app is
// untouched when Supabase is not configured.
if (supabase) {
  void supabase.auth.getSession().then(({ data }) => adopt(data.session));
  supabase.auth.onAuthStateChange((_event, session) => {
    void adopt(session);
  });
}
