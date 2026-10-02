import { ArrowUpRight } from "lucide-react";
import { AISummary } from "./AISummary";
import { SearchResultCard } from "./SearchResultCard";

interface AllOverviewProps {
  onProjectsClick: () => void;
}

export function AllOverview({ onProjectsClick }: AllOverviewProps) {
  const openProjects = () => {
    onProjectsClick();
    document
      .querySelector<HTMLButtonElement>('[data-filter-tab="projects"]')
      ?.focus({ preventScroll: true });
  };

  return (
    <div className="all-overview">
      <div className="all-overview__main">
        <div className="all-overview__introduction">
          <h1 className="all-overview__name">
            Ray Xu
          </h1>
          <p className="all-overview__subtitle">
            Computer Science @ University of Waterloo
          </p>
          <AISummary />
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
              An end-to-end machine learning project that detects and recognizes
              keystrokes using only a webcam
            </p>
            <button
              className="all-project__link"
              type="button"
              onClick={openProjects}
            >
              Explore project
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
