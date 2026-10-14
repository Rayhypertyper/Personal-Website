import { ArrowLeft, ArrowRight, Check, Maximize, Pause, Play, X } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { FilterName } from "./FilterTabs";
import { TourDemo, type TourDemoSource } from "./TourDemo";
import { TourTypedText, type TourTextRun } from "./TourTypedText";
import { useStepTimer } from "../hooks/useStepTimer";
import { buildTypingSchedule, TOUR_CHARACTERS_PER_SECOND, useTourTypewriter } from "../hooks/useTourTypewriter";
import { TourSpotlight, type SpotlightRect, type PlanetSpotlight } from "./TourSpotlight";
import { TourProgress } from "./TourProgress";
import type { TourCount } from "./TourPageText";
import "../guided-tour.css";

const PLANET_FINALE_MS = 3000;

export const TOUR_STOPS = [
  {
    id: "identity",
    estimatedMs: 2700,
    filter: "All",
    title: "Ray Xu",
    durationSeconds: 3,
    readingPauseMs: 600,
  },
  {
    id: "positioning",
    estimatedMs: 3900,
    filter: "All",
    title: "What I build",
    durationSeconds: 4,
    readingPauseMs: 700,
  },
  {
    id: "keyboard",
    estimatedMs: 22800,
    filter: "Projects",
    title: "Invisible Keyboard",
    query: "projects",
    videoStart: 50,
    videoEnd: 62.55,
    durationSeconds: 3,
    readingPauseMs: 750,
  },
  {
    id: "aircad",
    estimatedMs: 13100,
    filter: "Projects",
    title: "AirCAD",
    videoStart: 30.5,
    videoEnd: 36,
    videoTitle: "AirCAD",
    durationSeconds: 3,
    readingPauseMs: 350,
  },
  {
    id: "experience",
    estimatedMs: 6900,
    filter: "Experience",
    title: "Nokia",
    query: "experience",
    durationSeconds: 5,
    readingPauseMs: 900,
  },
  {
    id: "contact",
    estimatedMs: 9900 + PLANET_FINALE_MS,
    filter: "Contact",
    title: "Want to talk?",
    query: "contact",
    blockOrder: ["contact-intro", "contact-planet-linkedin", "contact-planet-github", "contact-planet-schedule", "contact-planet-resume", "contact-planet-email"],
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
  estimatedMs: number;
  durationSeconds: number;
  readingPauseMs: number;
  blockOrder?: string[];
  query?: string;
}>;

interface GuidedTourProps {
  stopIndex: number;
  paused: boolean;
  onPauseChange: (paused: boolean) => void;
  onNavigate: (index: number) => void;
  onExit: (restoreFocus?: boolean) => void;
  onComplete: (restoreFocus?: boolean) => void;
  onSearchPreview: (state: { query: string; searching: boolean } | null) => void;
}

interface PageTextTarget {
  host: HTMLElement;
  text: string;
  offset: number;
  runs: TourTextRun[];
  blockId: string;
  length: number;
  cps: number;
  leadMs: number;
  letters: boolean;
  count?: TourCount;
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

export function GuidedTour({ stopIndex, paused, onPauseChange, onNavigate, onExit, onComplete, onSearchPreview }: GuidedTourProps) {
  const stop = TOUR_STOPS[stopIndex];
  const progressClock = useRef({ stopId: "", elapsed: 0 });
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
    planets: PlanetSpotlight[];
  } | null>(null);
  const [pageText, setPageText] = useState<{ stopId: string; targets: PageTextTarget[]; blocks: PageFocusBlock[] }>({ stopId: "", targets: [], blocks: [] });
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [demo, setDemo] = useState<TourDemoSource | null>(null);
  const [demoActive, setDemoActive] = useState(false);
  const [demoEntered, setDemoEntered] = useState(false);
  const handoffSerial = useRef(0);
  const [arriving, setArriving] = useState(false);
  const [handoff, setHandoff] = useState<{ toIndex: number; serial: number; phase: "typing" | "searching" | "leaving" } | null>(null);
  const [ending, setEnding] = useState<"planets" | "lights" | "toast" | "leaving" | null>(null);
  const planetFinale = ending === "planets";
  const lightsUp = Boolean(ending && !planetFinale);
  const isVideoPhase = demoActive && demo?.stopId === stop.id;
  const isVideoVisible = isVideoPhase && !paused;
  videoPhaseRef.current = isVideoPhase;
  const isLastStop = stopIndex === TOUR_STOPS.length - 1;
  const textTargets = pageText.stopId === stop.id ? pageText.targets : [];
  const textReady = textTargets.length > 0;
  const schedule = useMemo(() => buildTypingSchedule(textTargets, stop.id), [pageText, stop.id]);
  const typing = useTourTypewriter(stop.id, schedule, textReady && spotlight?.stopId === stop.id && !paused && !hidden && !isVideoPhase && !handoff && !ending);
  // At a text boundary the next block owns the cursor and the only spotlight.
  const activeText = textTargets.find((item) => typing.characters < item.offset + item.length) ?? textTargets.at(-1);
  const activeBlock = pageText.stopId === stop.id ? pageText.blocks.find((block) => block.id === activeText?.blockId) : undefined;
  const rect = activeBlock?.elements.every((element) => element.isConnected)
    && spotlight?.stopId === stop.id ? spotlight.rect : null;

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

  const cancelHandoff = () => {
    setHandoff(null);
    setArriving(false);
    onSearchPreview(null);
    delete document.documentElement.dataset.tourHandoff;
  };
  const navigate = (index: number, withHandoff = false) => {
    const next = TOUR_STOPS[index];
    if (!next || transitioningRef.current) return;
    cancelHandoff();
    if (withHandoff && index > stopIndex && next.filter !== stop.filter && "query" in next && !typing.reducedMotion) {
      setHandoff({ toIndex: index, serial: ++handoffSerial.current, phase: "typing" });
    } else transition(() => onNavigate(index));
  };
  const exit = (restoreFocus = true) => { cancelHandoff(); transition(() => onExit(restoreFocus)); };
  const complete = (restoreFocus = true) => { cancelHandoff(); transition(() => onComplete(restoreFocus)); };
  const beginEnding = () => {
    if (transitioningRef.current || ending) return;
    performance.mark("tour:ending");
    setEnding(typing.reducedMotion ? "lights" : "planets");
  };
  const advance = () => isLastStop ? complete() : navigate(stopIndex + 1, !handoff);

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
    textReady && typing.complete && Boolean(rect) && !paused && !hidden && !isVideoPhase && !ending && !handoff,
    () => typeof stop.videoStart === "number" ? startDemo() : isLastStop ? beginEnding() : advance());

  const handoffStop = handoff ? TOUR_STOPS[handoff.toIndex] : null;
  const handoffQuery = handoffStop && "query" in handoffStop ? (handoffStop.query ?? "") : "";
  const handoffSchedule = useMemo(() => buildTypingSchedule([{ text: handoffQuery, cps: 45, leadMs: 0 }], `search:${handoffQuery}`), [handoffQuery]);
  const handoffTyping = useTourTypewriter(`handoff:${handoff?.serial ?? "idle"}`, handoffSchedule, handoff?.phase === "typing" && !paused && !hidden);
  useEffect(() => {
    if (handoff?.phase === "typing" && handoffTyping.complete) setHandoff({ ...handoff, phase: "searching" });
  }, [handoff, handoffTyping.complete]);
  useEffect(() => {
    onSearchPreview(handoff ? { query: `Ray Xu ${handoffQuery.slice(0, handoffTyping.characters)}`, searching: handoff.phase !== "typing" } : null);
  }, [handoff, handoffQuery, handoffTyping.characters, onSearchPreview]);
  useLayoutEffect(() => {
    if (handoff?.phase === "leaving") document.documentElement.dataset.tourHandoff = "leaving";
    else if (arriving) document.documentElement.dataset.tourHandoff = "arriving";
    else delete document.documentElement.dataset.tourHandoff;
  }, [handoff?.phase, arriving]);
  useStepTimer(`handoff:${handoff?.serial}:searching`, 320, handoff?.phase === "searching" && !paused && !hidden,
    () => { if (handoff) setHandoff({ ...handoff, phase: "leaving" }); });
  useStepTimer(`handoff:${handoff?.serial}:leaving`, 140, handoff?.phase === "leaving" && !paused && !hidden, () => {
    if (!handoff) return;
    const index = handoff.toIndex;
    setHandoff(null);
    setArriving(true);
    transition(() => onNavigate(index));
  });
  useStepTimer(`arriving:${stop.id}`, 320, arriving && !paused && !hidden, () => setArriving(false));
  useEffect(() => () => { onSearchPreview(null); delete document.documentElement.dataset.tourHandoff; }, [onSearchPreview]);

  useStepTimer("ending:planets", PLANET_FINALE_MS, planetFinale && !paused && !hidden, () => setEnding("lights"));
  useStepTimer("ending:lights", typing.reducedMotion ? 0 : 200, ending === "lights" && !hidden, () => setEnding("toast"));
  useStepTimer("ending:toast", 2200, ending === "toast" && !hidden, () => setEnding("leaving"));
  useStepTimer("ending:leaving", typing.reducedMotion ? 0 : 400, ending === "leaving" && !hidden, () => complete());
  useLayoutEffect(() => {
    document.documentElement.toggleAttribute("data-tour-ending", lightsUp);
    return () => { delete document.documentElement.dataset.tourEnding; };
  }, [lightsUp]);

  useEffect(() => {
    transitioningRef.current = false;
    finishingVideoRef.current = false;
    setPlaybackBlocked(false);
    setDemoActive(false);
    setDemoEntered(false);
    setEnding(null);
    setHandoff(null);
    performance.mark(`tour:stop:${stop.id}`);
    const target = document.querySelector<HTMLElement>(`[data-tour-target="${stop.id}"]`);

    // Mount, download, and seek the viewport player during the explanation.
    const video = target?.querySelector<HTMLVideoElement>("video");
    const src = video?.currentSrc || video?.querySelector("source")?.src;
    if (video && src && typeof stop.videoStart === "number") {
      video.pause();
      setDemo({ stopId: stop.id, src, poster: video.poster, title: stop.videoTitle ?? stop.title, start: stop.videoStart, end: stop.videoEnd, origin: target?.querySelector<HTMLElement>(".projects-feature__media") ?? undefined });
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
      const count = host.dataset.tourCountValue !== undefined ? {
        value: Number(host.dataset.tourCountValue), decimals: Number(host.dataset.tourCountDecimals ?? 0),
        suffix: host.dataset.tourCountSuffix ?? "", durationMs: Number(host.dataset.tourCountDuration ?? 900),
      } : undefined;
      return { host, text, offset: 0, runs, blockId, length: count ? 1 : text.length,
        cps: Number(host.dataset.tourCps ?? TOUR_CHARACTERS_PER_SECOND), leadMs: Number(host.dataset.tourLeadMs ?? 0),
        letters: host.dataset.tourLetters === "true", count };
    });
    const order = "blockOrder" in stop ? stop.blockOrder : undefined;
    const rank = (id: string) => { const index = order?.indexOf(id) ?? -1; return index < 0 ? Infinity : index; };
    targets.sort((a, b) => rank(a.blockId) - rank(b.blockId));
    blocks.sort((a, b) => rank(a.id) - rank(b.id));
    for (const item of targets) { item.offset = textOffset; textOffset += item.length; }
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
    document.documentElement.toggleAttribute("data-tour-paused", paused || hidden);
    document.documentElement.toggleAttribute("data-tour-hidden", hidden);
    return () => {
      delete document.documentElement.dataset.tourPresent;
      delete document.documentElement.dataset.tourStop;
      delete document.documentElement.dataset.tourPaused;
      delete document.documentElement.dataset.tourHidden;
    };
  }, [stop.id, paused, hidden]);

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
      const planets: PlanetSpotlight[] = [];
      if (isPlanet) {
        const activeIndex = pageText.blocks.indexOf(activeBlock);
        for (const block of pageText.blocks.slice(0, activeIndex + 1).filter((item) => item.id.startsWith("contact-planet-"))) {
          const planet = block.elements.find((element) => element.matches(".contact-planet"));
          const labels = block.elements.filter((element) => element !== planet);
          if (!planet) continue;
          const bounds = planet.getBoundingClientRect();
          planets.push({ id: block.id, planet: { x: bounds.left, y: bounds.top, width: bounds.width, height: bounds.height },
            label: getFocusRect({ id: block.id, elements: labels }), active: block.id === activeBlock.id });
        }
      }
      setSpotlight({ stopId: stop.id, blockId: activeBlock.id, rect: getFocusRect(activeBlock), planets });
    };

    const marked: HTMLElement[] = [];
    if (isPlanet) {
      firstElement.dataset.tourPlanetActive = "true";
      const activeIndex = pageText.blocks.indexOf(activeBlock);
      for (const block of pageText.blocks.slice(0, activeIndex + 1)) {
        const planet = block.elements.find((element) => element.matches(".contact-planet"));
        if (planet instanceof HTMLElement) { planet.dataset.tourPlanetLit = "true"; marked.push(planet); }
      }
      const trackPlanet = () => { measure(); trackingFrame = requestAnimationFrame(trackPlanet); };
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
      const visibleBlocks = isPlanet ? pageText.blocks.slice(0, pageText.blocks.indexOf(activeBlock) + 1).filter((block) => block.id.startsWith("contact-planet-")) : [activeBlock];
      const bounds = getFocusRect({ id: activeBlock.id, elements: visibleBlocks.flatMap((block) => block.elements) });
      const panelBounds = panel?.getBoundingClientRect();
      const panelAtTop = panelBounds && panelBounds.top < window.innerHeight / 2;
      const safeTop = panelAtTop ? panelBounds.bottom + 32 : 24;
      const safeBottom = panelAtTop ? window.innerHeight - 24 : (panelBounds?.top ?? window.innerHeight - 140) - 40;
      const container = getScrollContainer(firstElement);
      const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";

      // Keep adjacent blocks steady; scroll only when the active text needs room.
      if (bounds.y < safeTop || bounds.y + bounds.height > safeBottom) {
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
      marked.forEach((element) => delete element.dataset.tourPlanetLit);
    };
  }, [activeBlock, pageText, stop.id, paused, hidden, onExit, onComplete]);

  useEffect(() => {
    const exitIntoPage = () => isLastStop ? complete(false) : exit(false);
    const isTourControl = (target: EventTarget | null) => target instanceof Node
      && (panelRef.current?.contains(target) || (target instanceof Element && target.closest("[data-tour-video]")));
    const onScrollIntent = (event: Event) => {
      if (lightsUp) { complete(false); return; }
      if (!paused && !videoPhaseRef.current && !isTourControl(event.target)) exitIntoPage();
    };
    const onPageClick = (event: MouseEvent) => {
      if (lightsUp) { complete(false); return; }
      if (!paused && !isTourControl(event.target)) exitIntoPage();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (isLastStop) complete(false); else exit();
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
  }, [stopIndex, isLastStop, isVideoPhase, paused, lightsUp, handoff, onNavigate, onExit, onComplete]);

  const progressStops = useMemo(() => typing.reducedMotion ? TOUR_STOPS.map((item) => ({ ...item,
    estimatedMs: item.durationSeconds * 1000 + (typeof item.videoStart === "number" ? (item.videoEnd - item.videoStart) * 1000 + 120 : item.id === "contact" ? 2200 : 0),
  })) : TOUR_STOPS, [typing.reducedMotion]);

  const controls = ending && !planetFinale && ending !== "lights" ? (
    <aside ref={panelRef} className={`guided-tour guided-tour--toast${ending === "leaving" ? " guided-tour--leaving" : ""}`} role="status" aria-live="polite" tabIndex={-1}>
      That's the tour <Check size={18} aria-hidden="true" /><span className="sr-only">Tour complete.</span>
    </aside>
  ) : (
    <aside className={`guided-tour${isVideoVisible ? " guided-tour--video" : ""}${activeBlock?.id.startsWith("contact-planet-") && !paused ? " guided-tour--planet" : ""}`} aria-label="Guided portfolio tour" inert={lightsUp} ref={panelRef} tabIndex={-1}>
      <div className="guided-tour__progress-row">
        <TourProgress clock={progressClock} stops={progressStops} stopIndex={stopIndex} frozen={paused || hidden || Boolean(handoff)} reducedMotion={typing.reducedMotion}
          onNavigate={(index) => { if (index !== stopIndex || handoff) navigate(index); }} />
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
      <p className="guided-tour__hint">{paused ? "Tour paused. Explore freely, then Resume to continue." : handoff ? `Searching ${handoffQuery}…` : isVideoPhase ? "Demo plays muted. Esc exits the tour." : "Auto tour. Scroll or press Esc to explore."}</p>
    </aside>
  );

  return createPortal(
    <>
      {rect && !paused && !hidden && (!isVideoPhase || !demoEntered) ? <TourSpotlight key={`shade:${stop.id}`} stopId={stop.id} blockId={activeBlock?.id}
        rect={rect} maskId={maskId} reducedMotion={typing.reducedMotion} lifting={isVideoPhase} ending={lightsUp} planetFinale={planetFinale} leaving={Boolean(handoff)}
        planets={spotlight?.planets ?? []} /> : null}
      {demo?.stopId === stop.id ? <TourDemo
        key={`demo:${demo.stopId}`}
        source={demo}
        active={isVideoVisible}
        paused={paused}
        hidden={hidden}
        reducedMotion={typing.reducedMotion}
        onEntered={() => setDemoEntered(true)}
        stageRef={demoStageRef}
        finishingRef={finishingVideoRef}
        onPauseChange={onPauseChange}
        onFullscreenChange={setNativeFullscreen}
        onPlaybackBlocked={() => { setPlaybackBlocked(true); onPauseChange(true); }}
        onAdvance={advance}
      >{isVideoVisible ? controls : null}</TourDemo> : null}
      {!isVideoVisible ? controls : null}
      {!paused && textTargets.map((item, index) => createPortal(
        <span className="tour-page-text__typed" aria-hidden="true" data-typing-state={typing.characters >= item.offset + item.length ? "complete" : "typing"}>
          <TourTypedText text={item.text} runs={item.runs} characters={typing.characters} offset={item.offset} paused={paused || hidden} letters={item.letters} count={item.count} idle={typing.idle}
            progress={item.count ? (typing.elapsed - ((schedule.times[item.offset] ?? 0) - (item.count.durationMs ?? 900))) / (item.count.durationMs ?? 900) : undefined} cursor={!typing.reducedMotion} accessible={false} />
        </span>,
        item.host,
        `${stop.id}:${index}`,
      ))}
    </>,
    document.body,
  );
}
