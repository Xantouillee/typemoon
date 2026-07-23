import { useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { decodeScore } from '../lib/share';
import { useSettings, type Mode } from '../store/settings';
import { ScoreCard } from '../components/Share/ScoreCard';
import { ShareBar } from '../components/Share/ShareBar';
import { t } from '../i18n/strings';

/**
 * The landing a shared link opens: the score card, then a single loud "beat it"
 * button that sets the exact same mode and drops the visitor into a run. This is
 * the loop — the whole reason a score is worth sharing.
 */
export function ScorePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const s = useSettings();
  const lang = s.language;

  const payload = useMemo(() => decodeScore(params), [params]);

  if (!payload) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p style={{ color: 'rgb(var(--ink-soft))' }}>{t(lang, 'noScore')}</p>
        <Link
          to="/"
          className="px-6 py-3 rounded-full text-sm font-semibold"
          style={{ background: 'rgb(var(--accent))', color: 'rgb(var(--paper))' }}
        >
          {t(lang, 'startTyping')}
        </Link>
      </div>
    );
  }

  const beatIt = () => {
    // set up the exact same run, then send them into it
    s.setMode(payload.mode as Mode);
    if (payload.mode === 'time' && payload.val) s.setTimeValue(payload.val);
    if (payload.mode === 'words' && payload.val) s.setWordsValue(payload.val);
    if (payload.lang) s.setLanguage(payload.lang);
    const touch =
      window.matchMedia?.('(pointer: coarse)').matches && window.innerWidth < 820;
    navigate(touch ? '/play' : '/');
  };

  return (
    <div className="flex-1 flex flex-col items-center px-4 pb-16">
      <div className="w-full max-w-2xl flex flex-col items-center gap-6 mt-4">
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
    </div>
  );
}
