import type { TourCount } from "./TourPageText";
import { TourTextCopy, type TourTextRun } from "./TourTypedText";
export type { TourTextRun } from "./TourTypedText";

interface TourTypedTextProps {
  text: string;
  runs?: TourTextRun[];
  characters: number;
  offset?: number;
  cursor?: boolean;
  paused?: boolean;
  idle?: boolean;
  accessible?: boolean;
  letters?: boolean;
  count?: TourCount;
  progress?: number;
}

export function TourTypedText({ text, runs, characters, offset = 0, cursor = true, paused = false, idle = false, accessible = true, letters, count, progress = 0 }: TourTypedTextProps) {
  const length = count ? 1 : text.length;
  const visible = Math.max(0, Math.min(length, characters - offset));
  const typingHere = cursor && characters >= offset && characters < offset + length;
  const typedCursor = typingHere ? <span className={`tour-typed-cursor${paused ? " is-paused" : ""}`} data-idle={idle} /> : null;
  const fraction = Math.max(0, Math.min(1, progress));
  const counted = count ? `${(count.value * (1 - (1 - fraction) ** 3)).toFixed(count.decimals ?? 0)}${count.suffix ?? ""}` : "";
  return (
    <span className="tour-typed-text">
      <span className="tour-typed-text__reserve" aria-hidden="true"><TourTextCopy text={text} runs={runs} letters={letters} /></span>
      <span className="tour-typed-text__visible" aria-hidden="true" data-glyph-copy={count ? undefined : "true"}>
        {count
          ? <>{characters >= offset ? counted : ""}{typedCursor}</>
          : <TourTextCopy text={text} runs={runs} visible={visible} letters={letters} cursor={typedCursor} />}
      </span>
      {accessible ? <span className="sr-only">{text}</span> : null}
    </span>
  );
}
