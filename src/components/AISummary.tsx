import { useEffect, useRef, useState } from "react";
import { Pause, Play, Sparkles } from "lucide-react";
import { TourPageText } from "./TourPageText";
import { TOUR_READING_CHARACTERS_PER_SECOND } from "../tour-config";
import "../vision-phrase.css";

const WEBCAM_TARGETS = [
  { name: "search", selector: ".halo-search-input__icon", across: 0.5 },
  { name: "project", selector: ".all-project__preview", across: 0.8 },
  { name: "result", selector: ".all-overview__education .result-card > span:first-child", across: 0.5 },
] as const;

function aimAtPageTargets(phrase: HTMLElement) {
  const origin = phrase.getBoundingClientRect();
  for (const { name, selector, across } of WEBCAM_TARGETS) {
    const target = document.querySelector(selector)?.getBoundingClientRect();
    if (!target) continue;
    const dx = target.left + target.width * across - (origin.left + origin.width / 2);
    const dy = target.top + target.height / 2 - (origin.top + origin.height / 2);
    const pan = 55 * Math.tanh(dx / 165);
    const tilt = -26 * Math.tanh(dy / 170);
    phrase.style.setProperty(`--webcam-to-${name}`, `rotateY(${pan.toFixed(1)}deg) rotateX(${tilt.toFixed(1)}deg)`);
  }
}

export function AISummary() {
  const phraseRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const phrase = phraseRef.current;
    if (!phrase || typeof IntersectionObserver === "undefined") return;

    let inView = false;
    const measure = () => {
      if (inView && !document.hidden) aimAtPageTargets(phrase);
    };
    const updateVisibility = () => {
      setVisible(inView && !document.hidden);
      measure();
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updateVisibility();
    });
    observer.observe(phrase);
    const resize = new ResizeObserver(measure);
    resize.observe(phrase.closest(".all-overview") ?? phrase);
    resize.observe(phrase);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      observer.disconnect();
      resize.disconnect();
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  const motionLabel = paused ? "Play webcam animation" : "Pause webcam animation";

  return (
    <section
      className="ai-overview"
      aria-labelledby="ai-overview-title"
      data-webcam-visible={visible || undefined}
      data-webcam-paused={paused || undefined}
    >
      <header className="ai-overview__header">
        <Sparkles size={17} strokeWidth={1.6} aria-hidden="true" />
        <h2 id="ai-overview-title">AI Overview</h2>
        <button
          className="ai-overview__motion-toggle"
          type="button"
          aria-label={motionLabel}
          title={motionLabel}
          onClick={() => setPaused((current) => !current)}
        >
          {paused ? <Play size={12} aria-hidden="true" /> : <Pause size={12} aria-hidden="true" />}
        </button>
      </header>

      <p className="ai-overview__copy" data-tour-target="positioning" data-tour-focus-block="positioning">
        <TourPageText cps={TOUR_READING_CHARACTERS_PER_SECOND}>
          I build <strong>backends</strong>,{" "}
          <strong className="vision-phrase" ref={phraseRef}>
            <span className="vision-phrase__words">computer vision</span>
            <span className="vision-webcam" aria-hidden="true">
              <span className="vision-webcam__mount" />
              <span className="vision-webcam__head">
                <span className="vision-webcam__face" />
                <span className="vision-webcam__lens" />
                <span className="vision-webcam__light" />
              </span>
            </span>
          </strong>{" "}
          and <strong>machine learning systems</strong>.
        </TourPageText>
      </p>
    </section>
  );
}
