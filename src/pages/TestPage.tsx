import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ModeBar } from '../components/Chrome/ModeBar';
import { TypingArea } from '../components/Typing/TypingArea';
import { Keyboard } from '../components/Keyboard/Keyboard';
import { Results } from '../components/Results/Results';
import { useTypingTest } from '../hooks/useTypingTest';
import { modeLabel, toSpeedUnit, useSettings } from '../store/settings';
import { generateWords, cleanPassage } from '../engine/textGen';
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
import { submitScore, fetchPercentile, type Percentile } from '../lib/leaderboard';
import { encodeScore, payloadFromResult } from '../lib/share';
import { t } from '../i18n/strings';
import { Backdrop, useBackdropClass } from '../components/Backdrop/Backdrop';

export function TestPage() {
  const s = useSettings();
  const lang = s.language;
  const backdropClass = useBackdropClass();
  const layout = useMemo(
    () => LANGUAGES.find((l) => l.code === lang)?.layout ?? 'qwerty',
    [lang],
  );
  const isBook = s.mode === 'quote' || s.mode === 'daily';

  const [target, setTarget] = useState('');
  const [source, setSource] = useState<Passage | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);
  const [verdict, setVerdict] = useState<RunVerdict | null>(null);
  const [percentile, setPercentile] = useState<Percentile | null>(null);
  const [nonce, setNonce] = useState(0);

  // Build the typing target whenever the mode/options change or "new test" fires.
  useEffect(() => {
    let alive = true;
    setResult(null);
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
        setTarget(
          generateWords(words, {
            count,
            punctuation: s.punctuation,
            numbers: s.numbers,
          }),
        );
      }
    })();
    return () => {
      alive = false;
    };
  }, [s.mode, s.timeValue, s.wordsValue, s.punctuation, s.numbers, lang, nonce]);

  const onFinish = useCallback(
    (r: TestResult) => {
      setResult(r);
      setVerdict(null);
      setPercentile(null);
      // A failed run is not an attempt at the mode — it is a run that Expert or
      // Master stopped. Saving it would poison the average it would then be
      // ranked against, so it is neither recorded nor judged.
      if (r.charsTyped === 0 || r.failed) return;
      const mode = modeLabel(s);
      // rank first, save second — otherwise the run competes against itself
      void (async () => {
        setVerdict(await judgeRun(r.wpm, mode, lang));
        await saveRun(r, mode, lang);
      })();
      // The global board: read where the run stands *before* our own insert lands
      // (so it is not measured against itself), then send it up. Both no-op when
      // there is no backend or nobody is signed in.
      void (async () => {
        setPercentile(await fetchPercentile(r.wpm, mode, lang));
        await submitScore(r, mode, lang);
      })();
    },
    [s, lang],
  );

  const timeLimit = s.mode === 'time' ? s.timeValue : undefined;
  const typing = useTypingTest(target, {
    timeLimit,
    sound: s.sound,
    soundTheme: s.soundTheme,
    errorSound: s.errorSound,
    timeWarning: s.timeWarning,
    difficulty: s.difficulty,
    stopOnError: s.stopOnError,
    confidence: s.confidence,
    freedom: s.freedom,
    lazy: s.lazy,
    onFinish,
  });

  const newTest = useCallback(() => setNonce((n) => n + 1), []);

  // Caps lock is only observable from a key event, so watch both edges.
  const [caps, setCaps] = useState(false);
  useEffect(() => {
    if (!s.capsWarning) return setCaps(false);
    const read = (e: KeyboardEvent) => {
      if (typeof e.getModifierState === 'function') setCaps(e.getModifierState('CapsLock'));
    };
    window.addEventListener('keydown', read);
    window.addEventListener('keyup', read);
    return () => {
      window.removeEventListener('keydown', read);
      window.removeEventListener('keyup', read);
    };
  }, [s.capsWarning]);

  // Global shortcuts: Tab restarts, Enter repeats on the results screen.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        setResult(null);
        typing.restart();
      } else if (e.key === 'Enter' && result) {
        e.preventDefault();
        setResult(null);
        typing.restart();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [typing, result]);

  const progress =
    s.mode === 'words'
      ? `${Math.min(
          s.wordsValue,
          target.slice(0, typing.snapshot.cursor).split(' ').length,
        )}/${s.wordsValue}`
      : null;

  return (
    <div className={`relative flex flex-col items-center px-6 pb-16 ${backdropClass}`}>
      <Backdrop />
      <div
        className={`relative z-10 transition-opacity duration-300 ${
          result ? 'opacity-40 pointer-events-none' : ''
        }`}
      >
        <ModeBar />
      </div>

      <div className="relative z-10 w-full max-w-3xl mt-14 min-h-[26rem]">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Results
                result={result}
                lang={lang}
                speedUnit={s.speedUnit}
                layout={layout}
                verdict={verdict}
                percentile={percentile}
                modeText={modeLabel(s)}
                shareParams={
                  result.failed || result.charsTyped === 0
                    ? undefined
                    : encodeScore(
                        payloadFromResult(
                          result,
                          s.mode,
                          s.mode === 'time' ? s.timeValue : s.mode === 'words' ? s.wordsValue : undefined,
                          lang,
                        ),
                      )
                }
                failed={typing.snapshot.failed}
                difficulty={s.difficulty}
                onAgain={() => {
                  setResult(null);
                  typing.restart();
                }}
                onNew={() => {
                  setResult(null);
                  newTest();
                }}
                newLabel={isBook ? t(lang, 'next') : t(lang, 'newTest')}
              />
            </motion.div>
          ) : (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {/* live readout */}
              <div className="flex items-center justify-between mb-6 h-8 font-mono text-sm" style={{ color: 'rgb(var(--ink-soft))' }}>
                <div>
                  {source ? (
                    <span className="italic font-display" style={{ fontSize: '1rem' }}>
                      {source.title} — <span style={{ color: 'rgb(var(--ink-faint))' }}>{source.author}, {source.year}</span>
                    </span>
                  ) : (
                    <span className="eyebrow">{modeLabel(s)}</span>
                  )}
                </div>
                <div className="flex items-center gap-5">
                  {timeLimit != null && typing.remaining != null && (
                    <span
                      className="font-display font-semibold tabular-nums"
                      style={{ fontSize: '1.5rem', color: typing.snapshot.started ? 'rgb(var(--accent))' : 'rgb(var(--ink-soft))' }}
                    >
                      {typing.remaining}
                    </span>
                  )}
                  {progress && <span className="tabular-nums">{progress}</span>}
                  {typing.snapshot.started && (
                    <span className="tabular-nums">
                      {toSpeedUnit(typing.snapshot.wpm, s.speedUnit)}{' '}
                      <span style={{ color: 'rgb(var(--ink-faint))' }}>{s.speedUnit}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* stop-on-error swallows every keystroke until the typo is fixed;
                  without a word of explanation that reads as a frozen page */}
              {typing.snapshot.blocked && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center mb-3"
                >
                  <span
                    className="px-3 py-1 rounded-full font-sans text-[12px]"
                    style={{
                      color: 'rgb(var(--error))',
                      background: 'rgb(var(--error) / 0.1)',
                      border: '1px solid rgb(var(--error) / 0.35)',
                    }}
                  >
                    {t(lang, s.stopOnError === 'word' ? 'blockedWord' : 'blockedLetter')}
                  </span>
                </motion.div>
              )}

              {caps && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center mb-3"
                >
                  <span
                    className="px-3 py-1 rounded-full font-mono text-[11px] uppercase tracking-[0.14em]"
                    style={{
                      color: 'rgb(var(--error))',
                      background: 'rgb(var(--error) / 0.1)',
                      border: '1px solid rgb(var(--error) / 0.35)',
                    }}
                  >
                    caps lock
                  </span>
                </motion.div>
              )}

              <div {...typing.focusProps} className="outline-none">
                <TypingArea
                  snapshot={typing.snapshot}
                  focused={typing.focused}
                  serif={isBook}
                  onClick={typing.focus}
                  hint={t(lang, 'clickToFocus')}
                  caretStyle={s.caretStyle}
                  smoothCaret={s.smoothCaret}
                  highlightMode={s.highlightMode}
                  typedEffect={s.typedEffect}
                  indicateTypos={s.indicateTypos}
                  fontScale={s.fontSize}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* keyboard — hidden on the results screen (its heatmap lives there) */}
      <AnimatePresence>
        {!result && (
          <motion.div
            key="kb"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ delay: 0.1 }}
            className="relative z-10 mt-12"
          >
            <Keyboard layout={layout} activeKey={typing.activeKey} wrongKey={typing.wrongKey} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* footer hint */}
      {!result && (
        <div className="relative z-10 mt-10 flex items-center gap-4 text-[12px] font-sans" style={{ color: 'rgb(var(--ink-faint))' }}>
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 rounded border" style={{ borderColor: 'rgb(var(--ink) / 0.15)' }}>tab</kbd>
            {t(lang, 'restart')}
          </span>
        </div>
      )}
    </div>
  );
}
