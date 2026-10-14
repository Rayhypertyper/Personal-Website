/** Choose the tour without deleting either implementation. */
// export const TOUR_OVERHAUL_ENABLED: boolean = false;

// Enhanced tour is active. To use the pre-plan version, swap these two exports:
export const TOUR_OVERHAUL_ENABLED: boolean = true;

/** Let LinkedIn and Calendly linger together before focusing the contact form. */
export const TOUR_PLANET_FINALE_ENABLED: boolean = true;
/** Keep 22.78% of the original linger: 66% shorter, then another 33% shorter. */
export const TOUR_PLANET_FINALE_DURATION_SCALE = 0.2278;

/** Individual sequence takes about 36.3 s; excludes the synchronized finale. */
export const TOUR_CTA_DURATION_SECONDS = 37;
/** Start the countdown at 30 displayed seconds, with nearly a full first second. */
export const TOUR_COUNTDOWN_START_SECONDS = 30.9999;
/** Reveal longer copy quickly enough for visitors to read ahead of the animation. */
export const TOUR_READING_CHARACTERS_PER_SECOND = 60;
export const TOUR_FLOAT_DISMISSED_KEY = "rayxu-tour-float-dismissed-v1";
