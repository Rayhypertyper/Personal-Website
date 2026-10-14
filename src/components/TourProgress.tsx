import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { TOUR_COUNTDOWN_START_SECONDS } from "../tour-config";

interface TourProgressProps {
  clock: RefObject<{ stopId: string; elapsed: number; countdownElapsed: number }>;
  stops: { id: string; title: string; estimatedMs: number; filter: string }[];
  stopIndex: number;
  frozen: boolean;
  complete: boolean;
  reducedMotion: boolean;
  onNavigate: (index: number) => void;
}

export function TourProgress({ clock, stops, stopIndex, frozen, complete, reducedMotion, onNavigate }: TourProgressProps) {
  const fill = useRef<HTMLElement>(null);
  const animation = useRef<Animation | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(1,
    Math.floor(TOUR_COUNTDOWN_START_SECONDS - clock.current.countdownElapsed / 1000)));
  const stop = stops[stopIndex];
  useLayoutEffect(() => {
    if (clock.current.stopId !== stop.id) {
      clock.current.stopId = stop.id;
      clock.current.elapsed = 0;
    }
    if (!fill.current) return;
    const progress = fill.current.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: stop.estimatedMs, easing: "linear", fill: "both" });
    animation.current = progress;
    progress.currentTime = clock.current.elapsed;
    if (frozen) progress.pause();
    return () => { clock.current.elapsed = Number(progress.currentTime ?? 0); progress.cancel(); animation.current = null; };
  }, [stop.id, stop.estimatedMs]);
  useEffect(() => {
    if (complete && animation.current) animation.current.currentTime = stop.estimatedMs;
  }, [complete, stop.estimatedMs]);
  useEffect(() => {
    if (frozen) animation.current?.pause(); else animation.current?.play();
  }, [frozen, stop.id]);
  // One clock spans every stop; section estimates only drive the progress dots.
  useEffect(() => {
    if (complete) return;
    const alreadyElapsed = clock.current.countdownElapsed;
    const startedAt = performance.now();
    let timer = 0;
    const tick = () => {
      const elapsed = alreadyElapsed + (frozen ? 0 : performance.now() - startedAt);
      const remainingMs = Math.max(0, TOUR_COUNTDOWN_START_SECONDS * 1000 - elapsed);
      const remaining = Math.max(1, Math.floor(remainingMs / 1000));
      setSecondsLeft(remaining);
      // Tick when the remaining time crosses its next whole-second boundary.
      if (!frozen && remaining > 1) timer = window.setTimeout(tick, Math.max(1, remainingMs % 1000));
    };
    tick();
    return () => {
      window.clearTimeout(timer);
      if (!frozen) clock.current.countdownElapsed = alreadyElapsed + performance.now() - startedAt;
    };
  }, [clock, frozen, complete]);
  const remaining = complete ? 0 : secondsLeft;
  return <div className="guided-tour__progress">
    <nav className="guided-tour__dots" aria-label="Tour progress">
      {stops.map((item, index) => <button key={item.id} className={`guided-tour__dot${index < stopIndex ? " is-visited" : ""}`} type="button"
        aria-label={`Stop ${index + 1} of ${stops.length}: ${item.title}`} aria-current={index === stopIndex ? "step" : undefined} onClick={() => onNavigate(index)}>
        <span><i ref={index === stopIndex ? fill : undefined} style={reducedMotion && index === stopIndex ? { transform: "scaleX(1)" } : undefined} /></span>
      </button>)}
    </nav>
    <p className="guided-tour__time" aria-hidden="true">{stopIndex + 1} / {stops.length} · {remaining > 0 ? "~" : ""}{remaining} s left</p>
  </div>;
}
