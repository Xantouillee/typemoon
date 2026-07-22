import { useEffect, useState } from 'react';
import { animate, motion, useMotionValue } from 'framer-motion';
import { Hearts } from './Hearts';
import { MultMeter } from './MultMeter';

interface Props {
  score: number;
  mult: number;
  combo: number;
  hearts: number;
  tier: number;
  words: number;
  remaining: number | null;
  pulseKey: number;
  broke: boolean;
  bump: number; // increments on each gain to trigger the score scale-pop
  target?: number | null;
  progress?: number | null; // 0..1 toward target (Anthology)
}

/** A live score counter that springs toward its target and overshoots slightly. */
function ScoreNumber({ score, bump, tier }: { score: number; bump: number; tier: number }) {
  const mv = useMotionValue(0);
  const [disp, setDisp] = useState(0);

  useEffect(() => {
    const controls = animate(mv, score, {
      type: 'spring',
      stiffness: 130,
      damping: 15,
      mass: 0.7,
    });
    return () => controls.stop();
  }, [score, mv]);

  useEffect(() => mv.on('change', (v) => setDisp(Math.max(0, Math.round(v)))), [mv]);

  return (
    <motion.div
      key={bump}
      initial={{ scale: 1 }}
      animate={{ scale: [1.09, 1] }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="font-display font-black tabular-nums leading-none"
      style={{
        fontSize: 'clamp(3.5rem, 9vw, 6rem)',
        color: 'rgb(var(--ink))',
        textShadow: tier >= 2 ? `0 0 ${tier * 8}px rgb(var(--accent) / 0.25)` : undefined,
      }}
    >
      {disp.toLocaleString()}
    </motion.div>
  );
}

export function ScoreHUD({
  score,
  mult,
  combo,
  hearts,
  tier,
  words,
  remaining,
  pulseKey,
  broke,
  bump,
  target,
  progress,
}: Props) {
  return (
    <div className="w-full flex flex-col items-center gap-5">
      {/* top row: hearts + timer + words */}
      <div className="w-full max-w-3xl flex items-center justify-between">
        <Hearts hearts={hearts} tier={tier} />
        <div className="flex items-center gap-6 font-mono text-sm tabular-nums" style={{ color: 'rgb(var(--ink-soft))' }}>
          <span>
            {words} <span style={{ color: 'rgb(var(--ink-faint))' }}>words</span>
          </span>
          {remaining != null && (
            <span
              className="font-display font-bold"
              style={{
                fontSize: '1.6rem',
                color: remaining <= 5 ? 'rgb(var(--error))' : 'rgb(var(--ink))',
              }}
            >
              {remaining}s
            </span>
          )}
        </div>
      </div>

      {/* the score */}
      <ScoreNumber score={score} bump={bump} tier={tier} />

      {/* target progress (Anthology pages) */}
      {target != null && progress != null && (
        <div className="w-full max-w-md flex flex-col items-center gap-1.5 -mt-1">
          <div
            className="relative h-2 w-full rounded-full overflow-hidden"
            style={{ background: 'rgb(var(--ink) / 0.1)' }}
          >
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              animate={{ width: `${progress * 100}%` }}
              transition={{ type: 'spring', stiffness: 180, damping: 24 }}
              style={{
                background:
                  progress >= 1 ? 'rgb(var(--gold))' : 'rgb(var(--accent))',
              }}
            />
          </div>
          <div className="font-mono text-xs tabular-nums" style={{ color: 'rgb(var(--ink-faint))' }}>
            target {target.toLocaleString()}
          </div>
        </div>
      )}

      {/* the fragile multiplier */}
      <MultMeter mult={mult} combo={combo} tier={tier} pulseKey={pulseKey} broke={broke} />
    </div>
  );
}
