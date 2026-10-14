import { useEffect, useRef, type ReactNode, type RefObject } from "react";

export interface TourDemoSource {
  stopId: string;
  src: string;
  poster: string;
  title: string;
  start: number;
  end?: number;
}
interface TourDemoProps {
  source: TourDemoSource;
  active: boolean;
  paused: boolean;
  hidden: boolean;
  stageRef: RefObject<HTMLDivElement | null>;
  finishingRef: RefObject<boolean>;
  onPauseChange: (paused: boolean) => void;
  onFullscreenChange: (fullscreen: boolean) => void;
  onPlaybackBlocked: () => void;
  onAdvance: () => void;
  children: ReactNode;
}

/** Pre-plan prepared demo, including its original native-fullscreen attempt. */
export function TourDemo({ source, active, paused, hidden, stageRef, finishingRef, onPauseChange, onFullscreenChange, onPlaybackBlocked, onAdvance, children }: TourDemoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readyRef = useRef(false);
  const doneRef = useRef(false);
  const failedRef = useRef(false);
  const playbackStateRef = useRef({ active, paused, hidden });
  const actionsRef = useRef({ onAdvance, onPlaybackBlocked, onFullscreenChange });

  useEffect(() => { actionsRef.current = { onAdvance, onPlaybackBlocked, onFullscreenChange }; }, [onAdvance, onPlaybackBlocked, onFullscreenChange]);
  useEffect(() => { playbackStateRef.current = { active, paused, hidden }; }, [active, paused, hidden]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !active) { actionsRef.current.onFullscreenChange(false); return; }
    let disposed = false;
    let requestFrame = 0;
    const updateFullscreen = () => {
      const fullscreen = document.fullscreenElement === stage;
      actionsRef.current.onFullscreenChange(fullscreen);
      stage.dataset.fullscreenMode = fullscreen ? "native" : "viewport";
    };
    document.addEventListener("fullscreenchange", updateFullscreen);
    requestFrame = requestAnimationFrame(() => {
      if (!disposed && stage.requestFullscreen && !document.fullscreenElement) {
        void stage.requestFullscreen().catch(() => { if (!disposed) stage.dataset.fullscreenMode = "viewport"; });
      }
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(requestFrame);
      document.removeEventListener("fullscreenchange", updateFullscreen);
      if (document.fullscreenElement === stage) void document.exitFullscreen().catch(() => {});
    };
  }, [active, source.stopId, stageRef, finishingRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let disposed = false;
    const prepare = () => {
      video.defaultPlaybackRate = source.stopId === "aircad" ? 1.65 : source.stopId === "keyboard" ? 1.5 : 1;
      video.playbackRate = video.defaultPlaybackRate;
      video.currentTime = Math.min(source.start, Math.max(0, video.duration - 0.1));
      readyRef.current = true;
      if (playbackStateRef.current.active && !playbackStateRef.current.paused && !playbackStateRef.current.hidden) {
        void video.play().catch(() => {
          if (!disposed && playbackStateRef.current.active && !playbackStateRef.current.paused && !playbackStateRef.current.hidden) actionsRef.current.onPlaybackBlocked();
        });
      }
    };
    if (video.readyState >= 1) prepare();
    else video.addEventListener("loadedmetadata", prepare, { once: true });
    return () => {
      disposed = true;
      readyRef.current = false;
      video.removeEventListener("loadedmetadata", prepare);
      video.pause();
    };
  }, [source]);

  useEffect(() => {
    const video = videoRef.current;
    if (active && failedRef.current) { finishDemo(); return; }
    if (!video || !readyRef.current) return;
    let disposed = false;
    if (!active || paused || hidden) video.pause();
    else void video.play().catch(() => { if (!disposed) actionsRef.current.onPlaybackBlocked(); });
    return () => { disposed = true; };
  }, [active, paused, hidden]);

  const finishDemo = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    finishingRef.current = true;
    videoRef.current?.pause();
    actionsRef.current.onAdvance();
  };
  const hasCaption = source.stopId === "keyboard";
  return (
    <div className={`guided-tour-video${active ? "" : " guided-tour-video--preparing"}${hasCaption ? " guided-tour-video--captioned" : ""}`}
      data-tour-video data-tour-video-active={active} data-fullscreen-mode="viewport" aria-hidden={!active}
      role="region" aria-label={`${source.title} tour demo`} ref={stageRef}>
      <video ref={videoRef} className="guided-tour-video__player" src={source.src} poster={source.poster}
        aria-label={`${source.title} fullscreen demo`} controls muted playsInline preload="auto"
        onEnded={() => { if (active) finishDemo(); }}
        onError={() => { failedRef.current = true; if (active) finishDemo(); }}
        onTimeUpdate={() => { if (active && typeof source.end === "number" && (videoRef.current?.currentTime ?? 0) >= source.end) finishDemo(); }}
        onPause={() => {
          const video = videoRef.current;
          if (active && readyRef.current && !finishingRef.current && !video?.ended && !paused && !hidden) onPauseChange(true);
        }}
        onPlay={() => { if (active && paused && !hidden) onPauseChange(false); }} />
      {hasCaption ? <p className="guided-tour-video__caption">Invisible Keyboard <span>demo</span></p> : null}
      {children}
    </div>
  );
}
