import { useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { decodeScore } from '../lib/share';
import { useSettings, type Mode } from '../store/settings';
import { ScoreCard } from '../components/Share/ScoreCard';
import { ShareBar } from '../components/Share/ShareBar';
import { t } from '../i18n/strings';

/**
 * The landing a shared link opens. It is self-contained — a full-screen sheet
 * with its own minimal bar rather than the app chrome — so it reads the same on
 * a phone as on a desktop, and sharing from the mobile app never dumps anyone
 * onto the desktop navigation. The loud "beat it" button sets the shared run up
 * and sends the visitor into it.
 */
export function ScorePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const s = useSettings();
  const lang = s.language;

  const payload = useMemo(() => decodeScore(params), [params]);

  const goHome = () => {
    const touch = window.matchMedia?.('(pointer: coarse)').matches && window.innerWidth < 820;
    navigate(touch ? '/play' : '/');
  };

  const beatIt = () => {
    if (payload) {
      s.setMode(payload.mode as Mode);
      if (payload.mode === 'time' && payload.val) s.setTimeValue(payload.val);
      if (payload.mode === 'words' && payload.val) s.setWordsValue(payload.val);
      if (payload.lang) s.setLanguage(payload.lang);
    }
    goHome();
  };

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col overflow-y-auto"
      style={{ background: 'rgb(var(--paper))', color: 'rgb(var(--ink))' }}
    >
      {/* minimal bar */}
      <div className="shrink-0 flex items-center justify-between px-5 pt-4 pb-2">
        <Link to="/" className="font-display font-black tracking-tight" style={{ fontSize: '1.2rem' }}>
          Type<span style={{ color: 'rgb(var(--accent))' }}>moon</span>
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        {payload ? (
          <div className="w-full max-w-2xl flex flex-col items-center gap-6">
            <p className="eyebrow">{t(lang, 'canYouBeat')}</p>

            <ScoreCard payload={payload} />

            <button
              onClick={beatIt}
              className="px-8 py-4 rounded-full text-[16px] font-bold shadow-sm"
              style={{ background: 'rgb(var(--accent))', color: 'rgb(var(--paper))' }}
            >
              {t(lang, 'beatIt')} →
            </button>

            <div className="w-full pt-2">
              <ShareBar payload={payload} lang={lang} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <p style={{ color: 'rgb(var(--ink-soft))' }}>{t(lang, 'noScore')}</p>
            <button
              onClick={goHome}
              className="px-6 py-3 rounded-full text-sm font-semibold"
              style={{ background: 'rgb(var(--accent))', color: 'rgb(var(--paper))' }}
            >
              {t(lang, 'startTyping')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
