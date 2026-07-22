import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { ArcadeStage } from '../components/Arcade/ArcadeStage';
import { ScoreHUD } from '../components/Arcade/ScoreHUD';
import { JuiceLayer, type JuiceHandle } from '../components/Arcade/JuiceLayer';
import { QuillPick } from '../components/Arcade/QuillPick';
import { QuillTray } from '../components/Arcade/QuillTray';
import {
  useInkRush,
  type MistakeEvent,
  type RunSummary,
  type RushConfig,
  type ScoreEvent,
} from '../arcade/useInkRush';
import { tensionTier } from '../arcade/scoring';
import {
  QUILLS,
  QUILL_BY_ID,
  quillFlags,
  type Quill,
  type QuillId,
} from '../arcade/quills';
import {
  ANTHOLOGY,
  GIMMICK_INFO,
  HARD_WORDS,
  rollGimmick,
  type Gimmick,
} from '../arcade/anthology';
import { useSettings } from '../store/settings';
import { Backdrop, useBackdropClass } from '../components/Backdrop/Backdrop';
import { t } from '../i18n/strings';
import { bestArcadeScore, saveArcadeScore } from '../lib/db';
import { fmtMult } from '../components/Arcade/MultMeter';
import {
  arpeggioStep,
  cashOut as cashOutSfx,
  crack,
  ding,
  heartbeat,
  sparkle,
  stamp,
} from '../lib/sound';

type Phase = 'intro' | 'playing' | 'pick' | 'won' | 'lost';

const MILESTONE_LABELS: Record<number, string> = {
  3: 'HEATING UP', 5: 'ON FIRE', 8: 'INKED', 12: 'UNREAL',
  16: 'RAMPAGE', 20: 'LEGENDARY', 30: 'GODLIKE',
};

function drawOffer(owned: QuillId[]): Quill[] {
  const avail = QUILLS.filter((q) => !owned.includes(q.id));
  return [...avail].sort(() => Math.random() - 0.5).slice(0, 3);
}

function prefersReduced() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

