import { Html } from "@react-three/drei";
import {
  useMemo,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import type { Mesh, Object3D } from "three";
import type { PortfolioLocation } from "../data/locations";
import { latLonToVector3 } from "../utils/coordinates";

interface LocationMarkerProps {
  earthRef: RefObject<Mesh | null>;
  location: PortfolioLocation;
  selected: boolean;
  inactive: boolean;
  onSelect: (location: PortfolioLocation) => void;
}

function MarkerIcon({ type }: { type: PortfolioLocation["markerType"] }) {
  if (type === "home") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m4.5 10.5 7.5-6 7.5 6v8.2a.8.8 0 0 1-.8.8H5.3a.8.8 0 0 1-.8-.8v-8.2Z" />
        <path d="M9.5 19.5v-5.8h5v5.8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3.5 9 8.5-4.5L20.5 9 12 13.5 3.5 9Z" />
      <path d="M7 11.2v4.4c2.8 2 7.2 2 10 0v-4.4M20.5 9v6" />
    </svg>
  );
}

export function LocationMarker({
  earthRef,
  location,
  selected,
  inactive,
  onSelect,
}: LocationMarkerProps) {
  const [occluded, setOccluded] = useState(false);
  const position = useMemo(
    () => latLonToVector3(location.latitude, location.longitude, 1.008),
    [location.latitude, location.longitude],
  );
  const occluders = useMemo(
    () => [earthRef as RefObject<Object3D>],
    [earthRef],
  );
  const markerStyle = useMemo(() => {
    const labelOffset =
      location.markerType === "school"
        ? { x: -44, y: -38 }
        : { x: 46, y: -44 };
    const distance = Math.hypot(labelOffset.x, labelOffset.y);
    const angle = Math.atan2(labelOffset.y, labelOffset.x) * (180 / Math.PI);

    return {
      "--marker-label-x": `${labelOffset.x}px`,
      "--marker-label-y": `${labelOffset.y}px`,
      "--marker-line-length": `${Math.max(14, distance - 30)}px`,
      "--marker-line-angle": `${angle}deg`,
    } as CSSProperties;
  }, [location.markerType]);

  return (
    <group position={position}>
      <Html
        center
        occlude={occluders}
        onOcclude={setOccluded}
        zIndexRange={[30, 0]}
      >
        <button
          className={`location-marker location-marker--${location.markerType}${selected ? " is-selected" : ""}${inactive ? " is-inactive" : ""}`}
          style={markerStyle}
          type="button"
          aria-label={`View ${location.label} details`}
          aria-pressed={selected}
          tabIndex={occluded ? -1 : 0}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(location);
          }}
        >
          <span className="location-marker__connection" aria-hidden="true" />
          <span className="location-marker__anchor" aria-hidden="true">
            <span className="location-marker__pulse" />
          </span>
          <span className="location-marker__label">
            <span className="location-marker__label-icon" aria-hidden="true">
              <MarkerIcon type={location.markerType} />
            </span>
            <span>{location.label}</span>
          </span>
        </button>
      </Html>
    </group>
  );
}
