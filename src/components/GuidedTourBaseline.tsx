import { ArrowLeft, ArrowRight, Check, Maximize, Pause, Play, X } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { FilterName } from "./FilterTabs";
import { TourDemo, type TourDemoSource } from "./TourDemo";
import { TourTypedText, type TourTextRun } from "./TourTypedText";
import { useStepTimer } from "../hooks/useStepTimer";
import { TOUR_CHARACTERS_PER_SECOND, useTourTypewriter } from "../hooks/useTourTypewriter";
import "../guided-tour.css";

export const TOUR_STOPS = [
  {
    id: "identity",
    filter: "All",
    title: "Ray Xu",
    durationSeconds: 3,
    readingPauseMs: 600,
  },
  {
    id: "positioning",
    filter: "All",
    title: "What I build",
    durationSeconds: 4,
    readingPauseMs: 700,
  },
  {
    id: "keyboard",
    filter: "Projects",
    title: "Invisible Keyboard",
    videoStart: 50,
    videoEnd: 62.55,
    durationSeconds: 3,
    readingPauseMs: 750,
  },
  {
    id: "aircad",
    filter: "Projects",
    title: "AirCAD",
    videoStart: 30.5,
    videoEnd: 36,
    videoTitle: "AirCAD",
    durationSeconds: 3,
    readingPauseMs: 0,
  },
  {
    id: "experience",
    filter: "Experience",
    title: "Nokia",
    durationSeconds: 5,
    readingPauseMs: 900,
  },
  {
    id: "contact",
    filter: "Contact",
    title: "Want to talk?",
    durationSeconds: 0.3,
    readingPauseMs: 300,
  },
] satisfies Array<{
  id: string;
  filter: FilterName;
  title: string;
  videoStart?: number;
  videoEnd?: number;
  videoTitle?: string;
  durationSeconds: number;
  readingPauseMs: number;
}>;

interface GuidedTourProps {
  stopIndex: number;
  paused: boolean;
  onPauseChange: (paused: boolean) => void;
  onNavigate: (index: number) => void;
  onExit: (restoreFocus?: boolean) => void;
  onComplete: (restoreFocus?: boolean) => void;
}

interface SpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PageTextTarget {
  host: HTMLElement;
  text: string;
  offset: number;
  runs: TourTextRun[];
  blockId: string;
}

interface PageFocusBlock {
  id: string;
  elements: (HTMLElement | SVGElement)[];
}

