import { useCallback, useEffect, useState } from "react";
import { FILTERS, type FilterName } from "./components/FilterTabs";
import { SearchHeader } from "./components/SearchHeader";
import { SearchResultCard } from "./components/SearchResultCard";
import { PersonalGlobe } from "./components/PersonalGlobe";
import { AllOverview } from "./components/AllOverview";
import { ProjectsShowcase } from "./components/ProjectsShowcase";
import { ExperienceTimeline } from "./components/ExperienceTimeline";
import { AboutSection } from "./components/AboutSection";
import { ContactSection } from "./components/ContactSection";
import { UnderConstructionOverlay } from "./components/UnderConstructionOverlay";
import { findSearchMatch } from "./search";
import { GuidedTour, TOUR_STOPS } from "./components/GuidedTour";
import { CONTACT_EMAIL, hasCompletedTour, TOUR_STORAGE_KEY } from "./contact-links";
import "./globe.css";

const ACTIVE_FILTER_STORAGE_KEY = "rayxu-active-filter-v1";

function getInitialFilter(): FilterName {
  try {
    const savedFilter = sessionStorage.getItem(ACTIVE_FILTER_STORAGE_KEY);
    return FILTERS.find((filter) => filter === savedFilter) ?? "All";
  } catch {
    return "All";
  }
}

export function App() {
  const [activeFilter, setActiveFilter] = useState<FilterName>(getInitialFilter);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [tourStop, setTourStop] = useState<number | null>(null);
  const [tourPaused, setTourPaused] = useState(false);
  const [tourSearch, setTourSearch] = useState<{ query: string; searching: boolean } | null>(null);
  const [tourCompleted, setTourCompleted] = useState(hasCompletedTour);
  const [contactIntent, setContactIntent] = useState<"resume" | null>(null);

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
    performance.mark("tour:complete");
    setTourCompleted(true);
    setTourStop(null);
    setTourPaused(false);
    try { localStorage.setItem(TOUR_STORAGE_KEY, "true"); } catch { /* The tour also works without storage. */ }
    if (restoreFocus) requestAnimationFrame(() => {
      const focusTarget = document.querySelector<HTMLElement>('[data-tour-target="contact"] h2')
        ?? document.querySelector<HTMLElement>('[data-filter-tab][aria-selected="true"]');
      focusTarget?.focus({ preventScroll: true });
    });
  }, []);

  const navigateTour = useCallback((index: number) => {
    const stop = TOUR_STOPS[index];
    if (!stop) return;
    setActiveFilter(stop.filter);
    setContactIntent(null);
    setTourStop(index);
  }, []);

  const changeTourPause = useCallback((paused: boolean) => {
    setTourPaused(paused);
    if (!paused && tourStop !== null) {
      setActiveFilter(TOUR_STOPS[tourStop].filter);
      setContactIntent(null);
    }
  }, [tourStop]);

  const changeFilter = (filter: FilterName) => {
    if (!tourPaused) setTourStop(null);
    setActiveFilter(filter);
    setContactIntent(null);
  };

  useEffect(() => {
    const emailLink = document.querySelector<HTMLAnchorElement>("[data-contact-email]");
    if (!emailLink) return;
    emailLink.href = CONTACT_EMAIL ? `mailto:${CONTACT_EMAIL}` : "#contact";
    const openContact = (event: MouseEvent) => {
      if (CONTACT_EMAIL) return;
      event.preventDefault();
      if (!tourPaused) setTourStop(null);
      setContactIntent(null);
      setActiveFilter("Contact");
    };
    emailLink.addEventListener("click", openContact);
    return () => emailLink.removeEventListener("click", openContact);
  }, [tourPaused]);

  useEffect(() => {
    document.documentElement.dataset.theme = isDarkMode ? "dark" : "light";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", isDarkMode ? "#07101f" : "#f9f7f3");
  }, [isDarkMode]);

  useEffect(() => {
    // Keep the selected page when a preview reconnect or refresh reloads the app.
    try { sessionStorage.setItem(ACTIVE_FILTER_STORAGE_KEY, activeFilter); } catch { /* Browsing also works without storage. */ }
    document.documentElement.dataset.contactPage =
      activeFilter === "Contact" ? "true" : "false";
    document.documentElement.dataset.projectsPage =
      activeFilter === "Projects" ? "true" : "false";
    document.querySelector(".browser-frame")?.scrollTo({ top: 0, behavior: "instant" });
  }, [activeFilter]);

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

  const handleSearch = (query: string) => {
    changeFilter(findSearchMatch(query).filter);
  };

  return (
    <section
      className={`search-panel w-full rounded-none border border-[rgba(20,20,30,0.04)] bg-[rgba(255,255,255,0.96)] px-5 pb-6 pt-6 text-[#263044] shadow-[0_28px_70px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.9)] sm:px-8 sm:pb-8 sm:pt-9 lg:px-14 lg:pb-7 lg:pt-8${activeFilter === "All" ? " all-search-panel" : ""}${activeFilter === "Map" ? " map-search-panel" : ""}${activeFilter === "Contact" ? " contact-search-panel" : ""}`}
      id="results"
      data-active-tour-stop={tourStop !== null && !tourPaused ? TOUR_STOPS[tourStop].id : undefined}
      aria-label="Portfolio sections"
    >
      <div className="search-panel__inner">
        <SearchHeader
          onSearch={handleSearch}
          tourSearch={tourSearch}
          tourActive={tourStop !== null}
          activeFilter={activeFilter}
          onFilterChange={changeFilter}
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
              onResumeRequest={() => {
                changeFilter("Contact");
                setContactIntent("resume");
              }}
              onTourStart={() => { setTourPaused(false); navigateTour(0); }}
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
                <AboutSection onContactClick={() => setActiveFilter("Contact")} />
              </div>
              <UnderConstructionOverlay />
            </div>
          ) : activeFilter === "Contact" ? (
            <ContactSection
              isDarkMode={isDarkMode}
              onToggleTheme={() => setIsDarkMode((current) => !current)}
              initialIntent={contactIntent}
            />
          ) : (
            <SearchResultCard variant="profile" />
          )}
        </div>
      </div>
      {tourStop !== null ? <GuidedTour stopIndex={tourStop} paused={tourPaused} onPauseChange={changeTourPause} onNavigate={navigateTour} onExit={exitTour} onComplete={completeTour} onSearchPreview={setTourSearch} /> : null}
    </section>
  );
}
