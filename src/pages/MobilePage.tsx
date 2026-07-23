import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  useSettings,
  toSpeedUnit,
  modeLabel,
  TIME_VALUES,
  WORD_VALUES,
  type Mode,
} from '../store/settings';
import { useMobileTyping } from '../hooks/useMobileTyping';
import { useViewportHeight } from '../hooks/useViewportHeight';
import { MobileTypingArea } from '../components/Mobile/MobileTypingArea';
import { MobileSettings } from '../components/Mobile/MobileSettings';
import { generateWords, cleanPassage } from '../engine/textGen';
import { buildShareText, buildShareUrl, encodeScore, payloadFromResult } from '../lib/share';
import {
  LANGUAGES,
  loadWords,
  loadPassages,
  dailyPassage,
  randomPassage,
  type Passage,
} from '../lib/content';
import type { TestResult } from '../engine/types';
import { judgeRun, saveRun, type RunVerdict } from '../lib/db';
import { submitScore } from '../lib/leaderboard';
import { ordinal, t, tf } from '../i18n/strings';
import { isSupabaseConfigured } from '../lib/supabase';
import { avatarUrl, displayName, useAuth } from '../store/auth';

// The same five modes the desktop offers, so the phone is at parity.
const MODES: Mode[] = ['time', 'words', 'quote', 'daily', 'zen'];

