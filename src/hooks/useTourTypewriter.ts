import { useEffect, useRef, useState } from "react";

export const TOUR_CHARACTERS_PER_SECOND = 30;

/** Pre-plan character clock; the enhanced schedule is preserved separately. */
export function useTourTypewriter(key: string, length: number, enabled: boolean, charactersPerSecond = TOUR_CHARACTERS_PER_SECOND) {
  const [progress, setProgress] = useState({ key, characters: 0 });
  const typed = useRef({ key, characters: 0 });
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (typed.current.key !== key) {
      typed.current = { key, characters: 0 };
      setProgress({ key, characters: 0 });
    }
    if (reducedMotion) {
      setProgress({ key, characters: length });
      return;
    }
    if (!enabled) return;

    const alreadyTyped = typed.current.characters;
    const startedAt = performance.now();
    let frame = 0;
    let disposed = false;
    const tick = (now: number) => {
      if (disposed) return;
      const characters = Math.min(length, Math.floor(alreadyTyped + (now - startedAt) * charactersPerSecond / 1000));
      setProgress((previous) => previous.key === key && previous.characters === characters ? previous : { key, characters });
      if (characters < length) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      typed.current.characters = Math.min(length, alreadyTyped + (performance.now() - startedAt) * charactersPerSecond / 1000);
    };
  }, [key, length, enabled, reducedMotion, charactersPerSecond]);

  const characters = progress.key === key ? progress.characters : 0;
  return { characters, complete: characters >= length, reducedMotion };
}
