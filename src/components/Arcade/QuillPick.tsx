import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Quill } from '../../arcade/quills';

interface Props {
  offer: Quill[];
  onPick: (q: Quill) => void;
}

const ARCH_TOKEN: Record<string, string> = {
  Economy: '--gold',
  Multiplier: '--accent',
  Survival: '--error',
  Flow: '--accent-2',
};

/** Between-page reward: choose one of three Quills. 1/2/3 select by keyboard. */
export function QuillPick({ offer, onPick }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const i = Number(e.key) - 1;
      if (i >= 0 && i < offer.length) {
        e.preventDefault();
        onPick(offer[i]);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [offer, onPick]);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="eyebrow" style={{ letterSpacing: '0.35em' }}>
          page cleared · choose a quill
        </span>
        <p className="font-mono text-xs" style={{ color: 'rgb(var(--ink-faint))' }}>
          it stacks for the rest of the run
        </p>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5">
        {offer.map((q, i) => {
          const token = ARCH_TOKEN[q.archetype] ?? '--accent';
          return (
            <motion.button
              key={q.id}
              onClick={() => onPick(q)}
              initial={{ opacity: 0, y: 24, rotate: i === 0 ? -2 : i === 2 ? 2 : 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 * i, type: 'spring', stiffness: 260, damping: 20 }}
              whileHover={{ y: -8, scale: 1.03 }}
              className="relative flex flex-col items-center text-center gap-4 p-6 rounded-2xl overflow-hidden"
              style={{
                background: 'rgb(var(--paper-2))',
                border: `1.5px solid rgb(var(${token}) / 0.5)`,
                boxShadow: `0 12px 30px -12px rgb(var(${token}) / 0.4)`,
              }}
            >
              <span
                className="absolute top-3 left-3 font-mono text-xs px-1.5 py-0.5 rounded"
                style={{ color: 'rgb(var(--ink-faint))', border: '1px solid rgb(var(--ink) / 0.15)' }}
              >
                {i + 1}
              </span>
              <span
                className="grid place-items-center w-16 h-16 rounded-full font-display font-black"
                style={{
                  fontSize: '2rem',
                  color: 'rgb(var(--paper))',
                  background: `rgb(var(${token}))`,
                  boxShadow: `0 0 24px rgb(var(${token}) / 0.5)`,
                }}
              >
                {q.glyph}
              </span>
              <div className="flex flex-col gap-1">
                <span
                  className="font-display font-bold"
                  style={{ fontSize: '1.25rem', color: 'rgb(var(--ink))' }}
                >
                  {q.name}
                </span>
                <span
                  className="text-[10px] font-sans font-semibold uppercase tracking-[0.18em]"
                  style={{ color: `rgb(var(${token}))` }}
                >
                  {q.archetype}
                </span>
              </div>
              <p
                className="font-sans text-sm leading-snug"
                style={{ color: 'rgb(var(--ink-soft))' }}
              >
                {q.blurb}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
