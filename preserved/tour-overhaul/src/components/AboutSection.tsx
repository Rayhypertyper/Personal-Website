import { ArrowUpRight, BrainCircuit, Code2, Sparkles } from "lucide-react";

interface AboutSectionProps {
  onContactClick: () => void;
}

const focusAreas = [
  { label: "AI & machine learning", icon: BrainCircuit },
  { label: "Full-stack development", icon: Code2 },
  { label: "Thoughtful product design", icon: Sparkles },
] as const;

export function AboutSection({ onContactClick }: AboutSectionProps) {
  return (
    <section className="about-section" aria-labelledby="about-section-title">
      <div className="about-section__intro">
        <span className="about-section__eyebrow">A little about me</span>
        <h2 id="about-section-title">
          Building useful things with curiosity and care.
        </h2>
        <p>
          I&apos;m Ray, a Computer Science student at the University of Waterloo.
          I enjoy turning tricky ideas into simple, useful software—especially
          at the intersection of AI, computer vision, and thoughtful product
          design.
        </p>
      </div>

      <div className="about-section__details">
        <div className="about-section__detail-card">
          <span className="about-section__detail-label">Currently</span>
          <strong>
            Learning, building, and looking for the next interesting problem.
          </strong>
        </div>

        <div className="about-section__focus" aria-label="Areas of focus">
          <span className="about-section__detail-label">I like working on</span>
          <div className="about-section__focus-list">
            {focusAreas.map(({ label, icon: Icon }) => (
              <span className="about-section__focus-item" key={label}>
                <Icon aria-hidden="true" strokeWidth={1.65} />
                {label}
              </span>
            ))}
          </div>
        </div>

        <button
          className="about-section__link"
          type="button"
          onClick={onContactClick}
        >
          <span>
            Want to build something interesting?
            <small>Let&apos;s talk</small>
          </span>
          <ArrowUpRight aria-hidden="true" strokeWidth={1.7} />
        </button>
      </div>
    </section>
  );
}
