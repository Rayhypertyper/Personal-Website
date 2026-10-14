import type { ReactNode } from "react";

export interface TourCount { value: number; decimals?: number; suffix?: string; durationMs?: number }
interface TourPageTextProps {
  children: ReactNode;
  inline?: boolean;
  cps?: number;
  leadMs?: number;
  letters?: boolean;
  count?: TourCount;
}

/** Keep final, accessible page copy in place while the tour types over it. */
export function TourPageText({ children, inline = false, cps, leadMs, letters, count }: TourPageTextProps) {
  return (
    <span className={`tour-page-text${inline ? " tour-page-text--inline" : ""}`} data-tour-text-host
      data-tour-cps={cps} data-tour-lead-ms={leadMs} data-tour-letters={letters || undefined}
      data-tour-count-value={count?.value} data-tour-count-decimals={count?.decimals}
      data-tour-count-suffix={count?.suffix} data-tour-count-duration={count ? count.durationMs ?? 900 : undefined}>
      <span className="tour-page-text__original">{children}</span>
    </span>
  );
}
