import * as React from "react";

/**
 * Animate a numeric value from 0 to `target` over `duration` ms
 * using a cubic ease-out curve. Respects prefers-reduced-motion by
 * jumping straight to the final value.
 */
export function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = React.useState(0);
  const raf = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      setValue(target);
      return;
    }
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduce || !Number.isFinite(target)) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const from = 0;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (target - from) * eased);
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration]);

  return value;
}
