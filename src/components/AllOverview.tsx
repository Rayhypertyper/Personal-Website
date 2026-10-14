import { ArrowUpRight, Check, RotateCcw } from "lucide-react";
import { AISummary } from "./AISummary";
import { SearchResultCard } from "./SearchResultCard";
import { TourCTA } from "./TourCTA";
import { TourPageText } from "./TourPageText";

interface AllOverviewProps {
  onProjectsClick: () => void;
  onTourStart: () => void;
  onTourCtaVisibilityChange: (visible: boolean) => void;
  tourCompleted: boolean;
}

export function AllOverview({ onProjectsClick, onTourStart, onTourCtaVisibilityChange, tourCompleted }: AllOverviewProps) {
  const openProjects = () => {
    onProjectsClick();
    document
      .querySelector<HTMLButtonElement>('[data-filter-tab="projects"]')
      ?.focus({ preventScroll: true });
  };

  return (
    <div className="all-overview">
      {!tourCompleted ? <TourCTA onStart={onTourStart} onVisibilityChange={onTourCtaVisibilityChange} /> : null}
      <div className="all-overview__main">
        <div className="all-overview__introduction">
          <div data-tour-target="identity" data-tour-focus-block="identity">
            <h1 className="all-overview__name">Ray Xu</h1>
            <p className="all-overview__subtitle"><TourPageText>Computer Science @ University of Waterloo</TourPageText></p>
          </div>
          <AISummary />
          {tourCompleted ? (
            <div className="all-overview__actions">
              <div className="all-overview__tour-completed">
                <span><Check size={16} aria-hidden="true" /> Tour completed</span>
                <button className="all-overview__tour" type="button" data-tour-entry onClick={onTourStart} aria-label="Replay the quick tour">
                  <RotateCcw size={14} aria-hidden="true" /> Replay
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <article className="all-project" aria-labelledby="all-project-title">
          <div className="all-project__heading">
            <span>Featured project</span>
            <span>Computer Vision</span>
          </div>
          <button
            className="all-project__preview"
            type="button"
            onClick={openProjects}
            aria-label="Explore the Invisible Keyboard project"
          >
            <img
              src="/invisible-keyboard-demo-poster.jpg"
              alt="Webcam demo tracking hand movements over a virtual keyboard"
              width="1280"
              height="664"
              fetchPriority="high"
            />
          </button>
          <div className="all-project__details">
            <h2 id="all-project-title">Invisible Keyboard</h2>
            <p>
              An end-to-end machine learning system that <strong>detects and recognizes
              keystrokes using a webcam</strong>
            </p>
            <button
              className="all-project__link"
              type="button"
              onClick={openProjects}
            >
              {tourCompleted ? "Keep exploring" : "Explore project"}
              <ArrowUpRight size={18} strokeWidth={1.7} aria-hidden="true" />
            </button>
          </div>
        </article>
      </div>

      <div className="all-overview__education">
        <SearchResultCard compact sponsored variant="aircad" />
      </div>
    </div>
  );
}
