import { useLayoutEffect, useRef, useState } from 'react';
import type { EngineSnapshot } from '../../engine/types';

interface Props {
  snapshot: EngineSnapshot;
  /** multiplier on the base type size */
  fontScale?: number;
  /** raise the keyboard when the words are tapped */
  onTap?: () => void;
}

/**
 * The touch typing surface. Unlike the desktop `TypingArea` it does not float a
 * measured caret — on a phone a solid highlight under the current character
 * reads better and needs no pixel maths that a re-flow could invalidate. The
 * active line is kept in view by translating the text block, and the whole
 * surface is a big tap target that raises the keyboard.
 */
export function MobileTypingArea({ snapshot, fontScale = 1, onTap }: Props) {
  const activeRef = useRef<HTMLSpanElement>(null);
  const [scroll, setScroll] = useState(0);
  const { target, states, cursor } = snapshot;

  // Keep the character under the cursor pinned about a third of the way down the
  // panel, so there is always a line of context above and several lines below.
  useLayoutEffect(() => {
    const el = activeRef.current;
    if (!el) return;
    const lineH = el.offsetHeight || 40;
    setScroll(-Math.max(0, el.offsetTop - lineH));
  }, [cursor, target]);

  return (
    <div
      onPointerDown={onTap}
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
    </div>
  );
}
