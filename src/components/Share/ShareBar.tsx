import { useState } from 'react';
import {
  buildScoreCardSvg,
  buildShareText,
  buildShareUrl,
  svgToPngBlob,
  type ScorePayload,
} from '../../lib/share';
import { t } from '../../i18n/strings';

/** The site's absolute base, e.g. https://xantouillee.github.io/ */
function siteBase(): string {
  return window.location.origin + import.meta.env.BASE_URL;
}

const PLATFORMS: { id: string; name: string; dot: string; href: (u: string, txt: string) => string }[] = [
  { id: 'x', name: 'X', dot: '#111', href: (u, txt) => `https://twitter.com/intent/tweet?text=${enc(txt)}&url=${enc(u)}` },
  { id: 'wa', name: 'WhatsApp', dot: '#25D366', href: (u, txt) => `https://wa.me/?text=${enc(txt + ' ' + u)}` },
  { id: 'tg', name: 'Telegram', dot: '#229ED9', href: (u, txt) => `https://t.me/share/url?url=${enc(u)}&text=${enc(txt)}` },
  { id: 'rd', name: 'Reddit', dot: '#FF4500', href: (u, txt) => `https://www.reddit.com/submit?url=${enc(u)}&title=${enc(txt)}` },
];

const enc = encodeURIComponent;

/**
 * Everything a person can do with a finished run: the native share sheet (which
 * on a phone covers Messenger, Discord, WhatsApp… in one tap), a universal copy
 * link, a set of one-click platform hand-offs, and a PNG of the card to post
 * directly. The share sheet is only offered when the browser actually has it.
 */
export function ShareBar({ payload, lang }: { payload: ScorePayload; lang: string }) {
  const [copied, setCopied] = useState(false);
  const url = buildShareUrl(siteBase(), payload);
  const text = buildShareText(payload);
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const nativeShare = async () => {
    try {
      await navigator.share({ title: 'Typemoon', text, url });
    } catch {
      /* the user dismissed the sheet — nothing to do */
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — the link is still visible to select by hand */
    }
  };

  const download = async () => {
    const blob = await svgToPngBlob(buildScoreCardSvg(payload));
    if (!blob) return;
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `typemoon-${Math.round(payload.wpm)}wpm.png`;
    a.click();
    URL.revokeObjectURL(href);
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {canNativeShare && (
          <button
            onClick={nativeShare}
            className="px-5 py-2.5 rounded-full text-[14px] font-semibold flex items-center gap-2"
            style={{ background: 'rgb(var(--accent))', color: 'rgb(var(--paper))' }}
          >
            <IconShare /> {t(lang, 'share')}
          </button>
        )}
        <button
          onClick={copy}
          className="px-5 py-2.5 rounded-full text-[14px] font-semibold flex items-center gap-2"
          style={{
            background: copied ? 'rgb(var(--accent) / 0.14)' : 'rgb(var(--ink) / 0.06)',
            color: copied ? 'rgb(var(--accent))' : 'rgb(var(--ink))',
          }}
        >
          <IconLink /> {copied ? t(lang, 'copied') : t(lang, 'copyLink')}
        </button>
        <button
          onClick={download}
          className="px-5 py-2.5 rounded-full text-[14px] font-semibold flex items-center gap-2"
          style={{ background: 'rgb(var(--ink) / 0.06)', color: 'rgb(var(--ink))' }}
        >
          <IconDownload /> {t(lang, 'downloadCard')}
        </button>
      </div>

      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {PLATFORMS.map((p) => (
          <a
            key={p.id}
            href={p.href(url, text)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-full text-[12px] font-medium flex items-center gap-1.5 transition-colors"
            style={{ background: 'rgb(var(--ink) / 0.05)', color: 'rgb(var(--ink-soft))' }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: p.dot }} />
            {p.name}
          </a>
        ))}
      </div>
    </div>
  );
}

function IconShare() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M12 3v13M12 3 8 7M12 3l4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" strokeLinecap="round" />
    </svg>
  );
}
function IconLink() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconDownload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M12 3v12M12 15l-4-4M12 15l4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 20h14" strokeLinecap="round" />
    </svg>
  );
}
