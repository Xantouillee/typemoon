import { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { EngineSnapshot } from '../../engine/types';
import type {
  CaretStyle,
  HighlightMode,
  IndicateTypos,
  SmoothCaret,
  TypedEffect,
} from '../../store/settings';

interface Props {
  snapshot: EngineSnapshot;
  focused: boolean;
  serif?: boolean;
  onClick: () => void;
  hint: string;
  caretStyle?: CaretStyle;
  smoothCaret?: SmoothCaret;
  highlightMode?: HighlightMode;
  typedEffect?: TypedEffect;
  indicateTypos?: IndicateTypos;
  /** multiplier on the base type size */
  fontScale?: number;
}

interface CaretPos {
  x: number;
  y: number;
  h: number;
  w: number;
}

/** Spring stiffness per smoothness setting; `off` snaps with no animation. */
const SPRING: Record<SmoothCaret, { stiffness: number; damping: number } | null> = {
  off: null,
  slow: { stiffness: 380, damping: 42 },
  medium: { stiffness: 1400, damping: 70 },
  fast: { stiffness: 2600, damping: 80 },
};

/**
 * The typing surface. Renders each character with its state, marks errors with a
 * proofreader's red underline, and floats a pen-nib caret that springs between
 * characters. The current line stays comfortably in view via a vertical offset.
 */
export function TypingArea({
  snapshot,
  focused,
  serif,
  onClick,
  hint,
  caretStyle = 'line',
  smoothCaret = 'medium',
  highlightMode = 'off',
  typedEffect = 'keep',
  indicateTypos = 'off',
  fontScale = 1,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [caret, setCaret] = useState<CaretPos | null>(null);
  const [scroll, setScroll] = useState(0);

  const { target, states, typed, cursor } = snapshot;

  useLayoutEffect(() => {
    const el = charRefs.current[cursor] ?? charRefs.current[cursor - 1];
    if (!el) {
      setCaret(null);
      return;
    }
    // offsetLeft/Top are layout coordinates in the (untransformed) inner container,
    // so they are unaffected by the translateY we apply for scrolling — no feedback loop.
    const atEnd = cursor >= target.length;
    const h = el.offsetHeight;
    setCaret({
      x: atEnd ? el.offsetLeft + el.offsetWidth : el.offsetLeft,
      y: el.offsetTop,
      h,
      w: el.offsetWidth || 12,
    });
    // keep the active line comfortably in view: pin it to ~2 lines from the top
    const lineH = h || 40;
    setScroll(-Math.max(0, el.offsetTop - lineH * 2));
  }, [cursor, target]);

  // word bounds, so `highlightMode: 'word'` can dim everything else
  let wordStart = 0;
  let wordEnd = target.length;
  if (highlightMode === 'word') {
    wordStart = target.lastIndexOf(' ', Math.max(0, cursor - 1)) + 1;
    const nextSpace = target.indexOf(' ', cursor);
    wordEnd = nextSpace === -1 ? target.length : nextSpace;
  }

  const spring = SPRING[smoothCaret];
  const showCaret = caretStyle !== 'off' && caret;

  /** The caret's shape, per style. `line` keeps the original pen nib. */
  const caretBody = () => {
    if (caretStyle === 'block' || caretStyle === 'outline') {
      const outline = caretStyle === 'outline';
      return (
        <div
          className="rounded-[2px]"
          style={{
            width: caret!.w,
            height: '100%',
            background: outline ? 'transparent' : 'rgb(var(--accent) / 0.45)',
            border: outline ? '1.5px solid rgb(var(--accent))' : 'none',
            animation: focused ? 'caretPulse 1.1s ease-in-out infinite' : 'none',
            opacity: focused ? 1 : 0.4,
          }}
        />
      );
    }
    if (caretStyle === 'underline') {
      return (
        <div style={{ width: caret!.w, height: '100%', position: 'relative' }}>
          <div
            className="absolute bottom-1 left-0 right-0 rounded-full"
            style={{
              height: 2,
              background: 'rgb(var(--accent))',
              animation: focused ? 'caretPulse 1.1s ease-in-out infinite' : 'none',
              opacity: focused ? 1 : 0.4,
            }}
          />
        </div>
      );
    }
    // the default: a hairline with a pen nib on top
    return (
      <div className="relative" style={{ width: 2, height: '100%' }}>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'rgb(var(--accent))',
            boxShadow: '0 0 10px rgb(var(--accent) / 0.6)',
            animation: focused ? 'caretPulse 1.1s ease-in-out infinite' : 'none',
            opacity: focused ? 1 : 0.4,
          }}
        />
        <div
          className="absolute -top-1 left-1/2 -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: '3px solid transparent',
            borderRight: '3px solid transparent',
            borderBottom: '5px solid rgb(var(--accent))',
          }}
        />
      </div>
    );
  };

  return (
    <div onClick={onClick} className="relative cursor-text mx-auto" style={{ maxWidth: '52rem' }}>
      <div ref={wrapRef} className="relative overflow-hidden" style={{ height: '10.5rem' }}>
        <div
          className="relative transition-transform duration-300 ease-out"
          style={{ transform: `translateY(${scroll}px)` }}
        >
          {showCaret && (
            <motion.div
              className="absolute z-10"
              initial={false}
              animate={{ left: caret.x, top: caret.y }}
              transition={
                spring
                  ? { type: 'spring', mass: 0.4, ...spring }
                  : { duration: 0 }
              }
              style={{ height: caret.h }}
            >
              {caretBody()}
            </motion.div>
          )}

          <p
            className={`leading-[2.6rem] tracking-[0.01em] ${serif ? 'font-display' : 'font-mono'}`}
            style={{
              fontSize: `${(serif ? 1.9 : 1.6) * fontScale}rem`,
              wordSpacing: serif ? '0.05em' : '0.12em',
            }}
          >
            {target.split('').map((ch, i) => {
              const st = states[i];
              const done = i < cursor;
              const mistyped = st === 'incorrect';

              let color =
                st === 'correct'
                  ? 'rgb(var(--ink))'
                  : mistyped
                    ? 'rgb(var(--error))'
                    : 'rgb(var(--ink-soft) / 0.55)';

              // typed-effect only ever restyles characters already behind the cursor
              let opacity = 1;
              if (done && !mistyped) {
                if (typedEffect === 'fade') opacity = 0.35;
                else if (typedEffect === 'hide') opacity = 0;
              }

              // highlight dims whatever is not the current letter/word
              if (highlightMode === 'letter' && i !== cursor && !done) {
                opacity *= 0.4;
              } else if (highlightMode === 'word' && (i < wordStart || i >= wordEnd) && !done) {
                opacity *= 0.4;
              }

              // `replace` shows the wrong character in place of the intended one
              let glyph = ch;
              if (mistyped && indicateTypos === 'replace' && typed[i]) glyph = typed[i] as string;
              if (done && !mistyped && typedEffect === 'dots') {
                glyph = ch === ' ' ? ch : '·';
                color = 'rgb(var(--ink-soft) / 0.5)';
              }

              return (
                <span
                  key={i}
                  ref={(el) => {
                    charRefs.current[i] = el;
                  }}
                  className={mistyped ? 'proof-underline relative' : 'relative'}
                  style={{
                    color,
                    opacity,
                    transition: 'color 0.12s ease, opacity 0.18s ease',
                    // render a visible marker when a space is mistyped
                    background:
                      mistyped && ch === ' ' ? 'rgb(var(--error) / 0.18)' : undefined,
                  }}
                >
                  {glyph}
                  {/* `below` prints what you actually typed under the target letter */}
                  {mistyped && indicateTypos === 'below' && typed[i] && (
                    <span
                      className="absolute left-0 right-0 text-center font-mono pointer-events-none"
                      style={{
                        top: '1.35em',
                        fontSize: '0.5em',
                        color: 'rgb(var(--error))',
                        opacity: 0.85,
                      }}
                    >
                      {typed[i] === ' ' ? '␣' : typed[i]}
                    </span>
                  )}
                </span>
              );
            })}
          </p>
        </div>
      </div>

      {!focused && (
        <div className="absolute inset-0 grid place-items-center">
          <div
            className="rounded-full px-5 py-2 text-sm backdrop-blur-[2px]"
            style={{
              background: 'rgb(var(--paper) / 0.7)',
              color: 'rgb(var(--ink-soft))',
              border: '1px solid rgb(var(--ink) / 0.1)',
            }}
          >
            {hint}
          </div>
        </div>
      )}
    </div>
  );
}
