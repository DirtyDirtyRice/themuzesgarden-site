import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

export const FIND_IT_CATEGORY_ORDER = [
  "record",
  "action",
  "section",
  "page",
  "area",
  "app",
];

export const FIND_IT_CATEGORY_HELP_TEXT: Record<string, string> = {
  record: "Single metadata record destinations.",
  action: "Actions such as Find It or navigation help.",
  section: "Smaller areas inside a page.",
  page: "Full app pages.",
  area: "Large app areas.",
  app: "The main app starting point.",
};

export type FindItGroupedMatches = {
  category: string;
  matches: NavigationSearchResult[];
};

export function getSafeFindItRoute(href: string | undefined) {
  if (!href || href.startsWith("#")) {
    return null;
  }

  if (href.includes("[slug]")) {
    return "/metadata";
  }

  if (href.includes("[id]")) {
    return "/workspace/projects";
  }

  return href;
}

export function getFindItResultLabel(resultCount: number) {
  return resultCount === 1 ? "1 option" : `${resultCount} options`;
}

export function groupFindItMatchesByCategory(
  matches: NavigationSearchResult[],
): FindItGroupedMatches[] {
  const orderedGroups = FIND_IT_CATEGORY_ORDER.map((category) => ({
    category,
    matches: matches.filter((match) => match.node.kind === category),
  })).filter((group) => group.matches.length > 0);

  const knownCategories = new Set(FIND_IT_CATEGORY_ORDER);
  const extraGroups = Array.from(
    new Set(
      matches
        .map((match) => match.node.kind)
        .filter((category) => !knownCategories.has(category)),
    ),
  ).map((category) => ({
    category,
    matches: matches.filter((match) => match.node.kind === category),
  }));

  return [...orderedGroups, ...extraGroups];
}

export function clampFindItSelectedIndex(
  index: number,
  matches: NavigationSearchResult[],
) {
  if (matches.length === 0) return 0;
  if (index < 0) return matches.length - 1;
  if (index >= matches.length) return 0;
  return index;
}

export function getFindItSuggestionPhrases(searchValue: string) {
  const cleanSearchValue = searchValue.trim().toLowerCase();
  const suggestions = [
    "relationships",
    "create metadata",
    "metadata library",
    "metadata record",
    "shelves",
    "project detail",
    "find it",
    "review required fields",
  ];

  return suggestions.filter(
    (suggestion) =>
      suggestion.trim().toLowerCase() !== cleanSearchValue &&
      suggestion.trim().length > 3,
  );
}