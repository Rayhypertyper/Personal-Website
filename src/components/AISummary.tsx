import { Sparkles } from "lucide-react";
import { TourPageText } from "./TourPageText";
import { TOUR_READING_CHARACTERS_PER_SECOND } from "../tour-config";

type OverviewToken = {
  text: string;
  strong: boolean;
  keepTogether?: boolean;
};

const OVERVIEW_TOKENS: readonly OverviewToken[] = [
  { text: "I build ", strong: false },
  { text: "backends", strong: true },
  { text: ", ", strong: false },
  { text: "computer vision", strong: true },
  { text: " and ", strong: false },
  { text: "machine learning systems", strong: true },
  { text: ".", strong: false },
];

export function AISummary() {
  return (
    <section className="ai-overview" aria-labelledby="ai-overview-title">
      <header className="ai-overview__header">
        <Sparkles size={17} strokeWidth={1.6} aria-hidden="true" />
        <h2 id="ai-overview-title">AI Overview</h2>
      </header>

      <p className="ai-overview__copy" data-tour-target="positioning" data-tour-focus-block="positioning">
        <TourPageText cps={TOUR_READING_CHARACTERS_PER_SECOND}>
        {OVERVIEW_TOKENS.map((token, index) =>
          token.strong ? (
            <strong key={index}>{token.text}</strong>
          ) : (
            <span key={index}>{token.text}</span>
          ),
        )}
        </TourPageText>
      </p>
    </section>
  );
}
