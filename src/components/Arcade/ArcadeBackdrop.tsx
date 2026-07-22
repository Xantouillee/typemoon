import { useEffect, useState } from 'react';
import {
  MIN_SCRIM,
  backgroundMeta,
  backgroundUrl,
  type BackgroundId,
} from '../../lib/backgrounds';

interface Props {
  id: BackgroundId;
  /** 0..1 — how strongly the page colour covers the image */
  scrim: number;
  /** px of blur applied to the image only */
  blur: number;
}

/**
 * The arcade backdrop, in four stacked layers.
 *
 * Readability is enforced here rather than left to the image:
 *   1. the GIF, blurred/desaturated and `cover`-fitted so it never distorts
 *   2. a flat scrim in the page colour, floored so it cannot be turned off
 *   3. a radial scrim that is heaviest in the middle, where the words are,
 *      and lightest at the edges, so the art still reads at the periphery
 *   4. a vignette to stop bright corners pulling the eye off the text
 *
 * Everything is `position: fixed` behind `z-0`; arcade content sits at `z-10`.
 */
export function ArcadeBackdrop({ id, scrim, blur }: Props) {
  const meta = backgroundMeta(id);
  const [loaded, setLoaded] = useState(false);

  // Only fetch the image once it is actually chosen — the jungle frame alone is
  // 1.2 MB, and nobody should pay for it just by opening the arcade.
  useEffect(() => {
    if (!meta.file) return setLoaded(false);
    setLoaded(false);
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.src = backgroundUrl(meta.file);
    return () => {
      img.onload = null;
    };
  }, [meta.file]);

  if (!meta.file) return null;

  const cover = Math.max(MIN_SCRIM, scrim);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* 1 — the art */}
      <img
        src={backgroundUrl(meta.file)}
        alt=""
        className="absolute inset-0 w-full h-full transition-opacity duration-700"
        style={{
          objectFit: 'cover',
          objectPosition: 'center',
          // pixel art: keep it crisp when unblurred rather than smeared by the
          // browser's default smoothing
          imageRendering: blur > 0 ? 'auto' : 'pixelated',
          filter: `blur(${blur}px) saturate(0.82) contrast(0.9)`,
          // blur samples past the edge, so overscale to avoid transparent rims
          transform: `scale(${1 + blur / 60})`,
          opacity: loaded ? 1 : 0,
        }}
      />

      {/* 2 — flat scrim in the page colour */}
      <div className="absolute inset-0" style={{ background: `rgb(var(--paper) / ${cover})` }} />

      {/* 3 — heaviest where the text lives, lightest at the edges */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(115% 85% at 50% 45%,
            rgb(var(--paper) / ${Math.min(0.96, cover * 0.72)}) 0%,
            rgb(var(--paper) / ${cover * 0.34}) 55%,
            rgb(var(--paper) / 0) 100%)`,
        }}
      />

      {/* 4 — vignette, so bright corners do not pull the eye */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 100% at 50% 50%, transparent 45%, rgb(var(--paper) / 0.55) 100%)',
        }}
      />
    </div>
  );
}
