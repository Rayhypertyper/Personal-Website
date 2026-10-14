import { useEffect, useRef } from "react";

/** Pause a dwell timer without losing the time already spent on this stop. */
export function useStepTimer(key: string, durationMs: number, enabled: boolean, onElapsed: () => void) {
  const remaining = useRef({ key, milliseconds: durationMs });
  const callback = useRef(onElapsed);

  useEffect(() => {
    callback.current = onElapsed;
  }, [onElapsed]);

  useEffect(() => {
    if (remaining.current.key !== key) {
      remaining.current = { key, milliseconds: durationMs };
    }
    if (!enabled) return;

    const startedAt = performance.now();
    const timer = window.setTimeout(() => {
      remaining.current.milliseconds = 0;
      callback.current();
    }, remaining.current.milliseconds);

    return () => {
      window.clearTimeout(timer);
      remaining.current.milliseconds = Math.max(0, remaining.current.milliseconds - (performance.now() - startedAt));
    };
  }, [key, durationMs, enabled]);
}
