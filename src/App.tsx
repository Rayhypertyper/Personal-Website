import { useEffect, useState } from "react";
import type { FilterName } from "./components/FilterTabs";
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
import "./globe.css";

export function App() {
  const [activeFilter, setActiveFilter] = useState<FilterName>("All");
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = isDarkMode ? "dark" : "light";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", isDarkMode ? "#07101f" : "#f9f7f3");
  }, [isDarkMode]);

  useEffect(() => {
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
    setActiveFilter(findSearchMatch(query).filter);
  };

  return (
    <section
      className={`search-panel w-full rounded-none border border-[rgba(20,20,30,0.04)] bg-[rgba(255,255,255,0.96)] px-5 pb-6 pt-6 text-[#263044] shadow-[0_28px_70px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.9)] sm:px-8 sm:pb-8 sm:pt-9 lg:px-14 lg:pb-7 lg:pt-8${activeFilter === "All" ? " all-search-panel" : ""}${activeFilter === "Map" ? " map-search-panel" : ""}${activeFilter === "Contact" ? " contact-search-panel" : ""}`}
      id="results"
      aria-label="Portfolio sections"
    >
      <div className="search-panel__inner">
        <SearchHeader
          onSearch={handleSearch}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
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
            <AllOverview onProjectsClick={() => setActiveFilter("Projects")} />
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
            />
          ) : (
            <SearchResultCard variant="profile" />
          )}
        </div>
      </div>
    </section>
  );
}
