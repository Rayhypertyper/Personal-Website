import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { FILTERS, type FilterName } from "./components/FilterTabs";
import { SearchHeader } from "./components/SearchHeader";
import { SearchResultCard } from "./components/SearchResultCard";
import { PersonalGlobe } from "./components/PersonalGlobe";
import { AllOverview } from "./components/AllOverview";
import { TourFloatingCTA } from "./components/TourFloatingCTA";
import { ProjectsShowcase } from "./components/ProjectsShowcase";
import { KeyboardVideoIntro } from "./components/KeyboardVideoIntro";
import { ExperienceTimeline } from "./components/ExperienceTimeline";
import { AboutSection } from "./components/AboutSection";
import { ContactSection } from "./components/ContactSection";
import { UnderConstructionOverlay } from "./components/UnderConstructionOverlay";
import { findSearchMatch, getFilterQuery } from "./search";
import { GuidedTour, TOUR_STOPS } from "./components/GuidedTour";
import { CONTACT_EMAIL, hasCompletedTour, TOUR_STORAGE_KEY } from "./contact-links";
import { TOUR_FLOAT_DISMISSED_KEY, TOUR_OVERHAUL_ENABLED } from "./tour-config";
import "./globe.css";

const ACTIVE_FILTER_STORAGE_KEY = "rayxu-active-filter-v1";
const getPagePath = () => window.location.pathname.replace(/\/+$/, "") || "/";

function getInitialFilter(): FilterName {
  if (["/keyboard", "/projects"].includes(getPagePath())) return "Projects";
  try {
    const savedFilter = sessionStorage.getItem(ACTIVE_FILTER_STORAGE_KEY);
    return FILTERS.find((filter) => filter === savedFilter) ?? "All";
  } catch {
    return "All";
  }
}

