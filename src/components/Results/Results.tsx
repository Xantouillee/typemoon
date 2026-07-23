import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { Difficulty, TestResult } from '../../engine/types';
import { CountUp } from './CountUp';
import { WpmChart } from './WpmChart';
import { Keyboard } from '../Keyboard/Keyboard';
import type { Layout } from '../Keyboard/layouts';
import { ordinal, t, tf } from '../../i18n/strings';
import { toSpeedUnit, type SpeedUnit } from '../../store/settings';
import type { RunVerdict } from '../../lib/db';

interface Props {
  result: TestResult;
  lang: string;
  speedUnit?: SpeedUnit;
  layout: Layout;
  /** how this run stands against your own history; null while it loads */
  verdict?: RunVerdict | null;
  /** the mode this run was typed in, for the verdict sentence */
  modeText?: string;
  /** the run was cut short by Expert/Master, rather than reaching its end */
  failed?: boolean;
  difficulty?: Difficulty;
  onAgain: () => void;
  onNew: () => void;
  newLabel: string;
  /** encoded score query for the share card page; omit to hide the share button */
  shareParams?: string;
}

/**
 * The sentence that turns a number into a result.
 *
 * "68 wpm" says nothing on its own — it is only a good or a bad run relative to
 * the runs behind it, and that history is already sitting in IndexedDB. This is
 * the one line that answers the question everybody actually asks.
 */
function Verdict({
  verdict,
  lang,
  modeText,
  unit,
  wpm,
}: {
  verdict: RunVerdict;
  lang: string;
  modeText: string;
  unit: SpeedUnit;
  wpm: number;
}) {
  const amount = (n: number) => `${toSpeedUnit(Math.abs(n), unit)} ${unit}`;

  let text: string;
  let strong = false;

  if (verdict.first) {
    text = tf(lang, 'verdictFirst', { mode: modeText });
  } else if (verdict.isPersonalBest) {
    strong = true;
    text = tf(lang, 'verdictBest', {
      delta: amount(wpm - verdict.previousBest),
      best: amount(verdict.previousBest),
    });
  } else {
    const rank = tf(lang, 'verdictRank', {
      rank: ordinal(lang, verdict.rank),
      mode: modeText,
    });
    const trend =
      verdict.delta > 0
        ? tf(lang, 'verdictAbove', { delta: amount(verdict.delta) })
        : verdict.delta < 0
          ? tf(lang, 'verdictBelow', { delta: amount(verdict.delta) })
          : t(lang, 'verdictLevel');
    text = `${rank} · ${trend}`;
  }

  return (
    <motion.p
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="font-sans text-[13.5px] mt-2"
      style={{
        color: strong ? 'rgb(var(--accent))' : 'rgb(var(--ink-soft))',
        fontWeight: strong ? 600 : 400,
      }}
    >
      {strong && '★ '}
      {text}
    </motion.p>
  );
}

/**
 * Why the run stopped when it did.
 *
 * Expert and Master end a test mid-sentence. Without this the screen simply
 * appears, seconds early, with no explanation — which reads as a bug rather than
 * as the rule you switched on.
 */
