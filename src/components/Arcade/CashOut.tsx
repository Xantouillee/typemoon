import { motion } from 'framer-motion';
import type { RunSummary } from '../../arcade/useInkRush';
import type { ArcadeRecord } from '../../lib/db';
import { fmtMult } from './MultMeter';

interface Props {
  summary: RunSummary;
  title: string;
  isBest: boolean;
  scores: ArcadeRecord[];
  onAgain: () => void;
  onMenu: () => void;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <motion.div variants={item} className="flex flex-col items-center gap-1">
      <span className="eyebrow">{label}</span>
      <span
        className="font-display font-bold tabular-nums"
        style={{ fontSize: '1.7rem', color: 'rgb(var(--ink))' }}
      >
        {value}
      </span>
    </motion.div>
  );
}

export function CashOut({ summary, title, isBest, scores, onAgain, onMenu }: Props) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8 text-center"
    >
      <motion.div variants={item} className="flex flex-col items-center gap-2">
        <span className="eyebrow" style={{ letterSpacing: '0.35em' }}>
          {title} · cashed out
        </span>
        {isBest && (
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 14 }}
            className="font-display font-black uppercase text-sm px-3 py-1 rounded-full"
            style={{
              color: 'rgb(var(--paper))',
              background: 'rgb(var(--accent))',
              letterSpacing: '0.15em',
            }}
          >
            new best
          </motion.span>
        )}
      </motion.div>

      <motion.div
        variants={item}
        className="font-display font-black tabular-nums leading-none"
        style={{
          fontSize: 'clamp(4rem, 12vw, 7.5rem)',
          color: 'rgb(var(--ink))',
          textShadow: '0 0 40px rgb(var(--accent) / 0.2)',
        }}
      >
        {summary.score.toLocaleString()}
      </motion.div>

      <div className="flex items-center justify-center gap-8 flex-wrap">
        <Stat label="peak mult" value={`×${fmtMult(summary.peakMult)}`} />
        <Stat label="words" value={String(summary.words)} />
        <Stat label="wpm" value={String(summary.wpm)} />
        <Stat label="accuracy" value={`${summary.accuracy}%`} />
      </div>

      {scores.length > 0 && (
        <motion.div variants={item} className="w-full max-w-sm">
          <div className="eyebrow mb-2">best runs · this mode</div>
          <div className="flex flex-col gap-1">
            {scores.slice(0, 5).map((r, i) => (
              <div
                key={r.id ?? i}
                className="flex items-center justify-between font-mono text-sm py-1.5 px-3 rounded-md tabular-nums"
                style={{
                  background:
                    r.score === summary.score && r.date > Date.now() - 8000
                      ? 'rgb(var(--accent) / 0.12)'
                      : 'rgb(var(--ink) / 0.03)',
                  color: 'rgb(var(--ink-soft))',
                }}
              >
                <span style={{ color: 'rgb(var(--ink-faint))' }}>{i + 1}</span>
                <span className="flex-1 text-right mr-4" style={{ color: 'rgb(var(--ink))' }}>
                  {r.score.toLocaleString()}
                </span>
                <span style={{ color: 'rgb(var(--ink-faint))' }}>×{fmtMult(r.peakMult)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div variants={item} className="flex items-center gap-3">
        <button
          onClick={onAgain}
          className="px-6 py-2.5 rounded-full font-sans font-semibold text-sm transition-transform hover:scale-[1.03]"
          style={{ background: 'rgb(var(--accent))', color: 'rgb(var(--paper))' }}
        >
          Run it back
        </button>
        <button
          onClick={onMenu}
          className="px-6 py-2.5 rounded-full font-sans font-semibold text-sm transition-colors"
          style={{ border: '1px solid rgb(var(--ink) / 0.2)', color: 'rgb(var(--ink-soft))' }}
        >
          Change mode
        </button>
      </motion.div>
      <motion.div variants={item} className="font-mono text-xs" style={{ color: 'rgb(var(--ink-faint))' }}>
        press <kbd className="px-1.5 py-0.5 rounded border" style={{ borderColor: 'rgb(var(--ink) / 0.15)' }}>enter</kbd> to run it back
      </motion.div>
    </motion.div>
  );
}
