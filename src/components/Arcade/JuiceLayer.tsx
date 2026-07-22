import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export interface JuiceHandle {
  slam: (gain: number, pos: { x: number; y: number }, fast: boolean) => void;
  break: (pos?: { x: number; y: number }) => void;
  milestone: (label: string) => void;
}

interface FloatText {
  id: number;
  x: number;
  y: number;
  text: string;
  fast: boolean;
  big: boolean;
}
interface Fleck {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
}
interface Stamp {
  id: number;
  label: string;
}

let seq = 0;

/**
 * The juice overlay: floating combat text, ink-fleck bursts, a break flash and
 * stamped milestone callouts. Driven imperatively via a ref so effects fire the
 * instant a keystroke resolves, independent of React render timing.
 */
export const JuiceLayer = forwardRef<JuiceHandle, { reduced?: boolean }>(
  function JuiceLayer({ reduced }, ref) {
    const [texts, setTexts] = useState<FloatText[]>([]);
    const [flecks, setFlecks] = useState<Fleck[]>([]);
    const [stamps, setStamps] = useState<Stamp[]>([]);
    const [flash, setFlash] = useState(0);

    const burst = useCallback(
      (x: number, y: number, n: number, color: string) => {
        if (reduced) return;
        const items: Fleck[] = [];
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = 40 + Math.random() * 90;
          items.push({
            id: seq++,
            x,
            y,
            dx: Math.cos(a) * r,
            dy: Math.sin(a) * r,
            color,
          });
        }
        setFlecks((f) => [...f, ...items]);
        const ids = new Set(items.map((i) => i.id));
        window.setTimeout(
          () => setFlecks((f) => f.filter((i) => !ids.has(i.id))),
          650,
        );
      },
      [reduced],
    );

    useImperativeHandle(
      ref,
      () => ({
        slam(gain, pos, fast) {
          const id = seq++;
          const big = gain >= 100;
          setTexts((t) => [
            ...t,
            { id, x: pos.x, y: pos.y, text: `+${gain.toLocaleString()}`, fast, big },
          ]);
          window.setTimeout(() => setTexts((t) => t.filter((x) => x.id !== id)), 900);
          if (big) burst(pos.x, pos.y, 14, 'rgb(var(--gold))');
          else if (fast) burst(pos.x, pos.y, 8, 'rgb(var(--accent))');
        },
        break(pos) {
          setFlash((n) => n + 1);
          if (pos) burst(pos.x, pos.y, 16, 'rgb(var(--error))');
        },
        milestone(label) {
          const id = seq++;
          setStamps((s) => [...s, { id, label }]);
          window.setTimeout(() => setStamps((s) => s.filter((x) => x.id !== id)), 1100);
        },
      }),
      [burst],
    );

    return (
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {/* red break flash */}
        <AnimatePresence>
          {flash > 0 && (
            <motion.div
              key={flash}
              className="absolute inset-0"
              style={{ background: 'rgb(var(--error))' }}
              initial={{ opacity: 0.42 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>

        {/* floating combat text */}
        <AnimatePresence>
          {texts.map((t) => (
            <motion.div
              key={t.id}
              className="absolute font-display font-black tabular-nums"
              style={{
                left: t.x,
                top: t.y,
                x: '-50%',
                fontSize: t.big ? '2.6rem' : t.fast ? '1.9rem' : '1.5rem',
                color: t.big
                  ? 'rgb(var(--gold))'
                  : t.fast
                    ? 'rgb(var(--accent))'
                    : 'rgb(var(--ink))',
                textShadow: '0 2px 12px rgb(var(--paper))',
              }}
              initial={{ opacity: 0, y: 0, scale: 0.6 }}
              animate={{ opacity: 1, y: -70, scale: 1 }}
              exit={{ opacity: 0, y: -110 }}
              transition={{ duration: 0.85, ease: 'easeOut' }}
            >
              {t.text}
              {t.fast && <span className="ml-1 text-[0.7em]">⚡</span>}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ink flecks */}
        {flecks.map((f) => (
          <motion.div
            key={f.id}
            className="absolute rounded-full"
            style={{ left: f.x, top: f.y, width: 7, height: 7, background: f.color }}
            initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            animate={{ opacity: 0, scale: 0.2, x: f.dx, y: f.dy }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}

        {/* milestone stamps */}
        <AnimatePresence>
          {stamps.map((s) => (
            <motion.div
              key={s.id}
              className="absolute inset-x-0 top-[26%] grid place-items-center"
              initial={{ opacity: 0, scale: 1.8, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: -6 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 18 }}
            >
              <span
                className="font-display font-black uppercase px-6 py-2"
                style={{
                  fontSize: 'clamp(2rem, 6vw, 3.4rem)',
                  letterSpacing: '0.04em',
                  color: 'rgb(var(--accent))',
                  border: '4px solid rgb(var(--accent))',
                  borderRadius: 8,
                  boxShadow: '0 0 30px rgb(var(--accent) / 0.35)',
                  background: 'rgb(var(--paper) / 0.35)',
                }}
              >
                {s.label}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  },
);
