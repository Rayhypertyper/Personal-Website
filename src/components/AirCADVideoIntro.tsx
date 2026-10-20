import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AIRCAD_DEMO } from "../tour-config";
import { TourDemo } from "./TourDemoOverhaul";
import "../aircad-video-intro.css";

const ignore = () => {};
const AIRCAD_INTRO = { ...AIRCAD_DEMO, playbackRate: 1 };

export function AirCADVideoIntro({ onComplete }: { onComplete: () => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const finishingRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(() => document.hidden);
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);

  const prepareProjects = useCallback(() => {
    const media = document.querySelector<HTMLElement>('[data-tour-target="aircad"] .projects-feature__media');
    // Position the destination while it is covered, then use the tour's exit.
    media?.scrollIntoView({ block: "center", behavior: "instant" });
    const cardVideo = media?.querySelector("video");
    const introVideo = stageRef.current?.querySelector("video");
    if (cardVideo && introVideo && cardVideo.readyState >= 1) {
      cardVideo.pause();
      cardVideo.currentTime = introVideo.currentTime;
    }
  }, []);

  const finish = useCallback(() => {
    prepareProjects();
    onComplete();
  }, [onComplete, prepareProjects]);

  useEffect(() => {
    const page = document.getElementById("home");
    if (page) page.inert = true;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(motion.matches);
    const updateVisibility = () => setHidden(document.hidden);
    const skip = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    motion.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    document.addEventListener("keydown", skip);
    return () => {
      if (page) page.inert = false;
      delete document.documentElement.dataset.aircadIntro;
      motion.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
      document.removeEventListener("keydown", skip);
    };
  }, [finish]);

  return createPortal(
    <TourDemo source={AIRCAD_INTRO} presentation="standalone" active paused={paused} hidden={hidden}
      reducedMotion={reducedMotion} stageRef={stageRef} finishingRef={finishingRef}
      onPauseChange={setPaused} onFullscreenChange={ignore}
      onEntered={() => { delete document.documentElement.dataset.aircadIntro; }}
      onPlaybackBlocked={() => setPaused(true)} onBeforeExit={prepareProjects} onAdvance={finish}>
      {paused && !hidden ? (
        <div className="aircad-video-intro__recovery">
          <button type="button" onClick={() => setPaused(false)}>Play AirCAD demo</button>
          <button type="button" onClick={finish}>View projects</button>
        </div>
      ) : null}
    </TourDemo>,
    document.body,
  );
}
