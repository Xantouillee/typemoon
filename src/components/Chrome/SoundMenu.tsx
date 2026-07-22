import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSettings } from '../../store/settings';
import { t } from '../../i18n/strings';
import { SOUND_TIERS, VOICE_META, previewTheme, type SoundThemeId } from '../../lib/sound';

/** The waveform of a voice, drawn as a tiny signature. */
export function Signature({
  id,
  active,
  w = 46,
  h = 16,
}: {
  id: SoundThemeId;
  active: boolean;
  w?: number;
  h?: number;
}) {
  const fn = VOICE_META[id].wave;
  let d = '';
  for (let i = 0; i <= w; i += 1) {
    const y = h / 2 - fn(i / w) * (h / 2 - 1);
    d += `${i === 0 ? 'M' : 'L'}${i} ${y.toFixed(2)} `;
  }
  return (
    <svg width={w} height={h} className="shrink-0" aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke={active ? 'rgb(var(--accent))' : 'rgb(var(--ink) / 0.45)'}
        strokeWidth="1"
      />
    </svg>
  );
}

export function SoundMenu() {
  const s = useSettings();
  const lang = s.language;
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const pick = (id: SoundThemeId) => {
    s.setSoundTheme(id);
    if (!s.sound) s.toggleSound();
    previewTheme(id);
  };

  return (
    <div className="relative" ref={wrap}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="grid place-items-center w-9 h-9 rounded-full transition-colors"
        style={{
          color: s.sound ? 'rgb(var(--ink))' : 'rgb(var(--ink-faint))',
          background: open ? 'rgb(var(--ink) / 0.06)' : 'transparent',
        }}
        aria-label={t(lang, 'keyboardSound')}
        aria-expanded={open}
        title={t(lang, 'keyboardSound')}
      >
        {s.sound ? '♪' : '·'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 460, damping: 34 }}
            className="absolute right-0 top-11 z-50 w-[18rem] rounded-sm overflow-hidden"
            style={{
              background: 'rgb(var(--paper-2))',
              border: '1px solid rgb(var(--ink) / 0.14)',
              boxShadow: '0 20px 50px -24px rgb(var(--ink) / 0.5)',
            }}
          >
            {/* master switch */}
            <button
              onClick={s.toggleSound}
              className="w-full flex items-center justify-between gap-3 px-3.5 py-3"
              style={{ borderBottom: '1px solid rgb(var(--ink) / 0.1)' }}
            >
              <span
                className="text-[10px] font-sans font-semibold uppercase tracking-[0.18em]"
                style={{ color: 'rgb(var(--ink-faint))' }}
              >
                {t(lang, 'keyboardSound')}
              </span>
              <span
                className="relative inline-flex items-center w-8 h-[18px] rounded-full transition-colors"
                style={{ background: s.sound ? 'rgb(var(--accent))' : 'rgb(var(--ink) / 0.18)' }}
              >
                <motion.span
                  layout
                  transition={{ type: 'spring', stiffness: 600, damping: 38 }}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    background: 'rgb(var(--paper))',
                    left: s.sound ? 'calc(100% - 0.875rem)' : '0.185rem',
                  }}
                />
              </span>
            </button>

            <div
              className="max-h-[22rem] overflow-y-auto pb-1"
              style={{ opacity: s.sound ? 1 : 0.42 }}
            >
              {SOUND_TIERS.map((tier) => (
                <div key={tier.id}>
                  <p
                    className="px-3.5 pt-3 pb-1 text-[10px] font-sans font-semibold uppercase tracking-[0.18em]"
                    style={{ color: 'rgb(var(--ink-faint))' }}
                  >
                    {t(lang, `tier_${tier.id}`)}
                  </p>
                  {tier.voices.map((id) => {
                    const active = s.soundTheme === id;
                    return (
                      <button
                        key={id}
                        onClick={() => pick(id)}
                        className="w-full flex items-center gap-3 px-3.5 py-2 text-left transition-colors"
                        style={{
                          background: active ? 'rgb(var(--accent) / 0.1)' : 'transparent',
                          boxShadow: active ? 'inset 2px 0 0 rgb(var(--accent))' : undefined,
                        }}
                      >
                        <span className="flex-1 min-w-0">
                          <span
                            className="block font-display text-[15px] leading-tight"
                            style={{ color: active ? 'rgb(var(--accent))' : 'rgb(var(--ink))' }}
                          >
                            {VOICE_META[id].name}
                          </span>
                          <span
                            className="block font-mono text-[9.5px] uppercase tracking-[0.1em] truncate"
                            style={{ color: 'rgb(var(--ink-faint))' }}
                          >
                            {VOICE_META[id].material}
                          </span>
                        </span>
                        <Signature id={id} active={active} />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="block px-3.5 py-2.5 text-[12px] font-sans transition-colors"
              style={{
                borderTop: '1px solid rgb(var(--ink) / 0.1)',
                color: 'rgb(var(--ink-soft))',
              }}
            >
              {t(lang, 'allSettings')} →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
