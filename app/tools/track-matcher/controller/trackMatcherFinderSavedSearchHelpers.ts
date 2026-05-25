import { TRACK_MATCHER_FINDER_SAVED_SEARCHES } from "./trackMatcherFinderSavedSearchSeed";
import type {
  TrackMatcherFinderSavedSearch,
  TrackMatcherFinderSavedSearchGroup,
  TrackMatcherFinderSavedSearchScope,
  TrackMatcherFinderSavedSearchStatus,
} from "./trackMatcherFinderSavedSearchTypes";
import type { TrackMatcherFinderQuery } from "./trackMatcherFinderTypes";

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function includesTerm(value: unknown, term: string) {
  return normalize(value).includes(normalize(term));
}

export function getTrackMatcherSavedSearchById(searchId: string) {
  return TRACK_MATCHER_FINDER_SAVED_SEARCHES.find(
    (search) => search.id === searchId,
  );
}

export function getTrackMatcherSavedSearchesByScope(
  scope: TrackMatcherFinderSavedSearchScope,
) {
  return TRACK_MATCHER_FINDER_SAVED_SEARCHES.filter(
    (search) => search.scope === scope,
  );
}

export function getTrackMatcherSavedSearchesByStatus(
  status: TrackMatcherFinderSavedSearchStatus,
) {
  return TRACK_MATCHER_FINDER_SAVED_SEARCHES.filter(
    (search) => search.status === status,
  );
}

export function searchTrackMatcherSavedSearches(query: string) {
  const term = normalize(query);
  if (!term) return TRACK_MATCHER_FINDER_SAVED_SEARCHES;

  return TRACK_MATCHER_FINDER_SAVED_SEARCHES.filter((search) =>
    [
      search.id,
      search.label,
      search.description,
      search.scope,
      search.status,
      search.query.searchText,
      ...search.keywords,
    ].some((part) => includesTerm(part, term)),
  );
}

export function buildTrackMatcherSavedSearchGroup(
  args: Omit<TrackMatcherFinderSavedSearchGroup, "searches"> & {
    searchIds: string[];
  },
): TrackMatcherFinderSavedSearchGroup {
  return {
    id: args.id,
    label: args.label,
    description: args.description,
    searches: args.searchIds
      .map((searchId) => getTrackMatcherSavedSearchById(searchId))
      .filter(
        (search): search is TrackMatcherFinderSavedSearch => Boolean(search),
      ),
  };
}

export function applySavedSearchToFinderQuery(
  savedSearch: TrackMatcherFinderSavedSearch,
  currentQuery?: TrackMatcherFinderQuery,
): TrackMatcherFinderQuery {
  return {
    ...(currentQuery ?? savedSearch.query),
    ...savedSearch.query,
  };
}

export function getSavedSearchKeywords() {
  const keywords = new Set<string>();

  for (const search of TRACK_MATCHER_FINDER_SAVED_SEARCHES) {
    search.keywords.forEach((keyword) => keywords.add(keyword));
  }

  return [...keywords].sort((a, b) => a.localeCompare(b));
}

export function describeSavedSearch(search: TrackMatcherFinderSavedSearch) {
  return `${search.label}: ${search.description}`;
}