export function App() {
  const [keyboardIntro, setKeyboardIntro] = useState(() => getPagePath() === "/keyboard");
  const [activeFilter, setActiveFilter] = useState<FilterName>(getInitialFilter);
  const [searchRequest, setSearchRequest] = useState(() => ({
    query: getFilterQuery(activeFilter),
    animate: false,
  }));
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [tourStop, setTourStop] = useState<number | null>(null);
  const [tourPaused, setTourPaused] = useState(false);
  const [tourSearch, setTourSearch] = useState<{ query: string; searching: boolean } | null>(null);
  const [tourCompleted, setTourCompleted] = useState(hasCompletedTour);
  const [contactNoteNudge, setContactNoteNudge] = useState(false);
  const [heroCtaVisible, setHeroCtaVisible] = useState(false);
  const [floatDismissed, setFloatDismissed] = useState(() => {
    try { return sessionStorage.getItem(TOUR_FLOAT_DISMISSED_KEY) === "true"; } catch { return false; }
  });

  const finishKeyboardIntro = useCallback(() => {
    window.history.replaceState(null, "", "/projects");
    setKeyboardIntro(false);
    setFloatDismissed(true);
  }, []);

  const exitTour = useCallback((restoreFocus = true) => {
    setTourStop(null);
    setTourPaused(false);
    if (!restoreFocus) return;
    requestAnimationFrame(() => {
      const focusTarget = document.querySelector<HTMLElement>('[data-tour-entry]')
        ?? document.querySelector<HTMLElement>('[data-filter-tab][aria-selected="true"]');
      focusTarget?.focus({ preventScroll: true });
    });
  }, []);

  const completeTour = useCallback((restoreFocus = true) => {
    if (TOUR_OVERHAUL_ENABLED) performance.mark("tour:complete");
    setTourCompleted(true);
    setTourStop(null);
    setTourPaused(false);
    setContactNoteNudge(TOUR_OVERHAUL_ENABLED);
    try { localStorage.setItem(TOUR_STORAGE_KEY, "true"); } catch { /* The tour also works without storage. */ }
    if (restoreFocus) requestAnimationFrame(() => {
      const focusTarget = (TOUR_OVERHAUL_ENABLED ? document.querySelector<HTMLInputElement>('.contact-form input[name="name"]') : null)
        ?? document.querySelector<HTMLElement>('[data-tour-target="contact"] h2')
        ?? document.querySelector<HTMLElement>('[data-filter-tab][aria-selected="true"]');
      focusTarget?.focus({ preventScroll: true });
    });
  }, []);

  const navigateTour = useCallback((index: number) => {
    const stop = TOUR_STOPS[index];
    if (!stop) return;
    setContactNoteNudge(false);
    setActiveFilter(stop.filter);
    setTourStop(index);
  }, []);

  const startTour = useCallback(() => {
    setTourPaused(false);
    navigateTour(0);
  }, [navigateTour]);

  const dismissFloat = useCallback(() => {
    setFloatDismissed(true);
    try { sessionStorage.setItem(TOUR_FLOAT_DISMISSED_KEY, "true"); } catch { /* The reminder also works without storage. */ }
  }, []);

  const changeTourPause = useCallback((paused: boolean) => {
    setTourPaused(paused);
    if (!paused && tourStop !== null) {
      setActiveFilter(TOUR_STOPS[tourStop].filter);
      }
  }, [tourStop]);

  const changeFilter = useCallback((filter: FilterName, animateSearch = true, query = getFilterQuery(filter)) => {
    setContactNoteNudge(false);
    if (!tourPaused) setTourStop(null);
    setActiveFilter(filter);
    if (animateSearch) setSearchRequest({ query, animate: filter !== activeFilter });
  }, [activeFilter, tourPaused]);

  useEffect(() => {
    const emailLink = document.querySelector<HTMLAnchorElement>("[data-contact-email]");
    if (!emailLink) return;
    emailLink.href = CONTACT_EMAIL ? `mailto:${CONTACT_EMAIL}` : "#contact";
    const openContact = (event: MouseEvent) => {
      if (CONTACT_EMAIL) return;
      event.preventDefault();
      changeFilter("Contact");
    };
    emailLink.addEventListener("click", openContact);
    return () => emailLink.removeEventListener("click", openContact);
  }, [changeFilter]);

  useEffect(() => {
    document.documentElement.dataset.theme = isDarkMode ? "dark" : "light";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", isDarkMode ? "#07101f" : "#f9f7f3");
  }, [isDarkMode]);

  useLayoutEffect(() => {
    document.documentElement.dataset.tourImplementation = TOUR_OVERHAUL_ENABLED ? "overhaul" : "baseline";
  }, [TOUR_OVERHAUL_ENABLED]);

  useEffect(() => {
    // Keep the selected page when a preview reconnect or refresh reloads the app.
    if (!keyboardIntro && getPagePath() === "/projects" && activeFilter !== "Projects") {
      window.history.replaceState(null, "", "/");
    }
    try { sessionStorage.setItem(ACTIVE_FILTER_STORAGE_KEY, activeFilter); } catch { /* Browsing also works without storage. */ }
    document.documentElement.dataset.contactPage =
      activeFilter === "Contact" ? "true" : "false";
    document.documentElement.dataset.projectsPage =
      activeFilter === "Projects" ? "true" : "false";
    document.querySelector(".browser-frame")?.scrollTo({ top: 0, behavior: "instant" });
  }, [activeFilter, keyboardIntro]);

  const resultCount =
    activeFilter === "All"
      ? "About 1 result (0.01s)"
    : activeFilter === "Projects"
      ? "About 2 results (0.01s)"
    : activeFilter === "Map"
        ? "About 2 locations (0.01s)"
        : activeFilter === "Experience"
          ? "About 3 results (0.01s)"
          : activeFilter === "About"
            ? "A little more about Ray"
            : activeFilter === "Contact"
              ? "About 5 results (0.01s)"
            : undefined;

  const handleSearch = (query: string, quick = false) => {
    changeFilter(findSearchMatch(query).filter, quick, query);
  };

  return (
    <section
      className={`search-panel w-full rounded-none border border-[rgba(20,20,30,0.04)] bg-[rgba(255,255,255,0.96)] px-5 pb-6 pt-6 text-[#263044] shadow-[0_28px_70px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.9)] sm:px-8 sm:pb-8 sm:pt-9 lg:px-14 lg:pb-7 lg:pt-8${activeFilter === "All" ? " all-search-panel" : ""}${activeFilter === "Map" ? " map-search-panel" : ""}${activeFilter === "Contact" ? " contact-search-panel" : ""}`}
      id="results"
      data-active-tour-stop={tourStop !== null && !tourPaused ? TOUR_STOPS[tourStop].id : undefined}
      data-tour-contact-nudge={contactNoteNudge && tourStop === null && activeFilter === "Contact" ? "true" : undefined}
      onAnimationEnd={(event) => {
        // Consume this completion cue so returning to Contact cannot replay it.
        if (event.animationName === "tour-note-nudge") setContactNoteNudge(false);
      }}
      aria-label="Portfolio sections"
    >
      <div className="search-panel__inner">
        <SearchHeader
          onSearch={handleSearch}
          resetRequest={searchRequest}
          tourSearch={TOUR_OVERHAUL_ENABLED ? tourSearch : null}
          tourActive={TOUR_OVERHAUL_ENABLED && tourStop !== null}
          activeFilter={activeFilter}
          resultCount={resultCount}
        />

        <div
          className={`search-results-stack ${
            activeFilter === "All" ? "all-results" : ""
          } mt-[10px] transition-[opacity,transform] duration-200 motion-reduce:transition-none ${
            activeFilter === "Map" ? "map-results" : ""
          } translate-y-0 opacity-100`}
        >
          {activeFilter === "Projects" ? (
            <ProjectsShowcase />
          ) : activeFilter === "All" ? (
            <AllOverview
              onProjectsClick={() => changeFilter("Projects")}
              onTourStart={startTour}
              onTourCtaVisibilityChange={setHeroCtaVisible}
              tourCompleted={tourCompleted}
            />
          ) : activeFilter === "Map" ? (
            <section
              className="portfolio-map-panel"
              id="mapPanel"
              aria-label="Places on my map"
            >
              <div
                className="places-map"
                aria-label="Map with markers at the University of Waterloo and Ottawa"
              >
                <div className="personal-globe-root">
                  <PersonalGlobe />
                </div>
              </div>
            </section>
          ) : activeFilter === "Experience" ? (
            <ExperienceTimeline />
          ) : activeFilter === "About" ? (
            <div className="about-under-construction">
              <div className="about-under-construction__content" aria-hidden="true">
                <AboutSection onContactClick={() => changeFilter("Contact")} />
              </div>
              <UnderConstructionOverlay />
            </div>
          ) : activeFilter === "Contact" ? (
            <ContactSection
              isDarkMode={isDarkMode}
              onToggleTheme={() => setIsDarkMode((current) => !current)}
            />
          ) : (
            <SearchResultCard variant="profile" />
          )}
        </div>
      </div>
      {tourStop !== null ? <GuidedTour stopIndex={tourStop} paused={tourPaused} onPauseChange={changeTourPause} onNavigate={navigateTour} onExit={exitTour} onComplete={completeTour} onSearchPreview={setTourSearch} /> : null}
      {keyboardIntro ? <KeyboardVideoIntro onComplete={finishKeyboardIntro} /> : null}
      <TourFloatingCTA visible={!keyboardIntro && !tourCompleted && tourStop === null && !floatDismissed && !heroCtaVisible && activeFilter !== "Contact"} onStart={startTour} onDismiss={dismissFloat} />
    </section>
  );
}
