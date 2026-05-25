export type TrackMatcherFinderDestination =
  | "track-a"
  | "track-b"
  | "original-idea"
  | "suno-result"
  | "reference-song"
  | "melody"
  | "harmony"
  | "drums"
  | "bass"
  | "vocal"
  | "instrument"
  | "stem"
  | "hybrid"
  | "analysis";

export type TrackMatcherFinderSource =
  | "library"
  | "project"
  | "upload"
  | "supabase"
  | "seed"
  | "unknown";

export type TrackMatcherFinderCategory =
  | "all"
  | "genre"
  | "artist"
  | "title"
  | "band"
  | "album"
  | "tags"
  | "track-type"
  | "source"
  | "routing"
  | "metadata";

export type TrackMatcherFinderQuery = {
  searchText: string;
  searchCategory: TrackMatcherFinderCategory;
  searchBranchLabel: string;
  selectedTags: string[];
  selectedSources: TrackMatcherFinderSource[];
  includeStemTracks: boolean;
  includeInstrumentals: boolean;
  includeReferenceSongs: boolean;
  includeHybridCandidates: boolean;
};

export type TrackMatcherFinderTrackResult = {
  id: string;
  title: string;
  artist: string;
  source: TrackMatcherFinderSource;
  tags: string[];
  description?: string;
  audioUrl?: string;
  score: number;
  isStem: boolean;
  isInstrumental: boolean;
  isReferenceSong: boolean;
  isHybridCandidate: boolean;
  destinationHints: TrackMatcherFinderDestination[];
};

export type TrackMatcherFinderLoadRequest = {
  destination: TrackMatcherFinderDestination;
  trackId: string;
};

export type TrackMatcherFinderStatistics = {
  totalTracks: number;
  stemTracks: number;
  instrumentalTracks: number;
  referenceSongs: number;
  hybridCandidates: number;
};

export type TrackMatcherFinderState = {
  query: TrackMatcherFinderQuery;
  results: TrackMatcherFinderTrackResult[];
  statistics: TrackMatcherFinderStatistics;
};

export const DEFAULT_TRACK_MATCHER_FINDER_QUERY: TrackMatcherFinderQuery = {
  searchText: "",
  searchCategory: "all",
  searchBranchLabel: "All",
  selectedTags: [],
  selectedSources: [],
  includeStemTracks: true,
  includeInstrumentals: true,
  includeReferenceSongs: true,
  includeHybridCandidates: true,
};

export const DEFAULT_TRACK_MATCHER_FINDER_STATISTICS: TrackMatcherFinderStatistics =
  {
    totalTracks: 0,
    stemTracks: 0,
    instrumentalTracks: 0,
    referenceSongs: 0,
    hybridCandidates: 0,
  };

export const DEFAULT_TRACK_MATCHER_FINDER_STATE: TrackMatcherFinderState = {
  query: DEFAULT_TRACK_MATCHER_FINDER_QUERY,
  results: [],
  statistics: DEFAULT_TRACK_MATCHER_FINDER_STATISTICS,
};