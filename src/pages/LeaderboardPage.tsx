import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { modeLabel, useSettings } from '../store/settings';
import { useAuth } from '../store/auth';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  fetchLeaderboard,
  PERIODS,
  type LeaderPeriod,
  type LeaderRow,
} from '../lib/leaderboard';
import { LANGUAGES } from '../lib/content';
import { t } from '../i18n/strings';

const PERIOD_KEY: Record<LeaderPeriod, string> = {
  today: 'today',
  week: 'thisWeek',
  month: 'thisMonth',
  all: 'allTime',
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-[12.5px] font-sans font-medium transition-colors whitespace-nowrap"
      style={{
        color: active ? 'rgb(var(--paper))' : 'rgb(var(--ink-soft))',
        background: active ? 'rgb(var(--accent))' : 'rgb(var(--ink) / 0.05)',
      }}
    >
      {children}
    </button>
  );
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return <img src={url} alt="" width={30} height={30} className="rounded-full object-cover" style={{ width: 30, height: 30 }} />;
  }
  return (
    <span
      className="grid place-items-center rounded-full font-display font-semibold"
      style={{ width: 30, height: 30, fontSize: 14, background: 'rgb(var(--accent) / 0.15)', color: 'rgb(var(--accent))' }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function LeaderboardPage() {
  const s = useSettings();
  const lang = s.language;
  const { user } = useAuth();

  const [period, setPeriod] = useState<LeaderPeriod>('all');
  const [allModes, setAllModes] = useState(false);
  const [allLangs, setAllLangs] = useState(false);
  const [rows, setRows] = useState<LeaderRow[] | null>(null);

  const mode = useMemo(() => modeLabel(s), [s]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    setRows(null);
    void fetchLeaderboard(period, allModes ? null : mode, allLangs ? null : lang).then((r) => {
      if (alive) setRows(r);
    });
    return () => {
      alive = false;
    };
  }, [period, mode, lang, allModes, allLangs]);

  if (!isSupabaseConfigured) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <p className="font-display italic" style={{ fontSize: '1.4rem', color: 'rgb(var(--ink-soft))' }}>
          {t(lang, 'leaderboardWarming')}
        </p>
      </div>
    );
  }

  const langName = LANGUAGES.find((l) => l.code === lang)?.name ?? lang;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="font-display font-black tracking-tight" style={{ fontSize: '1.7rem', color: 'rgb(var(--ink))' }}>
          {t(lang, 'leaderboard')}
        </h1>
      </div>

      {/* when */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto">
        {PERIODS.map((p) => (
          <Chip key={p} active={period === p} onClick={() => setPeriod(p)}>
            {t(lang, PERIOD_KEY[p])}
          </Chip>
        ))}
      </div>

      {/* what */}
      <div className="flex gap-1.5 mb-8 overflow-x-auto">
        <Chip active={!allModes} onClick={() => setAllModes(false)}>{mode}</Chip>
        <Chip active={allModes} onClick={() => setAllModes(true)}>{t(lang, 'allModes')}</Chip>
        <span className="w-px h-6 mx-1" style={{ background: 'rgb(var(--ink) / 0.12)' }} />
        <Chip active={!allLangs} onClick={() => setAllLangs(false)}>{langName}</Chip>
        <Chip active={allLangs} onClick={() => setAllLangs(true)}>{t(lang, 'allLangs')}</Chip>
      </div>

      {!user && (
        <div
          className="rounded-xl px-4 py-3 mb-6 text-[13px] font-sans"
          style={{ background: 'rgb(var(--accent) / 0.08)', color: 'rgb(var(--ink-soft))' }}
        >
          {t(lang, 'signInToCompete')}
        </div>
      )}

      {rows === null ? (
        <p className="text-center py-16 font-sans text-sm" style={{ color: 'rgb(var(--ink-faint))' }}>
          …
        </p>
      ) : rows.length === 0 ? (
        <p className="text-center py-16 font-display italic" style={{ fontSize: '1.2rem', color: 'rgb(var(--ink-soft))' }}>
          {t(lang, 'leaderboardEmpty')}
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {rows.map((r, i) => {
            const me = user?.id === r.user_id;
            const top = i < 3;
            return (
              <motion.div
                key={r.user_id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
                className="flex items-center gap-3 rounded-xl px-4 py-2.5"
                style={{
                  background: me ? 'rgb(var(--accent) / 0.1)' : 'rgb(var(--ink) / 0.03)',
                  border: `1px solid rgb(var(--${me ? 'accent' : 'ink'}) / 0.09)`,
                }}
              >
                <span
                  className="w-7 text-center font-display font-semibold"
                  style={{ fontSize: top ? '1.15rem' : '0.95rem', color: top ? 'rgb(var(--accent))' : 'rgb(var(--ink-faint))' }}
                >
                  {i + 1}
                </span>
                <Avatar url={r.avatar_url} name={r.username} />
                <span className="flex-1 min-w-0 truncate font-sans font-medium" style={{ color: 'rgb(var(--ink))' }}>
                  {r.username}
                  {me && <span className="ml-2 text-[11px]" style={{ color: 'rgb(var(--accent))' }}>{t(lang, 'you')}</span>}
                </span>
                {allModes && (
                  <span className="hidden sm:inline text-[11px] font-mono" style={{ color: 'rgb(var(--ink-faint))' }}>
                    {r.mode}
                  </span>
                )}
                <span className="w-16 text-right font-mono text-sm" style={{ color: 'rgb(var(--ink-soft))' }}>
                  {Math.round(r.accuracy)}%
                </span>
                <span className="w-20 text-right">
                  <span className="font-display font-semibold" style={{ fontSize: '1.25rem', color: 'rgb(var(--ink))' }}>
                    {Math.round(r.wpm)}
                  </span>
                  <span className="ml-1 text-[11px]" style={{ color: 'rgb(var(--ink-faint))' }}>{t(lang, 'wpm')}</span>
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
