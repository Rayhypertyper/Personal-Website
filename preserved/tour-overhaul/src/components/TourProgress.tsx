import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

interface TourProgressProps {
  clock: RefObject<{ stopId: string; elapsed: number }>;
  stops: { id: string; title: string; estimatedMs: number; filter: string }[];
  stopIndex: number;
  frozen: boolean;
  reducedMotion: boolean;
  onNavigate: (index: number) => void;
}

export function TourProgress({ clock, stops, stopIndex, frozen, reducedMotion, onNavigate }: TourProgressProps) {
  const fill = useRef<HTMLElement>(null);
  const animation = useRef<Animation | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const stop = stops[stopIndex];
  useLayoutEffect(() => {
    if (clock.current.stopId !== stop.id) clock.current = { stopId: stop.id, elapsed: 0 };
    setElapsed(clock.current.elapsed);
    if (!fill.current) return;
    const progress = fill.current.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: stop.estimatedMs, easing: "linear", fill: "both" });
    animation.current = progress;
    progress.currentTime = clock.current.elapsed;
    if (frozen) progress.pause();
    return () => { clock.current.elapsed = Number(progress.currentTime ?? 0); progress.cancel(); animation.current = null; };
  }, [stop.id, stop.estimatedMs]);
  useEffect(() => {
    if (frozen) animation.current?.pause(); else animation.current?.play();
    if (frozen) return;
    const timer = window.setInterval(() => setElapsed(Number(animation.current?.currentTime ?? 0)), 1000);
    return () => window.clearInterval(timer);
  }, [frozen, stop.id]);
  const future = stops.slice(stopIndex + 1).reduce((sum, item, index) => sum + item.estimatedMs + (!reducedMotion && item.filter !== stops[stopIndex + index].filter ? 1000 : 0), 0);
  const remaining = Math.ceil((Math.max(0, stop.estimatedMs - elapsed) + future) / 1000);
  return <div className="guided-tour__progress">
    <nav className="guided-tour__dots" aria-label="Tour progress">
      {stops.map((item, index) => <button key={item.id} className={`guided-tour__dot${index < stopIndex ? " is-visited" : ""}`} type="button"
        aria-label={`Stop ${index + 1} of ${stops.length}: ${item.title}`} aria-current={index === stopIndex ? "step" : undefined} onClick={() => onNavigate(index)}>
        <span><i ref={index === stopIndex ? fill : undefined} style={reducedMotion && index === stopIndex ? { transform: "scaleX(1)" } : undefined} /></span>
      </button>)}
    </nav>
    <p className="guided-tour__time" aria-hidden="true">{stopIndex + 1} / {stops.length} · ~{remaining} s left</p>
  </div>;
}
