# Guided tour motion & ending overhaul

Rebuild the tour's motion layer on four primitives (ms-based typing schedule, smoothed "lamp" spotlight, shared-element demo expansion, search-bar handoff) and re-author the Contact ending so the tour lands on five lit planets, Email last, with lights-up, toast, and caret handoff — all additive to the current uncommitted tour code, verified by typecheck/build plus manual desktop/mobile/dark/reduced-motion runs.

## Active mode

The enhanced tour is active again, including the three-second planet finale.
`src/tour-config.ts` exports `TOUR_OVERHAUL_ENABLED = true`. The pre-plan tour
and exact enhanced snapshot remain preserved. See `TOUR_RESTORE.md` for the
one-switch instructions.

## Preserved enhanced implementation status

All six phases are implemented. The original uninterrupted desktop run took 61.161 seconds, including the ending. A subsequent three-second synchronized planet finale brings the expected duration to about 64 seconds. The progress estimates are now identity 2.7 s, positioning 3.9 s, Keyboard 22.8 s, AirCAD 13.1 s, Nokia 6.9 s, and Contact 12.9 s, plus a conservative 1 s per section handoff. Entry copy is “~1 minute.” See TOUR_CHECKPOINT.md for verification and remaining browser-specific limitations.

The detailed phases below preserve the supplied design proposal; their original timing estimates are superseded by the measurement above.

## Implementation decisions clarified

- Preserve the existing uncommitted work; do not make a baseline commit as a side effect.
- Use tick offsets for text lookup and millisecond windows for count-ups. A count's window starts at its scheduled completion minus its duration, so punctuation and host lead pauses cannot shift it incorrectly.
- Keep demo and shade React keys in separate namespaces. The stage owns its animations and cancels them on unmount. Next, Back, progress navigation, Skip, and Esc cancel the current handoff/clip safely.
- Re-measure contain-fit geometry on resize. A resize or pause during entrance completes the layout; Resume preserves the media time and does not replay the entrance.
- Preserve panel progress through its move into/out of the demo stage using a clock owned by GuidedTour.
- An interrupted search adopts a query matching the actual selected filter. Completed handoffs adopt the full preview without running the mock loader.
- After Email finishes, all five pulse rings and satellites restart together for a three-second pausable finale. Reduced motion skips this added motion beat. Automatic completion then runs the ending; Finish completes immediately. The ending ignores Pause, suspends while the document is hidden, and finishes immediately on visitor interaction. Only automatic completion restores heading focus; interruption preserves the visitor's focus.
- Calibrate each stop from a full live run, including actual copy lengths, count windows, media entrance/exit, and the ending. Replace the proposed ~53-second estimate if the measurement disagrees.
- Use the Codex in-app browser for manual verification. If media-preference emulation is unavailable, explicitly record that limitation rather than claiming a reduced-motion browser run.

## Decisions locked in

- Scope: everything in one pass (7 build-order items), phased so each phase typechecks on its own.
- Final planet: **Email** (the "send me a message" planet that focuses the form). Planet visit order becomes LinkedIn → GitHub → Schedule → Resume → Email (continues around the orbit ring and ends at Email).
- **Drop automatic native fullscreen** during the auto tour; keep the Maximize button for opt-in.
- Pacing: add a **350 ms AirCAD beat** (`readingPauseMs: 0 → 350`); keep the Keyboard clip at 0:50–1:02.55.
- No new dependencies. CSS keyframes + Web Animations API (WAAPI) only. React 19 / Vite / Tailwind 4 already present.
- Verification is `npm run typecheck` + `npm run build` + manual browser runs (no test runner exists in the project).

## Existing seams this builds on (verified in code)

