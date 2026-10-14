import { Play, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TOUR_CTA_DURATION_SECONDS } from "../tour-config";
import "../tour-cta.css";

const SHOW_DELAY_MS = 1200; // a gentle follow-up, and it also swallows the first-paint flicker before IntersectionObserver reports the hero card
const HIDE_MS = 220;

interface TourFloatingCTAProps {
  visible: boolean;
  onStart: () => void;
  onDismiss: () => void;
}

export function TourFloatingCTA({ visible, onStart, onDismiss }: TourFloatingCTAProps) {
  const [state, setState] = useState<"hidden" | "open" | "closing">("hidden");
  const [dodge, setDodge] = useState(false);

  useEffect(() => {
    if (visible) {
      const timer = window.setTimeout(() => setState("open"), SHOW_DELAY_MS);
      return () => window.clearTimeout(timer);
    }
    setState((current) => (current === "hidden" ? current : "closing"));
    const timer = window.setTimeout(() => setState("hidden"), HIDE_MS);
    return () => window.clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    if (state === "hidden") return;
    // On narrow screens the social dock sits at the document bottom; lift the pill above it while it is in view.
    const dock = document.querySelector(".social-dock");
    const narrow = window.matchMedia("(max-width: 639px)");
    if (!dock || typeof IntersectionObserver === "undefined") return;
    let dockVisible = false;
    const update = () => setDodge(narrow.matches && dockVisible);
    const observer = new IntersectionObserver(([entry]) => {
      dockVisible = entry.isIntersecting;
      update();
    }, { threshold: 0 });
    observer.observe(dock);
    narrow.addEventListener("change", update);
    return () => {
      observer.disconnect();
      narrow.removeEventListener("change", update);
    };
  }, [state]);

  if (state === "hidden") return null;

  return createPortal(
    <div className="tour-float" data-state={state} data-dodge={dodge || undefined} data-tour-cta-container>
      <p className="tour-float__caption" aria-hidden="true"><span>Short on time?</span></p>
      <div className="tour-float__pill">
        <button type="button" className="tour-float__start" data-tour-cta="floating" onClick={onStart}>
          <Play size={13} strokeWidth={0} fill="currentColor" aria-hidden="true" />Meet Ray in {TOUR_CTA_DURATION_SECONDS} sec
        </button>
        <button type="button" className="tour-float__close" data-tour-cta="floating-dismiss" onClick={onDismiss} aria-label="Dismiss tour reminder">
          <X size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </div>,
    document.body,
  );
}
