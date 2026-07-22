import { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { InkRushView } from '../../arcade/useInkRush';

interface Props {
  view: InkRushView;
  focused: boolean;
  tier: number;
  onClick: () => void;
  /** report the caret's viewport position so juice can launch from it */
  onCaret?: (pos: { x: number; y: number }) => void;
  /** Fog gimmick: blur the words you haven't reached yet */
  blurUpcoming?: boolean;
  /** Silent gimmick: no highlight on the active word */
  noHighlight?: boolean;
}

interface CaretPos {
  x: number;
  y: number;
  h: number;
}

/**
 * The Ink Rush typing surface: a fast, hot conveyor of words. The current letter
 * sits under a glowing block caret; typed letters recede into ghosts; the whole
 * line scrolls up as you burn through it.
 */
export function ArcadeStage({
  view,
  focused,
  tier,
  onClick,
  onCaret,
  blurUpcoming,
  noHighlight,
}: Props) {
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const caretRef = useRef<HTMLDivElement>(null);
  const [caret, setCaret] = useState<CaretPos | null>(null);
  const [scroll, setScroll] = useState(0);

  const { stream, states, released, cursor } = view;

  // bounds of the word the user is on right now → highlight it so "what's next" is obvious
  const wordStart = stream.lastIndexOf(' ', Math.max(0, cursor - 1)) + 1;
  let wordEnd = stream.indexOf(' ', cursor);
  if (wordEnd === -1) wordEnd = stream.length;

  useLayoutEffect(() => {
    const el = charRefs.current[cursor] ?? charRefs.current[cursor - 1];
    if (!el) {
      setCaret(null);
      return;
    }
    const atEnd = cursor >= stream.length;
    const h = el.offsetHeight;
    setCaret({
      x: atEnd ? el.offsetLeft + el.offsetWidth : el.offsetLeft,
      y: el.offsetTop,
      h,
    });
    const lineH = h || 44;
    // pin the active line to the vertical middle so words stream in below and out above
    setScroll(-Math.max(0, el.offsetTop - lineH * 1.1));
  }, [cursor, stream]);

  // report caret viewport position after paint (for the juice layer)
  useLayoutEffect(() => {
    if (!onCaret || !caretRef.current) return;
    const r = caretRef.current.getBoundingClientRect();
    onCaret({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  }, [caret, onCaret]);

  const accentGlow = 0.35 + tier * 0.14;

  return (
    <div
      onClick={onClick}
      className="relative cursor-text mx-auto select-none"
      style={{ maxWidth: '48rem' }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          height: '9rem',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent, #000 22%, #000 68%, transparent)',
          maskImage:
            'linear-gradient(to bottom, transparent, #000 22%, #000 68%, transparent)',
        }}
      >
        <div
          className="relative transition-transform duration-200 ease-out"
          style={{
            transform: `translateY(${scroll}px)`,
            // The container masks its top 22% to a fade. Without this lead-in the
            // very first line renders at y=0 — inside that fade — and its top is
            // clipped until the run scrolls. One line of padding starts the text
            // below the mask; later lines are unaffected.
            paddingTop: '2.75rem',
          }}
        >
          {/* block caret */}
          {caret && (
            <motion.div
              ref={caretRef}
              className="absolute z-10 rounded-[3px]"
              initial={false}
              animate={{ left: caret.x - 2, top: caret.y }}
              transition={{ type: 'spring', stiffness: 1600, damping: 60, mass: 0.35 }}
              style={{
                height: caret.h,
                width: 4,
                background: 'rgb(var(--accent))',
                boxShadow: `0 0 ${8 + tier * 6}px rgb(var(--accent) / ${accentGlow})`,
                opacity: focused ? 1 : 0.35,
              }}
            />
          )}

          <p
            className="font-mono font-medium"
            style={{
              fontSize: '1.75rem',
              lineHeight: '2.75rem',
              letterSpacing: '0.01em',
              wordSpacing: '0.15em',
            }}
          >
            {stream.split('').map((ch, i) => {
              const st = states[i];
              const isCurrent = i === cursor;
              const inActiveWord = i >= wordStart && i < wordEnd;
              // abandoned when its word broke — struck out so the jump is legible
              const gone = released[i];
              // color by state, with the active word kept bright and far words dimmed
              let color: string;
              if (gone) color = 'rgb(var(--error) / 0.4)';
              else if (st === 'incorrect') color = 'rgb(var(--error))';
              else if (st === 'correct') color = 'rgb(var(--ink) / 0.28)';
              else if (isCurrent) color = 'rgb(var(--ink))';
              else if (inActiveWord) color = 'rgb(var(--ink) / 0.85)';
              else color = 'rgb(var(--ink-soft) / 0.4)'; // upcoming words recede
              // continuous highlight pill behind the active word's untyped tail
              const highlight =
                !gone && inActiveWord && !noHighlight && st !== 'correct' && st !== 'incorrect';
              // fog gimmick: haze the words not yet reached
              const fogged = blurUpcoming && i > wordEnd && st === 'untyped';
              return (
                <span
                  key={i}
                  ref={(el) => {
                    charRefs.current[i] = el;
                  }}
                  className={st === 'incorrect' && !gone ? 'proof-underline' : ''}
                  style={{
                    color,
                    fontWeight: isCurrent ? 700 : undefined,
                    padding: highlight ? '0.15em 0' : undefined,
                    filter: fogged ? 'blur(5px)' : undefined,
                    textDecoration: gone ? 'line-through' : undefined,
                    textDecorationColor: gone ? 'rgb(var(--error) / 0.55)' : undefined,
                    background:
                      st === 'incorrect' && ch === ' '
                        ? 'rgb(var(--error) / 0.2)'
                        : highlight
                          ? 'rgb(var(--accent) / 0.09)'
                          : undefined,
                    transition: 'color 0.1s ease',
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </p>
        </div>
      </div>

      {!focused && view.running && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div
            className="rounded-full px-5 py-2 text-sm backdrop-blur-[2px]"
            style={{
              background: 'rgb(var(--paper) / 0.75)',
              color: 'rgb(var(--ink-soft))',
              border: '1px solid rgb(var(--ink) / 0.12)',
            }}
          >
            click to keep typing
          </div>
        </div>
      )}
    </div>
  );
}
