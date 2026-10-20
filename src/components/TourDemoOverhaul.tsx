import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

export interface TourDemoSource {
  stopId: string;
  src: string;
  poster: string;
  title: string;
  start: number;
  end?: number;
  origin?: HTMLElement;
}
interface TourDemoProps {
  source: TourDemoSource;
  active: boolean;
  paused: boolean;
  hidden: boolean;
  reducedMotion: boolean;
  stageRef: RefObject<HTMLDivElement | null>;
  finishingRef: RefObject<boolean>;
  onPauseChange: (paused: boolean) => void;
  onFullscreenChange: (fullscreen: boolean) => void;
  onPlaybackBlocked: () => void;
  onEntered: () => void;
  onAdvance: () => void;
  presentation?: "tour" | "standalone";
  children?: ReactNode;
}

export function TourDemo({ source, active, paused, hidden, reducedMotion, stageRef, finishingRef, onPauseChange, onFullscreenChange, onPlaybackBlocked, onEntered, onAdvance, presentation = "tour", children }: TourDemoProps) {
  const standalone = presentation === "standalone";
  const entranceTimingScale = source.stopId === "keyboard" ? 0.5 : 1;
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const progressRef = useRef<HTMLElement>(null);
  const readyRef = useRef(false);
  const enteredRef = useRef(false);
  const activatedRef = useRef(false);
  const doneRef = useRef(false);
  const failedRef = useRef(false);
  const mountedRef = useRef(true);
  const suppressPauseRef = useRef(false);
  const motionRef = useRef<Animation | null>(null);
  const progressAnimationRef = useRef<Animation | null>(null);
  const previousMousePositionRef = useRef<{ x: number; y: number } | null>(null);
  const [posterHidden, setPosterHidden] = useState(false);
  const [phase, setPhase] = useState("preparing");
  const [controlsRevealed, setControlsRevealed] = useState(false);
  const playbackStateRef = useRef({ active, paused, hidden });
  const actionsRef = useRef({ onAdvance, onPlaybackBlocked, onFullscreenChange, onEntered });
  const controlsEnabled = controlsRevealed && active && !hidden && phase === "entered";
  const revealControls = () => {
    if (active && !hidden && phase === "entered") setControlsRevealed(true);
  };
  useEffect(() => { playbackStateRef.current = { active, paused, hidden }; }, [active, paused, hidden]);
  useEffect(() => { actionsRef.current = { onAdvance, onPlaybackBlocked, onFullscreenChange, onEntered }; }, [onAdvance, onPlaybackBlocked, onFullscreenChange, onEntered]);
  useEffect(() => {
    if (!active || hidden) setControlsRevealed(false);
  }, [active, hidden]);
  useEffect(() => {
    const trackMouseMovement = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const previous = previousMousePositionRef.current;
      const moved = previous
        ? event.clientX !== previous.x || event.clientY !== previous.y
        : event.movementX !== 0 || event.movementY !== 0;
      previousMousePositionRef.current = { x: event.clientX, y: event.clientY };
      if (!moved || event.target !== videoRef.current || !active || hidden || phase !== "entered") return;
      setControlsRevealed(true);
    };
    document.addEventListener("pointermove", trackMouseMovement, { passive: true });
    return () => document.removeEventListener("pointermove", trackMouseMovement);
  }, [active, hidden, phase]);

  const play = () => {
    const state = playbackStateRef.current;
    if (!readyRef.current || !enteredRef.current || videoRef.current?.seeking || doneRef.current || !state.active || state.paused || state.hidden) return;
    void videoRef.current?.play().catch(() => {
      const current = playbackStateRef.current;
      if (mountedRef.current && current.active && !current.paused && !current.hidden && !doneRef.current) actionsRef.current.onPlaybackBlocked();
    });
  };
  const pauseVideo = () => {
    suppressPauseRef.current = true;
    videoRef.current?.pause();
    progressAnimationRef.current?.pause();
  };

  /** Fit the real video inside its player; FLIP the fitted image onto its card. */
  const expansion = () => {
    const stage = stageRef.current;
    const video = videoRef.current;
    if (!stage || !video) return [{ opacity: 0 }, { opacity: 1 }];
    const bounds = stage.getBoundingClientRect();
    const player = video.getBoundingClientRect();
    const aspect = video.videoWidth / video.videoHeight || 2940 / 1524;
    const width = Math.min(player.width, player.height * aspect);
    const height = width / aspect;
    const left = player.left - bounds.left + (player.width - width) / 2;
    const top = player.top - bounds.top + (player.height - height) / 2;
    if (posterRef.current) Object.assign(posterRef.current.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` });
    if (progressRef.current) Object.assign(progressRef.current.style, { left: `${left}px`, top: `${top + height - 2}px`, width: `${width}px` });
    const originElement = source.origin?.isConnected ? source.origin : document.querySelector<HTMLElement>(`[data-tour-target="${source.stopId}"] .projects-feature__media`);
    const origin = originElement?.getBoundingClientRect();
    if (!origin || !width || !origin.width || reducedMotion) return [{ opacity: 0 }, { opacity: 1 }];
    const scale = origin.width / width;
    return [
      { transform: `translate(${origin.left - bounds.left - left * scale}px, ${origin.top - bounds.top - top * scale}px) scale(${scale})`,
        clipPath: `inset(${top}px ${Math.max(0, bounds.width - left - width)}px ${Math.max(0, bounds.height - top - height)}px ${left}px round ${12 / scale}px)` },
      { transform: "none", clipPath: "inset(0px round 0px)" },
    ];
  };

  useEffect(() => {
    mountedRef.current = true;
    const video = videoRef.current;
    const progress = progressRef.current;
    if (!video) return;
    const prepare = () => {
      video.defaultPlaybackRate = standalone ? 1 : source.stopId === "aircad" ? 1.65 : source.stopId === "keyboard" ? 1.5 : 1;
      video.playbackRate = video.defaultPlaybackRate;
      video.currentTime = Math.min(source.start, Math.max(0, video.duration - 0.1));
      readyRef.current = true;
      const duration = Math.max(1, ((source.end ?? video.duration) - source.start) * 1000);
      if (progress) {
        progressAnimationRef.current = progress.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration, easing: "linear", fill: "both" });
        progressAnimationRef.current.pause();
      }
      play();
    };
    if (video.readyState >= 1) prepare();
    else video.addEventListener("loadedmetadata", prepare, { once: true });
    return () => {
      mountedRef.current = false;
      video.removeEventListener("loadedmetadata", prepare);
      suppressPauseRef.current = true;
      video.pause();
      motionRef.current?.cancel();
      progressAnimationRef.current?.cancel();
    };
  }, [source]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const update = () => {
      const fullscreen = document.fullscreenElement === stage;
      actionsRef.current.onFullscreenChange(fullscreen);
      stage.dataset.fullscreenMode = fullscreen ? "native" : "viewport";
    };
    update();
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, [stageRef]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (!active || paused || hidden) {
      pauseVideo();
      // A suspended entrance lands at its final layout; resuming never replays it.
      if (activatedRef.current && !enteredRef.current) {
        motionRef.current?.cancel();
        stage.style.willChange = "";
        enteredRef.current = true;
        setPhase("entered");
        setPosterHidden(true);
        actionsRef.current.onEntered();
      }
      if (doneRef.current) motionRef.current?.pause();
      return;
    }
    if (doneRef.current) { motionRef.current?.play(); return; }
    if (failedRef.current) { finishDemo(); return; }
    if (activatedRef.current) { expansion(); play(); return; }
    activatedRef.current = true;
    if (standalone) {
      expansion();
      enteredRef.current = true;
      setPhase("entered");
      setPosterHidden(true);
      actionsRef.current.onEntered();
      play();
      return;
    }
    setPhase("expanding");
    stage.style.willChange = "transform, clip-path";
    const animation = stage.animate(expansion(), { duration: (reducedMotion ? 120 : 520) * entranceTimingScale, easing: "cubic-bezier(0.16,1,0.3,1)", fill: "both" });
    motionRef.current = animation;
    void animation.finished.then(() => {
      if (!mountedRef.current || enteredRef.current) return;
      animation.cancel();
      stage.style.willChange = "";
      enteredRef.current = true;
      setPhase("entered");
      actionsRef.current.onEntered();
      const fade = posterRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reducedMotion ? 0 : 200 * entranceTimingScale, fill: "both" });
      motionRef.current = fade ?? null;
      return fade?.finished.then(() => { if (mountedRef.current) { setPosterHidden(true); play(); } }).catch(() => {});
    }).catch(() => {});
  }, [active, paused, hidden, reducedMotion]);

  useEffect(() => {
    const video = videoRef.current;
    const end = source.end;
    if (!standalone || !active || paused || hidden || !video || typeof end !== "number" || !video.requestVideoFrameCallback) return;
    let frameId: number;
    const checkEnd = (_now: number, frame: VideoFrameCallbackMetadata) => {
      if (frame.mediaTime >= end) finishDemo();
      else frameId = video.requestVideoFrameCallback(checkEnd);
    };
    frameId = video.requestVideoFrameCallback(checkEnd);
    return () => video.cancelVideoFrameCallback(frameId);
  }, [standalone, active, paused, hidden, source.end]);

  useEffect(() => {
    const resize = () => {
      // Finish a viewport-dependent entrance when its geometry changes.
      if (activatedRef.current && !enteredRef.current) {
        motionRef.current?.cancel();
        enteredRef.current = true;
        setPhase("entered");
        setPosterHidden(true);
        actionsRef.current.onEntered();
        if (stageRef.current) stageRef.current.style.willChange = "";
        play();
      }
      if (enteredRef.current && !doneRef.current) expansion();
    };
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [reducedMotion]);

  const syncProgress = (playing: boolean) => {
    const video = videoRef.current;
    const animation = progressAnimationRef.current;
    if (!video || !animation) return;
    animation.playbackRate = video.playbackRate;
    animation.currentTime = Math.max(0, (video.currentTime - source.start) * 1000);
    if (playing) animation.play(); else animation.pause();
  };
  const finishDemo = () => {
    if (doneRef.current || finishingRef.current) return;
    doneRef.current = true;
    finishingRef.current = true;
    pauseVideo();
    const stage = stageRef.current;
    if (!stage || failedRef.current || reducedMotion || document.fullscreenElement === stage) {
      actionsRef.current.onAdvance();
      return;
    }
    motionRef.current?.cancel();
    setPhase("leaving");
    stage.style.willChange = "transform, clip-path";
    const animation = stage.animate(expansion().reverse(), { duration: 320, easing: "cubic-bezier(0.7,0,0.84,0)", fill: "both" });
    motionRef.current = animation;
    void animation.finished.then(() => {
      if (mountedRef.current) actionsRef.current.onAdvance();
    }).catch(() => {});
  };

  const hasCaption = !standalone && source.stopId === "keyboard";
  return (
    <div className={`guided-tour-video${active ? "" : " guided-tour-video--preparing"}${hasCaption ? " guided-tour-video--captioned" : ""}${standalone ? " guided-tour-video--standalone" : ""}`}
      data-tour-video data-poster-hidden={posterHidden} data-tour-video-active={active} data-demo-phase={phase} data-fullscreen-mode="viewport"
      aria-hidden={!active} inert={!active || hidden} role="region" aria-label={`${source.title} ${standalone ? "demo" : "tour demo"}`} ref={stageRef}>
      <video ref={videoRef} className="guided-tour-video__player" src={source.src} poster={source.poster}
        aria-label={`${source.title} ${standalone ? "video" : "tour video"}`} controls={controlsEnabled} muted playsInline preload="auto"
        controlsList={standalone ? "nofullscreen noremoteplayback" : undefined} disablePictureInPicture={standalone}
        tabIndex={controlsEnabled ? undefined : 0}
        onFocus={revealControls}
        onClick={revealControls}
        onPointerDown={(event) => { if (event.pointerType !== "mouse") revealControls(); }}
        onEnded={() => { if (active) finishDemo(); }}
        onError={() => { failedRef.current = true; if (active) finishDemo(); }}
        onTimeUpdate={() => {
          syncProgress(Boolean(videoRef.current && !videoRef.current.paused));
          if (active && typeof source.end === "number" && (videoRef.current?.currentTime ?? 0) >= source.end) finishDemo();
        }}
        onSeeking={() => syncProgress(false)}
        onSeeked={() => { syncProgress(Boolean(videoRef.current && !videoRef.current.paused)); play(); }}
        onWaiting={() => syncProgress(false)}
        onPlaying={() => syncProgress(true)}
        onPause={() => {
          syncProgress(false);
          if (suppressPauseRef.current) { suppressPauseRef.current = false; return; }
          if (active && readyRef.current && enteredRef.current && !finishingRef.current && !videoRef.current?.ended && !paused && !hidden) onPauseChange(true);
        }}
        onPlay={() => { suppressPauseRef.current = false; syncProgress(true); if (active && paused && !hidden) onPauseChange(false); }} />
      <img ref={posterRef} className="guided-tour-video__poster" src={source.poster} alt="" aria-hidden="true" />
      {!standalone ? <i ref={progressRef} className="guided-tour-video__progress" aria-hidden="true" /> : null}
      {hasCaption ? <p className="guided-tour-video__caption">Invisible Keyboard <span>demo</span></p> : null}
      {children}
    </div>
  );
}
