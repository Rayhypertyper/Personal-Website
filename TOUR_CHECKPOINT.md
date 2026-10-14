# Guided tour checkpoint — October 13, 2026

## Countdown ends before the synchronized finale

The countdown now reaches exactly 0 at the transition from the individual
planet sequence to the synchronized turning animation. It stays at 0 during
that group animation, including Pause/Resume. The phase change determines
zero, so buffering or navigation cannot make the group animation start with
seconds still remaining. The popup continues to follow the group animation.

The starting countdown and floating reminder now use 37 seconds, rounding up
the previously measured 36,345.9 ms from identity entry to Email's final label
reveal. Contact's progress estimate is 3,100 ms, excluding the group finale.
The displayed zero has no approximation marker.

Verification: production build and TypeScript passed; the mechanical detector
reported no findings. The in-app browser showed `0 s left` with five active
orbit animations, complete Email copy, and no popup at desktop 1366 × 900.
After Pause/Resume at mobile 390 × 844, the same zero and five animations
remained until the popup followed. No console warnings/errors or horizontal
overflow were observed.

## Previous Email animation completion change

The active enhanced tour now ends when Email's typing is complete and its
current four-second orbit finishes. All five planets join the running Email
pulse/orbit as soon as its label finishes typing. Their animations are bounded
at that orbit's endpoint, and the actual animation completion promise shows
the “That's the tour” popup immediately while the shade lifts. The old 900 ms
reading dwell, separate three-second finale timer, and 200 ms popup delay have
been removed. The popup's existing hold and dismissal follow completion.

The starting countdown and floating reminder now use 40 seconds. The active
clock includes search transitions and freezes on Pause or page hiding. Stop
progress estimates were calibrated to the same measured uninterrupted run.
`tour:email-typed` marks the final label reveal and `tour:finished` marks the
animation-defined endpoint; `tour:complete` still marks overlay cleanup.

Verification in the in-app browser:

- Uninterrupted desktop, 1366 × 900: 39,991.9 ms from identity entry to the
  animation-defined endpoint. Contact took 6,678 ms, including the final
  3,646 ms remaining in Email's running orbit after typing completed.
- Mobile, 390 × 844: pausing at 3,099.961 ms of the 4,000 ms orbit and resuming
  after a 19-second hold restored exactly 3,099.961 ms. The popup appeared
  after the remaining approximately 900 ms, with no replay or extra delay.
- TypeScript and production build passed. The mechanical detector found no
  issues in the changed tour components. Temporary timing logs were removed.

The older entries below preserve implementation history; their finale timing
and duration estimates are superseded by this section.

The motion and ending overhaul is implemented without new dependencies or a
baseline commit. The existing uncommitted portfolio work is preserved.

## Invisible Keyboard clip trim

The active enhanced tour now plays Invisible Keyboard from 0:51 to 1:01.55,
removing one second from each end of the previous 0:50–1:02.55 clip. The
Keyboard stop's progress estimate is two seconds shorter (20,800 ms).
Verification: `npm run build` passed. The in-app browser confirmed the player
prepares at 51 seconds and automatically advances to AirCAD, with no warning
or error logs.

## Active implementation — enhanced tour reactivated

`src/tour-config.ts` now exports `TOUR_OVERHAUL_ENABLED = true`. All enhanced
features, including the synchronized three-second planet finale, are active.
The pre-plan implementation and exact snapshot remain preserved and available
through the same switch. Reactivation passed the production build and
TypeScript check. The in-app browser confirmed enhanced mode, all five pulse
rings and orbits, six progress segments, and empty warning/error logs.

## Previous baseline restoration and verification

`src/tour-config.ts` currently exports `TOUR_OVERHAUL_ENABLED = false`.
The enhanced implementation, including the synchronized finale, remains in
executable source and is selected by uncommenting the alternate `true` export.
An exact snapshot of the enhanced source and generated code is also retained
in `preserved/tour-overhaul/`, with a verified SHA-256 manifest.

