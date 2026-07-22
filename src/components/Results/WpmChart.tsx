import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { WpmSample } from '../../engine/types';

interface Props {
  series: WpmSample[];
}

/** WPM-over-time drawn like a seismograph: raw as a faint area, net as an inked line. */
export function WpmChart({ series }: Props) {
  const W = 620;
  const H = 200;
  const pad = { t: 18, r: 12, b: 24, l: 34 };

  const { netPath, rawPath, areaPath, ticks, dots } = useMemo(() => {
    const data = series.length ? series : [{ t: 0, wpm: 0, raw: 0 }];
    const maxRaw = Math.max(20, ...data.map((d) => Math.max(d.wpm, d.raw)));
    const maxY = Math.ceil(maxRaw / 20) * 20;
    const n = data.length;
    const xFor = (i: number) =>
      pad.l + (n <= 1 ? 0 : (i / (n - 1)) * (W - pad.l - pad.r));
    const yFor = (v: number) =>
      H - pad.b - (v / maxY) * (H - pad.t - pad.b);

    const line = (key: 'wpm' | 'raw') =>
      data
        .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yFor(d[key]).toFixed(1)}`)
        .join(' ');

    const netPath = line('wpm');
    const rawPath = line('raw');
    const areaPath =
      `M ${xFor(0)} ${yFor(0)} ` +
      data.map((d, i) => `L ${xFor(i).toFixed(1)} ${yFor(d.raw).toFixed(1)}`).join(' ') +
      ` L ${xFor(n - 1)} ${yFor(0)} Z`;

    const ticks = [0, maxY / 2, maxY].map((v) => ({ v, y: yFor(v) }));
    const dots = data.map((d, i) => ({ x: xFor(i), y: yFor(d.wpm) }));
    return { netPath, rawPath, areaPath, ticks, dots };
  }, [series]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="WPM over time">
      {ticks.map((tk) => (
        <g key={tk.v}>
          <line
            x1={pad.l}
            x2={W - pad.r}
            y1={tk.y}
            y2={tk.y}
            stroke="rgb(var(--ink) / 0.10)"
            strokeDasharray="2 4"
          />
          <text x={4} y={tk.y + 4} fontSize="11" fill="rgb(var(--ink-faint))" fontFamily="IBM Plex Mono">
            {tk.v}
          </text>
        </g>
      ))}
      <path d={areaPath} fill="rgb(var(--accent) / 0.08)" />
      <motion.path
        d={rawPath}
        fill="none"
        stroke="rgb(var(--ink-faint))"
        strokeWidth={1.5}
        strokeDasharray="3 3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
      <motion.path
        d={netPath}
        fill="none"
        stroke="rgb(var(--accent))"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      />
      {dots.map((d, i) => (
        <motion.circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={2.4}
          fill="rgb(var(--accent))"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 + i * 0.02 }}
        />
      ))}
    </svg>
  );
}
