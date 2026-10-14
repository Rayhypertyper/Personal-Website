import { Construction } from "lucide-react";

export function UnderConstructionOverlay() {
  return (
    <section
      className="under-construction-overlay"
      aria-labelledby="under-construction-title"
    >
      <div className="under-construction-card">
        <div className="under-construction-card__icon" aria-hidden="true">
          <Construction strokeWidth={1.6} />
        </div>

        <p className="under-construction-card__eyebrow">Construction in progress</p>
        <h2 id="under-construction-title">
          The About Me page is under construction.
        </h2>
        <p className="under-construction-card__message">
          The bulldozer deliveries have been delayed due to shortages...
        </p>
      </div>
    </section>
  );
}