The restored baseline uses the original linear typewriter, individual metric
typing at 16 cps, progress dots, immediate section navigation, single-block
spotlight, original fullscreen demo attempt, zero extra AirCAD dwell, and
Email → LinkedIn → GitHub → Schedule → Resume planet order. Its Contact ending
is the original 300 ms dwell without cumulative lighting, finale, or toast.
Existing portfolio changes outside the plan remain intact.

Verification: baseline desktop showed five planets in the original order,
exactly one ring/pulse, 8 px dots, no lamp blur/countdown/toast, and normal
completion on Contact. Temporarily uncommenting the `true` export restored
all five pulse/orbit animations, six segments, countdown, and soft lamp.
Both modes passed `npm run build`; browser warning/error logs were empty.
The switch has been returned to `false`. Final mobile verification at 390 × 844
confirmed Email first, one ring, no progress segments, and no horizontal overflow.

## Enhanced behavior (active)

- A deterministic, pausable millisecond schedule supports per-host speed,
  lead/punctuation pauses, name glyph arrivals, and numeric count-ups.
- `TourSpotlight.tsx` writes lamp geometry through SVG refs with 110 ms
  exponential smoothing. Planet geometry stays exact, with cumulative crisp
  cutouts for each visited planet and its label.
- Demos preload/seek during narration, expand from their real card geometry,
  fade the poster, play muted, track the clip with a hairline, then collapse.
  Native fullscreen is available only through Maximize. Pause or resize during
  entrance completes the layout; Resume keeps the clip position.
- Forward filter changes type the search query, show Searching, fade the stack,
  then navigate. Direct progress navigation and Back are immediate. Interrupted
  previews reconcile to the actual filter without the mock loading timer.
- Contact order is LinkedIn, GitHub, Schedule, Resume, Email. All five stay lit
  at the end, with Email active. Once Email finishes, all five pulse rings and
  orbiting dots restart together for a three-second finale before lights-up.
  The finale supports Pause/Resume and is skipped under reduced motion.
  Guided scrolling includes the cumulative group
  so every planet fits above the lower viewport edge on mobile.
- The page caret returns beside the completed heading during the planet
  sequence. After the finale, automatic completion lifts the shade over 600 ms, shows a status
  toast after 200 ms, nudges the note at 1800 ms, leaves at 2400 ms, and completes
  at 2800 ms. Visitor interaction completes immediately. Finish is immediate.
- Highlighting, AirCAD line drawing, Nokia rail/node/tag feedback, six progress
  segments, and a once-per-second estimate are scoped to the tour.
- Reduced motion uses full copy/final counts, static decoration, a 120 ms demo
  fade, instant filter changes, and a 2.2-second stationary toast. Its progress
  estimate uses the reduced-motion dwell and clip durations.

## Verification of this overhaul

- `npm run typecheck` passed after foundations, demo work, and the combined
  ending/handoff/panel implementation. `npm run build` passed.
- Schedule assertions passed for deterministic replay, monotonic ticks,
  punctuation pauses, one-tick counts, count duration, and empty input.
- Original uninterrupted desktop run before the added finale, 1366 × 900: 61.161 seconds from identity entry to
  completion. Observed entries (milliseconds from page load): identity 5009,
  positioning 7698, Keyboard 12268, AirCAD 35005, Nokia 48805, Contact 56342,
  completion 66170. Both demo clips continued automatically.
- Calibrated estimates excluding conservative handoff allowances: 2.7, 3.9,
  22.8, 13.1, 6.9, and 12.9 seconds (Contact includes the new three-second finale). Entry copy now says “~1 minute.”
- Desktop completion removed typed portals, shade, demo, ending/pause flags,
  stayed on Contact, focused `contact-title`, and retained “Ray Xu contact”.
- Mobile 390 × 844, dark: exactly five lit planets and five rings were captured
  with Email active. All five planet bounds fit within the viewport, controls
  stayed at the top, and there was no horizontal overflow. The heading caret
  remained beside the text rather than wrapping below it.
- Mobile demo pause at 53.294 seconds resumed at 53.319 seconds in viewport
  mode. Esc cleared the video, shade, portals, and pause attribute.