function getFocusRect(block: PageFocusBlock): SpotlightRect {
  // Responsive layouts may hide decorative members of the focus block.
  const bounds = block.elements.filter((element) => element.getClientRects().length > 0)
    .map((element) => element.getBoundingClientRect());
  if (bounds.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  const left = Math.min(...bounds.map((item) => item.left));
  const top = Math.min(...bounds.map((item) => item.top));
  const right = Math.max(...bounds.map((item) => item.right));
  const bottom = Math.max(...bounds.map((item) => item.bottom));
  return { x: left - 8, y: top - 8, width: right - left + 16, height: bottom - top + 16 };
}

function getTextRuns(original: HTMLElement): TourTextRun[] {
  const runs: TourTextRun[] = [];
  const walk = (node: Node, strong: boolean) => {
    if (node.nodeType === Node.TEXT_NODE) {
      runs.push({ text: node.textContent ?? "", strong });
      return;
    }
    for (const child of node.childNodes) walk(child, strong || (node instanceof Element && node.tagName === "STRONG"));
  };
  walk(original, false);
  return runs;
}

function getScrollContainer(target: Element): HTMLElement | null {
  let parent = target.parentElement;
  while (parent && parent !== document.body && parent !== document.documentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY) && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

export function GuidedTour({ stopIndex, paused, onPauseChange, onNavigate, onExit, onComplete }: GuidedTourProps) {
  const stop = TOUR_STOPS[stopIndex];
  const panelRef = useRef<HTMLElement>(null);
  const demoStageRef = useRef<HTMLDivElement>(null);
  const finishingVideoRef = useRef(false);
  const transitioningRef = useRef(false);
  const videoPhaseRef = useRef(false);
  const maskId = useId().replaceAll(":", "");
  const [spotlight, setSpotlight] = useState<{
    stopId: string;
    blockId: string;
    rect: SpotlightRect;
    planetRect?: SpotlightRect;
    labelRect?: SpotlightRect;
  } | null>(null);
  const [pageText, setPageText] = useState<{ stopId: string; targets: PageTextTarget[]; blocks: PageFocusBlock[] }>({ stopId: "", targets: [], blocks: [] });
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [demo, setDemo] = useState<TourDemoSource | null>(null);
  const [demoActive, setDemoActive] = useState(false);
  const isVideoPhase = demoActive && demo?.stopId === stop.id;
  const isVideoVisible = isVideoPhase && !paused;
  videoPhaseRef.current = isVideoPhase;
  const isLastStop = stopIndex === TOUR_STOPS.length - 1;
  const textTargets = pageText.stopId === stop.id ? pageText.targets : [];
  const textReady = textTargets.length > 0;
  const typingLength = textTargets.reduce((sum, item) => sum + item.text.length, 0);
  const isMetricBlock = spotlight?.stopId === "keyboard" && ["keyboard-precision", "keyboard-recall", "keyboard-fps"].includes(spotlight.blockId);
  const typing = useTourTypewriter(stop.id, typingLength, textReady && spotlight?.stopId === stop.id && !paused && !hidden && !isVideoPhase,
    isMetricBlock ? 16 : TOUR_CHARACTERS_PER_SECOND);
  // At a text boundary the next block owns the cursor and the only spotlight.
  const activeText = textTargets.find((item) => typing.characters < item.offset + item.text.length) ?? textTargets.at(-1);
  const activeBlock = pageText.stopId === stop.id ? pageText.blocks.find((block) => block.id === activeText?.blockId) : undefined;
  const rect = activeBlock?.elements.every((element) => element.isConnected)
    && spotlight?.stopId === stop.id && spotlight.blockId === activeBlock.id ? spotlight.rect : null;

  const planetRect = rect ? spotlight?.planetRect : undefined;
  const labelRect = rect ? spotlight?.labelRect : undefined;
  const planetRadius = planetRect ? Math.max(planetRect.width, planetRect.height) / 2 : 0;
  const planetCenter = planetRect ? { x: planetRect.x + planetRect.width / 2, y: planetRect.y + planetRect.height / 2 } : null;

  const transition = (action: () => void) => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    finishingVideoRef.current = true;
    if (demoStageRef.current && document.fullscreenElement === demoStageRef.current) {
      void document.exitFullscreen().catch(() => {}).then(action);
    } else {
      action();
    }
  };

  const navigate = (index: number) => transition(() => onNavigate(index));
  const exit = (restoreFocus = true) => transition(() => onExit(restoreFocus));
  const complete = (restoreFocus = true) => transition(() => onComplete(restoreFocus));
  const advance = () => isLastStop ? complete() : navigate(stopIndex + 1);

  const startDemo = () => {
    if (transitioningRef.current) return;
    if (demo?.stopId !== stop.id) {
      advance();
      return;
    }
    finishingVideoRef.current = false;
    setPlaybackBlocked(false);
    setNativeFullscreen(false);
    setDemoActive(true);
  };

  useStepTimer(`${stop.id}:typed`, typing.reducedMotion ? stop.durationSeconds * 1000 : stop.readingPauseMs,
    textReady && typing.complete && Boolean(rect) && !paused && !hidden && !isVideoPhase,
    () => typeof stop.videoStart === "number" ? startDemo() : advance());

  useEffect(() => {
    transitioningRef.current = false;
    finishingVideoRef.current = false;
    setPlaybackBlocked(false);
    setDemoActive(false);
    const target = document.querySelector<HTMLElement>(`[data-tour-target="${stop.id}"]`);

    // Mount, download, and seek the viewport player during the explanation.
    const video = target?.querySelector<HTMLVideoElement>("video");
    const src = video?.currentSrc || video?.querySelector("source")?.src;
    if (video && src && typeof stop.videoStart === "number") {
      video.pause();
      setDemo({ stopId: stop.id, src, poster: video.poster, title: stop.videoTitle ?? stop.title, start: stop.videoStart, end: stop.videoEnd });
    } else {
      setDemo(null);
    }
  }, [stop.id]);

  useEffect(() => {
    if (paused) return;
    // Browsing while paused may replace the page; reconnect to its new hosts.
    const target = document.querySelector<HTMLElement>(`[data-tour-target="${stop.id}"]`);
    const focusElements = target ? [target, ...target.querySelectorAll<HTMLElement | SVGElement>("[data-tour-focus-block]")] : [];
    const blocks: PageFocusBlock[] = [];
    let textOffset = 0;
    const targets = Array.from(target?.querySelectorAll<HTMLElement>("[data-tour-text-host]") ?? []).map((host) => {
      const original = host.querySelector<HTMLElement>(".tour-page-text__original");
      const runs = original ? getTextRuns(original) : [];
      const text = runs.map((run) => run.text).join("");
      const focusElement = host.closest<HTMLElement>("[data-tour-focus-block]") ?? host;
      const blockId = focusElement.dataset.tourFocusBlock ?? `text-${blocks.length}`;
      if (!blocks.some((block) => block.id === blockId)) {
        blocks.push({ id: blockId, elements: focusElement.dataset.tourFocusBlock
          ? focusElements.filter((element) => element.dataset.tourFocusBlock === blockId)
          : [focusElement] });
      }
      const item = { host, text, offset: textOffset, runs, blockId };
      textOffset += text.length;
      return item;
    });
    setPageText({ stopId: stop.id, targets, blocks });
  }, [stop.id, paused]);

  useEffect(() => {
    const updateVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (isVideoVisible) panelRef.current?.focus({ preventScroll: true });
  }, [isVideoVisible]);

  useLayoutEffect(() => {
    document.documentElement.dataset.tourPresent = "true";
    if (!paused) document.documentElement.dataset.tourStop = stop.id;
    return () => {
      delete document.documentElement.dataset.tourPresent;
      delete document.documentElement.dataset.tourStop;
    };
  }, [stop.id, paused]);

  useLayoutEffect(() => {
    if (paused || hidden || !activeBlock) return;
    const firstElement = activeBlock.elements[0];
    const isPlanet = firstElement.matches(".contact-planet");
    let frame = 0;
    let trackingFrame = 0;
    let scrollFrame = 0;
    let settleFrame = 0;
    let guidingScroll = true;
    let disposed = false;

    const measure = () => {
      if (disposed) return;
      setSpotlight({
        stopId: stop.id,
        blockId: activeBlock.id,
        rect: getFocusRect(activeBlock),
        planetRect: isPlanet ? getFocusRect({ id: activeBlock.id, elements: [firstElement] }) : undefined,
        labelRect: isPlanet ? getFocusRect({ id: activeBlock.id, elements: activeBlock.elements.slice(1) }) : undefined,
      });
    };

    if (isPlanet) {
      firstElement.dataset.tourPlanetActive = "true";
      const trackPlanet = () => {
        measure();
        trackingFrame = requestAnimationFrame(trackPlanet);
      };
      trackingFrame = requestAnimationFrame(trackPlanet);
    }

    const scheduleMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    const onPageScroll = (event: Event) => {
      if (videoPhaseRef.current || transitioningRef.current) return;
      scheduleMeasure();
      if (!guidingScroll && !(event.target instanceof Node && panelRef.current?.contains(event.target))) {
        if (stop.id === "contact") onComplete(false);
        else onExit(false);
      }
    };

    // Measure before paint so an upcoming block is never highlighted early.
    measure();
    scrollFrame = requestAnimationFrame(() => {
      const panel = panelRef.current;
      const bounds = getFocusRect(activeBlock);
      const panelBounds = panel?.getBoundingClientRect();
      const panelAtTop = panelBounds && panelBounds.top < window.innerHeight / 2;
      const safeTop = panelAtTop ? panelBounds.bottom + 32 : 24;
      const safeBottom = panelAtTop ? window.innerHeight - 24 : (panelBounds?.top ?? window.innerHeight - 140) - 40;
      const container = getScrollContainer(firstElement);
      const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";

      // Keep the final checkpoint stationary as its planet labels type.
      // Earlier checkpoints scroll only when the active text needs room.
      if (!isLastStop && (bounds.y < safeTop || bounds.y + bounds.height > safeBottom)) {
        const desiredTop = safeTop + Math.max(0, (safeBottom - safeTop - bounds.height) / 2);
        const delta = bounds.y - desiredTop;
        if (container) container.scrollTo({ top: container.scrollTop + delta, behavior });
        else window.scrollTo({ top: window.scrollY + delta, behavior });
      }
      let lastPosition = container?.scrollTop ?? window.scrollY;
      let stableFrames = 0;
      const waitForScrollToSettle = () => {
        const position = container?.scrollTop ?? window.scrollY;
        stableFrames = Math.abs(position - lastPosition) < 0.5 ? stableFrames + 1 : 0;
        lastPosition = position;
        if (stableFrames >= 6) guidingScroll = false;
        else settleFrame = requestAnimationFrame(waitForScrollToSettle);
      };
      settleFrame = requestAnimationFrame(waitForScrollToSettle);
      measure();
      if (panel && !panel.contains(document.activeElement)) panel.focus({ preventScroll: true });
    });

    const observer = new ResizeObserver(scheduleMeasure);
    activeBlock.elements.forEach((element) => observer.observe(element));
    if (panelRef.current) observer.observe(panelRef.current);
    window.addEventListener("scroll", onPageScroll, true);
    window.addEventListener("resize", scheduleMeasure);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(trackingFrame);
      cancelAnimationFrame(scrollFrame);
      cancelAnimationFrame(settleFrame);
      observer.disconnect();
      window.removeEventListener("scroll", onPageScroll, true);
      window.removeEventListener("resize", scheduleMeasure);
      if (isPlanet) delete firstElement.dataset.tourPlanetActive;
    };
  }, [activeBlock, stop.id, isLastStop, paused, hidden, onExit, onComplete]);

  useEffect(() => {
    const exitIntoPage = () => isLastStop ? complete(false) : exit(false);
    const isTourControl = (target: EventTarget | null) => target instanceof Node
      && (panelRef.current?.contains(target) || (target instanceof Element && target.closest("[data-tour-video]")));
    const onScrollIntent = (event: Event) => {
      if (!paused && !videoPhaseRef.current && !isTourControl(event.target)) exitIntoPage();
    };
    const onPageClick = (event: MouseEvent) => {
      if (!paused && !isTourControl(event.target)) exitIntoPage();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        exit();
        return;
      }
      if (paused && !isTourControl(event.target)) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.target instanceof Element && event.target.closest("input, textarea, select, video, [contenteditable='true']")) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        advance();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (stopIndex > 0) navigate(stopIndex - 1);
      } else if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key) && !isTourControl(event.target)) {
        exitIntoPage();
      }
    };

    window.addEventListener("wheel", onScrollIntent, { passive: true });
    window.addEventListener("touchmove", onScrollIntent, { passive: true });
    document.addEventListener("click", onPageClick, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("wheel", onScrollIntent);
      window.removeEventListener("touchmove", onScrollIntent);
      document.removeEventListener("click", onPageClick, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [stopIndex, isLastStop, isVideoPhase, paused, onNavigate, onExit, onComplete]);

  const controls = (
    <aside className={`guided-tour${isVideoVisible ? " guided-tour--video" : ""}`} aria-label="Guided portfolio tour" ref={panelRef} tabIndex={-1}>
      <div className="guided-tour__progress-row">
        <nav className="guided-tour__dots" aria-label="Tour progress">
          {TOUR_STOPS.map((item, index) => (
            <button key={item.id} className={`guided-tour__dot${index < stopIndex ? " is-visited" : ""}`} type="button"
              aria-label={`Stop ${index + 1} of ${TOUR_STOPS.length}: ${item.title}`}
              aria-current={index === stopIndex ? "step" : undefined}
              onClick={() => { if (index !== stopIndex) navigate(index); }}><span /></button>
          ))}
        </nav>
        <button className="guided-tour__skip" type="button" onClick={() => exit()} aria-label="Skip tour">
          Skip <X size={14} aria-hidden="true" />
        </button>
      </div>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">Stop {stopIndex + 1} of {TOUR_STOPS.length}. {stop.title}</span>
      {playbackBlocked ? <p className="guided-tour__hint" role="status">Press Resume to play the demo.</p> : null}
      <div className="guided-tour__navigation">
        <button type="button" onClick={() => navigate(stopIndex - 1)} disabled={stopIndex === 0}>
          <ArrowLeft size={16} aria-hidden="true" /> Back
        </button>
        <div className="guided-tour__playback">
          <button type="button" onClick={() => { setPlaybackBlocked(false); onPauseChange(!paused); }} aria-label={paused ? "Resume tour" : "Pause tour"}>
            {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />} {paused ? "Resume" : "Pause"}
          </button>
          {isVideoVisible && !nativeFullscreen ? <button type="button" aria-label="Enter fullscreen" onClick={() => {
            void demoStageRef.current?.requestFullscreen?.().catch(() => {});
          }}><Maximize size={16} aria-hidden="true" /></button> : null}
        </div>
        <button className="guided-tour__next" type="button" onClick={advance}>
          {isLastStop ? <>Finish <Check size={16} aria-hidden="true" /></> : <>Next <ArrowRight size={16} aria-hidden="true" /></>}
        </button>
      </div>
      <p className="guided-tour__hint">{paused ? "Tour paused. Explore freely, then Resume to continue." : isVideoPhase ? "Demo plays muted. Esc exits the tour." : "Auto tour. Scroll or press Esc to explore."}</p>
    </aside>
  );

  return createPortal(
    <>
      {rect && !paused && !hidden && !isVideoPhase ? (
        <svg className="guided-tour-shade" width="100%" height="100%" aria-hidden="true" data-tour-active-block={activeBlock?.id}>
          <defs>
            <mask id={maskId}>
              <rect width="100%" height="100%" fill="white" />
              {planetCenter && labelRect ? <>
                <circle cx={planetCenter.x} cy={planetCenter.y} r={planetRadius + 8} fill="black" />
                <rect x={labelRect.x} y={labelRect.y} width={labelRect.width} height={labelRect.height} rx="8" fill="black" />
              </> : <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx="12" fill="black" />}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="currentColor" mask={`url(#${maskId})`} />
          {planetCenter ? (
            <g key={activeBlock?.id} className="guided-tour-planet" transform={`translate(${planetCenter.x} ${planetCenter.y})`}>
              <circle className="guided-tour-planet__track" r={planetRadius + 3} />
              <circle className="guided-tour-planet__pulse" r={planetRadius + 3} />
              <g className="guided-tour-planet__orbit">
                <circle className="guided-tour-planet__arc" r={planetRadius + 3} strokeDasharray={`${planetRadius * 2} ${planetRadius * 5}`} />
                <circle className="guided-tour-planet__satellite" cx={planetRadius + 3} r="3" />
              </g>
            </g>
          ) : <rect className="guided-tour-spotlight" x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx="12" />}
        </svg>
      ) : null}
      {demo?.stopId === stop.id ? <TourDemo
        key={`demo:${demo.stopId}`}
        source={demo}
        active={isVideoVisible}
        paused={paused}
        hidden={hidden}
        stageRef={demoStageRef}
        finishingRef={finishingVideoRef}
        onPauseChange={onPauseChange}
        onFullscreenChange={setNativeFullscreen}
        onPlaybackBlocked={() => { setPlaybackBlocked(true); onPauseChange(true); }}
        onAdvance={advance}
      >{isVideoVisible ? controls : null}</TourDemo> : null}
      {!isVideoVisible ? controls : null}
      {!paused && textTargets.map((item, index) => createPortal(
        <span className="tour-page-text__typed" aria-hidden="true" data-typing-state={typing.characters >= item.offset + item.text.length ? "complete" : "typing"}>
          <TourTypedText text={item.text} runs={item.runs} characters={typing.characters} offset={item.offset} paused={paused || hidden} cursor={!typing.reducedMotion} accessible={false} />
        </span>,
        item.host,
        `${stop.id}:${index}`,
      ))}
    </>,
    document.body,
  );
}
