import type { FilterName } from "./components/FilterTabs";

export type SearchDestinationId =
  | "overview"
  | "hobbies"
  | "projects"
  | "experience"
  | "about"
  | "map"
  | "contact";

export interface SearchMatch {
  id: SearchDestinationId;
  filter: FilterName;
  title: string;
  description: string;
  isFallback: boolean;
}

interface SearchEntry extends Omit<SearchMatch, "isFallback"> {
  keywords: readonly string[];
  priority: number;
}

const SEARCH_ENTRIES: readonly SearchEntry[] = [
  {
    id: "projects",
    filter: "Projects",
    title: "Projects",
    description:
      "Invisible Keyboard and AirCAD: computer vision, deep learning, and spatial 3D design.",
    keywords: [
      "project",
      "projects",
      "build",
      "builds",
      "invisible keyboard",
      "keyboard",
      "aircad",
      "air cad",
      "cad",
      "spatial cad",
      "3d",
      "3d modeling",
      "keycap",
      "freecad",
      "extrusion",
      "sketch",
      "geometry",
      "computer vision",
      "machine learning",
      "deep learning",
      "artificial intelligence",
      "ai",
      "python",
      "pytorch",
      "opencv",
      "mediapipe",
      "typescript",
      "depth camera",
      "oak d",
      "webcam",
      "full stack",
      "github",
    ],
    priority: 6,
  },
  {
    id: "experience",
    filter: "Experience",
    title: "Experience",
    description:
      "Nokia, SHAD, and Auxilium experience across software engineering, testing, and mentorship.",
    keywords: [
      "experience",
      "work",
      "career",
      "nokia",
      "automation intern",
      "intern",
      "internship",
      "software engineering",
      "testing",
      "cypress",
      "typescript",
      "css",
      "shad",
      "fellow",
      "auxilium",
      "coding circle",
      "lead",
      "mentor",
      "mentorship",
      "teaching",
      "communication",
      "students",
    ],
    priority: 5,
  },
  {
    id: "map",
    filter: "Map",
    title: "Map",
    description:
      "The places that matter to Ray: Ottawa and the University of Waterloo.",
    keywords: [
      "map",
      "maps",
      "location",
      "locations",
      "place",
      "places",
      "where",
      "ottawa",
      "waterloo",
      "hometown",
      "home",
      "school",
      "university of waterloo",
      "ontario",
      "canada",
    ],
    priority: 7,
  },
  {
    id: "contact",
    filter: "Contact",
    title: "Contact",
    description:
      "Email, LinkedIn, GitHub, scheduling, resume, and a message form.",
    keywords: [
      "contact",
      "email",
      "mail",
      "reach",
      "message",
      "get in touch",
      "hire",
      "hiring",
      "collaborate",
      "collaboration",
      "linkedin",
      "github",
      "resume",
      "cv",
      "schedule",
      "calendar",
      "talk",
      "opportunity",
      "opportunities",
    ],
    priority: 5,
  },
  {
    id: "about",
    filter: "About",
    title: "About Ray",
    description:
      "Ray is a Computer Science student who enjoys AI, full-stack development, and thoughtful product design.",
    keywords: [
      "about",
      "about me",
      "bio",
      "background",
      "who is ray",
      "currently",
      "computer science student",
      "student",
      "ai",
      "machine learning",
      "full stack development",
      "full-stack development",
      "product design",
      "curiosity",
      "skills",
      "focus",
      "interests",
    ],
    priority: 4,
  },
  {
    id: "hobbies",
    filter: "All",
    title: "Hobbies & Interests",
    description:
      "A look at what Ray enjoys beyond classes, coding, and side projects.",
    keywords: [
      "hobby",
      "hobbies",
      "interests",
      "typing",
      "typing speed",
      "150 words per minute",
      "150 wpm",
      "words per minute",
      "outside class",
      "fun",
    ],
    priority: 3,
  },
  {
    id: "overview",
    filter: "All",
    title: "Ray Xu",
    description:
      "The portfolio overview: Ray Xu, Computer Science student and software builder.",
    keywords: [
      "ray",
      "ray xu",
      "xu",
      "portfolio",
      "developer",
      "software developer",
      "software",
      "computer science",
      "student",
      "university of waterloo",
    ],
    priority: 2,
  },
] as const;

const normalize = (value: string) =>
  value
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getTokens = (value: string) =>
  normalize(value)
    .split(" ")
    .filter((token) => token.length > 1);

const editDistance = (left: string, right: string) => {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = previous[0];
    previous[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = previous[rightIndex];
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;

      previous[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + 1,
        diagonal + substitutionCost,
      );
      diagonal = above;
    }
  }

  return previous[right.length];
};

const scoreEntry = (query: string, entry: SearchEntry) => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return entry.id === "overview" ? entry.priority : 0;
  }

  const normalizedKeywords = entry.keywords.map(normalize);
  const searchableText = normalize(
    [entry.title, entry.description, ...entry.keywords].join(" "),
  );
  const queryTokens = getTokens(normalizedQuery);
  const searchableTokens = new Set(getTokens(searchableText));
  let score = entry.priority;

  if (searchableText.includes(normalizedQuery)) {
    score += normalizedQuery.length > 3 ? 30 : 18;
  }

  for (const keyword of normalizedKeywords) {
    if (keyword === normalizedQuery) {
      score += 34;
    } else if (
      normalizedQuery.length > 3 &&
      (keyword.includes(normalizedQuery) || normalizedQuery.includes(keyword))
    ) {
      score += 16;
    }
  }

  for (const queryToken of queryTokens) {
    if (searchableTokens.has(queryToken)) {
      score += 12;
      continue;
    }

    const hasPrefixMatch = Array.from(searchableTokens).some(
      (searchableToken) =>
        searchableToken.length > 3 &&
        (searchableToken.startsWith(queryToken) || queryToken.startsWith(searchableToken)),
    );
    if (hasPrefixMatch) {
      score += 7;
      continue;
    }

    if (queryToken.length >= 4) {
      const hasNearMatch = Array.from(searchableTokens).some(
        (searchableToken) =>
          searchableToken.length >= 4 &&
          editDistance(queryToken, searchableToken) <=
            (queryToken.length >= 7 ? 2 : 1),
      );
      if (hasNearMatch) {
        score += 4;
      }
    }
  }

  return score;
};

export function findSearchMatch(query: string): SearchMatch {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return {
      id: "overview",
      filter: "All",
      title: "Ray Xu",
      description: "Showing the portfolio overview.",
      isFallback: false,
    };
  }

  const rankedEntries = SEARCH_ENTRIES.map((entry, index) => ({
    entry,
    index,
    score: scoreEntry(normalizedQuery, entry),
  })).sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return left.index - right.index;
  });

  const best = rankedEntries[0];
  const hasMatch = best && best.score > best.entry.priority;
  const entry = hasMatch ? best.entry : SEARCH_ENTRIES[SEARCH_ENTRIES.length - 1];

  return {
    id: entry.id,
    filter: entry.filter,
    title: entry.title,
    description: entry.description,
    isFallback: !hasMatch,
  };
}
