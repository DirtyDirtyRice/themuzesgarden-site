import type {
  TrackMatcherFinderQuery,
  TrackMatcherFinderStatistics,
  TrackMatcherFinderTrackResult,
} from "./trackMatcherFinderTypes";

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function tokenize(value: unknown) {
  return normalize(value)
    .split(/\s+/g)
    .map((token) => token.trim())
    .filter(Boolean);
}

function includesSearchTerm(
  haystack: string,
  terms: readonly string[],
) {
  return terms.every((term) => haystack.includes(term));
}

export function buildFinderSearchText(
  track: Partial<TrackMatcherFinderTrackResult>,
) {
  return [
    track.title,
    track.artist,
    track.description,
    ...(track.tags ?? []),
  ]
    .map(normalize)
    .filter(Boolean)
    .join(" ");
}

export function scoreFinderTrack(
  track: TrackMatcherFinderTrackResult,
  query: TrackMatcherFinderQuery,
) {
  const terms = tokenize(query.searchText);

  if (!terms.length) {
    return 1;
  }

  const title = normalize(track.title);
  const artist = normalize(track.artist);
  const description = normalize(track.description);
  const searchText = buildFinderSearchText(track);

  let score = 0;

  for (const term of terms) {
    if (title === term) score += 120;
    if (title.includes(term)) score += 80;

    if (artist.includes(term)) score += 40;

    if (description.includes(term)) score += 25;

    if (searchText.includes(term)) score += 10;
  }

  return score;
}

export function matchesFinderFilters(
  track: TrackMatcherFinderTrackResult,
  query: TrackMatcherFinderQuery,
) {
  if (
    query.selectedSources.length > 0 &&
    !query.selectedSources.includes(track.source)
  ) {
    return false;
  }

  if (!query.includeStemTracks && track.isStem) {
    return false;
  }

  if (!query.includeInstrumentals && track.isInstrumental) {
    return false;
  }

  if (!query.includeReferenceSongs && track.isReferenceSong) {
    return false;
  }

  if (!query.includeHybridCandidates && track.isHybridCandidate) {
    return false;
  }

  if (
    query.selectedTags.length > 0 &&
    !query.selectedTags.every((tag) =>
      track.tags.some(
        (trackTag) => normalize(trackTag) === normalize(tag),
      ),
    )
  ) {
    return false;
  }

  return true;
}

export function searchTrackMatcherFinder(
  tracks: readonly TrackMatcherFinderTrackResult[],
  query: TrackMatcherFinderQuery,
) {
  return tracks
    .filter((track) => matchesFinderFilters(track, query))
    .map((track) => ({
      ...track,
      score: scoreFinderTrack(track, query),
    }))
    .filter((track) => {
      if (!query.searchText.trim()) {
        return true;
      }

      return track.score > 0;
    })
    .sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }

      return a.title.localeCompare(b.title);
    });
}

export function buildFinderStatistics(
  tracks: readonly TrackMatcherFinderTrackResult[],
): TrackMatcherFinderStatistics {
  return {
    totalTracks: tracks.length,

    stemTracks: tracks.filter(
      (track) => track.isStem,
    ).length,

    instrumentalTracks: tracks.filter(
      (track) => track.isInstrumental,
    ).length,

    referenceSongs: tracks.filter(
      (track) => track.isReferenceSong,
    ).length,

    hybridCandidates: tracks.filter(
      (track) => track.isHybridCandidate,
    ).length,
  };
}