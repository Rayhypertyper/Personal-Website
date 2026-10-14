import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { locations, type PortfolioLocation } from "../data/locations";
import { LocationCard } from "./LocationCard";

const DEFAULT_CENTER: [number, number] = [44.4469, -78.12105];
const OVERVIEW_BOUNDS: [[number, number], [number, number]] = [
  [42.7, -81.3],
  [46.25, -74.9],
];
const OVERVIEW_ZOOM = 5;
const DETAIL_ZOOM = 6;

function markerIcon(location: PortfolioLocation): L.DivIcon {
  const markerType = location.markerType;

  return L.divIcon({
    className: `leaflet-pin-marker leaflet-pin-marker--${markerType}`,
    html: `<span class="leaflet-pin-marker__button" aria-hidden="true">
      <span class="leaflet-pin-marker__tack" aria-hidden="true">
        <span class="leaflet-pin-marker__head"></span>
        <span class="leaflet-pin-marker__stem"></span>
      </span>
    </span>`,
    iconSize: [34, 40],
    iconAnchor: [17, 35],
  });
}

interface LeafletMapProps {
  active: boolean;
  resetVersion: number;
  reducedMotion: boolean;
  selectedLocation: PortfolioLocation | null;
  onLocationPositionChange: (position: MapPoint | null) => void;
  onReady: () => void;
  onSelectLocation: (location: PortfolioLocation) => void;
}

interface MapPoint {
  x: number;
  y: number;
}

function LeafletMap({
  active,
  resetVersion,
  reducedMotion,
  selectedLocation,
  onLocationPositionChange,
  onReady,
  onSelectLocation,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef(new Map<string, L.Marker>());
  const selectLocationRef = useRef(onSelectLocation);
  const initialResetVersionRef = useRef(resetVersion);

  useEffect(() => {
    selectLocationRef.current = onSelectLocation;
  }, [onSelectLocation]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let disposed = false;
    let frameId = 0;

    const map = L.map(container, {
      center: DEFAULT_CENTER,
      zoom: OVERVIEW_ZOOM,
      minZoom: OVERVIEW_ZOOM,
      maxZoom: 17,
      zoomControl: true,
      scrollWheelZoom: true,
      touchZoom: true,
      dragging: true,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelDebounceTime: 80,
      wheelPxPerZoomLevel: 180,
      zoomAnimation: !reducedMotion,
      fadeAnimation: !reducedMotion,
      markerZoomAnimation: !reducedMotion,
      attributionControl: false,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      minZoom: OVERVIEW_ZOOM,
      tileSize: 256,
      crossOrigin: true,
    }).addTo(map);

    locations.forEach((location) => {
      const marker = L.marker([location.latitude, location.longitude], {
        icon: markerIcon(location),
        alt: `View ${location.label} details`,
        riseOnHover: true,
        keyboard: true,
      }).addTo(map);

      marker.getElement()?.setAttribute(
        "aria-label",
        `View ${location.label} details`,
      );
      marker.getElement()?.setAttribute("aria-pressed", "false");

      marker.on("click", () => {
        selectLocationRef.current(location);
      });
      markersRef.current.set(location.id, marker);
    });

    const frameLocations = (animate: boolean) => {
      map.fitBounds(L.latLngBounds(OVERVIEW_BOUNDS), {
        padding: [38, 82],
        maxZoom: OVERVIEW_ZOOM,
        animate,
        duration: reducedMotion ? 0 : 0.7,
        easeLinearity: 0.25,
      });
    };

    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(container);

    frameId = requestAnimationFrame(() => {
      if (disposed || mapRef.current !== map) {
        return;
      }
      map.invalidateSize();
      frameLocations(false);
      onReady();
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [onReady, reducedMotion]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    markersRef.current.forEach((marker, locationId) => {
      const element = marker.getElement();
      const button = marker
        .getElement()
        ?.querySelector<HTMLElement>(".leaflet-pin-marker__button");
      if (!button) {
        return;
      }

      const isSelected = selectedLocation?.id === locationId;
      button.classList.toggle("is-selected", isSelected);
      button.classList.toggle(
        "is-inactive",
        Boolean(selectedLocation && !isSelected),
      );
      button.setAttribute("aria-pressed", String(isSelected));
      element?.setAttribute("aria-pressed", String(isSelected));
    });

    if (selectedLocation) {
      map.flyTo(
        [selectedLocation.latitude, selectedLocation.longitude],
        Math.max(map.getZoom(), DETAIL_ZOOM),
        {
          animate: !reducedMotion,
          duration: reducedMotion ? 0 : 0.7,
          easeLinearity: 0.25,
        },
      );
    }
  }, [reducedMotion, selectedLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedLocation) {
      onLocationPositionChange(null);
      return;
    }

    const updatePosition = () => {
      const point = map.latLngToContainerPoint([
        selectedLocation.latitude,
        selectedLocation.longitude,
      ]);
      onLocationPositionChange({ x: point.x, y: point.y });
    };

    updatePosition();
    map.on("move zoom resize", updatePosition);
    return () => {
      map.off("move zoom resize", updatePosition);
    };
  }, [onLocationPositionChange, selectedLocation]);

  useEffect(() => {
    if (resetVersion === initialResetVersionRef.current) {
      return;
    }

    const map = mapRef.current;
    if (!map) {
      return;
    }

    map.fitBounds(L.latLngBounds(OVERVIEW_BOUNDS), {
      padding: [38, 82],
      maxZoom: OVERVIEW_ZOOM,
      animate: !reducedMotion,
      duration: reducedMotion ? 0 : 0.7,
      easeLinearity: 0.25,
    });
  }, [reducedMotion, resetVersion]);

  useEffect(() => {
    if (active) {
      requestAnimationFrame(() => mapRef.current?.invalidateSize());
    }
  }, [active]);

  return (
    <div
      ref={containerRef}
      className="personal-globe-map leaflet-map"
      aria-label="Interactive OpenStreetMap map of the University of Waterloo and Ottawa"
    />
  );
}

function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return reducedMotion;
}

