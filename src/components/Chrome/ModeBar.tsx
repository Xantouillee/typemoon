import { motion } from 'framer-motion';
import {
  TIME_VALUES,
  WORD_VALUES,
  useSettings,
  type Mode,
} from '../../store/settings';
import { t } from '../../i18n/strings';

const MODES: Mode[] = ['time', 'words', 'quote', 'daily', 'zen'];

/** A segmented-control button with its own sliding highlight (scoped by `groupId`). */
function Seg({
  active,
  onClick,
  groupId,
  accent,
  children,
}: {
  active: boolean;
  onClick: () => void;
  groupId: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="relative px-3 py-1.5 text-[13px] font-sans font-medium rounded-full transition-colors"
      style={{ color: active ? 'rgb(var(--paper))' : 'rgb(var(--ink-soft))' }}
    >
      {active && (
        <motion.span
          layoutId={groupId}
          className="absolute inset-0 rounded-full"
          style={{ background: accent ? 'rgb(var(--accent))' : 'rgb(var(--ink))' }}
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        />
      )}
      <span className="relative z-10 lowercase">{children}</span>
    </button>
  );
}

/** An on/off toggle chip that clearly reads as a switch, not a selector. */
function Toggle({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-sans font-medium rounded-full transition-colors"
      style={{
        color: on ? 'rgb(var(--ink))' : 'rgb(var(--ink-faint))',
        background: on ? 'rgb(var(--accent) / 0.12)' : 'transparent',
        border: `1px solid ${on ? 'rgb(var(--accent) / 0.4)' : 'rgb(var(--ink) / 0.12)'}`,
      }}
    >
      <span
        className="inline-block w-2 h-2 rounded-full transition-colors"
        style={{ background: on ? 'rgb(var(--accent))' : 'rgb(var(--ink) / 0.2)' }}
      />
      <span className="lowercase">{children}</span>
    </button>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="text-[10px] font-sans font-semibold uppercase tracking-[0.18em] mr-0.5 select-none"
        style={{ color: 'rgb(var(--ink-faint))' }}
      >
        {label}
      </span>
      <div
        className="flex items-center gap-0.5 rounded-full px-1 py-1"
        style={{ background: 'rgb(var(--ink) / 0.05)' }}
      >
        {children}
      </div>
    </div>
  );
}

export function ModeBar() {
  const s = useSettings();
  const lang = s.language;
  const hasOptions = s.mode === 'time' || s.mode === 'words' || s.mode === 'zen';

  return (
    <div className="flex flex-col items-center gap-3">
      {/* primary: choose a mode */}
      <Group label={t(lang, 'mode')}>
        {MODES.map((m) => (
          <Seg key={m} groupId="mode-seg" active={s.mode === m} onClick={() => s.setMode(m)}>
            {t(lang, m)}
          </Seg>
        ))}
      </Group>

      {/* contextual second row: length + extras */}
      {(hasOptions || s.mode === 'quote' || s.mode === 'daily') && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          {s.mode === 'time' && (
            <Group label={t(lang, 'time_stat')}>
              {TIME_VALUES.map((v) => (
                <Seg key={v} groupId="len-seg" accent active={s.timeValue === v} onClick={() => s.setTimeValue(v)}>
                  {v}
                </Seg>
              ))}
            </Group>
          )}
          {s.mode === 'words' && (
            <Group label={t(lang, 'words')}>
              {WORD_VALUES.map((v) => (
                <Seg key={v} groupId="len-seg" accent active={s.wordsValue === v} onClick={() => s.setWordsValue(v)}>
                  {v}
                </Seg>
              ))}
            </Group>
          )}
          {hasOptions && (
            <div className="flex items-center gap-2">
              <Toggle on={s.punctuation} onClick={s.togglePunctuation}>
                {t(lang, 'punctuation')}
              </Toggle>
              <Toggle on={s.numbers} onClick={s.toggleNumbers}>
                {t(lang, 'numbers')}
              </Toggle>
            </div>
          )}
          {(s.mode === 'quote' || s.mode === 'daily') && (
            <span
              className="px-3 py-1.5 text-[13px] font-sans italic"
              style={{ color: 'rgb(var(--ink-faint))' }}
            >
              {s.mode === 'daily' ? t(lang, 'todaysPage') : t(lang, 'quote')}
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
}