export function AnthologyRun({ pool, onExit }: { pool: string[]; onExit: () => void }) {
  const s = useSettings();
  const lang = s.language;
  const backdropClass = useBackdropClass();
  const reduced = useMemo(prefersReduced, []);

  const [phase, setPhase] = useState<Phase>('intro');
  const [pageIndex, setPageIndex] = useState(0);
  const [quills, setQuills] = useState<QuillId[]>([]);
  const [runBaseMult, setRunBaseMult] = useState(1);
  const [totalScore, setTotalScore] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [offer, setOffer] = useState<Quill[]>([]);
  const [seed] = useState(() => Math.floor(Math.random() * 3));
  const [lastSummary, setLastSummary] = useState<RunSummary | null>(null);
  const [isBest, setIsBest] = useState(false);

  const [pulseKey, setPulseKey] = useState(0);
  const [bump, setBump] = useState(0);
  const [broke, setBroke] = useState(false);
  const [focused, setFocused] = useState(false);

  const juiceRef = useRef<JuiceHandle>(null);
  const caretPos = useRef({ x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement>(null);
  const shakeCtl = useAnimationControls();
  const totalRef = useRef(0);
  totalRef.current = totalScore;

  const page = ANTHOLOGY[pageIndex];
  const gimmick: Gimmick | null = rollGimmick(pageIndex, seed);
  const flags = quillFlags(quills);
  const maxHearts = 3 + (flags.secondWind ? 2 : 0);
  const startHearts = gimmick === 'featherweight' ? 1 : maxHearts;

  const config: RushConfig = useMemo(
    () => ({
      seconds: page.seconds,
      target: page.target,
      startHearts,
      maxHearts,
      baseMult: runBaseMult,
      wordPool: pool,
      quills,
      hardPool: page.hardWords ? HARD_WORDS : undefined,
      timeScale: gimmick === 'deadline' ? 1.3 : 1,
      sound: s.sound,
      soundTheme: s.soundTheme,
    }),
    [page, startHearts, maxHearts, runBaseMult, pool, quills, gimmick, s.sound, s.soundTheme],
  );

  const shake = useCallback(
    (amp: number, rot = 0) => {
      if (reduced) return;
      const a = Math.min(24, amp);
      shakeCtl.start({
        x: [0, -a, a, -a * 0.6, a * 0.4, 0],
        y: [0, a * 0.4, -a * 0.5, a * 0.3, 0],
        rotate: rot ? [0, -rot, rot, 0] : 0,
        transition: { duration: 0.3, ease: 'easeOut' },
      });
    },
    [reduced, shakeCtl],
  );

  const onScore = useCallback(
    (e: ScoreEvent) => {
      if (s.sound) {
        arpeggioStep(e.combo);
        if (e.fast) sparkle();
      }
      juiceRef.current?.slam(e.gain, caretPos.current, e.fast);
      if (e.golden) {
        juiceRef.current?.milestone('GOLDEN WORD');
        if (s.sound) stamp();
      } else if (e.milestone) {
        juiceRef.current?.milestone(MILESTONE_LABELS[e.milestone] ?? `×${e.milestone}`);
        if (s.sound) stamp();
      }
      setPulseKey((n) => n + 1);
      setBump((n) => n + 1);
      setBroke(false);
      shake(2 + e.gain / 22);
    },
    [s.sound, shake],
  );

  const onMistake = useCallback(
    (e: MistakeEvent) => {
      if (e.forgiven) {
        juiceRef.current?.milestone('SHIELDED');
        return;
      }
      if (s.sound) crack();
      juiceRef.current?.break(caretPos.current);
      setBroke(true);
      setPulseKey((n) => n + 1);
      shake(20, 2);
    },
    [s.sound, shake],
  );

  const saveRun = useCallback(
    async (finalTotal: number, sum: RunSummary) => {
      const prevBest = await bestArcadeScore('anthology');
      await saveArcadeScore(
        {
          score: finalTotal,
          mode: 'anthology',
          peakMult: sum.peakMult,
          words: totalWords + sum.words,
          wpm: sum.wpm,
          accuracy: sum.accuracy,
        },
        lang,
      );
      setIsBest(finalTotal > prevBest && finalTotal > 0);
    },
    [lang, totalWords],
  );

  const onClear = useCallback(
    (sum: RunSummary) => {
      const newTotal = totalRef.current + sum.score;
      setTotalScore(newTotal);
      setTotalWords((w) => w + sum.words);
      setLastSummary(sum);
      if (page.final) {
        if (s.sound) cashOutSfx();
        setPhase('won');
        void saveRun(newTotal, sum);
      } else {
        if (s.sound) ding();
        setOffer(drawOffer(quills));
        setPhase('pick');
      }
    },
    [page.final, quills, s.sound, saveRun],
  );

  const onOver = useCallback(
    (sum: RunSummary) => {
      const newTotal = totalRef.current + sum.score;
      setTotalScore(newTotal);
      setTotalWords((w) => w + sum.words);
      setLastSummary(sum);
      if (s.sound) cashOutSfx();
      setPhase('lost');
      void saveRun(newTotal, sum);
    },
    [s.sound, saveRun],
  );

  const { view, start, onKeyDown, onKeyUp, onBlur: releaseKeys } = useInkRush(config, {
    onScore,
    onMistake,
    onOver,
    onClear,
    onMomentum: (base) => setRunBaseMult(base),
  });

  const tier = tensionTier(view.mult);

  // escalating heartbeat under pressure
  useEffect(() => {
    if (phase !== 'playing' || tier < 2 || !s.sound || reduced) return;
    const id = window.setInterval(() => heartbeat(tier), Math.max(360, 900 - tier * 140));
    return () => window.clearInterval(id);
  }, [phase, tier, s.sound, reduced]);

  const beginPage = useCallback(() => {
    setPhase('playing');
    setBroke(false);
    setTimeout(() => {
      start();
      stageRef.current?.focus();
    }, 0);
  }, [start]);

  // the page intro plays, then the run begins
  useEffect(() => {
    if (phase !== 'intro') return;
    const id = window.setTimeout(beginPage, 1700);
    return () => window.clearTimeout(id);
  }, [phase, beginPage]);

  const pickQuill = useCallback(
    (q: Quill) => {
      setQuills((cur) => [...cur, q.id]);
      setPageIndex((i) => i + 1);
      setPhase('intro');
    },
    [],
  );

  const resetRun = useCallback(() => {
    setPageIndex(0);
    setQuills([]);
    setRunBaseMult(1);
    setTotalScore(0);
    setTotalWords(0);
    setLastSummary(null);
    setPhase('intro');
  }, []);

  // Enter to run again on the end screens
  useEffect(() => {
    if (phase !== 'won' && phase !== 'lost') return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        resetRun();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [phase, resetRun]);

  return (
    <div
      className={`relative flex-1 flex flex-col items-center px-6 pb-16 ${
        backdropClass
      }`}
    >
      <Backdrop />
      <div
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-500"
        style={{
          opacity: phase === 'playing' ? Math.min(1, tier * 0.28) : 0,
          background:
            'radial-gradient(120% 90% at 50% 40%, transparent 40%, rgb(var(--error) / 0.18) 100%)',
        }}
      />
      <JuiceLayer ref={juiceRef} reduced={reduced} />

      {/* run rail: page pips + quills */}
      <div className="w-full max-w-3xl flex items-center justify-between mt-2 mb-4 relative z-10">
        <div className="flex items-center gap-2">
          {ANTHOLOGY.map((p, i) => (
            <div
              key={i}
              title={p.final ? 'final boss' : p.boss ? 'boss page' : `page ${i + 1}`}
              className="grid place-items-center rounded-full transition-all"
              style={{
                width: p.boss ? 14 : 10,
                height: p.boss ? 14 : 10,
                background:
                  i < pageIndex
                    ? 'rgb(var(--accent))'
                    : i === pageIndex
                      ? 'rgb(var(--ink))'
                      : 'rgb(var(--ink) / 0.15)',
                boxShadow: p.final ? '0 0 8px rgb(var(--error) / 0.6)' : undefined,
                border: p.final ? '1px solid rgb(var(--error))' : undefined,
              }}
            />
          ))}
        </div>
        <QuillTray quills={quills} skipReady={view.skipReady} skipRemaining={view.skipRemaining} />
      </div>

      <AnimatePresence mode="wait">
        {phase === 'intro' && page && (
          <motion.div
            key={`intro-${pageIndex}`}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            onClick={beginPage}
            className="flex-1 w-full flex flex-col items-center justify-center gap-5 text-center cursor-pointer relative z-10"
          >
            <span className="eyebrow" style={{ letterSpacing: '0.4em' }}>
              {page.final ? 'final boss' : page.boss ? 'boss page' : `page ${pageIndex + 1} of ${ANTHOLOGY.length}`}
            </span>
            <h2
              className="font-display font-black leading-none"
              style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', color: 'rgb(var(--ink))' }}
            >
              Reach {page.target.toLocaleString()}
            </h2>
            <div className="font-mono text-sm" style={{ color: 'rgb(var(--ink-soft))' }}>
              {page.seconds}s on the clock
            </div>
            {gimmick && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-1 flex flex-col items-center gap-1 px-5 py-3 rounded-xl"
                style={{ background: 'rgb(var(--error) / 0.1)', border: '1px solid rgb(var(--error) / 0.35)' }}
              >
                <span className="font-display font-bold uppercase tracking-wide" style={{ color: 'rgb(var(--error))' }}>
                  {GIMMICK_INFO[gimmick].name}
                </span>
                <span className="font-sans text-sm" style={{ color: 'rgb(var(--ink-soft))' }}>
                  {GIMMICK_INFO[gimmick].desc}
                </span>
              </motion.div>
            )}
            <span className="font-mono text-xs mt-2" style={{ color: 'rgb(var(--ink-faint))' }}>
              starting…
            </span>
          </motion.div>
        )}

        {phase === 'playing' && (
          <motion.div
            key="play"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex flex-col items-center relative z-10"
          >
            <motion.div animate={shakeCtl} className="w-full flex flex-col items-center gap-10">
              <ScoreHUD
                score={view.score}
                mult={view.mult}
                combo={view.combo}
                hearts={view.hearts}
                tier={tier}
                words={view.words}
                remaining={view.remaining}
                pulseKey={pulseKey}
                broke={broke}
                bump={bump}
                target={view.target}
                progress={view.progress}
              />
              <div
                ref={stageRef}
                tabIndex={0}
                onKeyDown={onKeyDown}
                onKeyUp={onKeyUp}
                onFocus={() => setFocused(true)}
                onBlur={() => {
                  releaseKeys();
                  setFocused(false);
                }}
                className="outline-none w-full"
                style={{
                  transform: reduced ? undefined : `scale(${1 + tier * 0.012})`,
                  transition: 'transform 0.5s ease',
                }}
              >
                <ArcadeStage
                  view={view}
                  focused={focused}
                  tier={tier}
                  onClick={() => stageRef.current?.focus()}
                  onCaret={(p) => (caretPos.current = p)}
                  blurUpcoming={gimmick === 'fog'}
                  noHighlight={gimmick === 'silent'}
                />
              </div>
            </motion.div>
          </motion.div>
        )}

        {phase === 'pick' && (
          <motion.div
            key="pick"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full mt-6 relative z-10"
          >
            <QuillPick offer={offer} onPick={pickQuill} />
          </motion.div>
        )}

        {(phase === 'won' || phase === 'lost') && lastSummary && (
          <motion.div
            key="end"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-2xl mx-auto mt-10 flex flex-col items-center gap-7 text-center relative z-10"
          >
            <span className="eyebrow" style={{ letterSpacing: '0.35em' }}>
              {phase === 'won' ? 'the anthology · complete' : `run ended · page ${pageIndex + 1}`}
            </span>
            <h2
              className="font-display font-black leading-none"
              style={{
                fontSize: 'clamp(3rem, 9vw, 5.5rem)',
                color: phase === 'won' ? 'rgb(var(--gold))' : 'rgb(var(--ink))',
                textShadow: phase === 'won' ? '0 0 40px rgb(var(--gold) / 0.4)' : undefined,
              }}
            >
              {phase === 'won' ? 'Bound.' : 'Unfinished.'}
            </h2>
            {isBest && (
              <span
                className="font-display font-black uppercase text-sm px-3 py-1 rounded-full"
                style={{ color: 'rgb(var(--paper))', background: 'rgb(var(--accent))', letterSpacing: '0.15em' }}
              >
                new best
              </span>
            )}
            <div
              className="font-display font-black tabular-nums leading-none"
              style={{ fontSize: 'clamp(3.5rem, 11vw, 6.5rem)', color: 'rgb(var(--ink))' }}
            >
              {totalScore.toLocaleString()}
            </div>
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="flex flex-col items-center gap-1">
                <span className="eyebrow">{t(lang, 'pagesLabel')}</span>
                <span className="font-display font-bold" style={{ fontSize: '1.6rem', color: 'rgb(var(--ink))' }}>
                  {phase === 'won' ? ANTHOLOGY.length : pageIndex}/{ANTHOLOGY.length}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="eyebrow">{t(lang, 'peakMult')}</span>
                <span className="font-display font-bold" style={{ fontSize: '1.6rem', color: 'rgb(var(--ink))' }}>
                  ×{fmtMult(lastSummary.peakMult)}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="eyebrow">{t(lang, 'quillsLabel')}</span>
                <span className="font-display font-bold" style={{ fontSize: '1.6rem', color: 'rgb(var(--ink))' }}>
                  {quills.length}
                </span>
              </div>
            </div>
            {quills.length > 0 && (
              <div className="flex flex-col items-center gap-2">
                <span className="eyebrow">{t(lang, 'yourQuills')}</span>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <QuillTray quills={quills} skipReady />
                </div>
                <span className="font-mono text-xs" style={{ color: 'rgb(var(--ink-faint))' }}>
                  {quills.map((id) => QUILL_BY_ID[id]?.name).join(' · ')}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={resetRun}
                className="px-6 py-2.5 rounded-full font-sans font-semibold text-sm transition-transform hover:scale-[1.03]"
                style={{ background: 'rgb(var(--accent))', color: 'rgb(var(--paper))' }}
              >
                {t(lang, 'newRun')}
              </button>
              <button
                onClick={onExit}
                className="px-6 py-2.5 rounded-full font-sans font-semibold text-sm"
                style={{ border: '1px solid rgb(var(--ink) / 0.2)', color: 'rgb(var(--ink-soft))' }}
              >
                {t(lang, 'backToArcade')}
              </button>
            </div>
            <span className="font-mono text-xs" style={{ color: 'rgb(var(--ink-faint))' }}>
              <kbd className="px-1.5 py-0.5 rounded border" style={{ borderColor: 'rgb(var(--ink) / 0.15)' }}>enter</kbd>{' '}
              {t(lang, 'pressEnterNewRun')}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