function EndedEarly({ lang, difficulty }: { lang: string; difficulty: Difficulty }) {
  return (
    <motion.div
      variants={item}
      className="flex flex-col gap-0.5 rounded-sm px-4 py-3 mb-6"
      style={{
        background: 'rgb(var(--error) / 0.08)',
        borderLeft: '2.5px solid rgb(var(--error))',
      }}
    >
      <span
        className="font-mono text-[10px] uppercase tracking-[0.18em]"
        style={{ color: 'rgb(var(--error))' }}
      >
        {t(lang, 'endedEarly')}
      </span>
      <span className="font-sans text-[13.5px]" style={{ color: 'rgb(var(--ink))' }}>
        {t(lang, difficulty === 'master' ? 'endedMaster' : 'endedExpert')}
      </span>
      <span className="font-sans text-[12.5px]" style={{ color: 'rgb(var(--ink-faint))' }}>
        {t(lang, 'endedNote')}
      </span>
    </motion.div>
  );
}

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="eyebrow">{label}</span>
      <span
        className="font-display leading-none"
        style={{
          fontSize: '2.1rem',
          color: accent ? 'rgb(var(--accent))' : 'rgb(var(--ink))',
        }}
      >
        {value}
      </span>
    </div>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export function Results({
  result,
  lang,
  speedUnit,
  layout,
  verdict,
  modeText,
  failed,
  difficulty,
  onAgain,
  onNew,
  newLabel,
  shareParams,
}: Props) {
  const slowest = [...result.perKey]
    .sort((a, b) => b.avgLatency + b.errors * 250 - (a.avgLatency + a.errors * 250))
    .slice(0, 5);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="w-full">
      {failed && difficulty && difficulty !== 'normal' && (
        <EndedEarly lang={lang} difficulty={difficulty} />
      )}

      {/* headline */}
      <motion.div variants={item} className="flex items-end justify-between flex-wrap gap-6 mb-8">
        <div>
          <span className="eyebrow">{speedUnit ?? t(lang, 'wpm')}</span>
          <div
            className="font-display font-semibold leading-none"
            style={{ fontSize: 'clamp(4rem, 12vw, 8rem)', color: 'rgb(var(--accent))' }}
          >
            <CountUp value={toSpeedUnit(result.wpm, speedUnit ?? 'wpm')} decimals={speedUnit === 'wps' ? 1 : 0} />
          </div>
          {verdict && (
            <Verdict
              verdict={verdict}
              lang={lang}
              modeText={modeText ?? ''}
              unit={speedUnit ?? 'wpm'}
              wpm={result.wpm}
            />
          )}
        </div>
        <div className="grid grid-cols-3 gap-x-10 gap-y-5">
          <Stat label={t(lang, 'accuracy')} value={<><CountUp value={result.accuracy} decimals={1} delay={150} />%</>} />
          <Stat
            label={t(lang, 'raw')}
            value={
              <CountUp
                value={toSpeedUnit(result.raw, speedUnit ?? 'wpm')}
                decimals={speedUnit === 'wps' ? 1 : 0}
                delay={250}
              />
            }
          />
          <Stat label={t(lang, 'consistency')} value={<><CountUp value={result.consistency} decimals={0} delay={350} />%</>} />
          <Stat label={t(lang, 'time_stat')} value={<>{result.timeSeconds}s</>} />
          <Stat label={t(lang, 'characters')} value={result.charsTyped} />
          <Stat label={t(lang, 'proof')} value={result.incorrectChars === 0 ? '✓' : result.incorrectChars} accent={result.incorrectChars > 0} />
        </div>
      </motion.div>

      {/* chart */}
      <motion.div
        variants={item}
        className="rounded-xl p-4 mb-8"
        style={{ background: 'rgb(var(--ink) / 0.03)', border: '1px solid rgb(var(--ink) / 0.07)' }}
      >
        <WpmChart series={result.series} />
      </motion.div>

      {/* heatmap + actions */}
      <div className="flex flex-wrap items-center justify-between gap-8">
        {slowest.length > 0 && (
          <motion.div variants={item} className="flex flex-col gap-3">
            <span className="eyebrow">{t(lang, 'slowestKeys')}</span>
            <Keyboard layout={layout} activeKey={null} heatmap={result.perKey} />
          </motion.div>
        )}

        <motion.div variants={item} className="flex gap-3 ml-auto">
          {shareParams && (
            <Link
              to={`/score?${shareParams}`}
              className="font-sans text-sm font-semibold px-6 py-3 rounded-full transition-transform hover:-translate-y-0.5 inline-flex items-center gap-2"
              style={{
                background: 'transparent',
                color: 'rgb(var(--accent))',
                border: '1px solid rgb(var(--accent) / 0.4)',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M12 3v13M12 3 8 7M12 3l4 4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" strokeLinecap="round" />
              </svg>
              {t(lang, 'shareScore')}
            </Link>
          )}
          <button
            onClick={onAgain}
            className="font-sans text-sm font-semibold px-6 py-3 rounded-full transition-transform hover:-translate-y-0.5"
            style={{ background: 'rgb(var(--accent))', color: 'rgb(var(--paper))' }}
          >
            {t(lang, 'again')}
          </button>
          <button
            onClick={onNew}
            className="font-sans text-sm font-semibold px-6 py-3 rounded-full transition-transform hover:-translate-y-0.5"
            style={{
              background: 'transparent',
              color: 'rgb(var(--ink))',
              border: '1px solid rgb(var(--ink) / 0.2)',
            }}
          >
            {newLabel}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
