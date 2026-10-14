import type { PortfolioLocation } from "../data/locations";
import type { CSSProperties } from "react";

interface LocationCardProps {
  anchor?: { x: number; y: number } | null;
  location: PortfolioLocation;
  onClose: () => void;
}

export function LocationCard({ anchor, location, onClose }: LocationCardProps) {
  return (
    <aside
      className={`location-card location-card--${location.markerType}${anchor ? " location-card--anchored" : ""}`}
      aria-label={`${location.label} location details`}
      style={
        anchor
          ? ({
              "--location-anchor-x": `${anchor.x}px`,
              "--location-anchor-y": `${anchor.y}px`,
            } as CSSProperties)
          : undefined
      }
    >
      <button
        className="location-card__close"
        type="button"
        aria-label={`Close ${location.label} details`}
        onClick={onClose}
      >
        <span aria-hidden="true">×</span>
      </button>
      <span className="location-card__eyebrow">
        {location.markerType === "home" ? "Home" : "School"}
      </span>
      <h3>{location.label}</h3>
      <p className="location-card__name">{location.locationName}</p>
      <p className="location-card__description">
        {location.shortDescription}
      </p>
    </aside>
  );
}