- `src/components/GuidedTour.tsx`: `TOUR_STOPS`, page-text target discovery (`[data-tour-text-host]`, `[data-tour-focus-block]`), single spotlight via SVG mask (`rect` re-rendered on each measure → teleports), planet rAF tracking, `transition()/navigate()/advance()` helpers, `useStepTimer` dwell, typed portals carrying `data-typing-state="typing|complete"`.
- `src/hooks/useTourTypewriter.ts`: linear chars-per-second clock keyed per stop; pause preserves characters.
- `src/components/TourDemo.tsx`: hidden pre-mounted stage (`guided-tour-video--preparing`), seeks to `start`, requests native fullscreen in a rAF on activation, advances on `end`.
- `src/components/TourPageText.tsx` / `TourTypedText.tsx`: reserve span holds layout, visible span types; `strong` runs preserved.
- `src/App.tsx`: `navigateTour` flips `activeFilter` instantly; `search-results-stack` transition classes are inert; `#results[data-active-tour-stop]` scopes blanking.
- `src/components/SearchBar.tsx` + `ui/halo-search.tsx`: controlled `value`, `isLoading` → "Searching…" shimmer (chars arrive via `search-bar-character-arrive`), input text hidden while loading.
- `src/components/FilterTabs.tsx`: per-tab underline via Tailwind `after:scale-x-0/100`, 200 ms.
- Contact: `.contact-intro h2 > span[aria-hidden]` is the page caret (`contact-caret` 1.05 s); hidden during the contact stop by `guided-tour.css:104`. Planets are `.contact-planet` inside `.contact-orbit-item` positioned each frame via `style.transform` (ContactSection.tsx ~751). Sticky note `.contact-sticky-note` ("Send a message to launch the rocket!").
- Experience: rail is `.experience-timeline::before` (uses `transform: translateY(var(--experience-rail-shift))`, so the draw must use `clip-path`, not scale); node dot `.experience-entry__node span`; logo `.experience-logo--nokia`; tags `.experience-card__tags span`; arrow `.experience-card__arrow`.
- AirCAD doodles: `src/components/AirCADDoodles.tsx` SVG paths; `.aircad-doodle__faint` / `__hidden-edge` are already dashed (exclude from self-draw).
- Projects media: `.projects-feature__media` has `aspect-ratio: 2940/1524` — same as the video, so a uniform-scale FLIP is exact. Both the page player and the tour stage use the same poster image.

---

## Phase 1 — Foundations (typing schedule, text metadata, lamp)

### 1a. `src/hooks/useTourTypewriter.ts` → millisecond schedule

Replace the linear cps clock with a precomputed per-tick schedule so per-host speed, lead pauses, punctuation pauses, deterministic jitter, and count-up durations all share one pausable clock.

```ts
export interface TypingSchedule { times: number[]; total: number }  // times[i] = ms at which tick i completes
export interface ScheduleInput { text: string; cps: number; leadMs: number; count?: { durationMs: number } }

export function buildTypingSchedule(inputs: ScheduleInput[], seed: string): TypingSchedule
// rules: base = 1000/cps; after "," +180 ms; after "." "?" "!" +280 ms; leadMs before a host's first tick;
// jitter ±15% of base via mulberry32 seeded from `seed` (identical on Replay);
// a count host contributes exactly ONE tick at +durationMs (default 900).

export function useTourTypewriter(key: string, schedule: TypingSchedule, enabled: boolean):
  { characters: number; elapsed: number; complete: boolean; reducedMotion: boolean }
// pause/resume stores elapsed ms (not characters); reduced motion → characters = times.length, elapsed = total.
```

`characters` keeps its name so `activeText` lookup and `TourTypedText` slicing are unchanged; count hosts simply own one tick. Also expose `idle = elapsed - times[characters-1] > 350` for cursor blinking.

### 1b. `src/components/TourPageText.tsx` → metadata props rendered as data attributes

```ts
interface TourPageTextProps {
  children: ReactNode; inline?: boolean;
  cps?: number;          // data-tour-cps        (default 30)
  leadMs?: number;       // data-tour-lead-ms    (pause before this host starts)
  letters?: boolean;     // data-tour-letters    (per-glyph landing; identity name only)
  count?: { value: number; decimals?: number; suffix?: string; durationMs?: number }; // data-tour-count-*
}
```

Host usages to update:
- `AllOverview.tsx`: name `cps={12} letters`; subtitle `leadMs={180}`.
- `ProjectsShowcase.tsx`: `95.6%` → `count={{ value: 95.6, decimals: 1, suffix: "%" }}`; `95.7%` likewise; `24 FPS` → `count={{ value: 24, suffix: " FPS" }}`. Remove the `isMetricBlock ? 16 : 30` special case in `GuidedTour.tsx`.

