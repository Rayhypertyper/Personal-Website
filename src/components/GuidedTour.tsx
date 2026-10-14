import type { ComponentProps } from "react";
import { TOUR_OVERHAUL_ENABLED } from "../tour-config";
import { GuidedTour as BaselineTour, TOUR_STOPS as BASELINE_STOPS } from "./GuidedTourBaseline";
import { GuidedTour as EnhancedTour, TOUR_STOPS as ENHANCED_STOPS } from "./GuidedTourOverhaul";
import "../guided-tour.css";
import "../guided-tour-overhaul.css";

export const TOUR_STOPS = TOUR_OVERHAUL_ENABLED ? ENHANCED_STOPS : BASELINE_STOPS;

/** One switch restores the entire enhanced tour, including its planet finale. */
export function GuidedTour(props: ComponentProps<typeof EnhancedTour>) {
  return TOUR_OVERHAUL_ENABLED ? <EnhancedTour {...props} /> : <BaselineTour {...props} />;
}
