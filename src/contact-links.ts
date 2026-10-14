// Optional public destinations. Without them, the contact form remains usable.
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL?.trim() || "";
export const RESUME_URL = import.meta.env.VITE_RESUME_URL?.trim() || "";
export const LINKEDIN_URL = "https://www.linkedin.com/messaging/compose/?recipient=rayxurx";
export const GITHUB_URL = "https://github.com/Rayhypertyper/";
export const SCHEDULE_URL = "https://calendly.com/rayxurx8/30min";

export const TOUR_STORAGE_KEY = "rayxu-quick-tour-completed-v1";

export function hasCompletedTour() {
  try {
    return localStorage.getItem(TOUR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}
