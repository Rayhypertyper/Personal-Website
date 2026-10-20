import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AIRCAD_DEMO } from "../tour-config";
import { TourDemo } from "./TourDemoOverhaul";
import "../aircad-video-intro.css";

const ignore = () => {};
const AIRCAD_INTRO = { ...AIRCAD_DEMO, end: 40, playbackRate: 1 };

export function AirCADVideoIntro({ onComplete }: { onComplete: () => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const finishingRef = useRef(false);
  const awaitingGestureRef = useRef(true);
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

  const awaitPlaybackGesture = useCallback(() => {
    awaitingGestureRef.current = true;
  }, []);

  useEffect(() => {
    const page = document.getElementById("home");
    if (page) page.inert = true;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(motion.matches);
    const updateVisibility = () => setHidden(document.hidden);
    const enableSound = () => {
      if (!awaitingGestureRef.current || finishingRef.current) return;
      const video = stageRef.current?.querySelector("video");
      if (!video) return;
      if (!video.paused) { awaitingGestureRef.current = false; return; }
      video.muted = false;
      setPaused(false);
      void video.play().then(() => {
        awaitingGestureRef.current = false;
      }).catch(awaitPlaybackGesture);
    };
    const skip = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
      else enableSound();
    };
    motion.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    document.addEventListener("keydown", skip);
    document.addEventListener("pointerdown", enableSound, true);
    return () => {
      if (page) page.inert = false;
      delete document.documentElement.dataset.aircadIntro;
      motion.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
      document.removeEventListener("keydown", skip);
      document.removeEventListener("pointerdown", enableSound, true);
    };
  }, [finish, awaitPlaybackGesture]);

  return createPortal(
    <TourDemo source={AIRCAD_INTRO} presentation="standalone" muted={false} active paused={paused} hidden={hidden}
      reducedMotion={reducedMotion} stageRef={stageRef} finishingRef={finishingRef}
      onPauseChange={setPaused} onFullscreenChange={ignore}
      onEntered={() => { delete document.documentElement.dataset.aircadIntro; }}
      onPlaybackBlocked={awaitPlaybackGesture} onBeforeExit={prepareProjects} onAdvance={finish} />,
    document.body,
  );
}
