import { useMemo } from 'react';
import { buildScoreCardSvg, type ScorePayload } from '../../lib/share';

/**
 * The score card, rendered inline as SVG so the page's real fonts draw it. The
 * same markup is what gets rasterised to PNG for download — one source of truth.
 */
export function ScoreCard({ payload, className }: { payload: ScorePayload; className?: string }) {
  const svg = useMemo(() => buildScoreCardSvg(payload), [payload]);
  return (
    <div
      className={`score-card w-full ${className ?? ''}`}
      // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