- Count-up pause restored original metrics; Resume continued counting. A
  handoff paused during Searching preserved the same query across an 800 ms
  hold. Resume and direct progress navigation cleared the preview and produced
  a query matching the selected Experience tab.
- The initial QA pass found a shade/demo React key collision. Distinct key
  namespaces fixed it; the uninterrupted run subsequently completed. The old
  console entries predate the corrected run.
- Final clean-tab checks: AirCAD paused during expansion at 30.500 seconds
  and resumed directly in the entered layout at 30.736 seconds, in viewport
  mode. Planet pause/resume retained `contact-planet-github`. Esc, a heading
  click, and a wheel scroll during the toast each immediately cleared the tour
  while preserving Contact and its search query. Console warning/error logs
  were empty in this clean tab.
- Final desktop capture contains all five lit planets and the fully typed
  Email label/detail, with no horizontal overflow.
- Planet finale refinement: desktop showed five pulse rings, five orbit groups,
  and five satellites simultaneously after all Email copy completed. The toast
  appeared 3171 ms after observing finale entry (three-second hold plus the
  existing 200 ms toast delay). Mobile 390 × 844 retained Resume after a
  3500 ms pause, restored all five animations, and continued into the toast.
  No horizontal overflow or console warnings/errors were observed. The build
  and TypeScript check passed.
- The Impeccable mechanical detector reported no findings for changed tour,
  search, and navigation files.

## Verification limits

The in-app browser exposes viewport resizing but no media-preference emulation.
Reduced-motion branches and CSS were reviewed; a live emulated reduced-motion
run remains unverified. Browser-engine-specific SVG mask blur and manually
selected native fullscreen should also receive a release smoke check. No
contact form was submitted, no external links were activated, and nothing was
published.

## Files and preview

- Completed plan: `TOUR_PLAN.md`.
- Main orchestration: `src/components/GuidedTour.tsx`.
- Animation ownership: `TourDemo.tsx`, `TourSpotlight.tsx`, `TourProgress.tsx`.
- Typing: `useTourTypewriter.ts`, `TourPageText.tsx`, `TourTypedText.tsx`.
- Preview: http://127.0.0.1:5173/.
- Desktop final-frame screenshot:
  `/Users/rayxu/.codex/visualizations/2026/10/12/01a13275-6b1e-7501-b139-3f07f70f27a6/tour-desktop-light.jpg`.
- Mobile final-frame screenshot:
  `/Users/rayxu/.codex/visualizations/2026/10/12/01a13275-6b1e-7501-b139-3f07f70f27a6/tour-mobile-dark.jpg`.
- Changes remain uncommitted. The build refreshes tracked `dist/client` outputs.

## Previous checkpoint (preserved history)

The following text records earlier behavior and checks. Its old timing, planet
order, and native-fullscreen descriptions are superseded above.

The contact planet spotlight refinement is complete. Desktop and mobile
browser checks passed. The final step now highlights the planets rather than
the four recruiter buttons.

## Previous baseline behavior (superseded)

- The opt-in tour visits six real stops: identity, positioning, Invisible
  Keyboard, AirCAD, Nokia, and contact. These are the only featured projects.
- The actual highlighted website copy starts visually blank and types at
  30 characters per second by default behind a straight cursor. This includes Ray Xu,
  the university subtitle, the positioning sentence, project headings and
  descriptions, right-side keyboard metrics, Nokia's company/role/description
  and skills, and the contact heading/copy/planet labels.
- The bottom-right panel holds only progress dots and tour controls. It no
  longer duplicates or types narration in a small annotation box.
- Original copy reserves the completed layout and stays accessible. The
  positioning sentence retains its bold emphasis as it types. Exiting or
  changing stops restores the original copy immediately.
- Exactly one block is spotlighted, following the typing cursor. The project
  heading and description share a block; precision, recall, and FPS each get
  their own block only when their text begins typing. Previous and upcoming
  blocks remain dimmed, with a stronger 48% shade around the active block.
