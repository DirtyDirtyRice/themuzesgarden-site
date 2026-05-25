import {
  buildFinderSearchText,
  buildFinderStatistics,
  searchTrackMatcherFinder,
} from "./trackMatcherFinderHelpers";
import { adaptLibraryTracksToFinderResults } from "./trackMatcherFinderLibraryAdapter";
import type { TrackMatcherFinderLibraryTrackLike } from "./trackMatcherFinderLibraryAdapter";
import { buildTrackMatcherMetadataPipelineResult } from "./trackMatcherFinderMetadataPipeline";
import {
  getMetadataSearchTokenSuggestions,
  getTopMetadataSearchResults,
  searchTrackMatcherMetadataProfiles,
  type TrackMatcherMetadataSearchResult,
} from "./trackMatcherFinderMetadataSearch";
import type { TrackMatcherMetadataProfile } from "./trackMatcherFinderMetadataTypes";
import type {
  TrackMatcherFinderQuery,
  TrackMatcherFinderSource,
  TrackMatcherFinderState,
  TrackMatcherFinderTrackResult,
} from "./trackMatcherFinderTypes";
import {
  DEFAULT_TRACK_MATCHER_FINDER_QUERY,
  DEFAULT_TRACK_MATCHER_FINDER_STATE,
} from "./trackMatcherFinderTypes";

export type TrackMatcherFinderLibrarySourceSummary = {
  source: TrackMatcherFinderSource;
  count: number;
  playableCount: number;
};

export type TrackMatcherFinderLibrarySearchSummary = {
  totalTracks: number;
  resultCount: number;
  playableResults: number;
  taggedResults: number;
  sourceSummaries: TrackMatcherFinderLibrarySourceSummary[];
  topTags: string[];
  metadataSuggestionCount: number;
};

export type TrackMatcherFinderLibrarySearchState = TrackMatcherFinderState & {
  allTracks: TrackMatcherFinderTrackResult[];
  metadataProfiles: TrackMatcherMetadataProfile[];
  metadataResults: TrackMatcherMetadataSearchResult[];
  metadataSuggestions: string[];
  summary: TrackMatcherFinderLibrarySearchSummary;
};

const EMPTY_SOURCE_SUMMARIES: TrackMatcherFinderLibrarySourceSummary[] = [
  { source: "library", count: 0, playableCount: 0 },
  { source: "project", count: 0, playableCount: 0 },
  { source: "upload", count: 0, playableCount: 0 },
  { source: "supabase", count: 0, playableCount: 0 },
  { source: "seed", count: 0, playableCount: 0 },
  { source: "unknown", count: 0, playableCount: 0 },
];

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ");
}

function unique(values: string[]) {
  return Array.from(new Set(values.map(normalize).filter(Boolean)));
}

function isPlayableTrack(track: TrackMatcherFinderTrackResult) {
  return Boolean(track.audioUrl);
}

function buildSourceSummaries(
  tracks: readonly TrackMatcherFinderTrackResult[],
): TrackMatcherFinderLibrarySourceSummary[] {
  return EMPTY_SOURCE_SUMMARIES.map((summary) => {
    const sourceTracks = tracks.filter((track) => track.source === summary.source);

    return {
      source: summary.source,
      count: sourceTracks.length,
      playableCount: sourceTracks.filter(isPlayableTrack).length,
    };
  });
}

