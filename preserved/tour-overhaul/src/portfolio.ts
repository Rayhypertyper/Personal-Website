interface ResultContent {
  count: string;
  title: string;
  url: string;
  href: string;
  description: string;
  waterlooLogo?: boolean;
}

type ResultFilter = "all" | "projects" | "experience" | "contact";

const content: Record<ResultFilter, ResultContent> = {
  all: {
    count: "About 2 results (0.01s)",
    title: "Computer Science @ University of Waterloo",
    url: "uwaterloo.ca",
    href: "https://uwaterloo.ca",
    waterlooLogo: true,
    description: "Finding clubs...",
  },
  projects: {
    count: "About 4 results (0.02s)",
    title: "Projects",
    url: "rayxu.dev/projects",
    href: "#projects",
    description:
      "Explore computer vision, route optimization, machine learning, and full-stack projects.",
  },
  experience: {
    count: "About 3 results (0.01s)",
    title: "Experience",
    url: "rayxu.dev/experience",
    href: "#projects",
    description:
      "Experience spanning software engineering, testing, and mentoring 30 students through a coding circle.",
  },
  contact: {
    count: "About 5 results (0.01s)",
    title: "Contact Ray",
    url: "rayxu.dev/contact",
    href: "#projects",
    description:
      "Get in touch about internships, collaborations, or an interesting technical problem.",
  },
};

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element #${id}`);
  }
  return element as T;
}

function isResultFilter(value: string): value is ResultFilter {
  return value in content;
}

export function setupPortfolioInteractions() {
  const heroSearch = getElement<HTMLFormElement>("heroSearch");
  const heroSearchInput = getElement<HTMLInputElement>("heroSearchInput");
  const resultCard = getElement<HTMLAnchorElement>("resultCard");
  const resultCount = getElement<HTMLSpanElement>("resultCount");
  const resultTitle = getElement<HTMLElement>("resultTitle");
  const resultUrl = getElement<HTMLSpanElement>("resultUrl");
  const resultDescription = getElement<HTMLSpanElement>("resultDescription");
  const resultAvatar = getElement<HTMLSpanElement>("resultAvatar");
  const hobbiesResultCard =
    getElement<HTMLAnchorElement>("hobbiesResultCard");
  const searchResults = getElement<HTMLDivElement>("searchResults");
  const mapPanel = getElement<HTMLElement>("mapPanel");
  const tabs = Array.from(
    document.querySelectorAll<HTMLButtonElement>(".tab[data-filter]"),
  );
  const searchPhrase = "Ray Xu";
  let searchTypingTimer: number | undefined;
  let searchTypingActive = true;

  const activateTab = (tab: HTMLButtonElement) => {
    tabs.forEach((otherTab) => {
      const isActive = otherTab === tab;
      otherTab.classList.toggle("active", isActive);
      otherTab.setAttribute("aria-selected", String(isActive));
    });

    const filter = tab.dataset.filter ?? "all";
    const showingMap = filter === "map";
    mapPanel.hidden = !showingMap;
    searchResults.hidden = showingMap;
    resultCard.hidden = showingMap;
    hobbiesResultCard.hidden = showingMap || filter !== "all";

    if (showingMap) {
      resultCount.textContent = "2 places";
      window.requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
      return;
    }

    if (!isResultFilter(filter)) {
      return;
    }

    const next = content[filter];
    resultCard.classList.remove("is-changing");
    void resultCard.offsetWidth;
    resultCard.classList.add("is-changing");
    resultCount.textContent = next.count;
    resultTitle.textContent = next.title;
    resultUrl.textContent = next.url;
    resultDescription.innerHTML = next.description;
    resultCard.href = next.href;
    resultAvatar.classList.toggle(
      "is-uwaterloo",
      Boolean(next.waterlooLogo),
    );
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activateTab(tab));
  });

  const filterFromQuery = (value: string) => {
    const query = value.toLowerCase();
    const wantsMap = ["map", "place", "waterloo", "ottawa"].some((keyword) =>
      query.includes(keyword),
    );
    const nextFilter = wantsMap
      ? "map"
      : (["projects", "experience", "contact"].find((keyword) =>
          query.includes(keyword),
        ) ?? "all");
    const matchingTab = tabs.find(
      (tab) => tab.dataset.filter === nextFilter,
    );
    matchingTab?.click();
  };

  const typeSearchIntro = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      heroSearchInput.value = searchPhrase;
      searchTypingActive = false;
      return;
    }

    heroSearchInput.value = "";
    heroSearchInput.focus({ preventScroll: true });
    let index = 0;

    const typeNextCharacter = () => {
      if (index >= searchPhrase.length) {
        searchTypingActive = false;
        return;
      }

      const typedCharacter = searchPhrase[index];
      heroSearchInput.value += typedCharacter;
      heroSearchInput.setSelectionRange(
        heroSearchInput.value.length,
        heroSearchInput.value.length,
      );
      index += 1;
      searchTypingTimer = window.setTimeout(
        typeNextCharacter,
        typedCharacter === " " ? 190 : 145,
      );
    };

    searchTypingTimer = window.setTimeout(typeNextCharacter, 420);
  };

  heroSearchInput.addEventListener("input", () => {
    if (searchTypingActive) {
      window.clearTimeout(searchTypingTimer);
      searchTypingActive = false;
    }
  });

  heroSearch.addEventListener("submit", (event) => {
    event.preventDefault();
    filterFromQuery(heroSearchInput.value.trim() || searchPhrase);
  });

  typeSearchIntro();
}