- Hero identity and positioning are compact text blocks. Nokia highlights
  its entire card while company/role, description, and skills type. Contact
  highlights the introduction, then Email, LinkedIn, GitHub, Schedule, and
  Resume planets as their labels type. Circular spotlights, pulsing rings,
  and an orbiting dot follow the active planet and its moving label. The
  controls move to the top during the planet sequence, keeping the lower
  planets visible. Blocks scroll into view only when needed to clear the
  controls. There is no permanent section or metric-column box.
- The duplicate under-title metric strip and project heading decorations are
  hidden during project stops. On mobile, metrics form a three-column row.
- Precision, recall, and FPS now type at 16 characters per second, versus
  30 for the rest of the tour. Speed changes preserve character progress and
  pause/resume continues from the same letter.
- The project heading, description, and (for Keyboard) metrics finish before
  the demo expands. Keyboard lingers for 0.75 seconds after “Real-time inference”
  finishes typing; AirCAD has no extra dwell after typing.
- Text-only stops allow a brief reading pause: 600 ms, 700 ms, and 900 ms for
  identity, positioning, and experience. Contact lingers for 300 ms (0.3 seconds)
  after typing completes, then clears the tour overlays and stays on Contact
  without returning to the homepage. Finishing preserves the selected page,
  including when Finish is selected after browsing another section while paused.
- The selected page is kept in session storage for the current browser tab,
  so refreshing or a Vite reconnect also preserves Contact after completion.
- Fullscreen players mount invisibly, preload, and seek while page copy types.
  Invisible Keyboard plays muted from 0:50 to 1:02.55; AirCAD plays muted
  from 0:30.5 to 0:36. Video completion advances the tour automatically.
- Pause/resume preserves both typed characters and playback position. Hidden
  tabs suspend them. Reduced-motion preferences show static copy with the
  original reading dwell instead of character-by-character animation.
- Native fullscreen is attempted after revealing the prepared player. If
  the browser rejects or abandons it, playback continues across the viewport.
  Fullscreen changes alone do not cancel the tour. Explicit Esc/Skip controls
  exit it; video completion exits owned fullscreen before advancing.
- Back, Next, dots, Skip, Escape, remembered completion, and explicit Replay
  remain available. The estimated duration is about 50 seconds.

## Main files

- `src/components/GuidedTour.tsx`: stops, actual page-copy sequencing, typed
  portals, current-block spotlight/scrolling, video preparation, and controls.
- `src/components/TourPageText.tsx`: original accessible copy and portal hosts.
- `src/components/TourTypedText.tsx`: reserved layout, rich text, and cursor.
- `src/hooks/useTourTypewriter.ts`: a single pausable character clock.
- `src/components/TourDemo.tsx`: prepared player, seek, activation, fullscreen
  fallback, pause/resume, and clip completion.
- `src/hooks/useStepTimer.ts`: the pausable reading dwell.
- `src/components/AllOverview.tsx`, `AISummary.tsx`, `ProjectsShowcase.tsx`,
  `ExperienceTimeline.tsx`, `ContactSection.tsx`: hosts around real page copy.
- `src/App.tsx`: current-stop attribute scopes blanking to the active content.
- `src/guided-tour.css`: typing, metric highlights, mobile layout, and player.
- `src/all-overview.css`, `src/globe.css`, `styles.css`: existing span styles
  scoped so the new text hosts inherit the original typography and spacing.
- `README.md`: timing and current behavior documentation.

## Verification

- Latest planet refinement: all five planets were observed in sequence at
  desktop 1366 × 900 and mobile 390 × 844, with exactly one active planet,
  no overlap with the tour controls, and no horizontal overflow. Tracking
  coordinates matched the moving planet center. Pause removed all effects
  and restored the labels; Resume continued the same planet. Automatic
  completion removed the effects, stayed on Contact, and focused its heading.
  Browser warning/error logs were empty. Reduced-motion CSS replaces the
  moving rings with static emphasis.
- The following entries record checks of earlier tour refinements; the
  older references to recruiter action buttons describe the replaced behavior.
