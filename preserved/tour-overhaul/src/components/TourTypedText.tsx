import type { TourCount } from "./TourPageText";

export interface TourTextRun { text: string; strong: boolean }
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
  const glyphs = (copy: string) => letters ? Array.from(copy).map((character, index) =>
    <span className="tour-typed-char" key={index}>{character}</span>) : copy;
  const renderCopy = (amount: number) => {
    if (!runs) return glyphs(text.slice(0, amount));
    let remaining = amount;
    return runs.map((run, index) => {
      const complete = remaining >= run.text.length;
      const copy = glyphs(run.text.slice(0, Math.max(0, remaining)));
      remaining -= run.text.length;
      return run.strong ? <strong key={index} data-complete={complete || undefined}>{copy}</strong> : <span key={index}>{copy}</span>;
    });
  };
  const fraction = Math.max(0, Math.min(1, progress));
  const counted = count ? `${(count.value * (1 - (1 - fraction) ** 3)).toFixed(count.decimals ?? 0)}${count.suffix ?? ""}` : "";
  return (
    <span className="tour-typed-text">
      <span className="tour-typed-text__reserve" aria-hidden="true">{renderCopy(text.length)}</span>
      <span className="tour-typed-text__visible" aria-hidden="true">
        {count ? (characters >= offset ? counted : "") : renderCopy(visible)}
        {typingHere ? <span className={`tour-typed-cursor${paused ? " is-paused" : ""}`} data-idle={idle} /> : null}
      </span>
      {accessible ? <span className="sr-only">{text}</span> : null}
    </span>
  );
}
