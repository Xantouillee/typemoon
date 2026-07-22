import { motion } from 'framer-motion';
import type { TestResult } from '../../engine/types';
import { CountUp } from './CountUp';
import { WpmChart } from './WpmChart';
import { Keyboard } from '../Keyboard/Keyboard';
import type { Layout } from '../Keyboard/layouts';
import { t } from '../../i18n/strings';
import { toSpeedUnit, type SpeedUnit } from '../../store/settings';

interface Props {
  result: TestResult;
  lang: string;
  speedUnit?: SpeedUnit;
  layout: Layout;
  onAgain: () => void;
  onNew: () => void;
  newLabel: string;
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
  onAgain,
  onNew,
  newLabel,
}: Props) {
  const slowest = [...result.perKey]
    .sort((a, b) => b.avgLatency + b.errors * 250 - (a.avgLatency + a.errors * 250))
    .slice(0, 5);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="w-full">
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
