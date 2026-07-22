import { motion } from 'framer-motion';

/**
 * One setting: a name, a sentence explaining what it does, its control — and,
 * where the behaviour is hard to picture, a concrete example underneath.
 *
 * The description carries its weight: a setting nobody understands is dead UI,
 * and "Confidence: off / on / max" understands nothing about itself.
 */
export function Row({
  label,
  hint,
  tip,
  children,
  wide,
}: {
  label: string;
  hint: string;
  tip?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={`py-4 ${wide ? '' : 'md:grid md:grid-cols-[1fr_auto] md:items-start md:gap-8'}`}
      style={{ borderBottom: '1px solid rgb(var(--ink) / 0.09)' }}
    >
      <div className="max-w-[34rem]">
        <p className="font-sans text-[14px] font-semibold" style={{ color: 'rgb(var(--ink))' }}>
          {label}
        </p>
        <p
          className="font-sans text-[12.5px] leading-snug mt-0.5"
          style={{ color: 'rgb(var(--ink-soft))' }}
        >
          {hint}
        </p>
        {tip && (
          <p
            className="font-sans text-[12px] leading-snug mt-1.5 pl-2.5"
            style={{
              color: 'rgb(var(--ink-faint))',
              borderLeft: '1.5px solid rgb(var(--ink) / 0.14)',
            }}
          >
            {tip}
          </p>
        )}
      </div>
      <div className={wide ? 'mt-3' : 'mt-3 md:mt-0 md:justify-self-end'}>{children}</div>
    </div>
  );
}

/** A segmented control. One group, one sliding highlight — never shared across groups. */
export function Choice<T extends string | number>({
  value,
  options,
  onChange,
  groupId,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  groupId: string;
}) {
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full p-1"
      style={{ background: 'rgb(var(--ink) / 0.05)' }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            className="relative px-3 py-1.5 text-[13px] font-sans font-medium rounded-full transition-colors whitespace-nowrap"
            style={{ color: active ? 'rgb(var(--paper))' : 'rgb(var(--ink-soft))' }}
          >
            {active && (
              <motion.span
                layoutId={groupId}
                className="absolute inset-0 rounded-full"
                style={{ background: 'rgb(var(--ink))' }}
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative z-10 lowercase">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** An on/off switch that reads as a switch, not as one more selectable pill. */
export function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      className="relative inline-flex items-center w-11 h-6 rounded-full transition-colors shrink-0"
      style={{ background: on ? 'rgb(var(--accent))' : 'rgb(var(--ink) / 0.18)' }}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 38 }}
        className="absolute w-4 h-4 rounded-full"
        style={{ background: 'rgb(var(--paper))', left: on ? 'calc(100% - 1.25rem)' : '0.25rem' }}
      />
    </button>
  );
}

/** A slider with its current value shown in tabular figures so it never jitters. */
export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-40 cursor-pointer"
        style={{ accentColor: 'rgb(var(--accent))' }}
      />
      <span
        className="font-mono text-[12px] w-12 text-right"
        style={{ color: 'rgb(var(--ink-soft))', fontVariantNumeric: 'tabular-nums' }}
      >
        {format(value)}
      </span>
    </div>
  );
}

/** A titled block of settings, and the scroll target for the section nav. */
export function Section({
  id,
  title,
  blurb,
  children,
}: {
  id: string;
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 pt-10 first:pt-0">
      <h2
        className="font-display text-[1.6rem] leading-tight"
        style={{ color: 'rgb(var(--ink))' }}
      >
        {title}
      </h2>
      <p
        className="font-sans text-[13px] mt-1 mb-2 max-w-[38rem]"
        style={{ color: 'rgb(var(--ink-faint))' }}
      >
        {blurb}
      </p>
      {children}
    </section>
  );
}
