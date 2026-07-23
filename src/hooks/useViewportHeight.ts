import { useEffect, useState } from 'react';

/**
 * The height of the *visible* viewport, in pixels.
 *
 * On a phone the soft keyboard covers part of the screen without changing
 * `window.innerHeight` on every browser, and `100vh` famously measures the
 * layout viewport (behind the keyboard) rather than what you can actually see.
 * `visualViewport` is the one API that reports the real visible area, so we
 * size the app to it and the panel + controls always stay above the keyboard.
 */
export function useViewportHeight(): number {
  const [height, setHeight] = useState(() =>
    typeof window === 'undefined'
      ? 0
      : window.visualViewport?.height ?? window.innerHeight,
  );

  useEffect(() => {
    const vv = window.visualViewport;
    const read = () => setHeight(vv?.height ?? window.innerHeight);
    read();
    if (vv) {
      vv.addEventListener('resize', read);
      vv.addEventListener('scroll', read);
    }
    window.addEventListener('resize', read);
    window.addEventListener('orientationchange', read);
    return () => {
      if (vv) {
        vv.removeEventListener('resize', read);
        vv.removeEventListener('scroll', read);
      }
      window.removeEventListener('resize', read);
      window.removeEventListener('orientationchange', read);
    };
  }, []);

  return height;
}
