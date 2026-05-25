import {
  adaptLibraryTracksToFinderResults,
  type TrackMatcherFinderLibraryTrackLike,
} from "./trackMatcherFinderLibraryAdapter";
import {
  buildTrackMatcherMetadataPipelineResult,
} from "./trackMatcherFinderMetadataPipeline";
import {
  searchTrackMatcherMetadataProfiles,
  type TrackMatcherMetadataSearchResult,
} from "./trackMatcherFinderMetadataSearch";
import {
  buildFinderStatistics,
  searchTrackMatcherFinder,
} from "./trackMatcherFinderHelpers";
import type {
  TrackMatcherFinderQuery,
  TrackMatcherFinderStatistics,
  TrackMatcherFinderTrackResult,
} from "./trackMatcherFinderTypes";
import { DEFAULT_TRACK_MATCHER_FINDER_QUERY } from "./trackMatcherFinderTypes";
import type {
  TrackMatcherMetadataProfile,
  TrackMatcherMetadataStatistics,
} from "./trackMatcherFinderMetadataTypes";

export type TrackMatcherFinderIndex = {
  tracks: TrackMatcherFinderTrackResult[];
  profiles: TrackMatcherMetadataProfile[];
  statistics: TrackMatcherFinderStatistics;
  metadataStatistics: TrackMatcherMetadataStatistics;
};

export type TrackMatcherFinderIndexSearchResult = {
  query: TrackMatcherFinderQuery;
  tracks: TrackMatcherFinderTrackResult[];
  metadataResults: TrackMatcherMetadataSearchResult[];
  statistics: TrackMatcherFinderStatistics;
};

export function buildTrackMatcherFinderIndex(
  libraryTracks: readonly TrackMatcherFinderLibraryTrackLike[],
): TrackMatcherFinderIndex {
  const tracks = adaptLibraryTracksToFinderResults(libraryTracks);
  const metadataPipeline = buildTrackMatcherMetadataPipelineResult(libraryTracks);

  return {
    tracks,
    profiles: metadataPipeline.profiles,
    statistics: buildFinderStatistics(tracks),
    metadataStatistics: metadataPipeline.statistics,
  };
}

export function searchTrackMatcherFinderIndex(
  index: TrackMatcherFinderIndex,
  query: TrackMatcherFinderQuery = DEFAULT_TRACK_MATCHER_FINDER_QUERY,
): TrackMatcherFinderIndexSearchResult {
  const tracks = searchTrackMatcherFinder(index.tracks, query);
  const metadataResults = searchTrackMatcherMetadataProfiles(
    index.profiles,
    query.searchText,
  );

  return {
    query,
    tracks,
    metadataResults,
    statistics: buildFinderStatistics(tracks),
  };
}

export function getEmptyTrackMatcherFinderIndex(): TrackMatcherFinderIndex {
  return {
    tracks: [],
    profiles: [],
    statistics: buildFinderStatistics([]),
    metadataStatistics: {
      totalProfiles: 0,
      totalTokens: 0,
      totalGenres: 0,
      totalStemTypes: 0,
      totalInstruments: 0,
    },
  };
}

export function hasTrackMatcherFinderIndexData(index: TrackMatcherFinderIndex) {
  return index.tracks.length > 0 || index.profiles.length > 0;
}