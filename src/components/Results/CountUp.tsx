import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  duration?: number;
  decimals?: number;
  delay?: number;
}

/** Animated number that counts up from zero — the results "money shot". */
export function CountUp({ value, duration = 1100, decimals = 0, delay = 0 }: Props) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    let start: number | null = null;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      if (start === null) start = now;
      const p = Math.min(1, (now - start) / duration);
      setDisplay(value * ease(p));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    const id = window.setTimeout(() => {
      raf.current = requestAnimationFrame(tick);
    }, delay);
    return () => {
      window.clearTimeout(id);
      cancelAnimationFrame(raf.current);
    };
  }, [value, duration, delay]);

  return <>{display.toFixed(decimals)}</>;
}
