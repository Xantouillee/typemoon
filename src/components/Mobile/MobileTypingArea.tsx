import { useLayoutEffect, useRef, useState } from 'react';
import type { EngineSnapshot } from '../../engine/types';
import type { MobileTypingApi } from '../../hooks/useMobileTyping';

interface Props {
  snapshot: EngineSnapshot;
  /** the hidden-input handlers from useMobileTyping */
  inputProps: MobileTypingApi['inputProps'];
  /** multiplier on the base type size */
  fontScale?: number;
  langLabel?: string;
}

/**
 * The touch typing surface. A transparent <input> is laid directly over the
 * words, so tapping the text focuses a *real* form field and the phone raises
 * its keyboard natively — no programmatic focus that a browser might ignore.
 * The words render underneath; the active character carries a solid highlight
 * (no measured caret to misfire on reflow), and the block scrolls to keep the
 * current line in view.
 */
export function MobileTypingArea({ snapshot, inputProps, fontScale = 1, langLabel }: Props) {
  const activeRef = useRef<HTMLSpanElement>(null);
  const [scroll, setScroll] = useState(0);
  const { target, states, cursor } = snapshot;

  useLayoutEffect(() => {
    const el = activeRef.current;
    if (!el) return;
    const lineH = el.offsetHeight || 40;
    setScroll(-Math.max(0, el.offsetTop - lineH));
  }, [cursor, target]);

  return (
    <div
      data-panel
      className="relative w-full h-full overflow-hidden rounded-2xl cursor-text select-none"
      style={{ padding: 'clamp(0.9rem, 4vw, 1.4rem)' }}
    >
      <div
        className="transition-transform duration-200 ease-out"
        style={{ transform: `translateY(${scroll}px)` }}
      >
        <p
          className="font-mono"
          style={{
            fontSize: `clamp(1.15rem, ${5.2 * fontScale}vw, ${1.7 * fontScale}rem)`,
            lineHeight: 1.85,
            wordSpacing: '0.1em',
            letterSpacing: '0.01em',
          }}
        >
          {target.split('').map((ch, i) => {
            const st = states[i];
            const isActive = i === cursor;
            const mistyped = st === 'incorrect';

            const color =
              st === 'correct'
                ? 'rgb(var(--ink))'
                : mistyped
                  ? 'rgb(var(--error))'
                  : 'rgb(var(--ink-soft) / var(--untyped-alpha, 0.6))';

            return (
              <span
                key={i}
                ref={isActive ? activeRef : undefined}
                className={mistyped ? 'proof-underline relative' : 'relative'}
                style={{
                  color,
                  borderRadius: 3,
                  background: isActive
                    ? 'rgb(var(--accent) / 0.18)'
                    : mistyped && ch === ' '
                      ? 'rgb(var(--error) / 0.18)'
                      : undefined,
                  boxShadow: isActive ? 'inset 0 -2px 0 rgb(var(--accent))' : undefined,
                  transition: 'color 0.1s ease, background 0.1s ease',
                }}
              >
                {ch}
              </span>
            );
          })}
        </p>
      </div>

      {/* The real input, laid transparently over the words. Tapping the text
          focuses it and the keyboard comes up on its own. 16px font stops iOS
          from zooming; every autocorrect affordance is stripped so what you
          type is what gets scored. */}
      <input
        {...inputProps}
        type="text"
        inputMode="text"
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        aria-label={langLabel}
        className="absolute inset-0 w-full h-full m-0 p-0 bg-transparent border-0 outline-none"
        style={{ color: 'transparent', caretColor: 'transparent', fontSize: 16, cursor: 'text' }}
      />
    </div>
  );
}
