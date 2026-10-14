"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { HaloSearchInput } from "./ui/halo-search";

interface SearchBarProps {
  onSearch: (query: string) => void;
  previewQuery?: string | null;
  previewSearching?: boolean;
  tourQuery?: string;
}

const MOCK_LOADING_MS = 4800;
const LOADING_STAGGER_SEC = 0.044;
const LOADING_CHAR_DURATION_SEC = 0.42;

export function SearchBar({ onSearch, previewQuery, previewSearching = false, tourQuery }: SearchBarProps) {
  const [searchValue, setSearchValue] = useState("Ray Xu");
  const [isLoading, setIsLoading] = useState(false);
  const lastTourQuery = useRef<string | null>(null);
  const lastPreview = useRef<string | null>(null);
  const loadTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (loadTimerRef.current !== null) {
        window.clearTimeout(loadTimerRef.current);
      }
    };
  }, []);

  const clearLoadingTimer = useCallback(() => {
    if (loadTimerRef.current !== null) {
      window.clearTimeout(loadTimerRef.current);
      loadTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (tourQuery != null) lastTourQuery.current = tourQuery;
    if (previewQuery != null) {
      lastPreview.current = previewQuery;
      clearLoadingTimer();
      setIsLoading(false);
    } else if (lastPreview.current !== null || tourQuery != null) {
      setSearchValue(tourQuery ?? lastTourQuery.current ?? lastPreview.current ?? "Ray Xu");
      lastPreview.current = null;
    }
  }, [previewQuery, tourQuery, clearLoadingTimer]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || isLoading || previewQuery != null) {
      return;
    }

    const query = event.currentTarget.value.trim();
    if (!query) {
      return;
    }

    event.preventDefault();
    clearLoadingTimer();
    setIsLoading(true);
    onSearch(query);
    loadTimerRef.current = window.setTimeout(() => {
      setIsLoading(false);
      loadTimerRef.current = null;
    }, MOCK_LOADING_MS);
  };

  const handleClear = useCallback(() => {
    clearLoadingTimer();
    setIsLoading(false);
    setSearchValue("");
  }, [clearLoadingTimer]);

  return (
    <HaloSearchInput
      aria-label="Search Ray Xu’s portfolio"
      autoComplete="off"
      autoFocus
      blobTranslucent={false}
      className="search-bar mx-0 flex min-w-0 items-center rounded-full border border-[#ecebe8] bg-white shadow-[0_9px_24px_rgba(49,42,35,0.065),inset_0_1px_0_rgba(255,255,255,0.96)] lg:mx-8"
      isLoading={isLoading || previewSearching}
      readOnly={previewQuery != null}
      loadingCharDurationSec={LOADING_CHAR_DURATION_SEC}
      loadingStaggerSec={LOADING_STAGGER_SEC}
      loadingText="Searching…"
      onChange={(event) => setSearchValue(event.target.value)}
      onClear={handleClear}
      onKeyDown={handleKeyDown}
      placeholder="Search Ray Xu’s portfolio…"
      value={previewQuery ?? searchValue}
    />
  );
}
