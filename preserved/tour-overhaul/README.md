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
  use a full-viewport video presentation.

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

## Guided tour

The opt-in tour takes about one minute (about 64 seconds including the planet
finale), plus buffering. A seeded millisecond schedule drives page typing, punctuation
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
0:50–1:02.55 after a 750 ms reading beat; AirCAD plays 0:30.5–0:36 after 350 ms.
A hairline tracks the clip, and natural completion collapses the stage before
advancing. Pause/Resume preserves playback time; a suspended entrance resumes
at its completed layout.

Contact visits LinkedIn → GitHub → Schedule → Resume → Email. Visited planets
stay lit, the active one has a pulse and satellite, and the page caret returns
after the intro. After Email finishes, all five pulse rings and orbiting dots
start together for three seconds. Then the shade lifts, a
“That’s the tour” status toast appears, the sticky note nudges, and the tour
finishes on Contact with its heading focused. Interaction during the ending
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

```bash
npm run typecheck
npm run build
```

The build runs the TypeScript check, creates the static client bundle in `dist/client`, and generates the server worker in `dist/server/index.js` for `POST /api/contact`.
