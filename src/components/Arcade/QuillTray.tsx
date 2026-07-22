import { QUILL_BY_ID, type QuillId } from '../../arcade/quills';

interface Props {
  quills: QuillId[];
  skipReady?: boolean;
  skipRemaining?: number; // 0..1
}

const ARCH_TOKEN: Record<string, string> = {
  Economy: '--gold',
  Multiplier: '--accent',
  Survival: '--error',
  Flow: '--accent-2',
};

/** Compact row of owned Quill tokens; Quick Quill dims while on cooldown. */
export function QuillTray({ quills, skipReady, skipRemaining = 0 }: Props) {
  if (!quills.length) return null;
  return (
    <div className="flex items-center gap-1.5">
      {quills.map((id) => {
        const q = QUILL_BY_ID[id];
        if (!q) return null;
        const token = ARCH_TOKEN[q.archetype] ?? '--accent';
        const isSkip = id === 'quickQuill';
        const cooling = isSkip && !skipReady;
        return (
          <div
            key={id}
            title={`${q.name} — ${q.blurb}`}
            className="relative grid place-items-center w-8 h-8 rounded-lg font-display font-bold overflow-hidden"
            style={{
              fontSize: '1rem',
              color: cooling ? 'rgb(var(--ink-faint))' : 'rgb(var(--paper))',
              background: cooling ? 'rgb(var(--ink) / 0.12)' : `rgb(var(${token}))`,
              boxShadow: cooling ? 'none' : `0 0 10px rgb(var(${token}) / 0.35)`,
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            {q.glyph}
            {cooling && (
              <div
                className="absolute bottom-0 left-0 right-0"
                style={{
                  height: `${skipRemaining * 100}%`,
                  background: 'rgb(var(--accent-2) / 0.35)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