function useMapPanelVisibility(): boolean {
  const readVisibility = () => {
    const panel = document.getElementById("mapPanel");
    return Boolean(panel && !panel.hidden);
  };
  const [active, setActive] = useState(readVisibility);

  useEffect(() => {
    const panel = document.getElementById("mapPanel");
    if (!panel) {
      return;
    }

    const updateVisibility = () => setActive(!panel.hidden);
    const observer = new MutationObserver(updateVisibility);
    observer.observe(panel, { attributes: true, attributeFilter: ["hidden"] });
    updateVisibility();
    return () => observer.disconnect();
  }, []);

  return active;
}

export function PersonalGlobe() {
  const active = useMapPanelVisibility();
  const reducedMotion = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<PortfolioLocation | null>(null);
  const [selectedLocationPosition, setSelectedLocationPosition] =
    useState<MapPoint | null>(null);
  const [resetVersion, setResetVersion] = useState(0);

  const resetView = useCallback(() => {
    setSelectedLocation(null);
    setSelectedLocationPosition(null);
    setResetVersion((version) => version + 1);
  }, []);

  const closeLocation = useCallback(() => {
    setSelectedLocation(null);
    setSelectedLocationPosition(null);
    setResetVersion((version) => version + 1);
  }, []);
  const selectLocation = useCallback((location: PortfolioLocation) => {
    setSelectedLocationPosition(null);
    setSelectedLocation(location);
  }, []);
  const handleMapReady = useCallback(() => {
    setReady(true);
  }, []);

  return (
    <div
      className={`personal-globe${ready ? " is-ready" : " is-loading"}`}
      aria-label="Interactive OpenStreetMap map"
    >
      <LeafletMap
        active={active}
        resetVersion={resetVersion}
        reducedMotion={reducedMotion}
        selectedLocation={selectedLocation}
        onLocationPositionChange={setSelectedLocationPosition}
        onReady={handleMapReady}
        onSelectLocation={selectLocation}
      />

      <button
        className="globe-reset"
        type="button"
        aria-label="Reset map to show Waterloo and Ottawa"
        onClick={resetView}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4.7 8.1A8 8 0 1 1 4 13M4.7 8.1V3.8M4.7 8.1H9" />
        </svg>
        <span>Show both</span>
      </button>

      <p className="globe-hint" aria-hidden="true">
        Drag to explore <i>·</i> Select a pin to see its story
      </p>

      {selectedLocation && selectedLocationPosition ? (
        <LocationCard
          anchor={selectedLocationPosition}
          location={selectedLocation}
          onClose={closeLocation}
        />
      ) : null}
    </div>
  );
}
