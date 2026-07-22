import { Link, useLocation } from 'react-router-dom';
import { LANGUAGES } from '../../lib/content';
import { useSettings } from '../../store/settings';
import { t } from '../../i18n/strings';
import { SoundMenu } from './SoundMenu';

function IconMoon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}
function IconSun() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconGear() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3.2" />
      <path
        d="M19.4 15a1.6 1.6 0 0 0 .32 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-1 1.47V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9.1 19.4a1.6 1.6 0 0 0-1.77.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.47-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.47-1.05 1.6 1.6 0 0 0-.32-1.77l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.6 1.6 0 0 0 1.77.32H9a1.6 1.6 0 0 0 1-1.47V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.47 1.6 1.6 0 0 0 1.77-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.6 1.6 0 0 0-.32 1.77V9a1.6 1.6 0 0 0 1.47 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.47 1Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Header() {
  const s = useSettings();
  const loc = useLocation();
  const lang = s.language;

  return (
    <header className="flex items-center justify-between gap-4 py-6 px-6 md:px-10 relative z-20">
      <Link to="/" className="flex items-baseline gap-2 group">
        <span
          className="font-display font-black tracking-tight"
          style={{ fontSize: '1.5rem', color: 'rgb(var(--ink))' }}
        >
          Type<span style={{ color: 'rgb(var(--accent))' }}>moon</span>
        </span>
        <span className="hidden md:inline text-[11px] font-sans italic" style={{ color: 'rgb(var(--ink-faint))' }}>
          {t(lang, 'tagline')}
        </span>
      </Link>

      <nav className="flex items-center gap-1.5">
        <Link
          to="/"
          className="px-3 py-1.5 rounded-full text-[13px] font-sans font-medium transition-colors"
          style={{
            color: loc.pathname === '/' ? 'rgb(var(--ink))' : 'rgb(var(--ink-soft))',
            background: loc.pathname === '/' ? 'rgb(var(--ink) / 0.06)' : 'transparent',
          }}
        >
          {t(lang, 'practice')}
        </Link>
        <Link
          to="/arcade"
          className="px-3 py-1.5 rounded-full text-[13px] font-sans font-semibold uppercase tracking-wide transition-colors"
          style={{
            color: loc.pathname === '/arcade' ? 'rgb(var(--paper))' : 'rgb(var(--accent))',
            background:
              loc.pathname === '/arcade' ? 'rgb(var(--accent))' : 'rgb(var(--accent) / 0.1)',
            fontSize: '11.5px',
            letterSpacing: '0.08em',
          }}
        >
          {t(lang, 'arcade')}
        </Link>
        <Link
          to="/history"
          className="px-3 py-1.5 rounded-full text-[13px] font-sans font-medium transition-colors"
          style={{
            color: loc.pathname === '/history' ? 'rgb(var(--ink))' : 'rgb(var(--ink-soft))',
            background: loc.pathname === '/history' ? 'rgb(var(--ink) / 0.06)' : 'transparent',
          }}
        >
          {t(lang, 'history')}
        </Link>

        <span className="w-px h-5 mx-1.5" style={{ background: 'rgb(var(--ink) / 0.12)' }} />

        <select
          value={s.language}
          onChange={(e) => s.setLanguage(e.target.value)}
          className="bg-transparent text-[13px] font-sans font-medium rounded-full px-2 py-1.5 cursor-pointer outline-none"
          style={{ color: 'rgb(var(--ink-soft))' }}
          aria-label="language"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} style={{ color: '#000' }}>
              {l.name}
            </option>
          ))}
        </select>

        <Link
          to="/settings"
          className="grid place-items-center w-9 h-9 rounded-full transition-colors"
          style={{
            color: loc.pathname === '/settings' ? 'rgb(var(--ink))' : 'rgb(var(--ink-soft))',
            background: loc.pathname === '/settings' ? 'rgb(var(--ink) / 0.06)' : 'transparent',
          }}
          aria-label={t(lang, 'settings')}
          title={t(lang, 'settings')}
        >
          <IconGear />
        </Link>

        <SoundMenu />

        <button
          onClick={s.toggleTheme}
          className="grid place-items-center w-9 h-9 rounded-full transition-colors"
          style={{ color: 'rgb(var(--ink))' }}
          aria-label="toggle theme"
        >
          {s.theme === 'light' ? <IconMoon /> : <IconSun />}
        </button>
      </nav>
    </header>
  );
}