- Port 5174 reconnect regression: its Vite connection dropped and reconnecting
  reset the app to All. The selected page now survives in session storage.
  The build passed; a full automatic tour on port 5174 ended on Contact,
  and both a page reload and an actual server stop/restart kept Contact selected.
- Completion navigation refinement: the production build passed. In-app
  browser checks confirmed automatic completion leaves Contact selected, and
  Finish leaves Projects selected after browsing there while paused. Both
  remove the tour controls and restore focus within the selected page.
- `npm run build` passed, including TypeScript and the server build.
- Verification used the Codex in-app browser at desktop 1366 × 900 and mobile
  390 × 844. No horizontal overflow or overlap was observed.
- Hero copy types directly in the page; the subtitle remained at the exact
  same partial string while paused. Next began the positioning copy blank.
- Bold emphasis in the positioning sentence is preserved in the typed copy.
- Keyboard heading/description/metrics begin blank. The prepared player was
  buffered (`readyState` 4), paused at 52 seconds, while actual copy typed.
- After the final right-side metric label finished, the same prepared player
  became active, muted, and played from 52 seconds. Esc removed the player.
- AirCAD was likewise buffered and paused at 38 seconds during on-page typing,
  then expanded directly. Its clip automatically continued to Nokia/contact.
- Contact heading/copy/action labels typed on the page. Resume completed the
  labels and automatic completion removed all typed overlays/tour players,
  restored the full original copy, and focused the contact heading.
- Focus checks confirmed exactly one border at the project introduction and
  at each of precision, recall, and FPS, with upcoming copy still blank.
- Desktop and mobile snapshots confirm only the active block is undimmed.
  Nokia description/skills and the LinkedIn action were separately verified.
- Automatic video continuation and final completion still work; completion
  removes the spotlight, typed overlays, and player, then focuses contact.
- Browser console warnings/errors were empty.
- Slower metric pacing was verified after the latest build: project copy
  stayed complete at the speed change, paused metric text stayed unchanged,
  and the remaining metrics finished before the prepared video played.
- The one-second keyboard dwell was measured in the in-app browser at 1008 ms
  from the final label completing to the demo opening, with FPS spotlighted.
- Earlier Back/Next/Skip/replay/fullscreen-fallback checks remain valid.
- Historical, from the six-second contact linger (before the 300 ms change; not
  a check of the current setting): Contact linger was verified at desktop 1366 × 900: automatic completion
  occurred about six seconds after the last action label finished typing,
  left Contact selected, and focused its heading. At mobile 390 × 844,
  Finish returned to Contact after visiting Projects while paused; there was
  no horizontal overflow. The build passed and browser warnings/errors were
  empty.

## Preview and artifacts

- Preview: `http://127.0.0.1:5173/`. Existing Vite session: `44184` if available.
  No deployment was requested or performed.
- In-app browser: browser `2`, tab `1`, left on Contact after completion.
  Temporary viewport overrides have been reset.
- Current planet spotlight screenshots:
  `/Users/rayxu/.codex/visualizations/2026/10/12/01a131f7-aaed-7e02-ab50-4b3367778a12/tour-planets-desktop.jpg`
  and `tour-planets-mobile.jpg` in the same directory.
- Current project introduction spotlight screenshot:
  `/Users/rayxu/.codex/visualizations/2026/10/12/01a12e2a-0c16-7f62-bbff-7cccd3e9975a/tour-block-intro-desktop.jpg`.
- Current isolated precision spotlight screenshots:
  `/Users/rayxu/.codex/visualizations/2026/10/12/01a12e2a-0c16-7f62-bbff-7cccd3e9975a/tour-block-precision-desktop.jpg`
  and `tour-block-precision-mobile.jpg` in the same directory.

## Preserve existing work

Changes remain uncommitted. `src/components/SearchBar.tsx`,
`src/search-header.css`, and `src/components/ui/` were changed before the tour
work; do not revert or claim them. Tracked `dist/client` outputs were refreshed
by the build. No commit was made.

The user confirmed Scout should not be included. Direct email and résumé
links have not been supplied; functional contact-form fallbacks exist.
Do not invent those details or re-request Scout.