### 1c. `src/components/TourTypedText.tsx`

- `count` mode: render `(value * easeOutCubic(progress)).toFixed(decimals) + suffix` where `progress` comes from `elapsed` within the host's tick window (passed as a prop); reserve span still renders the final string. Add `font-variant-numeric: tabular-nums` on `.projects-metric strong .tour-typed-text__visible`.
- `letters` mode: wrap each glyph of **both** reserve and visible spans in `<span class="tour-typed-char">` (`display:inline-block; white-space:pre`) so metrics match; visible glyphs animate `tour-letter-land` 160 ms (opacity 0→1, translateY(0.06em)→0, blur(2px)→0).
- `strong` runs: add `data-complete="true"` when the run is fully typed (drives the Phase 5 highlighter).
- Cursor: `idle` prop → `data-idle` → blink only when idle; no blink while typing.

### 1d. `src/components/GuidedTour.tsx` — targets + lamp

- `PageTextTarget` gains `length` (ticks: `text.length`, or 1 for count), `cps`, `leadMs`, `count`, `letters`, read from host dataset. Offsets are in ticks. `TOUR_STOPS[n].blockOrder?: string[]` sorts hosts by focus-block id before offsets are computed (stable; unlisted blocks keep DOM order after listed ones). Contact: `["contact-intro","contact-planet-linkedin","contact-planet-github","contact-planet-schedule","contact-planet-resume","contact-planet-email"]`.
- Build `schedule = useMemo(() => buildTypingSchedule(targets, stop.id))`; `useTourTypewriter(stop.id, schedule, enabled)`.
- **Lamp renderer**: React state keeps only the *target* rect. A rAF loop writes `x/y/width/height` directly onto the mask cutout `<rect>` and the stroke `<rect>` via refs: `display += (target − display) · (1 − e^(−dt/110ms))`, settle when all deltas < 0.5 px. Snap (no morph) when `stop.id` changes or on first rect of a stop. Planet circles stay exact per frame (unchanged).
- **Soft edge**: `<filter id={maskId+"-soft"} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="10"/></filter>` applied to the mask cutout rect only (never to planet circles).
- **Arrival pulse**: stroke rect keyed by `activeBlock.id` → `tour-spot-arrive` 160 ms, 300 ms delay (opacity 1→0.5→1).
- **Shade fade**: `.guided-tour-shade` keyed by `stop.id`, `tour-shade-in` 280 ms (opacity 0→1).
- Add `html[data-tour-paused]` while paused (for any CSS animation that should freeze).

### 1e. `src/guided-tour.css`
Keyframes `tour-shade-in`, `tour-spot-arrive`, `tour-letter-land`; `.tour-typed-char`; idle-cursor rule; tabular nums; reduced-motion overrides (no letter-land, no pulse).

**Exit criteria:** typecheck passes; identity/positioning/keyboard run end-to-end with morphing spotlight; metrics count up; Replay produces identical timing.

---

## Phase 2 — Demo expansion, no auto-fullscreen, AirCAD beat

