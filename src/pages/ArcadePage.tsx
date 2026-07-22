import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { ArcadeStage } from '../components/Arcade/ArcadeStage';
import { ScoreHUD } from '../components/Arcade/ScoreHUD';
import { CashOut } from '../components/Arcade/CashOut';
import { JuiceLayer, type JuiceHandle } from '../components/Arcade/JuiceLayer';
import { AnthologyRun } from './AnthologyPage';
import {
  ARCADE_MODES,
  type ArcadeMode,
  type MistakeEvent,
  type RunSummary,
  type RushConfig,
  type ScoreEvent,
  useInkRush,
} from '../arcade/useInkRush';
import { tensionTier } from '../arcade/scoring';
import { useSettings } from '../store/settings';
import { Backdrop, useBackdropClass } from '../components/Backdrop/Backdrop';
import { t } from '../i18n/strings';
import { loadWords } from '../lib/content';
import {
  bestArcadeScore,
  getArcadeScores,
  saveArcadeScore,
  type ArcadeRecord,
} from '../lib/db';
import {
  arpeggioStep,
  cashOut as cashOutSfx,
  crack,
  heartbeat,
  sparkle,
  stamp,
} from '../lib/sound';

type Phase = 'menu' | 'playing' | 'over' | 'anthology';

const MILESTONE_LABELS: Record<number, string> = {
  3: 'HEATING UP', 5: 'ON FIRE', 8: 'INKED', 12: 'UNREAL',
  16: 'RAMPAGE', 20: 'LEGENDARY', 30: 'GODLIKE',
};

function prefersReduced() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

