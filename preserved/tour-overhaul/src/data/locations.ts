export type MarkerType = "home" | "school";

export interface PortfolioLocation {
  id: string;
  label: string;
  locationName: string;
  latitude: number;
  longitude: number;
  shortDescription: string;
  markerType: MarkerType;
}

export const locations = [
  {
    id: "ottawa-home",
    label: "Ottawa",
    locationName: "Ottawa, Ontario",
    latitude: 45.4215,
    longitude: -75.6972,
    shortDescription: "My hometown!",
    markerType: "home",
  },
  {
    id: "waterloo-school",
    label: "Waterloo",
    locationName: "University of Waterloo, Waterloo, Ontario",
    latitude: 43.4723,
    longitude: -80.5449,
    shortDescription: "I go to school here!",
    markerType: "school",
  },
] as const satisfies readonly PortfolioLocation[];
