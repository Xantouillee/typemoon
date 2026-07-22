import { motion } from 'framer-motion';
import { MULT_MILESTONES } from '../../arcade/scoring';

interface Props {
  mult: number;
  combo: number;
  tier: number;
  /** bump this to replay the "just grew" pulse */
  pulseKey: number;
  broke: boolean;
}

const TIER_COLORS = ['--ink', '--gold', '--accent-2', '--accent', '--error'];

function nextMilestone(mult: number): number {
  for (const m of MULT_MILESTONES) if (m > mult) return m;
  return MULT_MILESTONES[MULT_MILESTONES.length - 1];
}

/** ×3 · ×4.5 · ×12.2 — trims trailing zeros, one decimal once big. */
export function fmtMult(mult: number): string {
  const dp = mult >= 10 ? 1 : 2;
  return mult.toFixed(dp).replace(/\.?0+$/, '');
}

/** The fragile multiplier — nurse it higher; a mistake halves it. */
export function MultMeter({ mult, combo, tier, pulseKey, broke }: Props) {
  const token = TIER_COLORS[Math.min(tier, TIER_COLORS.length - 1)];
  const next = nextMilestone(mult);
  const prev = MULT_MILESTONES.filter((m) => m <= mult).pop() ?? 1;
  const progress = Math.min(1, (mult - prev) / (next - prev));

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <div className="eyebrow" style={{ letterSpacing: '0.3em' }}>
        multiplier
      </div>
      <motion.div
        key={pulseKey}
        initial={{ scale: 1 }}
        animate={
          broke
            ? { scale: [1.1, 0.9, 1], rotate: [0, -3, 3, 0], y: [0, 4, 0] }
            : { scale: [1.35, 1] }
        }
        transition={{ duration: broke ? 0.4 : 0.28, ease: 'easeOut' }}
        className="font-display font-black tabular-nums leading-none"
        style={{
          fontSize: '3.4rem',
          color: `rgb(var(${token}))`,
          textShadow: tier >= 3 ? `0 0 ${8 + tier * 6}px rgb(var(${token}) / 0.5)` : undefined,
        }}
      >
        ×{fmtMult(mult)}
      </motion.div>

      {/* progress toward the next milestone */}
      <div
        className="relative h-1.5 w-40 rounded-full overflow-hidden"
        style={{ background: 'rgb(var(--ink) / 0.1)' }}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 26 }}
          style={{ background: `rgb(var(${token}))` }}
        />
      </div>

      <div
        className="font-mono text-xs tabular-nums"
        style={{ color: 'rgb(var(--ink-faint))' }}
      >
        {combo > 0 ? `${combo} streak · next ×${next}` : `next ×${next}`}
      </div>
    </div>
  );
}
