import { useLayoutEffect, useRef, type RefObject } from "react";
import { TOUR_PLANET_FINALE_DURATION_SCALE } from "../tour-config";

export interface SpotlightRect { x: number; y: number; width: number; height: number }
export interface PlanetSpotlight { id: string; planet: SpotlightRect; label: SpotlightRect; active: boolean }
export interface PlanetFinaleClock { elapsedMs: number; endMs: number }
interface TourSpotlightProps {
  stopId: string;
  blockId?: string;
  rect: SpotlightRect;
  planets: PlanetSpotlight[];
  maskId: string;
  reducedMotion: boolean;
  lifting?: boolean;
  leaving?: boolean;
  ending?: boolean;
  planetFinale?: boolean;
  finaleClock?: RefObject<PlanetFinaleClock>;
  onFinaleComplete?: () => void;
}

/** Rectangles ease toward layout targets; moving planets stay frame-exact. */
export function TourSpotlight({ stopId, blockId, rect, planets, maskId, reducedMotion, lifting, leaving, ending, planetFinale, finaleClock, onFinaleComplete }: TourSpotlightProps) {
  const shadeRef = useRef<SVGSVGElement>(null);
  const cutoutRef = useRef<SVGRectElement>(null);
  const strokeRef = useRef<SVGRectElement>(null);
  const display = useRef<{ stopId: string; rect: SpotlightRect } | null>(null);
  const onFinished = useRef(onFinaleComplete);
  useLayoutEffect(() => { onFinished.current = onFinaleComplete; }, [onFinaleComplete]);
  useLayoutEffect(() => {
    if (!planetFinale || reducedMotion || !shadeRef.current || !finaleClock) return;
    const shade = shadeRef.current;
    const lastPlanet = shade.querySelector(".guided-tour-planet:last-child");
    const orbit = lastPlanet?.querySelector(".guided-tour-planet__orbit")?.getAnimations()[0];
    const orbitDuration = Number(orbit?.effect?.getTiming().duration);
    if (!orbit?.effect || !orbitDuration) { onFinished.current?.(); return; }

    // Shorten the remaining simultaneous linger without speeding up the planets.
    // The shared clock survives the shade unmounting on Pause or tab hiding.
    const clock = finaleClock.current;
    if (!clock.endMs) {
      clock.elapsedMs = Number(orbit.currentTime ?? 0);
      const orbitEndMs = (Math.floor(clock.elapsedMs / orbitDuration) + 1) * orbitDuration;
      clock.endMs = clock.elapsedMs + (orbitEndMs - clock.elapsedMs) * TOUR_PLANET_FINALE_DURATION_SCALE;
    }
    for (const element of shade.querySelectorAll(".guided-tour-planet__pulse, .guided-tour-planet__orbit")) {
      const animation = element.getAnimations()[0];
      const duration = Number(animation?.effect?.getTiming().duration);
      if (!animation?.effect || !duration) continue;
      animation.effect.updateTiming({ iterations: clock.endMs / duration, fill: "forwards" });
      animation.currentTime = clock.elapsedMs;
    }
    let disposed = false;
    void orbit.finished.then(() => {
      if (disposed) return;
      clock.elapsedMs = clock.endMs;
      onFinished.current?.();
    }).catch(() => {});
    return () => {
      disposed = true;
      clock.elapsedMs = Number(orbit.currentTime ?? clock.elapsedMs);
    };
  }, [planetFinale, reducedMotion, finaleClock]);

  useLayoutEffect(() => {
    if (!cutoutRef.current) return;
    if (!display.current || display.current.stopId !== stopId || reducedMotion) display.current = { stopId, rect: { ...rect } };
    let frame = 0;
    let last = performance.now();
    const draw = (now: number) => {
      const current = display.current!.rect;
      const weight = reducedMotion ? 1 : 1 - Math.exp(-Math.min(now - last, 64) / 110);
      last = now;
      let settled = true;
      for (const name of ["x", "y", "width", "height"] as const) {
        const delta = rect[name] - current[name];
        if (Math.abs(delta) >= 0.5) settled = false;
        current[name] = Math.abs(delta) < 0.5 ? rect[name] : current[name] + delta * weight;
        cutoutRef.current?.setAttribute(name, String(current[name]));
        strokeRef.current?.setAttribute(name, String(current[name]));
      }
      if (!settled) frame = requestAnimationFrame(draw);
    };
    draw(last);
    return () => cancelAnimationFrame(frame);
  }, [stopId, blockId, rect, reducedMotion]);

  return (
    <svg ref={shadeRef} className={`guided-tour-shade${lifting ? " guided-tour-shade--lifting" : ""}${leaving ? " guided-tour-shade--leaving" : ""}${ending ? " guided-tour-shade--ending" : ""}`}
      width="100%" height="100%" aria-hidden="true" data-tour-active-block={blockId} data-tour-planet-finale={planetFinale || undefined}>
      <defs>
        <filter id={`${maskId}-soft`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="10" /></filter>
        <mask id={maskId}>
          <rect width="100%" height="100%" fill="white" />
          {planets.length ? planets.map(({ id, planet, label }) => (
            <g key={id}>
              <circle cx={planet.x + planet.width / 2} cy={planet.y + planet.height / 2} r={Math.max(planet.width, planet.height) / 2 + 8} fill="black" />
              <rect x={label.x} y={label.y} width={label.width} height={label.height} rx="8" fill="black" />
            </g>
          )) : <rect ref={cutoutRef} rx="12" fill="black" filter={reducedMotion ? undefined : `url(#${maskId}-soft)`} />}
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="currentColor" mask={`url(#${maskId})`} />
      {planets.length ? planets.map(({ id, planet, active }) => {
        const radius = Math.max(planet.width, planet.height) / 2 + 3;
        return <g key={id} data-planet-id={id} className={`guided-tour-planet${ending ? " guided-tour-planet--ending" : ""}`} transform={`translate(${planet.x + planet.width / 2} ${planet.y + planet.height / 2})`}>
          <circle className="guided-tour-planet__track" r={radius} />
          {active || planetFinale ? <g>
            <circle className="guided-tour-planet__pulse" r={radius} />
            <g className="guided-tour-planet__orbit">
              <circle className="guided-tour-planet__arc" r={radius} strokeDasharray={`${radius * 2} ${radius * 5}`} />
              <circle className="guided-tour-planet__satellite" cx={radius} r="3" />
            </g>
          </g> : null}
        </g>;
      }) : <rect key={blockId} ref={strokeRef} className="guided-tour-spotlight" rx="12" />}
    </svg>
  );
}
