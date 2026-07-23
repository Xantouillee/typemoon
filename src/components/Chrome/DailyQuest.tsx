import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useDaily, useDoneToday, useLiveStreak } from '../../store/daily';
import { tf, t } from '../../i18n/strings';

/** A small hand-drawn flame — on-brand, and no emoji tofu across platforms. */
function Flame({ size = 16, lit = true }: { size?: number; lit?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2c1.4 2.8-1.6 4.3-1.6 7.2 0 1.3.9 2.1 1.8 2.1 1 0 1.7-.7 1.7-1.9 0-.9-.2-1.5.3-2.4 1 1.1 3.3 3 3.3 6.3a5.5 5.5 0 1 1-11 0C6.5 8.9 10.4 7.1 12 2Z"
        fill={lit ? 'rgb(var(--accent))' : 'rgb(var(--ink) / 0.22)'}
      />
      {lit && (
        <path
          d="M12 11.5c.9 1 .3 2.2-.1 3.1-.5 1-.2 2.4 1 2.4 1.5 0 2.4-1.4 2.4-3 0-1.4-.6-2.3-1.2-3.1.2 1.2-.6 2-1.3 2-.6 0-1-.6-.8-1.4Z"
          fill="rgb(var(--paper))"
          fillOpacity="0.55"
        />
      )}
    </svg>
  );
}

/**
 * The pre-run daily banner: your streak, whether today is already done, and a
 * nudge to keep it alive. Shown above the typing surface on the daily page — the
 * thing that turns "type today's passage" into "don't break your streak".
 */
export function DailyStrip({ lang }: { lang: string }) {
  const streak = useLiveStreak();
  const done = useDoneToday();
  const best = useDaily((s) => s.bestStreak);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-full px-4 py-2"
      style={{
        background: streak > 0 ? 'rgb(var(--accent) / 0.08)' : 'rgb(var(--ink) / 0.04)',
        border: `1px solid ${streak > 0 ? 'rgb(var(--accent) / 0.25)' : 'rgb(var(--ink) / 0.1)'}`,
      }}
    >
      <Flame lit={streak > 0} size={18} />
      {streak > 0 ? (
        <span className="font-sans text-[13px] font-semibold" style={{ color: 'rgb(var(--ink))' }}>
          {tf(lang, 'dailyStreakN', { n: streak })}
          {best > streak && (
            <span className="ml-1.5 font-normal" style={{ color: 'rgb(var(--ink-faint))' }}>
              · {tf(lang, 'dailyBestN', { n: best })}
            </span>
          )}
        </span>
      ) : (
        <span className="font-sans text-[13px]" style={{ color: 'rgb(var(--ink-soft))' }}>
          {t(lang, 'dailyStart')}
        </span>
      )}
      {done && (
        <span
          className="ml-1 flex items-center gap-1 font-sans text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: 'rgb(var(--accent))' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
            <path d="M4 12l5 5 11-11" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t(lang, 'dailyDone')}
        </span>
      )}
    </motion.div>
  );
}

/**
 * The post-run stamp on the results screen for a daily run: the streak it earned,
 * a line that either celebrates or asks you back tomorrow, and — when signed in —
 * where you stand on today's shared page.
 */
export function DailyStamp({
  lang,
  rank,
}: {
  lang: string;
  rank: { rank: number; total: number } | null;
}) {
  const streak = useLiveStreak();
  const best = useDaily((s) => s.bestStreak);
  if (streak === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 22 }}
      className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl px-4 py-3 mb-6"
      style={{ background: 'rgb(var(--accent) / 0.08)', border: '1px solid rgb(var(--accent) / 0.22)' }}
    >
      <span className="flex items-center gap-2">
        <Flame size={20} />
        <span className="font-display font-semibold" style={{ fontSize: '1.35rem', color: 'rgb(var(--accent))' }}>
          {tf(lang, 'dailyStreakN', { n: streak })}
        </span>
        {best > streak && (
          <span className="font-sans text-[12px]" style={{ color: 'rgb(var(--ink-faint))' }}>
            {tf(lang, 'dailyBestN', { n: best })}
          </span>
        )}
      </span>

      <span className="font-sans text-[13px]" style={{ color: 'rgb(var(--ink-soft))' }}>
        {streak >= 3 ? tf(lang, 'dailyOnFire', { n: streak }) : t(lang, 'dailyKeep')}
      </span>

      {rank && (
        <Link
          to="/leaderboard"
          className="ml-auto font-sans text-[12px] font-semibold px-3 py-1.5 rounded-full"
          style={{ background: 'rgb(var(--accent))', color: 'rgb(var(--paper))' }}
        >
          {tf(lang, 'dailyRankToday', { rank: rank.rank })}
        </Link>
      )}
    </motion.div>
  );
}
