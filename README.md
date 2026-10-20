# Ray Xu Portfolio

A responsive React and TypeScript portfolio for Ray Xu, presented through an interactive search-inspired interface.

## Features

- Search-style landing page with interactive portfolio filters.
- Project showcase featuring Invisible Keyboard and AirCAD.
- Experience timeline, about section, and Waterloo/Ottawa location globe.
- Animated contact experience with local development preview and hosted email delivery.
- Light and dark themes with responsive layouts and reduced-motion support.
- Opt-in six-stop recruiter tour with page spotlights, keyboard navigation,
  typed narration and project metrics, automatic pacing, pause/resume,
  preloaded fullscreen muted demos, scroll-to-exit,
  and remembered completion with explicit replay. Browsers that deny automatic native fullscreen
  use a full-viewport video presentation. A full-width tour card tops the All page and
  the whole card starts the tour. On the first All view of each page load, the rest of the
  page dims for two seconds; any click, scroll, or key press clears it immediately.
  A floating reminder (dismissable for the session) appears on every section except Contact when the card is off screen.

## Stack

- React 19 and TypeScript
- Vite
- Tailwind CSS and custom CSS
- React Three Fiber, Three.js, and MapLibre assets
- Resend for hosted contact-form delivery

## Local development

Install dependencies and start the Vite development server:

```bash
npm install
npm run dev
```

The site is available at `http://localhost:5173`. Contact submissions are previewed locally and are not sent anywhere during development.

## Environment

The production contact form uses a server-side Resend API key. Copy `.env.example`, replace the placeholder value, and configure the resulting `RESEND_API_KEY` as a secret on the hosted site. Keep the key server-side; it must not use a `VITE_` prefix or be included in browser code.

Set `VITE_CONTACT_EMAIL` and `VITE_RESUME_URL` to the public email address and
résumé destination before building to enable direct recruiter links. If either
is empty, its action uses the contact form instead. Tour targets, ordering, and demo timestamps live in `src/components/GuidedTour.tsx`.

## Guided tour implementation switch

The enhanced tour is active, including scheduled typing, count-ups, the smoothed
spotlight, demo expansion, search handoffs, and the synchronized
planet finale. The pre-plan version remains available alongside it.

[`src/tour-config.ts`](src/tour-config.ts) currently exports
`TOUR_OVERHAUL_ENABLED = true`. To return to the pre-plan tour, comment out the
`true` export and uncomment the `false` export. Reverse those two comment
changes to reactivate the enhanced tour again.
Both implementations pass TypeScript and build checks. No feature needs to be
implemented again.

An exact source/generated-code snapshot from before this restoration is in
[`preserved/tour-overhaul/`](preserved/tour-overhaul/), with SHA-256 checksums in
`SNAPSHOT.json`. See [`TOUR_RESTORE.md`](TOUR_RESTORE.md) for file ownership and
reactivation instructions.

## Enhanced guided tour (active)

The All-page card promises "30 seconds" (a desktop run measured 40.0 s through
the synchronized finale, with the individual sequence ending at 36.3 s).
The floating reminder advertises `TOUR_CTA_DURATION_SECONDS` (37 sec) from
`src/tour-config.ts`; the in-tour
countdown starts at the same value and ticks once per active second, including
search transitions. It reaches exactly 0 when the individual sequence ends,
in the same frame the planets start turning together, and stays at 0 throughout
the synchronized finale. Pausing or hiding the page freezes it. The finale,
completion toast's hold, and exit animation are excluded. The floating
reminder (every section except Contact) remembers dismissal in sessionStorage under `TOUR_FLOAT_DISMISSED_KEY`.
Analytics hooks are `data-tour-cta="hero" | "floating" | "floating-dismiss"`.

The opt-in tour takes about 40 seconds, plus buffering. A seeded millisecond
schedule drives page typing, punctuation
pauses, slower landing letters for Ray's name, and the precision/recall/FPS
count-ups. Original copy reserves the layout and remains accessible. One soft
spotlight eases between text blocks; project headings share a block with their
description, metrics get individual blocks, and Nokia keeps its whole card lit.

Forward section changes type “Ray Xu projects”, “Ray Xu experience”, and
“Ray Xu contact” into the real search bar, show a brief Searching state, slide
the tab underline, and reveal the results. Back and progress buttons switch
immediately. The search query remains consistent with the selected section.

Prepared, muted demos expand from their project cards without automatically
requesting native fullscreen. Maximize remains available. Keyboard plays
0:51–1:01.55 after a 750 ms reading beat; AirCAD plays 0:30.5–0:36 after 350 ms.
A hairline tracks the clip, and natural completion collapses the stage before
advancing. Pause/Resume preserves playback time; a suspended entrance resumes
at its completed layout.

Contact visits LinkedIn → GitHub → Schedule → Resume → Email. Visited planets
stay lit, the active one has a pulse and satellite, and the page caret returns
after the intro. As soon as Email finishes typing, all five pulse rings and
orbiting dots join Email's current animation. Its final orbit completes the
tour and immediately shows the “That’s the tour” status toast as the shade
lifts. The animation's completion event determines this boundary; there is
no additional reading dwell or popup delay. Pause/Resume preserves the final
orbit's position. The toast then dismisses, the sticky note nudges, and Contact
keeps its heading focused. Interaction during the ending
completes immediately. Finish also completes immediately.

Pause restores the ordinary page and preserves elapsed typing, counts, dwell,
and handoff progress. Hidden documents suspend these clocks and playback.
Reduced motion shows final text/counts, uses static emphasis and a short demo
fade, switches sections instantly, and shows a stationary completion toast.
The six progress segments and remaining-time estimate stay accessible through
Back, Next, Skip, Esc, and Replay. Completion is remembered, and the selected
page survives a refresh in the current tab.

See `TOUR_PLAN.md` for the completed plan and `TOUR_CHECKPOINT.md` for checks
and browser-specific verification limits.

## Production build

`/keyboard` opens a muted, full-viewport Invisible Keyboard clip from 0:44 to
1:03 at 1.65× speed. It then uses the tour's zoom-out animation to reveal the
Projects page at `/projects` and stops. Escape skips the clip; reduced motion
returns directly without the zoom. Both routes have static entry documents for
direct visits and refreshes on GitHub Pages.

`/aircad` opens the AirCAD demo from 0:30.8–0:40 at normal speed with audio on,
then zooms into its video card on `/projects` and stops. It has its own static
entry document, supports Escape, and skips the zoom for reduced motion.
Playback attempts to start with sound, without a button prompt or muted fallback.
If the browser blocks autoplay with sound, the first tap or key press starts it with audio.

```bash
npm run typecheck
npm run build
```
