import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getRuns, summarise, type RunRecord } from '../lib/db';
import { useSettings } from '../store/settings';
import { t } from '../i18n/strings';

function Tile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      className="flex flex-col gap-2 rounded-xl p-5"
      style={{ background: 'rgb(var(--ink) / 0.03)', border: '1px solid rgb(var(--ink) / 0.07)' }}
    >
      <span className="eyebrow">{label}</span>
      <span className="font-display font-semibold leading-none" style={{ fontSize: '2.6rem', color: 'rgb(var(--ink))' }}>
        {value}
      </span>
    </div>
  );
}

function Sparkline({ runs }: { runs: RunRecord[] }) {
  const pts = useMemo(() => {
    const data = [...runs].reverse().slice(-40);
    if (data.length < 2) return null;
    const W = 900;
    const H = 160;
    const max = Math.max(...data.map((r) => r.wpm)) * 1.1;
    const min = Math.min(...data.map((r) => r.wpm)) * 0.9;
    const range = max - min || 1;
    const x = (i: number) => (i / (data.length - 1)) * W;
    const y = (v: number) => H - ((v - min) / range) * H;
    const line = data.map((r, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(r.wpm).toFixed(1)}`).join(' ');
    const area = `${line} L ${W} ${H} L 0 ${H} Z`;
    return { line, area, W, H, dots: data.map((r, i) => ({ x: x(i), y: y(r.wpm) })) };
  }, [runs]);

  if (!pts) return null;
  return (
    <svg viewBox={`0 0 ${pts.W} ${pts.H}`} className="w-full" preserveAspectRatio="none" style={{ height: 160 }}>
      <path d={pts.area} fill="rgb(var(--accent) / 0.08)" />
      <motion.path
        d={pts.line}
        fill="none"
        stroke="rgb(var(--accent))"
        strokeWidth={2}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
    </svg>
  );
}

export function StatsPage() {
  const lang = useSettings((s) => s.language);
  const [runs, setRuns] = useState<RunRecord[] | null>(null);

  useEffect(() => {
    void getRuns().then(setRuns);
  }, []);

  const stats = useMemo(() => summarise(runs ?? []), [runs]);

  if (runs && runs.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <p className="font-display italic" style={{ fontSize: '1.4rem', color: 'rgb(var(--ink-soft))' }}>
          {t(lang, 'noHistory')}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Tile label={t(lang, 'bestWpm')} value={stats.bestWpm} />
        <Tile label={t(lang, 'avgWpm')} value={stats.avgWpm} />
        <Tile label={t(lang, 'avgAcc')} value={<>{stats.avgAcc}%</>} />
        <Tile label={t(lang, 'tests')} value={stats.total} />
      </div>

      {runs && runs.length >= 2 && (
        <div
          className="rounded-xl p-5 mb-10"
          style={{ background: 'rgb(var(--ink) / 0.03)', border: '1px solid rgb(var(--ink) / 0.07)' }}
        >
          <span className="eyebrow">{t(lang, 'wpm')}</span>
          <div className="mt-3">
            <Sparkline runs={runs} />
          </div>
        </div>
      )}

      <div className="flex flex-col divide-y" style={{ borderColor: 'rgb(var(--ink) / 0.08)' }}>
        {(runs ?? []).slice(0, 30).map((r) => (
          <div key={r.id} className="flex items-center justify-between py-3 font-mono text-sm">
            <span className="w-24" style={{ color: 'rgb(var(--ink))' }}>
              <span className="font-display font-semibold" style={{ fontSize: '1.1rem', color: 'rgb(var(--accent))' }}>{r.wpm}</span>
              <span className="ml-1" style={{ color: 'rgb(var(--ink-faint))' }}>{t(lang, 'wpm')}</span>
            </span>
            <span className="flex-1" style={{ color: 'rgb(var(--ink-soft))' }}>{r.mode} · {r.language}</span>
            <span className="w-20 text-right" style={{ color: 'rgb(var(--ink-soft))' }}>{r.accuracy}%</span>
            <span className="w-32 text-right" style={{ color: 'rgb(var(--ink-faint))' }}>
              {new Date(r.date).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
