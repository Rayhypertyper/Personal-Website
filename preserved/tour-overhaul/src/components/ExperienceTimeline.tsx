import { useLayoutEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { TourPageText } from "./TourPageText";

type ExperienceLogoKind = "auxilium" | "nokia" | "shad";

interface ExperienceEntry {
  id: string;
  period: readonly string[];
  company: string;
  role: string;
  description: string;
  tags: readonly string[];
  logo: ExperienceLogoKind;
}

const experienceEntries: readonly ExperienceEntry[] = [
  {
    id: "nokia",
    period: ["Summer", "2025"],
    company: "Nokia",
    role: "Software Engineering Intern",
    description: "Worked on production React/Redux/TypeScript applications and built automated component testing with Cypress.",
    tags: ["React", "TypeScript", "Redux", "Cypress"],
    logo: "nokia",
  },
  {
    id: "shad",
    period: ["Summer", "2024"],
    company: "SHAD",
    role: "Fellow",
    description: "Created and explored an ambitious project with a multidisciplinary team.",
    tags: ["Python", "Design", "Innovation"],
    logo: "shad",
  },
  {
    id: "auxilium",
    period: ["2023 — 2026"],
    company: "Auxilium",
    role: "Coding Circle Lead",
    description:
      "Led a coding circle for 30 students, teaching programming concepts and building an encouraging, collaborative learning environment.",
    tags: ["Teaching", "Mentorship", "Communication"],
    logo: "auxilium",
  },
] as const;

function ExperienceLogo({ kind }: { kind: ExperienceLogoKind }) {
  if (kind === "nokia") {
    return <img className="experience-logo experience-logo--nokia" src="/nokia-logo.png" alt="Nokia logo" />;
  }

  if (kind === "shad") {
    return <img className="experience-logo experience-logo--shad" src="/shad-logo.png" alt="SHAD logo" />;
  }

  return (
    <img className="experience-logo experience-logo--auxilium" src="/auxilium-logo.png" alt="Auxilium logo" />
  );
}

export function ExperienceTimeline() {
  const timelineRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const timeline = timelineRef.current;
    const contactLabel = document.querySelector<HTMLElement>(
      '[data-filter-label="contact"]',
    );
    const railNode = timeline?.querySelector<HTMLElement>(
      ".experience-entry__node",
    );

    if (!timeline || !contactLabel || !railNode) {
      return;
    }

    const updateConnector = () => {
      const timelineRect = timeline.getBoundingClientRect();
      const contactRect = contactLabel.getBoundingClientRect();
      const railRect = railNode.getBoundingClientRect();
      const contactCenterX = contactRect.left + contactRect.width / 2;
      const contactCenterY = contactRect.top + contactRect.height / 2;
      const railCenterX = railRect.left + railRect.width / 2;
      const endY = contactCenterY - timelineRect.top;

      timeline.style.setProperty(
        "--experience-contact-connector-width",
        `${Math.max(0, contactCenterX - railCenterX)}px`,
      );
      timeline.style.setProperty(
        "--experience-contact-connector-end-y",
        `${endY}px`,
      );
      timeline.style.setProperty(
        "--experience-contact-connector-turn-y",
        `${endY + 28}px`,
      );
    };

    updateConnector();

    const resizeObserver = new ResizeObserver(updateConnector);
    resizeObserver.observe(timeline);
    resizeObserver.observe(contactLabel);
    window.addEventListener("resize", updateConnector);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateConnector);
    };
  }, []);

  return (
    <section
      ref={timelineRef}
      className="experience-timeline"
      aria-label="Experience timeline"
    >
      <span className="experience-timeline__contact-connector" aria-hidden="true">
        <span className="experience-timeline__contact-connector-left-turn" />
        <span className="experience-timeline__contact-connector-horizontal" />
        <span className="experience-timeline__contact-connector-right-turn" />
      </span>
      <h2 className="sr-only">Experience</h2>

      {experienceEntries.map((entry) => (
        <article className="experience-entry" key={entry.id} data-tour-target={entry.id === "nokia" ? "experience" : undefined}>
          <div className="experience-entry__period" aria-label={entry.period.join(" ")}>
            {entry.period.map((line) => (
              <span key={line}>{line}</span>
            ))}
            <span className="experience-entry__rule" aria-hidden="true" />
          </div>

          <span className="experience-entry__node" aria-hidden="true">
            <span />
          </span>

          <div className="experience-card" data-tour-focus-block={entry.id === "nokia" ? "experience-card" : undefined}>
            <div className="experience-card__brand">
              <ExperienceLogo kind={entry.logo} />
            </div>
            <span className="experience-card__divider" aria-hidden="true" />

            <div className="experience-card__body">
              <h3><TourPageText>{entry.company}</TourPageText></h3>
              <p className="experience-card__role"><TourPageText>{entry.role}</TourPageText></p>
              <p className="experience-card__description"><TourPageText>{entry.description}</TourPageText></p>
              <div className="experience-card__tags" aria-label="Skills">
                {entry.tags.map((tag) => (
                  <span key={tag}><TourPageText inline>{tag}</TourPageText></span>
                ))}
              </div>
            </div>

            <span className="experience-card__arrow" aria-hidden="true">
              <ArrowRight strokeWidth={1.45} />
            </span>
          </div>
        </article>
      ))}
    </section>
  );
}
