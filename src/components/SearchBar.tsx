"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { HaloSearchInput } from "./ui/halo-search";

interface SearchBarProps {
  onSearch: (query: string) => void;
  resetRequest: { query: string; animate: boolean };
  previewQuery?: string | null;
  previewSearching?: boolean;
  tourQuery?: string;
}

const MOCK_LOADING_MS = 4800;
const LOADING_STAGGER_SEC = 0.044;
const LOADING_CHAR_DURATION_SEC = 0.42;
const TAB_SEARCH_MS = 200;
const TAB_LOADING_STAGGER_SEC = 0.008;
const TAB_LOADING_CHAR_DURATION_SEC = 0.09;

export function SearchBar({ onSearch, resetRequest, previewQuery, previewSearching = false, tourQuery }: SearchBarProps) {
  const [searchValue, setSearchValue] = useState(resetRequest.query);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuickSearch, setIsQuickSearch] = useState(false);
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
      setIsQuickSearch(false);
    } else if (lastPreview.current !== null || tourQuery != null) {
      setSearchValue(tourQuery ?? lastTourQuery.current ?? lastPreview.current ?? "Ray Xu");
      lastPreview.current = null;
    }
  }, [previewQuery, tourQuery, clearLoadingTimer]);

  useEffect(() => {
    clearLoadingTimer();
    setIsLoading(resetRequest.animate);
    setIsQuickSearch(resetRequest.animate);
    setSearchValue(resetRequest.query);
    lastTourQuery.current = null;
    lastPreview.current = null;
    if (resetRequest.animate) {
      // Navigation has already happened; only the search feedback uses a timer.
      loadTimerRef.current = window.setTimeout(() => {
        setIsLoading(false);
        setIsQuickSearch(false);
        loadTimerRef.current = null;
      }, TAB_SEARCH_MS);
    }
  }, [resetRequest, clearLoadingTimer]);

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
    setIsQuickSearch(false);
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
    setIsQuickSearch(false);
    setSearchValue("");
  }, [clearLoadingTimer]);

  return (
    <HaloSearchInput
      aria-label="Search Ray Xu’s portfolio"
      autoComplete="off"
      autoFocus
      blobTranslucent={false}
      className={`search-bar mx-0 flex min-w-0 items-center rounded-full border border-[#ecebe8] bg-white shadow-[0_9px_24px_rgba(49,42,35,0.065),inset_0_1px_0_rgba(255,255,255,0.96)] lg:mx-8${isQuickSearch ? " search-bar--quick-search" : ""}`}
      isLoading={isLoading || previewSearching}
      readOnly={previewQuery != null}
      loadingAnimationKey={resetRequest.query}
      loadingCharDurationSec={isQuickSearch ? TAB_LOADING_CHAR_DURATION_SEC : LOADING_CHAR_DURATION_SEC}
      loadingStaggerSec={isQuickSearch ? TAB_LOADING_STAGGER_SEC : LOADING_STAGGER_SEC}
      loadingText="Searching…"
      onChange={(event) => setSearchValue(event.target.value)}
      onClear={handleClear}
      onKeyDown={handleKeyDown}
      placeholder="Search Ray Xu’s portfolio…"
      value={previewQuery ?? searchValue}
    />
  );
}
