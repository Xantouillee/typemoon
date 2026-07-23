import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSettings, THEMES, type Theme } from '../../store/settings';
import { SOUND_TIERS, VOICE_META, previewTheme, type SoundThemeId } from '../../lib/sound';
import { t } from '../../i18n/strings';
import { isSupabaseConfigured } from '../../lib/supabase';
import { avatarUrl, displayName, useAuth } from '../../store/auth';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** The three themes shown as a swatch the eye can pick without reading. */
const THEME_SWATCH: Record<Theme, { paper: string; ink: string; accent: string }> = {
  light: { paper: '#F2ECDD', ink: '#201B14', accent: '#BE3D2D' },
  caramel: { paper: '#EACDA6', ink: '#2E1C10', accent: '#B04A1E' },
  dark: { paper: '#191410', ink: '#EDE6D6', accent: '#E06A4F' },
};

/**
 * A bottom-sheet of the settings that matter on a phone: theme, sound and its
 * volume, the keyboard voice (the fun part), a couple of text options and the
 * type size. Everything reads and writes the same store the desktop settings
 * page does, so a choice made here follows you to the desktop and back.
 */
export function MobileSettings({ open, onClose }: Props) {
  const s = useSettings();
  const lang = s.language;
  const { status, user, profile, signIn, signOut, setVisible } = useAuth();
  const signedIn = status === 'signed-in';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* scrim */}
          <div className="absolute inset-0" style={{ background: 'rgb(0 0 0 / 0.35)' }} onClick={onClose} />

          <motion.div
            className="relative rounded-t-3xl overflow-y-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            style={{
              background: 'rgb(var(--paper))',
              maxHeight: '85%',
              boxShadow: '0 -20px 60px -30px rgb(0 0 0 / 0.6)',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.25rem)',
            }}
          >
            {/* grabber + title */}
            <div className="sticky top-0 z-10 px-5 pt-3 pb-3" style={{ background: 'rgb(var(--paper))' }}>
              <div className="mx-auto mb-3 h-1 w-10 rounded-full" style={{ background: 'rgb(var(--ink) / 0.18)' }} />
              <div className="flex items-center justify-between">
                <span className="eyebrow">{t(lang, 'settings')}</span>
                <button
                  onClick={onClose}
                  className="grid place-items-center w-8 h-8 rounded-full"
                  style={{ background: 'rgb(var(--ink) / 0.06)', color: 'rgb(var(--ink))' }}
                  aria-label="close"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="px-5 pb-2 space-y-6">
              {/* GO — the phone's overlay hides the desktop header, so the only
                  way to the other pages lives here */}
              <div className="flex gap-2">
                <NavPill to="/play" label={t(lang, 'practice')} onClose={onClose} />
                <NavPill to="/history" label={t(lang, 'history')} onClose={onClose} />
                {isSupabaseConfigured && (
                  <NavPill to="/leaderboard" label={t(lang, 'leaderboard')} onClose={onClose} />
                )}
              </div>

              {/* ACCOUNT */}
              {isSupabaseConfigured && (
                <Section label={t(lang, 'account')}>
                  {signedIn ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <MiniAvatar url={avatarUrl(user, profile)} name={displayName(user, profile)} />
                        <div className="min-w-0 flex-1">
                          <div className="font-display font-semibold truncate" style={{ color: 'rgb(var(--ink))' }}>
                            {displayName(user, profile)}
                          </div>
                          <div className="text-[11px] truncate" style={{ color: 'rgb(var(--ink-faint))' }}>
                            {user?.email}
                          </div>
                        </div>
                        <button
                          onClick={() => void signOut()}
                          className="px-3 py-1.5 rounded-full text-[12px] font-medium shrink-0"
                          style={{ background: 'rgb(var(--ink) / 0.06)', color: 'rgb(var(--ink-soft))' }}
                        >
                          {t(lang, 'signOut')}
                        </button>
                      </div>
                      {(() => {
                        const visible = profile?.visible ?? true;
                        return (
                          <button
                            onClick={() => void setVisible(!visible)}
                            role="switch"
                            aria-checked={visible}
                            className="flex items-center justify-between gap-3 text-left"
                          >
                            <span className="text-[13px] font-medium" style={{ color: 'rgb(var(--ink-soft))' }}>
                              {t(lang, 'showOnBoard')}
                            </span>
                            <span
                              className="relative shrink-0 rounded-full transition-colors"
                              style={{ width: 40, height: 24, background: visible ? 'rgb(var(--accent))' : 'rgb(var(--ink) / 0.18)' }}
                            >
                              <span
                                className="absolute top-0.5 rounded-full transition-all"
                                style={{ left: visible ? 18 : 2, width: 20, height: 20, background: 'rgb(var(--paper))' }}
                              />
                            </span>
                          </button>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[12.5px] leading-snug" style={{ color: 'rgb(var(--ink-soft))' }}>
                        {t(lang, 'signInBlurb')}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => void signIn('google')}
                          className="flex-1 py-2.5 rounded-xl text-[13px] font-medium"
                          style={{ background: 'rgb(var(--ink) / 0.05)', border: '1px solid rgb(var(--ink) / 0.1)', color: 'rgb(var(--ink))' }}
                        >
                          {t(lang, 'continueGoogle')}
                        </button>
                        <button
                          onClick={() => void signIn('github')}
                          className="flex-1 py-2.5 rounded-xl text-[13px] font-medium"
                          style={{ background: 'rgb(var(--ink) / 0.05)', border: '1px solid rgb(var(--ink) / 0.1)', color: 'rgb(var(--ink))' }}
                        >
                          {t(lang, 'continueGitHub')}
                        </button>
                      </div>
                    </div>
                  )}
                </Section>
              )}

              {/* THEME */}
              <Section label={t(lang, 'theme')}>
                <div className="flex gap-2.5">
                  {THEMES.map((th) => {
                    const on = s.theme === th;
                    const sw = THEME_SWATCH[th];
                    return (
                      <button
                        key={th}
                        onClick={() => s.set('theme', th)}
                        className="flex-1 rounded-xl p-3 flex items-center justify-center gap-1.5 transition-all"
                        style={{
                          background: sw.paper,
                          border: on ? '2px solid rgb(var(--accent))' : '2px solid rgb(var(--ink) / 0.12)',
                          transform: on ? 'scale(1)' : 'scale(0.97)',
                        }}
                        aria-label={th}
                      >
                        <span className="w-4 h-4 rounded-full" style={{ background: sw.ink }} />
                        <span className="w-4 h-4 rounded-full" style={{ background: sw.accent }} />
                      </button>
                    );
                  })}
                </div>
              </Section>

              {/* SOUND + VOLUME */}
              <Section label={t(lang, 'keyboardSound')}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={s.toggleSound}
                    className="px-4 py-2 rounded-full text-[13px] font-semibold shrink-0"
                    style={{
                      background: s.sound ? 'rgb(var(--accent))' : 'rgb(var(--ink) / 0.08)',
                      color: s.sound ? 'rgb(var(--paper))' : 'rgb(var(--ink-soft))',
                    }}
                  >
                    {s.sound ? 'on' : 'off'}
                  </button>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-[11px] shrink-0" style={{ color: 'rgb(var(--ink-faint))' }}>
                      {t(lang, 'volume')}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={s.soundVolume}
                      disabled={!s.sound}
                      onChange={(e) => s.set('soundVolume', Number(e.target.value))}
                      className="flex-1 accent-current"
                      style={{ color: 'rgb(var(--accent))', opacity: s.sound ? 1 : 0.4 }}
                    />
                  </div>
                </div>
              </Section>

              {/* VOICE PICKER */}
              <Section label={t(lang, 'soundVoice')}>
                <div className="space-y-3">
                  {SOUND_TIERS.map((tier) => (
                    <div key={tier.id}>
                      <div className="eyebrow mb-1.5" style={{ fontSize: '0.58rem', opacity: 0.7 }}>
                        {t(lang, `tier_${tier.id}`)}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tier.voices.map((v: SoundThemeId) => {
                          const on = s.soundTheme === v;
                          return (
                            <button
                              key={v}
                              onClick={() => {
                                s.setSoundTheme(v);
                                if (!s.sound) s.toggleSound();
                                previewTheme(v);
                              }}
                              className="px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors"
                              style={{
                                background: on ? 'rgb(var(--accent))' : 'rgb(var(--ink) / 0.06)',
                                color: on ? 'rgb(var(--paper))' : 'rgb(var(--ink))',
                              }}
                            >
                              {VOICE_META[v].name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* TEXT OPTIONS */}
              <Section label={t(lang, 'words')}>
                <div className="flex gap-2.5">
                  <Toggle on={s.punctuation} onClick={s.togglePunctuation} label={t(lang, 'punctuation')} />
                  <Toggle on={s.numbers} onClick={s.toggleNumbers} label={t(lang, 'numbers')} />
                </div>
              </Section>

              {/* TEXT SIZE */}
              <Section label={t(lang, 'textSize')}>
                <input
                  type="range"
                  min={0.85}
                  max={1.35}
                  step={0.05}
                  value={s.fontSize}
                  onChange={(e) => s.set('fontSize', Number(e.target.value))}
                  className="w-full"
                  style={{ accentColor: 'rgb(var(--accent))' }}
                />
              </Section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NavPill({ to, label, onClose }: { to: string; label: string; onClose: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClose}
      className="flex-1 text-center py-2.5 rounded-xl text-[13px] font-sans font-medium transition-colors"
      style={{ background: 'rgb(var(--ink) / 0.05)', color: 'rgb(var(--ink))' }}
    >
      {label}
    </Link>
  );
}

function MiniAvatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return <img src={url} alt="" width={36} height={36} className="rounded-full object-cover shrink-0" style={{ width: 36, height: 36 }} />;
  }
  return (
    <span
      className="grid place-items-center rounded-full font-display font-semibold shrink-0"
      style={{ width: 36, height: 36, fontSize: 16, background: 'rgb(var(--accent) / 0.15)', color: 'rgb(var(--accent))' }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="eyebrow mb-2">{label}</div>
      {children}
    </div>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 px-3 py-2.5 rounded-xl text-[13px] font-medium flex items-center justify-center gap-2 transition-colors"
      style={{
        background: on ? 'rgb(var(--accent) / 0.12)' : 'rgb(var(--ink) / 0.05)',
        color: on ? 'rgb(var(--accent))' : 'rgb(var(--ink-soft))',
        border: on ? '1px solid rgb(var(--accent) / 0.4)' : '1px solid transparent',
      }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ background: on ? 'rgb(var(--accent))' : 'rgb(var(--ink-faint))' }}
      />
      {label}
    </button>
  );
}