### 2a. `src/components/TourDemo.tsx`
- Remove the rAF `stage.requestFullscreen()` block (lines ~62–68). Keep the `fullscreenchange` listener and `data-fullscreen-mode` for the Maximize button.
- `TourDemoSource` gains `origin?: HTMLElement` (GuidedTour sets `target.querySelector(".projects-feature__media")`).
- **Shared-element expansion (FLIP + clip)** on `active → true` (skip under reduced motion → 120 ms opacity fade):
  1. `O = origin.getBoundingClientRect()`; `P = player.getBoundingClientRect()`; `F = contain-fit of aspect (videoWidth/videoHeight, fallback 2940/1524) inside P`.
  2. `s = O.width / F.width`. Start keyframe: `transform: translate(O.left − F.left·s, O.top − F.top·s) scale(s)` with `transform-origin: 0 0`, `clip-path: inset(F.top F.rightInset F.bottomInset F.left round 12px/s)`. End: `transform: none; clip-path: inset(0)`.
  3. `stage.animate([...], { duration: 520, easing: "cubic-bezier(0.16,1,0.3,1)", fill: "both" })`; `will-change` only for its duration.
  4. New `<img class="guided-tour-video__poster">` absolutely positioned on F (object-fit contain) covers the seeked frame during expansion; on `finished`: poster fades 200 ms, then `video.play()`; caption (keyboard only) rises 200 ms after (`tour-caption-rise`).
  5. Shade stays mounted during expansion with `.guided-tour-shade--lifting` (opacity→0 over 520 ms); unmount after `entered`.
  6. Exit: `finishDemo()` on clip end runs the reverse (320 ms, `cubic-bezier(0.7,0,0.84,0)`) **then** `onAdvance()`. User-initiated Next/Esc/Skip (via `finishingRef`) skip the animation.
  7. Pause mid-expansion: cancel to end state and hide (today's pause behaviour); Resume shows the stage without re-expanding.
- **Progress hairline**: `<i class="guided-tour-video__progress">` on the player's bottom edge; WAAPI `scaleX 0→1` over `(end − start)·1000` ms linear, `transform-origin: left`; synced on `play` (`anim.currentTime = (video.currentTime − start)·1000`), paused on `pause`. Accent `#f0ad88`.

### 2b. `src/components/GuidedTour.tsx`
- AirCAD `readingPauseMs: 350`.
- Pass `origin` into `demo`; hint copy unchanged.

### 2c. `src/guided-tour.css`
`.guided-tour-video__poster`, `.guided-tour-video__progress`, `.guided-tour-shade--lifting`, caption rise keyframes; reduced-motion fallbacks.

**Exit criteria:** Keyboard and AirCAD demos grow out of their cards and collapse back; no native fullscreen prompt; hairline tracks the clip; pause/resume mid-clip still resumes at the same frame.

---

## Phase 3 — The ending (Contact)

### 3a. Order & cumulative light (`GuidedTour.tsx`)
- `blockOrder` for contact (Phase 1d) ends on Email.
- Lit set is derived, not stored: `litBlocks = blocks.slice(0, indexOf(activeBlock))` filtered to `contact-planet-*`. The planet rAF tracker measures planet + label rects for every lit block (≤ 5 × 2 rects/frame).
- Mask renders a crisp circle + label rect for each lit planet; the **active** planet keeps pulse ring + orbiting satellite, lit planets get only the thin `__track` ring. `data-tour-planet-lit` on lit planets (brightness filter), `data-tour-planet-active` on the current one.

### 3b. Caret handoff (`guided-tour.css`)
Replace line 104 with: `#results[data-active-tour-stop="contact"] .contact-recruiter:has([data-typing-state="typing"]) h2 > span[aria-hidden] { display: none; }` — the page caret is hidden only while the intro types, then blinks for the whole planet sequence and after.

### 3c. Lights-up sequence (`GuidedTour.tsx` + CSS)
The contact `useStepTimer` callback calls `beginEnding()` instead of `complete()`:

| t (ms) | Beat |
|---|---|
| 0 | `ending = true`; `html[data-tour-ending]`; shade `.guided-tour-shade--ending` (opacity → 0, 600 ms); planet rings `--ending` (fade 300 ms, delay 300 ms). |
| 200 | Panel switches to toast variant `.guided-tour--toast`: "That's the tour ✓", `role="status"` (non-interactive); sr-only live region announces "Tour complete." |
| 1800 | `html[data-tour-ending] .contact-sticky-note { animation: tour-note-nudge 320ms 1800ms }` using the `rotate` property (0 → 1° → −0.6° → 0) so it doesn't fight existing transforms. |
| 2400 | Toast `--leaving` (slide down + fade, 240 ms). |
| 2800 | `complete()` (existing: marks completed, stays on Contact, focuses heading). |

Scroll / click / Esc during the ending → `complete(false)` immediately (reuse `exitIntoPage`; Esc on the last stop completes rather than exits). Reduced motion: shade off instantly, toast shown 2.2 s with no slide, no nudge.

**Exit criteria:** final frame before lights-up shows exactly five lit planets with Email active; caret blinks after the intro; toast appears and leaves; Contact remains selected and focused.

---

## Phase 4 — Search handoff (→ Projects, → Experience, → Contact)

### 4a. `TOUR_STOPS`: `query?: string` on the first stop of each new filter — keyboard `"projects"`, experience `"experience"`, contact `"contact"`.

### 4b. `GuidedTour.tsx` orchestrator
- State `handoff: { toIndex: number; phase: "typing" | "searching" | "leaving" } | null`.
- `navigate(index)`: forward + different filter + `query` + not reduced motion → start handoff; otherwise today's instant path (Back, dots, reduced motion).
- Phases: `typing` uses a second typewriter `useTourTypewriter("handoff:"+toIndex, scheduleFor(query, 45 cps), enabled)` → `searching` (`useStepTimer` 320 ms) → `leaving`: set `html[data-tour-handoff="leaving"]` (stack fades out 140 ms) → `transition(() => onNavigate(toIndex))`, `handoff = null`. In the `[stop.id]` effect, if `data-tour-handoff === "leaving"` set `"arriving"` and clear after 320 ms.
- Shade: `.guided-tour-shade--leaving` (opacity → 0, 160 ms) from handoff start; the new stop's shade uses `tour-shade-in` with 300 ms delay when arriving. Finished typed copy stays visible throughout.
- New prop `onSearchPreview(state: { query: string; searching: boolean } | null)`; called as the preview changes: typing → `"Ray Xu " + suffix.slice(0, chars)`, searching → full query + `searching: true`, navigate → `null`. Esc/Skip/unmount → `null` and clear `data-tour-handoff`.
- Pause during handoff freezes it (typewriter and timers disabled); hidden tab likewise.

### 4c. `App.tsx`
`tourSearch` state; pass `onSearchPreview={setTourSearch}` to `GuidedTour` and `tourSearch` to `SearchHeader` → `SearchBar`. Add CSS hooks on `.search-results-stack`: `html[data-tour-handoff="leaving"] .search-results-stack { opacity:0; transform: translateY(-6px); transition: 140ms }`, `html[data-tour-handoff="arriving"] .search-results-stack { animation: tour-stack-arrive 320ms cubic-bezier(0.16,1,0.3,1) }`. Also `html[data-tour-handoff="arriving"] .filter-result-count { animation: tour-count-roll 120ms }`.

### 4d. `SearchBar.tsx`
Props `previewQuery?: string | null; previewSearching?: boolean`. Displayed value = `previewQuery ?? searchValue`; `isLoading || previewSearching`; `readOnly` while previewing; when `previewQuery` returns to `null`, adopt the last preview as the real `searchValue` (the bar truthfully shows "Ray Xu contact" after the tour). Do not start the 4800 ms mock loader.

### 4e. `FilterTabs.tsx` + `search-header.css`
Track previous active index in a ref; set `data-direction="forward|backward"` on the tablist. CSS: forward → inactive underline `transform-origin: right`, active `transform-origin: left` (both edges move right = one bar sliding); backward mirrored.

**Exit criteria:** each section change reads as type → search → tab slides → content arrives (~1.0 s); Back is instant; reduced motion is instant; pausing mid-handoff and resuming continues it.

---

## Phase 5 — Micro-moves + panel

All CSS lives in `src/guided-tour.css`, scoped to `html[data-tour-stop="…"]` / `#results[data-active-tour-stop="…"]` so nothing leaks into normal browsing.

- **Positioning highlighter**: `[data-tour-target="positioning"] .tour-typed-text__visible strong { background: linear-gradient(var(--tour-highlight),var(--tour-highlight)) no-repeat 0 85% / 0% 0.5em; box-decoration-break: clone; transition: background-size 260ms ease-out }` → `strong[data-complete="true"] { background-size: 100% 0.5em }`. `--tour-highlight: rgb(163 81 51 / 20%)`, dark `rgb(240 173 136 / 22%)`.
- **AirCAD self-draw**: `AirCADDoodles.tsx` adds `pathLength={1}` to every `path`/`circle`. CSS: `html[data-tour-stop="aircad"] .aircad-doodle :is(path,circle):not(.aircad-doodle__wash,.aircad-doodle__faint,.aircad-doodle__hidden-edge) { stroke-dasharray:1; stroke-dashoffset:1; animation: tour-draw 900ms cubic-bezier(.4,0,.2,1) var(--draw-delay,0ms) forwards }`; per-doodle `--draw-delay` 0/120/240/360 ms; wash + dashed paths fade in 400 ms at 600 ms.
- **Nokia**: rail `html[data-tour-stop="experience"] .experience-timeline::before { animation: tour-rail-draw 420ms both }` (`clip-path: inset(0 0 100% 0) → inset(0)`); node `[data-tour-target="experience"] .experience-entry__node span { animation: tour-node-fill 220ms 300ms both }` (scale .6→1); logo `opacity:.4` until `.experience-card:has(h3 [data-typing-state="complete"]) .experience-logo { opacity:1 }` (200 ms); tags `.experience-card__tags span:has([data-typing-state="complete"]) { animation: tour-stamp 160ms both }` (scale .96→1 + 1 px accent inset shadow); arrow nudge when the last tag completes (`translateX 4px`, 240 ms, 500 ms delay).
- **Panel progress** (`GuidedTour.tsx` + CSS): keep the six `<button>`s (a11y intact) but render each as a 22×2 px segment; visited = filled accent; current = track + `<i>` fill animated with WAAPI `scaleX` over `TOUR_STOPS[n].estimatedMs` (paused with `paused || hidden || handoff`; snaps full on stop change). Header text "3 / 6 · ~35 s left" from `estimatedMs` sums (1 Hz update). Initial estimates: identity 3200, positioning 4600, keyboard 17500, aircad 11400, experience 6200, contact 7800, +1000 per handoff — **calibrate from a measured run before finishing**.
- Panel arrival on stop 1: `tour-arrive` gets a 400 ms delay so the first fixation lands on the name.

---

## Phase 6 — Docs
- `README.md` tour paragraph: ms-schedule pacing, count-ups, demo expansion (no auto fullscreen), search handoff, cumulative planets ending on Email, lights-up/toast, ~53 s.
- `TOUR_CHECKPOINT.md`: new "Current behavior" + verification notes.

---

## Reduced motion / pause / theme matrix

| Effect | Reduced motion | Paused | Dark theme |
|---|---|---|---|
| Lamp morph + soft edge | snap, no blur | shade unmounted (existing) | stroke `#f0ad88` |
| Typing schedule | full text immediately, dwell preserved | elapsed ms frozen | — |
| Count-up | final value | frozen | — |
| Letter-land / highlighter / draw / stamps | static | attributes removed → static | `--tour-highlight` dark value |
| Demo FLIP + hairline | 120 ms fade; hairline still shown | cancel to end state; hairline paused | — |
| Search handoff | instant switch | frozen mid-phase | shimmer colours already themed |
| Panel progress | stepped segments; countdown shown | WAAPI paused | `--tour-*` vars |
| Ending | shade off instantly, toast 2.2 s, no nudge | n/a (ending ignores pause; interaction completes) | panel dark vars |

## Verification

1. `npm run typecheck` after each phase; `npm run build` at the end.
2. `npm run dev` → `http://127.0.0.1:5173/`. Full auto run at 1366×900 and 390×844, light and dark, plus DevTools `prefers-reduced-motion: reduce` emulation. Record total duration and calibrate `estimatedMs`.
3. Interaction matrix: Pause/Resume during (a) count-up, (b) handoff typing, (c) demo expansion, (d) planet sequence; Back/Next/dots during handoff; Esc during video; Esc/scroll/click during the ending; Replay twice (identical cadence).
4. Confirm: exactly one lamp at all times except cumulative planets on Contact; no native fullscreen prompt; no horizontal overflow on mobile; console free of warnings; search bar shows the last query and the real filter after completion; All page shows "Tour completed · Replay".

## Risks / notes

- `:has()` is relied on for CSS "on complete" hooks (Chrome 105+, Safari 15.4+, Firefox 121+) — acceptable for a portfolio; no JS fallback planned.
- `feGaussianBlur` inside an SVG mask: verify Safari rendering; fallback is to drop the filter (crisp cutout) — nothing else depends on it.
- The FLIP uses the stage's own `transform` + `clip-path`; the Maximize button still works afterward because the animation fills `both` at identity.
- Handoff adds ~1 s × 3 to the tour (~53 s total); the entry note "~50 seconds" stays truthful enough, or bump to "~1 minute" if the measured run exceeds 55 s.
- All current tour work is uncommitted. Recommended step 0 (your call): commit the existing tour as a baseline so this overhaul is a reviewable diff.
