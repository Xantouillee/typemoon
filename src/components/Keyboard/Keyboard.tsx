import { motion } from 'framer-motion';
import { useMemo } from 'react';
import type { PerKeyStat } from '../../engine/types';
import { LAYOUTS, type Layout } from './layouts';

interface Props {
  layout: Layout;
  activeKey: string | null;
  wrongKey?: boolean;
  heatmap?: PerKeyStat[] | null;
}

/**
 * The interactive keyboard.
 * - While typing: the pressed key lights up (ink or error tint).
 * - After a run: keys bloom into a heatmap of the slowest / most-errored keys.
 */
export function Keyboard({ layout, activeKey, wrongKey, heatmap }: Props) {
  const rows = LAYOUTS[layout];

  const heat = useMemo(() => {
    if (!heatmap?.length) return null;
    const map = new Map<string, number>();
    let max = 0;
    for (const k of heatmap) {
      // weight: latency + heavy penalty per error
      const score = k.avgLatency + k.errors * 250;
      map.set(k.key, score);
      if (score > max) max = score;
    }
    return { map, max: max || 1 };
  }, [heatmap]);

  function heatFor(key: string): number {
    if (!heat) return 0;
    return (heat.map.get(key) ?? 0) / heat.max;
  }

  return (
    <div className="select-none flex flex-col items-center gap-1.5">
      {rows.map((row, ri) => (
        <div
          key={ri}
          className="flex gap-1.5"
          style={{ paddingLeft: ri * 18, paddingRight: ri * 18 }}
        >
          {row.map((key) => {
            const active = activeKey === key;
            const h = heatFor(key);
            return (
              <motion.div
                key={key}
                animate={
                  active
                    ? { y: 2, scale: 0.94 }
                    : { y: 0, scale: 1 }
                }
                transition={{ type: 'spring', stiffness: 900, damping: 30 }}
                className="grid place-items-center rounded-[7px] font-mono text-[13px] font-medium"
                style={{
                  width: 42,
                  height: 42,
                  color: active && wrongKey
                    ? 'rgb(var(--error))'
                    : active
                      ? 'rgb(var(--paper))'
                      : 'rgb(var(--ink-soft))',
                  background: heat
                    ? `rgb(var(--accent) / ${0.06 + h * 0.85})`
                    : active
                      ? wrongKey
                        ? 'rgb(var(--error) / 0.16)'
                        : 'rgb(var(--ink))'
                      : 'rgb(var(--ink) / 0.04)',
                  boxShadow: active
                    ? 'inset 0 2px 4px rgb(var(--ink) / 0.25)'
                    : '0 1px 0 rgb(var(--ink) / 0.10)',
                  border: '1px solid rgb(var(--ink) / 0.08)',
                }}
              >
                {key}
              </motion.div>
            );
          })}
        </div>
      ))}
      {/* space bar */}
      <motion.div
        animate={activeKey === ' ' ? { y: 2, scale: 0.99 } : { y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 900, damping: 30 }}
        className="rounded-[7px] mt-0.5"
        style={{
          width: 320,
          height: 30,
          background:
            activeKey === ' ' ? 'rgb(var(--ink))' : 'rgb(var(--ink) / 0.04)',
          border: '1px solid rgb(var(--ink) / 0.08)',
          boxShadow: '0 1px 0 rgb(var(--ink) / 0.10)',
        }}
      />
    </div>
  );
}
