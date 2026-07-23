import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { avatarUrl, displayName, useAuth } from '../../store/auth';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useSettings } from '../../store/settings';
import { t } from '../../i18n/strings';

function IconGoogle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.5 12.2c0-.7-.06-1.4-.18-2.06H12v3.9h5.9a5.04 5.04 0 0 1-2.19 3.31v2.74h3.54c2.07-1.9 3.25-4.72 3.25-7.89Z" />
      <path fill="#34A853" d="M12 23c2.95 0 5.43-.98 7.24-2.65l-3.54-2.74c-.98.66-2.24 1.05-3.7 1.05-2.85 0-5.26-1.92-6.12-4.5H2.22v2.83A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.88 14.16a6.6 6.6 0 0 1 0-4.32V7H2.22a11 11 0 0 0 0 9.99l3.66-2.83Z" />
      <path fill="#EA4335" d="M12 5.18c1.6 0 3.05.55 4.18 1.63l3.14-3.14A11 11 0 0 0 12 1 11 11 0 0 0 2.22 7l3.66 2.84C6.74 7.1 9.15 5.18 12 5.18Z" />
    </svg>
  );
}

function IconGitHub() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 1.5a10.5 10.5 0 0 0-3.32 20.46c.52.1.71-.23.71-.5v-1.76c-2.9.63-3.52-1.4-3.52-1.4-.47-1.2-1.16-1.52-1.16-1.52-.95-.65.07-.64.07-.64 1.05.07 1.6 1.08 1.6 1.08.94 1.6 2.46 1.14 3.06.87.1-.68.37-1.14.66-1.4-2.32-.27-4.75-1.16-4.75-5.15 0-1.14.4-2.07 1.07-2.8-.1-.27-.46-1.32.1-2.75 0 0 .88-.28 2.88 1.07a9.9 9.9 0 0 1 5.24 0c2-.35 2.87-1.07 2.87-1.07.57 1.43.21 2.48.11 2.75.67.73 1.07 1.66 1.07 2.8 0 4-2.44 4.88-4.76 5.14.37.33.71.97.71 1.96v2.9c0 .28.19.61.72.5A10.5 10.5 0 0 0 12 1.5Z" />
    </svg>
  );
}

/** Avatar image, or a monogram disc when the provider gave us no picture. */
function Avatar({ url, name, size = 26 }: { url: string | null; name: string; size?: number }) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="grid place-items-center rounded-full font-display font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.46,
        background: 'rgb(var(--accent) / 0.15)',
        color: 'rgb(var(--accent))',
      }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function AccountMenu() {
  const lang = useSettings((s) => s.language);
  const { status, user, profile, error, signIn, signOut, setUsername } = useAuth();
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState('');
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  // The leaderboard needs a backend; with none configured there is no account.
  if (!isSupabaseConfigured) return null;

  const name = displayName(user, profile);
  const avatar = avatarUrl(user, profile);
  const signedIn = status === 'signed-in';

  const saveName = async () => {
    const err = await setUsername(draft);
    setSaveErr(err);
    if (!err) setRenaming(false);
  };

  return (
    <div className="relative" ref={wrap}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full transition-colors"
        style={{
          padding: signedIn ? '3px 3px 3px 10px' : '6px 12px',
          background: open ? 'rgb(var(--ink) / 0.06)' : 'transparent',
          color: 'rgb(var(--ink-soft))',
        }}
        aria-label={t(lang, 'account')}
        title={t(lang, 'account')}
      >
        {signedIn ? (
          <>
            <span className="hidden sm:inline text-[13px] font-sans font-medium max-w-[8rem] truncate">
              {name}
            </span>
            <Avatar url={avatar} name={name} />
          </>
        ) : (
          <span className="text-[13px] font-sans font-medium">
            {status === 'loading' ? '…' : t(lang, 'signIn')}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 mt-2 w-72 rounded-2xl p-4 z-40"
            style={{
              background: 'rgb(var(--paper))',
              border: '1px solid rgb(var(--ink) / 0.1)',
              boxShadow: '0 12px 40px rgb(0 0 0 / 0.18)',
            }}
          >
            {signedIn ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Avatar url={avatar} name={name} size={40} />
                  <div className="min-w-0">
                    {renaming ? (
                      <div className="flex flex-col gap-1">
                        <input
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && void saveName()}
                          maxLength={24}
                          autoFocus
                          className="w-full rounded-lg px-2 py-1 text-sm font-sans outline-none"
                          style={{
                            background: 'rgb(var(--ink) / 0.05)',
                            border: '1px solid rgb(var(--ink) / 0.12)',
                            color: 'rgb(var(--ink))',
                          }}
                        />
                        {saveErr && (
                          <span className="text-[11px]" style={{ color: 'rgb(var(--accent))' }}>
                            {saveErr}
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        <div
                          className="font-display font-semibold truncate"
                          style={{ color: 'rgb(var(--ink))' }}
                        >
                          {name}
                        </div>
                        <div className="text-[11px] truncate" style={{ color: 'rgb(var(--ink-faint))' }}>
                          {user?.email}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {renaming ? (
                    <button
                      onClick={() => void saveName()}
                      className="flex-1 rounded-lg py-1.5 text-[12px] font-sans font-semibold"
                      style={{ background: 'rgb(var(--accent))', color: 'rgb(var(--paper))' }}
                    >
                      {t(lang, 'save')}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setDraft(name);
                        setSaveErr(null);
                        setRenaming(true);
                      }}
                      className="flex-1 rounded-lg py-1.5 text-[12px] font-sans font-medium"
                      style={{
                        background: 'rgb(var(--ink) / 0.05)',
                        color: 'rgb(var(--ink-soft))',
                      }}
                    >
                      {t(lang, 'rename')}
                    </button>
                  )}
                  <button
                    onClick={() => void signOut()}
                    className="flex-1 rounded-lg py-1.5 text-[12px] font-sans font-medium"
                    style={{ background: 'rgb(var(--ink) / 0.05)', color: 'rgb(var(--ink-soft))' }}
                  >
                    {t(lang, 'signOut')}
                  </button>
                </div>

                <Link
                  to="/leaderboard"
                  onClick={() => setOpen(false)}
                  className="block text-center rounded-lg py-2 text-[12px] font-sans font-semibold uppercase tracking-wide"
                  style={{ background: 'rgb(var(--accent) / 0.1)', color: 'rgb(var(--accent))' }}
                >
                  {t(lang, 'leaderboard')}
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-[12.5px] font-sans leading-snug" style={{ color: 'rgb(var(--ink-soft))' }}>
                  {t(lang, 'signInBlurb')}
                </p>
                <button
                  onClick={() => void signIn('google')}
                  className="flex items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-sans font-medium"
                  style={{ background: 'rgb(var(--ink) / 0.05)', border: '1px solid rgb(var(--ink) / 0.1)', color: 'rgb(var(--ink))' }}
                >
                  <IconGoogle /> {t(lang, 'continueGoogle')}
                </button>
                <button
                  onClick={() => void signIn('github')}
                  className="flex items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-sans font-medium"
                  style={{ background: 'rgb(var(--ink) / 0.05)', border: '1px solid rgb(var(--ink) / 0.1)', color: 'rgb(var(--ink))' }}
                >
                  <IconGitHub /> {t(lang, 'continueGitHub')}
                </button>
                {error && (
                  <span className="text-[11px]" style={{ color: 'rgb(var(--accent))' }}>
                    {error}
                  </span>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
