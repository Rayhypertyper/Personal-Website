# Restoring the enhanced tour

The enhanced tour and the synchronized LinkedIn/Calendly planet linger are
currently active. Set `TOUR_PLANET_FINALE_ENABLED` to `false` in
`src/tour-config.ts` to make the linger dormant. When the planet animation
finishes, the name field receives focus and the launch-message note shakes.
The pre-plan implementation remains available behind the tour implementation switch.

## One switch

Open `src/tour-config.ts`. Comment out:

```ts
export const TOUR_OVERHAUL_ENABLED: boolean = false;
```

Uncomment:

```ts
export const TOUR_OVERHAUL_ENABLED: boolean = true;
```

Vite will refresh the preview. Run `npm run build` for a production bundle.
To return to the original tour, reverse those two comment changes. No source
needs to be copied or reimplemented.

## Executable versions

- `src/components/GuidedTour.tsx` selects the implementation and stop list.
- `GuidedTourBaseline.tsx`, `TourDemo.tsx`, `TourTypedText.tsx`, and
  `src/hooks/useTourTypewriter.ts` implement the recorded pre-plan behavior.
- `GuidedTourOverhaul.tsx`, `TourDemoOverhaul.tsx`, `TourTypedTextOverhaul.tsx`,
  `TourSpotlight.tsx`, `TourProgress.tsx`, and
  `src/hooks/useTourTypewriterOverhaul.ts` retain all enhanced features.
- `src/guided-tour.css` supplies the baseline styles.
- `src/guided-tour-overhaul.css` retains the enhanced styles, scoped to
  `html[data-tour-implementation="overhaul"]` so they cannot alter baseline UI.
- The same switch gates search preview, directional underlines, AirCAD path
  normalization, and the entry-duration copy. The original accessible text
  hosts retain their enhanced metadata for future reactivation.

## Exact snapshot

`preserved/tour-overhaul/` contains the complete source tree, root styles and
configuration, tour documents, and generated JS/CSS from immediately before
the restoration. `SNAPSHOT.json` records the original SHA-256 for every saved
file. Keep this snapshot unchanged; work on the executable source in `src`.
The existing screenshot artifacts are also retained at their documented paths.

Both modes were built and inspected in the in-app browser. The current
configuration is `true`, so the preview and production build use the enhanced tour.
