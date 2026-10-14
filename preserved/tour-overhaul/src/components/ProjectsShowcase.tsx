import {
  ArrowRight,
  Box,
  Code2,
  ExternalLink,
  Settings,
} from "lucide-react";
import { useRef, type ReactNode } from "react";
import { TourPageText } from "./TourPageText";
import { PaperPlaneDoodle } from "./PaperPlaneDoodle";
import { AirCADDoodles } from "./AirCADDoodles";
import { KeyboardDoodles } from "./KeyboardDoodles";
import "../projects-motion.css";
import "../aircad-project.css";
import "../keyboard-project.css";

function TechChip({ kind, icon, children }: { kind?: string; icon?: ReactNode; children: string }) {
  return (
    <span className="projects-tech-chip">
      {kind ? (
        <img className="projects-tech-chip__logo" src={`/featured-${kind}-logo.png`} alt="" aria-hidden="true" />
      ) : icon}
      {children}
    </span>
  );
}

export function ProjectsShowcase() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const aircadVideoRef = useRef<HTMLVideoElement>(null);

  const playProjectFullscreen = (video: HTMLVideoElement | null) => {
    if (!video) {
      return;
    }

    void video.play().catch(() => {
      // The browser may block playback if the click is no longer considered user initiated.
    });

    if (video.requestFullscreen) {
      void video.requestFullscreen().catch(() => {
        // Playback still starts when fullscreen is unavailable or denied.
      });
      return;
    }

    const legacyVideo = video as HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
    };
    legacyVideo.webkitEnterFullscreen?.();
  };

  return (
    <section className="projects-showcase" aria-label="Featured projects">
      <article className="projects-feature projects-feature--keyboard" data-tour-target="keyboard">
        <div className="projects-feature__copy">
          <div className="projects-feature__badge-row">
            <span className="projects-rays projects-rays--left" aria-hidden="true">
              <i /><i /><i />
            </span>
            <span className="projects-feature__badge"><span>★</span> FEATURED PROJECT</span>
            <span className="projects-rays projects-rays--right" aria-hidden="true">
              <i /><i /><i />
            </span>
          </div>
          <div className="projects-feature__title-row">
            <h2 data-tour-focus-block="keyboard-intro"><TourPageText>Invisible Keyboard</TourPageText></h2>
            <Settings className="projects-feature__settings" size={48} strokeWidth={1.5} aria-hidden="true" />
          </div>
          <p data-tour-focus-block="keyboard-intro"><TourPageText>An AI-powered system that detects and recognizes keystrokes using only a webcam and deep learning.</TourPageText></p>
          <div className="projects-tech-chips" aria-label="Technologies used">
            <TechChip kind="numpy">NumPy</TechChip>
            <TechChip kind="pytorch">PyTorch</TechChip>
            <TechChip kind="mediapipe">MediaPipe</TechChip>
          </div>
          <div className="projects-feature__actions">
            <button
              type="button"
              className="projects-feature__button"
              onClick={() => playProjectFullscreen(videoRef.current)}
              aria-label="Play Invisible Keyboard project demo in fullscreen"
            >
              <span className="projects-green-arrow" aria-hidden="true" />
              View Project <ArrowRight size={16} />
            </button>
            <a
              href="https://github.com/Rayhypertyper/Invisible-Keyboard"
              target="_blank"
              rel="noreferrer"
              className="projects-feature__github"
              aria-label="Open Invisible Keyboard project on GitHub"
            >
              <img src="/github-logo.png" alt="" aria-hidden="true" />
              <span>GitHub</span>
              <ExternalLink size={15} aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="projects-feature__media-frame">
          <KeyboardDoodles />
          <div className="projects-feature__media">
            <video
              ref={videoRef}
              className="projects-feature__video"
              controls
              playsInline
              preload="metadata"
              poster="/invisible-keyboard-demo-poster.jpg"
              aria-label="Invisible Keyboard project demo"
            >
              <source src="/invisible-keyboard-demo.mp4" type="video/mp4" />
              Your browser does not support embedded video.
            </video>
          </div>
        </div>

        <div className="projects-feature__metrics" aria-label="Project metrics" data-tour-metrics>
          <div className="projects-metric" data-tour-focus-block="keyboard-precision">
            <span className="projects-metric__icon projects-metric__icon--green">
              <img
                className="projects-metric__precision-icon"
                src="/press-precision-icon.png"
                alt=""
                aria-hidden="true"
              />
            </span>
            <strong><TourPageText count={{ value: 95.6, decimals: 1, suffix: "%" }}>95.6%</TourPageText></strong>
            <small><TourPageText>Press Precision</TourPageText></small>
          </div>
          <div className="projects-metric" data-tour-focus-block="keyboard-recall">
            <span className="projects-metric__icon projects-metric__icon--blue">
              <img
                className="projects-metric__recall-icon"
                src="/recall-icon.png"
                alt=""
                aria-hidden="true"
              />
            </span>
            <strong><TourPageText count={{ value: 95.7, decimals: 1, suffix: "%" }}>95.7%</TourPageText></strong>
            <small><TourPageText>Recall</TourPageText></small>
          </div>
          <div className="projects-metric" data-tour-focus-block="keyboard-fps">
            <span className="projects-metric__icon projects-metric__icon--speed">
              <img src="/typing-speed-symbol.png" alt="" aria-hidden="true" />
            </span>
            <strong><TourPageText count={{ value: 24, suffix: " FPS" }}>24 FPS</TourPageText></strong>
            <small><TourPageText>Real-time inference</TourPageText></small>
          </div>
          <div className="projects-feature__doodle" aria-hidden="true">
            <PaperPlaneDoodle />
          </div>
        </div>
      </article>

      <div className="projects-divider" aria-hidden="true" />

      <article className="projects-feature projects-feature--aircad" aria-labelledby="aircad-project-title" data-tour-target="aircad">
        <AirCADDoodles />
        <div className="projects-feature__copy">
          <div className="projects-feature__title-row">
            <h2 id="aircad-project-title" data-tour-focus-block="aircad-intro"><TourPageText>AirCAD</TourPageText></h2>
            <Box className="projects-feature__settings" size={44} strokeWidth={1.5} aria-hidden="true" />
          </div>
          <p data-tour-focus-block="aircad-intro"><TourPageText>A spatial CAD app for sketching and shaping 3D models with a camera-tracked keycap. Draw in space, turn shapes into solids, and export to FreeCAD.</TourPageText></p>
          <div className="projects-tech-chips" aria-label="AirCAD technologies used">
            <TechChip icon={<Code2 size={22} strokeWidth={1.7} aria-hidden="true" />}>TypeScript</TechChip>
            <TechChip kind="python">Python</TechChip>
            <TechChip icon={<Box size={22} strokeWidth={1.7} aria-hidden="true" />}>FreeCAD</TechChip>
          </div>
          <div className="projects-feature__actions">
            <button
              type="button"
              className="projects-feature__button"
              onClick={() => playProjectFullscreen(aircadVideoRef.current)}
              aria-label="Play AirCAD project demo in fullscreen"
            >
              View Project <ArrowRight size={16} aria-hidden="true" />
            </button>
            <a
              href="https://devpost.com/software/aircad"
              target="_blank"
              rel="noreferrer"
              className="projects-feature__github"
              aria-label="Open AirCAD project on Devpost"
            >
              <img src="/devpost-logo.png" alt="" aria-hidden="true" />
              <span>Devpost</span>
              <ExternalLink size={15} aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="projects-feature__media-frame">
          <div className="projects-feature__media">
            <video
              ref={aircadVideoRef}
              className="projects-feature__video"
              controls
              playsInline
              preload="metadata"
              poster="/aircad-demo-poster.jpg"
              aria-label="AirCAD project demo"
            >
              <source src="/aircad-demo.mp4" type="video/mp4" />
              Your browser does not support embedded video. <a href="/aircad-demo.mp4">Watch the AirCAD demo.</a>
            </video>
          </div>
        </div>
      </article>
    </section>
  );
}