export function ArcadePage() {
  const s = useSettings();
  const lang = s.language;
  const backdropClass = useBackdropClass();
  const reduced = useMemo(prefersReduced, []);

  const [phase, setPhase] = useState<Phase>('menu');
  const [mode, setMode] = useState<ArcadeMode>('sprint30');
  const [pool, setPool] = useState<string[]>([]);
  const [bests, setBests] = useState<Record<string, number>>({});

  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [isBest, setIsBest] = useState(false);
  const [scores, setScores] = useState<ArcadeRecord[]>([]);

  const [pulseKey, setPulseKey] = useState(0);
  const [bump, setBump] = useState(0);
  const [broke, setBroke] = useState(false);
  const [focused, setFocused] = useState(false);

  const juiceRef = useRef<JuiceHandle>(null);
  const caretPos = useRef({ x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement>(null);
  const shakeCtl = useAnimationControls();

  useEffect(() => {
    loadWords(lang).then(setPool);
  }, [lang]);

  const refreshBests = useCallback(() => {
    const keys = [...(Object.keys(ARCADE_MODES) as ArcadeMode[]), 'anthology'];
    Promise.all(keys.map((m) => bestArcadeScore(m).then((v) => [m, v] as const))).then(
      (pairs) => setBests(Object.fromEntries(pairs)),
    );
  }, []);
  useEffect(() => {
    refreshBests();
  }, [refreshBests, phase]);

  const config: RushConfig = useMemo(
    () => ({
      seconds: ARCADE_MODES[mode].seconds,
      target: null,
      startHearts: 3,
      maxHearts: 3,
      baseMult: 1,
      wordPool: pool,
      quills: [],
      sound: s.sound,
      soundTheme: s.soundTheme,
    }),
    [mode, pool, s.sound, s.soundTheme],
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
    (_e: MistakeEvent) => {
      if (s.sound) crack();
      juiceRef.current?.break(caretPos.current);
      setBroke(true);
      setPulseKey((n) => n + 1);
      shake(20, 2);
    },
    [s.sound, shake],
  );

  const onOver = useCallback(
    async (sum: RunSummary) => {
      if (s.sound) cashOutSfx();
      const prevBest = await bestArcadeScore(mode);
      await saveArcadeScore({ ...sum, mode }, lang);
      setSummary(sum);
      setIsBest(sum.score > prevBest && sum.score > 0);
      setScores(await getArcadeScores(mode, 8));
      setPhase('over');
    },
    [s.sound, lang, mode],
  );

  const { view, start, onKeyDown, onKeyUp, onBlur: releaseKeys } = useInkRush(config, {
    onScore,
    onMistake,
    onOver,
  });
  const tier = tensionTier(view.mult);

  useEffect(() => {
    if (phase !== 'playing' || tier < 2 || !s.sound || reduced) return;
    const id = window.setInterval(() => heartbeat(tier), Math.max(360, 900 - tier * 140));
    return () => window.clearInterval(id);
  }, [phase, tier, s.sound, reduced]);

  const begin = useCallback(
    (m: ArcadeMode) => {
      setMode(m);
      setPhase('playing');
      setBroke(false);
      setTimeout(() => {
        start();
        stageRef.current?.focus();
      }, 0);
    },
    [start],
  );

  const again = useCallback(() => {
    setPhase('playing');
    setBroke(false);
    setSummary(null);
    setTimeout(() => {
      start();
      stageRef.current?.focus();
    }, 0);
  }, [start]);

  useEffect(() => {
    if (phase !== 'over') return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        again();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [phase, again]);

  if (phase === 'anthology') {
    return <AnthologyRun pool={pool} onExit={() => setPhase('menu')} />;
  }

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

      <AnimatePresence mode="wait">
        {phase === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-2xl mt-10 flex flex-col items-center gap-8 text-center relative z-10"
          >
            <div className="flex flex-col items-center gap-3">
              <span className="eyebrow" style={{ letterSpacing: '0.35em' }}>{t(lang, 'arcade')}</span>
              <h1
                className="font-display font-black leading-none"
                style={{ fontSize: 'clamp(2.6rem, 8vw, 4.5rem)', color: 'rgb(var(--ink))' }}
              >
                Ink&nbsp;Rush
              </h1>
              <p className="font-sans max-w-md" style={{ color: 'rgb(var(--ink-soft))', fontSize: '1rem' }}>
                {t(lang, 'inkRushBlurb')}
              </p>
            </div>

            {/* featured: the roguelite run */}
            <button
              onClick={() => setPhase('anthology')}
              className="group w-full flex items-center justify-between px-6 py-5 rounded-2xl transition-all hover:scale-[1.02] text-left"
              style={{
                background: 'rgb(var(--accent) / 0.1)',
                border: '1.5px solid rgb(var(--accent) / 0.5)',
                boxShadow: '0 12px 30px -14px rgb(var(--accent) / 0.6)',
              }}
            >
              <span className="flex flex-col">
                <span className="font-display font-black" style={{ fontSize: '1.6rem', color: 'rgb(var(--ink))' }}>
                  The Anthology
                </span>
                <span className="font-sans text-sm" style={{ color: 'rgb(var(--ink-soft))' }}>
                  {t(lang, 'anthologySub')}
                </span>
              </span>
              <span className="flex flex-col items-end gap-1">
                <span
                  className="font-sans text-[10px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full"
                  style={{ background: 'rgb(var(--accent))', color: 'rgb(var(--paper))' }}
                >
                  {t(lang, 'newBadge')}
                </span>
                <span className="font-mono text-sm tabular-nums" style={{ color: 'rgb(var(--ink-faint))' }}>
                  {bests['anthology']
                    ? `${t(lang, 'best')} ${bests['anthology'].toLocaleString()}`
                    : '—'}
                </span>
              </span>
            </button>

            <div className="w-full flex flex-col gap-3">
              <span className="eyebrow self-center">{t(lang, 'scoreAttack')}</span>
              {(Object.keys(ARCADE_MODES) as ArcadeMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => begin(m)}
                  className="group flex items-center justify-between px-6 py-5 rounded-2xl transition-all hover:scale-[1.02]"
                  style={{ background: 'rgb(var(--ink) / 0.04)', border: '1px solid rgb(var(--ink) / 0.1)' }}
                >
                  <span className="font-display font-bold" style={{ fontSize: '1.5rem', color: 'rgb(var(--ink))' }}>
                    {ARCADE_MODES[m].label}
                  </span>
                  <span className="font-mono text-sm tabular-nums" style={{ color: 'rgb(var(--ink-faint))' }}>
                    {bests[m]
                      ? `${t(lang, 'best')} ${bests[m].toLocaleString()}`
                      : t(lang, 'noRunsYet')}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {phase === 'playing' && (
          <motion.div
            key="play"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex flex-col items-center relative z-10"
            style={{ paddingTop: '1.5rem' }}
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
                />
              </div>
            </motion.div>
          </motion.div>
        )}

        {phase === 'over' && summary && (
          <motion.div
            key="over"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full mt-10 relative z-10"
          >
            <CashOut
              summary={summary}
              title={ARCADE_MODES[mode].label}
              isBest={isBest}
              scores={scores}
              onAgain={again}
              onMenu={() => setPhase('menu')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
