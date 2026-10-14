"use client";

import { Search, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEventHandler,
  type KeyboardEventHandler,
} from "react";

interface HaloSearchInputProps {
  "aria-label": string;
  autoComplete?: string;
  autoFocus?: boolean;
  blobTranslucent: boolean;
  className: string;
  isLoading: boolean;
  loadingAnimationKey?: string;
  loadingCharDurationSec: number;
  loadingStaggerSec: number;
  loadingText: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onClear: () => void;
  onKeyDown: KeyboardEventHandler<HTMLInputElement>;
  placeholder?: string;
  value: string;
  readOnly?: boolean;
}

export function HaloSearchInput({
  "aria-label": ariaLabel,
  autoComplete = "off",
  autoFocus = false,
  blobTranslucent,
  className,
  isLoading,
  loadingAnimationKey,
  loadingCharDurationSec,
  loadingStaggerSec,
  loadingText,
  onChange,
  onClear,
  onKeyDown,
  placeholder,
  value,
  readOnly = false,
}: HaloSearchInputProps) {
  const [isClearing, setIsClearing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const clearTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current !== null) {
        window.clearTimeout(clearTimerRef.current);
      }
    };
  }, []);

  const handleClear = () => {
    if (clearTimerRef.current !== null) {
      window.clearTimeout(clearTimerRef.current);
    }
    setIsClearing(true);
    onClear();
    inputRef.current?.focus();
    clearTimerRef.current = window.setTimeout(() => {
      setIsClearing(false);
      clearTimerRef.current = null;
    }, 260);
  };

  return (
    <div
      className={`halo-search-input ${className}`}
      role="search"
      aria-busy={isLoading}
      data-loading={isLoading ? "true" : "false"}
      data-clearing={isClearing ? "true" : "false"}
      data-translucent={blobTranslucent ? "true" : "false"}
    >
      <span className="search-bar__effects" aria-hidden="true" />

      <Search
        aria-hidden="true"
        className="halo-search-input__icon h-7 w-7 shrink-0 text-[#5c6679] sm:h-8 sm:w-8 lg:h-[34px] lg:w-[34px]"
        strokeWidth={1.8}
      />

      <label className="halo-search-input__field min-w-0 flex-1">
        <span className="sr-only">{ariaLabel}</span>
        <input
          ref={inputRef}
          className="w-full min-w-0 bg-transparent text-[#313949] caret-[#8f422b] outline-none placeholder:text-[#687286]"
          type="text"
          value={value}
          readOnly={readOnly}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete={autoComplete}
          spellCheck="false"
          autoFocus={autoFocus}
        />
        {isLoading && (
          <span key={loadingAnimationKey} className="halo-search-input__loading" aria-hidden="true">
            {Array.from(loadingText).map((character, index) => (
              <span
                className="halo-search-input__loading-char"
                key={`${character}-${index}`}
                style={{
                  animationDelay: `${index * loadingStaggerSec}s`,
                  animationDuration: `${loadingCharDurationSec}s`,
                }}
              >
                {character === " " ? "\u00a0" : character}
              </span>
            ))}
          </span>
        )}
      </label>

      {value.length > 0 && !readOnly && (
        <button
          className="halo-search-input__clear grid shrink-0 place-items-center rounded-full transition-[color,background-color,transform] duration-200 hover:bg-[#f5e5dc] hover:text-[#8f422b] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c46f4c]/20 motion-reduce:transition-none"
          type="button"
          aria-label="Clear search"
          onClick={handleClear}
        >
          <X aria-hidden="true" strokeWidth={1.8} />
        </button>
      )}

      <span className="sr-only" role="status" aria-live="polite">
        {isLoading ? loadingText : ""}
      </span>
    </div>
  );
}
