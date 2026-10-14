import { Send } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import "../tour-cta.css";

// The attention nudge plays once per page load, not on every return to All.
let attentionPlayed = false;

const SHADE_HOLD_MS = 2000;
const SHADE_EXIT_MS = { lift: 650, clear: 180 } as const;
const SHADE_DISMISS_EVENTS = ["pointerdown", "keydown", "wheel", "touchmove"] as const;
const SHADE_PADDING = 12;

type ShadeState = "on" | keyof typeof SHADE_EXIT_MS;

interface TourCTAProps {
  onStart: () => void;
  onVisibilityChange?: (visible: boolean) => void;
}

export function TourCTA({ onStart, onVisibilityChange }: TourCTAProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [shade, setShade] = useState<ShadeState | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || attentionPlayed) return;
    attentionPlayed = true;
    root.dataset.attention = "true";
    setShade("on");
  }, []);

  useEffect(() => {
    if (shade !== "on") return;
    const clear = () => setShade("clear");
    const timer = window.setTimeout(() => setShade("lift"), SHADE_HOLD_MS);
    SHADE_DISMISS_EVENTS.forEach((type) => window.addEventListener(type, clear, { capture: true, passive: true }));
    return () => {
      window.clearTimeout(timer);
      SHADE_DISMISS_EVENTS.forEach((type) => window.removeEventListener(type, clear, { capture: true }));
    };
  }, [shade]);

  useEffect(() => {
    if (shade !== "lift" && shade !== "clear") return;
    const timer = window.setTimeout(() => setShade(null), SHADE_EXIT_MS[shade]);
    return () => window.clearTimeout(timer);
  }, [shade]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !onVisibilityChange) return;
    if (typeof IntersectionObserver === "undefined") {
      onVisibilityChange(true);
      return () => onVisibilityChange(false);
    }
    const observer = new IntersectionObserver(([entry]) => onVisibilityChange(entry.isIntersecting), { threshold: 0 });
    observer.observe(root);
    return () => {
      observer.disconnect();
      onVisibilityChange(false);
    };
  }, [onVisibilityChange]);

  const start = () => {
    setShade(null);
    onStart();
  };

  return (
    <section ref={rootRef} className="tour-cta" aria-labelledby="tour-cta-title" data-tour-cta-card>
      <div className="tour-cta__copy">
        <p className="tour-cta__lead">Sponsored result</p>
        <p className="tour-cta__title" id="tour-cta-title">Get to know me in <em>30&nbsp;seconds</em>.</p>
      </div>
      <div className="tour-cta__action">
        <button type="button" className="tour-cta__button" data-tour-cta="hero" data-tour-entry onClick={start} aria-describedby="tour-cta-title">
          <span className="tour-cta__button-face">
            <Send className="tour-cta__icon" size={28} aria-hidden="true" />
            Start tour
          </span>
        </button>
      </div>
      {shade ? <TourCTAShade target={rootRef} state={shade} /> : null}
    </section>
  );
}

function TourCTAShade({ target, state }: { target: RefObject<HTMLElement | null>; state: ShadeState }) {
  const holeRef = useRef<SVGRectElement>(null);

  useLayoutEffect(() => {
    let frame = 0;
    const follow = () => {
      const card = target.current?.getBoundingClientRect();
      const hole = holeRef.current;
      if (card && hole) {
        hole.setAttribute("x", String(card.left - SHADE_PADDING));
        hole.setAttribute("y", String(card.top - SHADE_PADDING));
        hole.setAttribute("width", String(card.width + SHADE_PADDING * 2));
        hole.setAttribute("height", String(card.height + SHADE_PADDING * 2));
      }
      frame = requestAnimationFrame(follow);
    };
    follow();
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return createPortal(
    <svg className="tour-cta-shade" data-state={state} width="100%" height="100%" aria-hidden="true">
      <defs>
        <filter id="tour-cta-shade-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6" /></filter>
        <mask id="tour-cta-shade-mask">
          <rect width="100%" height="100%" fill="white" />
          <rect ref={holeRef} rx={16 + SHADE_PADDING} fill="black" filter="url(#tour-cta-shade-soft)" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="currentColor" mask="url(#tour-cta-shade-mask)" />
    </svg>,
    document.body,
  );
}
