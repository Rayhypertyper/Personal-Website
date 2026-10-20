import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TourDemo, type TourDemoSource } from "./TourDemoOverhaul";
import "../keyboard-video-intro.css";

const KEYBOARD_CLIP: TourDemoSource = {
  stopId: "keyboard",
  src: "/invisible-keyboard-demo.mp4",
  poster: "/invisible-keyboard-intro-poster.jpg",
  title: "Invisible Keyboard",
  start: 42,
  end: 63,
  playbackRate: 1.5,
};

export function KeyboardVideoIntro({ onComplete }: { onComplete: () => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const finishingRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const page = document.getElementById("home");
    if (page) page.inert = true;
    const onVisibilityChange = () => setHidden(document.hidden);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onComplete();
    };
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => setReducedMotion(motion.matches);
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("keydown", onKeyDown);
    motion.addEventListener("change", onMotionChange);

    // The card receives the last frame before the fullscreen player shrinks into it.
    const cardVideo = document.querySelector<HTMLVideoElement>('[data-tour-target="keyboard"] video');
    const prepareCard = () => { if (cardVideo) cardVideo.currentTime = KEYBOARD_CLIP.end!; };
    if (cardVideo && cardVideo.readyState >= 1) prepareCard();
    else cardVideo?.addEventListener("loadedmetadata", prepareCard, { once: true });

    return () => {
      if (page) page.inert = false;
      delete document.documentElement.dataset.keyboardIntro;
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('[data-filter-tab][aria-selected="true"]')?.focus({ preventScroll: true });
      });
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("keydown", onKeyDown);
      motion.removeEventListener("change", onMotionChange);
      cardVideo?.removeEventListener("loadedmetadata", prepareCard);
    };
  }, [onComplete]);

  return createPortal(
    <TourDemo source={KEYBOARD_CLIP} presentation="standalone" active paused={paused} hidden={hidden}
      reducedMotion={reducedMotion} stageRef={stageRef} finishingRef={finishingRef}
      onPauseChange={setPaused} onFullscreenChange={() => {}}
      onEntered={() => { delete document.documentElement.dataset.keyboardIntro; }}
      onPlaybackBlocked={() => { setBlocked(true); setPaused(true); }} onAdvance={onComplete}>
      {blocked ? <button className="keyboard-video-intro__play" type="button" onClick={() => { setBlocked(false); setPaused(false); }}>Play video</button> : null}
    </TourDemo>,
    document.body,
  );
}
