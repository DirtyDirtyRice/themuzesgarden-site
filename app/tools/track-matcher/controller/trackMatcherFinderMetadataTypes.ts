export type TrackMatcherMetadataCategory =
  | "genre"
  | "mood"
  | "stem"
  | "instrument"
  | "vocal"
  | "structure"
  | "source"
  | "quality"
  | "workflow";

export type TrackMatcherMetadataConfidence =
  | "verified"
  | "inferred"
  | "generated";

export type TrackMatcherMetadataToken = {
  token: string;
  category: TrackMatcherMetadataCategory;
  confidence: TrackMatcherMetadataConfidence;
  score: number;
};

export type TrackMatcherMetadataProfile = {
  trackId: string;
  title: string;

  searchableText: string;

  genres: string[];
  moods: string[];

  instruments: string[];

  stemTypes: string[];

  vocalTypes: string[];

  workflowFlags: string[];

  metadataTokens: TrackMatcherMetadataToken[];

  generatedKeywords: string[];

  confidenceScore: number;
};

export type TrackMatcherFinderPreset = {
  id: string;
  label: string;
  description: string;
  requiredTokens: string[];
  excludedTokens: string[];
};

export type TrackMatcherMetadataStatistics = {
  totalProfiles: number;
  totalTokens: number;
  totalGenres: number;
  totalStemTypes: number;
  totalInstruments: number;
};