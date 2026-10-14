import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

type SearchResultVariant = "aircad" | "hobbies" | "profile";

interface SearchResultCardProps {
  compact?: boolean;
  sponsored?: boolean;
  variant: SearchResultVariant;
}

const resultDetails = {
  aircad: {
    title: "AirCAD",
    url: "Semi-Finalist @ Hack the North 2026",
    href: "https://devpost.com/software/aircad",
    ariaLabel: "View AirCAD on Devpost",
  },
  hobbies: {
    title: "Hobbies & Interests",
    url: "rayxu.dev/hobbies",
    href: "#hobbies",
    ariaLabel: "View Ray Xu's hobbies and interests",
  },
  profile: {
    title: "Ray Xu",
    url: "https://rayxu.dev",
    href: "https://rayxu.dev",
    ariaLabel: "Visit Ray Xu at rayxu.dev",
  },
} as const;

function HobbiesTypingLine() {
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    const phrase = "I type 150 words per minute";

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTypedText(phrase);
      return;
    }

    const millisecondsPerCharacter = 60_000 / (150 * 5);
    let characterIndex = 0;
    let timeoutId = 0;

    function typeNextCharacter() {
      characterIndex += 1;
      setTypedText(phrase.slice(0, characterIndex));

      if (characterIndex < phrase.length) {
        timeoutId = window.setTimeout(
          typeNextCharacter,
          millisecondsPerCharacter,
        );
      }
    }

    typeNextCharacter();

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <span className="block min-h-[1.55em]">
      <span className="sr-only">I type 150 words per minute</span>
      <span aria-hidden="true">{typedText}</span>
    </span>
  );
}

export function SearchResultCard({
  compact = false,
  sponsored = false,
  variant,
}: SearchResultCardProps) {
  const details = resultDetails[variant];
  const isAircad = variant === "aircad";
  const isHobbies = variant === "hobbies";

  return (
    <a
      className={`result-card ${isAircad ? "result-card--aircad" : ""} group grid h-full w-full min-w-0 grid-cols-[58px_minmax(0,1fr)] items-start gap-x-5 gap-y-4 rounded-[24px] border border-[rgba(38,48,68,0.035)] bg-white px-5 shadow-[0_14px_36px_rgba(44,38,31,0.055),inset_0_1px_0_rgba(255,255,255,0.96)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(44,38,31,0.085),inset_0_1px_0_rgba(255,255,255,0.96)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#b45f3f]/15 motion-reduce:transition-none sm:flex sm:items-center sm:gap-6 sm:rounded-[28px] sm:px-8 ${
        compact
          ? "min-h-[145px] py-3 sm:min-h-[145px] sm:py-3"
          : "min-h-[178px] py-6 sm:min-h-[178px] sm:py-7"
      }`}
      href={details.href}
      id={isHobbies ? "hobbies" : undefined}
      aria-label={details.ariaLabel}
    >
      <span
        className={`mt-0.5 grid h-[58px] w-[58px] shrink-0 place-items-center self-start overflow-hidden rounded-full text-[24px] font-medium text-white shadow-[0_8px_16px_rgba(180,95,63,0.18)] sm:h-[62px] sm:w-[62px] ${
          isAircad
            ? "bg-black"
            : isHobbies
              ? "bg-[radial-gradient(circle_at_35%_25%,#d59b7e_0%,#b45f3f_55%,#8f422b_100%)]"
              : "bg-[radial-gradient(circle_at_35%_25%,#c68566_0%,#a85b3d_55%,#864028_100%)]"
        }`}
        aria-hidden="true"
      >
        {isAircad ? (
          <img
            className="h-full w-full object-cover"
            src="/featured-result-logo.png"
            alt=""
          />
        ) : isHobbies ? (
          "H"
        ) : (
          "R"
        )}
      </span>

      <span className="contents min-w-0 flex-1 sm:block">
        <span className="min-w-0">
          {sponsored && (
            <span className="result-card-sponsored">Featured result</span>
          )}
          <strong className="result-title block text-[22px] font-medium leading-tight sm:text-[25px]">
            {details.title}
          </strong>
          <span className="result-card-url mt-1 block text-[14px] font-medium leading-snug text-[#a85b3d] sm:text-[15px]">
            {details.url}
          </span>
        </span>

        {!isAircad && (
          <span className="result-card-description col-span-2 block text-[16px] leading-[1.55] text-[#536075] sm:mt-3 sm:text-[17px]">
            {isHobbies ? (
              <>
                <span className="block">
                  A look at what I enjoy beyond classes, coding, and side projects.
                </span>
                <HobbiesTypingLine />
              </>
            ) : (
              <span className="block">More to come Soon™</span>
            )}
          </span>
        )}
      </span>

      <span className="ml-1 mr-1 hidden h-[60px] w-[72px] shrink-0 place-items-center rounded-[19px] border border-[#eadfd8] bg-white text-[#a85b3d] shadow-[0_5px_14px_rgba(83,52,40,0.045)] sm:grid">
        <ArrowRight
          className="h-6 w-6 transition-transform duration-200 group-hover:translate-x-[3px] motion-reduce:transition-none"
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </span>
    </a>
  );
}