export function MobilePage() {
  const s = useSettings();
  const lang = s.language;
  const appHeight = useViewportHeight();
  const navigate = useNavigate();
  const { status, user, profile } = useAuth();

  const [target, setTarget] = useState('');
  const [source, setSource] = useState<Passage | null>(null);
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<TestResult | null>(null);
  const [verdict, setVerdict] = useState<RunVerdict | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const timeLimit = s.mode === 'time' ? s.timeValue : undefined;

  // Build the typing target for the current mode: words/time draw from the word
  // pool, quote/daily pull a public-domain passage, zen is a long free run.
  useEffect(() => {
    let alive = true;
    setResult(null);
    setVerdict(null);
    (async () => {
      if (s.mode === 'quote' || s.mode === 'daily') {
        const passages = await loadPassages();
        if (!alive) return;
        const p = s.mode === 'daily' ? dailyPassage(passages, lang) : randomPassage(passages, lang);
        setSource(p);
        setTarget(cleanPassage(p.text));
      } else {
        const words = await loadWords(lang);
        if (!alive) return;
        setSource(null);
        const count =
          s.mode === 'time'
            ? Math.max(120, s.timeValue * 3)
            : s.mode === 'zen'
              ? 60
              : s.wordsValue;
        setTarget(generateWords(words, { count, punctuation: s.punctuation, numbers: s.numbers }));
      }
    })();
    return () => {
      alive = false;
    };
  }, [s.mode, s.timeValue, s.wordsValue, s.punctuation, s.numbers, lang, nonce]);

  const onFinish = useCallback(
    (r: TestResult) => {
      setResult(r);
      if (r.charsTyped === 0) return;
      const mk = modeLabel(s);
      void (async () => {
        // rank before saving so the run does not compete with itself
        setVerdict(await judgeRun(r.wpm, mk, lang));
        await saveRun(r, mk, lang);
      })();
      void submitScore(r, mk, lang);
    },
    [s, lang],
  );

  const typing = useMobileTyping(target, {
    timeLimit,
    sound: s.sound,
    soundTheme: s.soundTheme,
    errorSound: s.errorSound,
    lazy: s.lazy,
    onFinish,
  });

  const newText = useCallback(() => setNonce((n) => n + 1), []);
  const again = useCallback(() => {
    setResult(null);
    setVerdict(null);
    typing.restart();
  }, [typing]);

  // Share stays inside the app: the native sheet (Messenger/Discord/WhatsApp…)
  // opens over the run. Only when the browser has no share API do we fall back
  // to the card page so the link can still be copied.
  const shareRun = useCallback(async () => {
    if (!result) return;
    const val = s.mode === 'time' ? s.timeValue : s.mode === 'words' ? s.wordsValue : undefined;
    const payload = payloadFromResult(result, s.mode, val, lang);
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Typemoon',
          text: buildShareText(payload),
          url: buildShareUrl(window.location.origin + import.meta.env.BASE_URL, payload),
        });
      } catch {
        /* the user dismissed the sheet */
      }
      return;
    }
    navigate(`/score?${encodeScore(payload)}`);
  }, [result, s.mode, s.timeValue, s.wordsValue, lang, navigate]);

  const progress = useMemo(() => {
    if (s.mode !== 'words') return null;
    const done = target.slice(0, typing.snapshot.cursor).split(' ').filter(Boolean).length;
    return `${Math.min(s.wordsValue, done)}/${s.wordsValue}`;
  }, [s.mode, s.wordsValue, target, typing.snapshot.cursor]);

  const liveWpm = toSpeedUnit(typing.snapshot.wpm, s.speedUnit);

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col overflow-hidden"
      style={{
        height: appHeight || undefined,
        background: 'rgb(var(--paper))',
        color: 'rgb(var(--ink))',
      }}
    >
      {/* top bar */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-3 pb-1">
        <Link to="/" className="font-display font-black tracking-tight" style={{ fontSize: '1.15rem' }}>
          Type<span style={{ color: 'rgb(var(--accent))' }}>moon</span>
        </Link>
        <div className="flex items-center gap-1">
          <select
            value={lang}
            onChange={(e) => s.setLanguage(e.target.value)}
            className="bg-transparent text-[13px] font-medium rounded-full px-2 py-1.5 outline-none"
            style={{ color: 'rgb(var(--ink-soft))' }}
            aria-label="language"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} style={{ color: '#000' }}>
                {l.name}
              </option>
            ))}
          </select>
          <button
            onClick={s.toggleSound}
            className="grid place-items-center w-9 h-9 rounded-full"
            style={{ color: s.sound ? 'rgb(var(--ink))' : 'rgb(var(--ink-faint))' }}
            aria-label="toggle sound"
          >
            {s.sound ? <IconSound /> : <IconSoundOff />}
          </button>
          <button
            onClick={s.toggleTheme}
            className="grid place-items-center w-9 h-9 rounded-full"
            style={{ color: 'rgb(var(--ink))' }}
            aria-label="toggle theme"
          >
            {s.theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>
          {isSupabaseConfigured && (
            <button
              onClick={() => setSettingsOpen(true)}
              className="grid place-items-center w-9 h-9 rounded-full overflow-hidden"
              style={{ color: 'rgb(var(--ink))' }}
              aria-label={t(lang, 'account')}
            >
              {status === 'signed-in' ? (
                (() => {
                  const url = avatarUrl(user, profile);
                  const name = displayName(user, profile);
                  return url ? (
                    <img src={url} alt="" width={26} height={26} className="rounded-full object-cover" style={{ width: 26, height: 26 }} />
                  ) : (
                    <span
                      className="grid place-items-center rounded-full font-display font-semibold"
                      style={{ width: 26, height: 26, fontSize: 12, background: 'rgb(var(--accent) / 0.15)', color: 'rgb(var(--accent))' }}
                    >
                      {name.charAt(0).toUpperCase()}
                    </span>
                  );
                })()
              ) : (
                <IconUser />
              )}
            </button>
          )}
          <button
            onClick={() => setSettingsOpen(true)}
            className="grid place-items-center w-9 h-9 rounded-full"
            style={{ color: 'rgb(var(--ink))' }}
            aria-label={t(lang, 'settings')}
          >
            <IconGear />
          </button>
        </div>
      </div>

      <MobileSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* mode selector — a category row, then a contextual length row for
          time/words only, so the phone matches desktop without crowding */}
      <div className="shrink-0 px-3 py-2 space-y-1.5">
        <div className="flex items-center justify-center gap-1 overflow-x-auto no-scrollbar">
          {MODES.map((m) => {
            const on = s.mode === m;
            return (
              <button
                key={m}
                onClick={() => s.setMode(m)}
                className="shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium lowercase transition-colors"
                style={{
                  color: on ? 'rgb(var(--paper))' : 'rgb(var(--ink-soft))',
                  background: on ? 'rgb(var(--ink))' : 'rgb(var(--ink) / 0.06)',
                }}
              >
                {t(lang, m)}
              </button>
            );
          })}
        </div>

        {(s.mode === 'time' || s.mode === 'words') && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-1"
          >
            {(s.mode === 'time' ? TIME_VALUES : WORD_VALUES).map((v) => {
              const on = s.mode === 'time' ? s.timeValue === v : s.wordsValue === v;
              return (
                <button
                  key={v}
                  onClick={() => (s.mode === 'time' ? s.setTimeValue(v) : s.setWordsValue(v))}
                  className="px-3.5 py-1 rounded-full text-[13px] font-medium tabular-nums transition-colors"
                  style={{
                    color: on ? 'rgb(var(--paper))' : 'rgb(var(--ink-soft))',
                    background: on ? 'rgb(var(--accent))' : 'rgb(var(--ink) / 0.06)',
                  }}
                >
                  {v}
                </button>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* live readout */}
      <div
        className="shrink-0 flex items-center justify-between px-5 h-8 font-mono text-[13px]"
        style={{ color: 'rgb(var(--ink-soft))' }}
      >
        <span className="tabular-nums truncate pr-3">
          {timeLimit != null && typing.remaining != null ? (
            <span
              className="font-display font-semibold"
              style={{
                fontSize: '1.15rem',
                color: typing.phase === 'running' ? 'rgb(var(--accent))' : 'rgb(var(--ink-soft))',
              }}
            >
              {typing.remaining}s
            </span>
          ) : source ? (
            <span className="italic font-display block truncate" style={{ fontSize: '0.95rem' }}>
              {source.title}
            </span>
          ) : (
            progress
          )}
        </span>
        {typing.phase !== 'ready' && (
          <span className="tabular-nums shrink-0">
            {liveWpm} <span style={{ color: 'rgb(var(--ink-faint))' }}>{s.speedUnit}</span>
          </span>
        )}
      </div>

      {/* the typing panel fills the space that is left above the keyboard */}
      <div className="flex-1 min-h-0 px-3 pb-2 relative">
        <div className="w-full h-full max-w-2xl mx-auto relative">
          <MobileTypingArea
            snapshot={typing.snapshot}
            inputProps={typing.inputProps}
            fontScale={s.fontSize}
            langLabel={t(lang, 'mobileTitle')}
          />

          {/* keyboard dropped mid-run — a hint that a tap brings it back. It is
              pointer-transparent so the tap lands on the input underneath and
              the keyboard rises natively. */}
          {typing.phase === 'running' && !typing.keyboardUp && !result && (
            <div
              className="absolute inset-0 grid place-items-center rounded-2xl pointer-events-none"
              style={{ background: 'rgb(var(--paper) / 0.55)', backdropFilter: 'blur(2px)' }}
            >
              <span
                className="px-4 py-2 rounded-full text-sm font-medium"
                style={{ background: 'rgb(var(--ink) / 0.08)', color: 'rgb(var(--ink))' }}
              >
                {t(lang, 'tapToResume')}
              </span>
            </div>
          )}

          {/* results */}
          <AnimatePresence>
            {result && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 grid place-items-center rounded-2xl px-4"
                style={{ background: 'rgb(var(--paper) / 0.96)' }}
              >
                <div className="text-center w-full">
                  <div
                    className="font-display font-black leading-none"
                    style={{ fontSize: 'clamp(3.5rem, 22vw, 6rem)', color: 'rgb(var(--accent))' }}
                  >
                    {toSpeedUnit(result.wpm, s.speedUnit)}
                  </div>
                  <div className="eyebrow mt-1">{s.speedUnit}</div>

                  <div
                    className="flex items-center justify-center gap-6 mt-5 font-mono text-sm"
                    style={{ color: 'rgb(var(--ink-soft))' }}
                  >
                    <span>
                      <span style={{ color: 'rgb(var(--ink))' }}>{result.accuracy}%</span>{' '}
                      {t(lang, 'accuracy')}
                    </span>
                    <span>
                      <span style={{ color: 'rgb(var(--ink))' }}>{result.timeSeconds}s</span>{' '}
                      {t(lang, 'time')}
                    </span>
                  </div>

                  {verdict && (
                    <p className="mt-4 text-[13px] px-2" style={{ color: 'rgb(var(--ink-soft))' }}>
                      {verdictText(verdict, lang, modeLabel(s), s.speedUnit, result.wpm)}
                    </p>
                  )}

                  <div className="flex items-center justify-center gap-2.5 mt-7">
                    <button
                      onClick={again}
                      className="px-6 py-3 rounded-full text-sm font-semibold"
                      style={{ background: 'rgb(var(--accent))', color: 'rgb(var(--paper))' }}
                    >
                      {t(lang, 'again')}
                    </button>
                    <button
                      onClick={newText}
                      className="px-6 py-3 rounded-full text-sm font-semibold"
                      style={{ background: 'rgb(var(--ink) / 0.08)', color: 'rgb(var(--ink))' }}
                    >
                      {t(lang, 'newTest')}
                    </button>
                  </div>

                  <button
                    onClick={shareRun}
                    className="mt-3 px-6 py-2.5 rounded-full text-sm font-semibold inline-flex items-center gap-2"
                    style={{
                      background: 'transparent',
                      color: 'rgb(var(--accent))',
                      border: '1px solid rgb(var(--accent) / 0.4)',
                    }}
                  >
                    <IconShareSmall /> {t(lang, 'shareScore')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* controls */}
      <div
        className="shrink-0 flex items-center justify-center gap-2.5 px-4 pt-2"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
      >
        {!result && typing.phase === 'ready' && (
          <>
            <button
              onClick={typing.start}
              className="flex-1 max-w-xs py-3.5 rounded-full text-[15px] font-semibold"
              style={{ background: 'rgb(var(--accent))', color: 'rgb(var(--paper))' }}
            >
              {t(lang, 'startTyping')}
            </button>
            <button
              onClick={newText}
              className="py-3.5 px-5 rounded-full text-[15px] font-medium"
              style={{ background: 'rgb(var(--ink) / 0.06)', color: 'rgb(var(--ink-soft))' }}
              aria-label={t(lang, 'newWords')}
            >
              <IconShuffle />
            </button>
          </>
        )}
        {!result && typing.phase === 'running' && (
          <>
            <button
              onClick={typing.restart}
              className="flex-1 max-w-[10rem] py-3.5 rounded-full text-[15px] font-medium"
              style={{ background: 'rgb(var(--ink) / 0.06)', color: 'rgb(var(--ink))' }}
            >
              {t(lang, 'restart')}
            </button>
            <button
              onClick={typing.stop}
              className="flex-1 max-w-[10rem] py-3.5 rounded-full text-[15px] font-semibold"
              style={{ background: 'rgb(var(--accent))', color: 'rgb(var(--paper))' }}
            >
              {t(lang, 'stopRun')}
            </button>
          </>
        )}
        {!result && typing.phase === 'ready' && (
          <span className="sr-only">{t(lang, 'tapToStart')}</span>
        )}
      </div>
    </div>
  );
}

/** Compact verdict sentence, mirroring the desktop Results logic. */
function verdictText(
  v: RunVerdict,
  lang: string,
  modeText: string,
  unit: 'wpm' | 'cpm' | 'wps',
  wpm: number,
): string {
  const amount = (n: number) => `${toSpeedUnit(Math.abs(n), unit)} ${unit}`;
  if (v.first) return tf(lang, 'verdictFirst', { mode: modeText });
  if (v.isPersonalBest)
    return tf(lang, 'verdictBest', {
      delta: amount(wpm - v.previousBest),
      best: amount(v.previousBest),
    });
  const rank = tf(lang, 'verdictRank', { rank: ordinal(lang, v.rank), mode: modeText });
  const trend =
    v.delta > 0
      ? tf(lang, 'verdictAbove', { delta: amount(v.delta) })
      : v.delta < 0
        ? tf(lang, 'verdictBelow', { delta: amount(v.delta) })
        : t(lang, 'verdictLevel');
  return `${rank} · ${trend}`;
}

/* --- icons (match the header's hand-drawn line style) --- */
function IconMoon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" fill="currentColor" opacity="0.9" />
    </svg>
  );
}
function IconSun() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconSound() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4 9v6h4l5 4V5L8 9H4Z" strokeLinejoin="round" />
      <path d="M17 8.5a5 5 0 0 1 0 7" strokeLinecap="round" />
    </svg>
  );
}
function IconSoundOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4 9v6h4l5 4V5L8 9H4Z" strokeLinejoin="round" />
      <path d="M16 9.5 21 15M21 9.5 16 15" strokeLinecap="round" />
    </svg>
  );
}
function IconShareSmall() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M12 3v13M12 3 8 7M12 3l4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" strokeLinecap="round" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20a7 7 0 0 1 14 0" strokeLinecap="round" />
    </svg>
  );
}
function IconGear() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3.2" />
      <path
        d="M19.4 15a1.6 1.6 0 0 0 .32 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-1 1.47V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9.1 19.4a1.6 1.6 0 0 0-1.77.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.47-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.47-1.05 1.6 1.6 0 0 0-.32-1.77l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.6 1.6 0 0 0 1.77.32H9a1.6 1.6 0 0 0 1-1.47V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.47 1.6 1.6 0 0 0 1.77-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.6 1.6 0 0 0-.32 1.77V9a1.6 1.6 0 0 0 1.47 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.47 1Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconShuffle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 7h4l10 10h4M17 7h4M3 17h4l3-3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 4l3 3-3 3M18 14l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