function buildTopTags(
  tracks: readonly TrackMatcherFinderTrackResult[],
  limit = 24,
) {
  const counts = new Map<string, number>();

  for (const track of tracks) {
    for (const tag of track.tags) {
      const normalizedTag = normalize(tag);
      if (!normalizedTag) continue;
      counts.set(normalizedTag, (counts.get(normalizedTag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => {
      if (a[1] !== b[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .map(([tag]) => tag)
    .slice(0, limit);
}

function buildFinderLibrarySummary(args: {
  allTracks: readonly TrackMatcherFinderTrackResult[];
  results: readonly TrackMatcherFinderTrackResult[];
  metadataSuggestions: readonly string[];
}): TrackMatcherFinderLibrarySearchSummary {
  return {
    totalTracks: args.allTracks.length,
    resultCount: args.results.length,
    playableResults: args.results.filter(isPlayableTrack).length,
    taggedResults: args.results.filter((track) => track.tags.length > 0).length,
    sourceSummaries: buildSourceSummaries(args.allTracks),
    topTags: buildTopTags(args.allTracks),
    metadataSuggestionCount: args.metadataSuggestions.length,
  };
}

function getMetadataQueryText(query: TrackMatcherFinderQuery) {
  return unique([
    query.searchText,
    ...query.selectedTags,
    ...query.selectedSources,
  ]).join(" ");
}

function mergeMetadataResultsIntoFinderResults(args: {
  results: readonly TrackMatcherFinderTrackResult[];
  metadataResults: readonly TrackMatcherMetadataSearchResult[];
}) {
  if (!args.metadataResults.length) return [...args.results];

  const metadataScoreByTrackId = new Map<string, number>();

  for (const result of args.metadataResults) {
    metadataScoreByTrackId.set(result.profile.trackId, result.score);
  }

  return [...args.results].sort((a, b) => {
    const aMetadataScore = metadataScoreByTrackId.get(a.id) ?? 0;
    const bMetadataScore = metadataScoreByTrackId.get(b.id) ?? 0;

    if (aMetadataScore !== bMetadataScore) {
      return bMetadataScore - aMetadataScore;
    }

    if (a.score !== b.score) {
      return b.score - a.score;
    }

    return a.title.localeCompare(b.title);
  });
}

export function buildTrackMatcherFinderStateFromLibraryTracks(
  tracks: readonly TrackMatcherFinderLibraryTrackLike[],
  query: TrackMatcherFinderQuery = DEFAULT_TRACK_MATCHER_FINDER_QUERY,
): TrackMatcherFinderState {
  const finderTracks = adaptLibraryTracksToFinderResults(tracks);
  const results = searchTrackMatcherFinder(finderTracks, query);

  return {
    query,
    results,
    statistics: buildFinderStatistics(results),
  };
}

export function buildTrackMatcherFinderLibrarySearchState(
  tracks: readonly TrackMatcherFinderLibraryTrackLike[],
  query: TrackMatcherFinderQuery = DEFAULT_TRACK_MATCHER_FINDER_QUERY,
): TrackMatcherFinderLibrarySearchState {
  const allTracks = adaptLibraryTracksToFinderResults(tracks);
  const baseResults = searchTrackMatcherFinder(allTracks, query);
  const metadataPipeline = buildTrackMatcherMetadataPipelineResult(tracks);
  const metadataQueryText = getMetadataQueryText(query);
  const metadataResults = metadataQueryText
    ? searchTrackMatcherMetadataProfiles(
        metadataPipeline.profiles,
        metadataQueryText,
      )
    : getTopMetadataSearchResults(metadataPipeline.profiles, "", 24);

  const metadataSuggestions = getMetadataSearchTokenSuggestions(
    metadataPipeline.profiles,
  );

  const results = mergeMetadataResultsIntoFinderResults({
    results: baseResults,
    metadataResults,
  });

  return {
    query,
    allTracks,
    results,
    statistics: buildFinderStatistics(results),
    metadataProfiles: metadataPipeline.profiles,
    metadataResults,
    metadataSuggestions,
    summary: buildFinderLibrarySummary({
      allTracks,
      results,
      metadataSuggestions,
    }),
  };
}

export function buildTrackMatcherFinderSearchCorpus(
  tracks: readonly TrackMatcherFinderTrackResult[],
) {
  return tracks.map((track) => ({
    trackId: track.id,
    title: track.title,
    source: track.source,
    hasAudioUrl: isPlayableTrack(track),
    tags: track.tags,
    searchText: buildFinderSearchText(track),
  }));
}

export function hasTrackMatcherFinderLibraryTracks(
  tracks: readonly TrackMatcherFinderLibraryTrackLike[] | null | undefined,
) {
  return Array.isArray(tracks) && tracks.length > 0;
}

export function getEmptyTrackMatcherFinderState(): TrackMatcherFinderState {
  return DEFAULT_TRACK_MATCHER_FINDER_STATE;
}

export function getEmptyTrackMatcherFinderLibrarySearchState(): TrackMatcherFinderLibrarySearchState {
  return {
    ...DEFAULT_TRACK_MATCHER_FINDER_STATE,
    allTracks: [],
    metadataProfiles: [],
    metadataResults: [],
    metadataSuggestions: [],
    summary: {
      totalTracks: 0,
      resultCount: 0,
      playableResults: 0,
      taggedResults: 0,
      sourceSummaries: EMPTY_SOURCE_SUMMARIES,
      topTags: [],
      metadataSuggestionCount: 0,
    },
  };
}
