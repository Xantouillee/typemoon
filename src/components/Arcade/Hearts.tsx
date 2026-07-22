import { AnimatePresence, motion } from 'framer-motion';
import { MAX_HEARTS } from '../../arcade/scoring';

interface Props {
  hearts: number;
  /** tension tier 0..4 — hearts beat faster/hotter as it rises */
  tier: number;
}

function HeartShape({ filled, beat }: { filled: boolean; beat: number }) {
  return (
    <motion.svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      animate={
        filled
          ? { scale: [1, 1.18, 1] }
          : { scale: 1 }
      }
      transition={
        filled
          ? { duration: beat, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0.2 }
      }
      style={{ display: 'block' }}
    >
      <path
        d="M12 21s-7.5-4.7-9.6-9.2C1 8.5 2.6 5.5 5.7 5.1c1.9-.2 3.5.9 4.3 2.3.8-1.4 2.4-2.5 4.3-2.3 3.1.4 4.7 3.4 3.3 6.7C19.5 16.3 12 21 12 21Z"
        fill={filled ? 'rgb(var(--error))' : 'transparent'}
        stroke="rgb(var(--error))"
        strokeWidth={filled ? 0 : 1.6}
        opacity={filled ? 1 : 0.35}
      />
    </motion.svg>
  );
}

/** Three hearts — the life/tension gauge. They beat faster as the multiplier climbs. */
export function Hearts({ hearts, tier }: Props) {
  const beat = Math.max(0.34, 1.15 - tier * 0.18); // seconds per beat
  const glow = tier * 5;
  return (
    <div
      className="flex items-center gap-1.5"
      style={{ filter: glow ? `drop-shadow(0 0 ${glow}px rgb(var(--error) / 0.6))` : undefined }}
    >
      <AnimatePresence mode="popLayout">
        {Array.from({ length: MAX_HEARTS }).map((_, i) => {
          const filled = i < hearts;
          return (
            <motion.div
              key={i}
              initial={false}
              animate={
                filled
                  ? {}
                  : { rotate: [0, -12, 10, 0], x: [0, -3, 3, 0] }
              }
              transition={{ duration: 0.35 }}
            >
              <HeartShape filled={filled} beat={beat} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
