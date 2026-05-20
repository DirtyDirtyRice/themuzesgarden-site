"use client";

export type TrackMatcherLaneGroupKey =
  | "primaryLanes"
  | "stemLanes"
  | "analysisLanes"
  | "hybridLanes";

export type TrackMatcherLaneSectionConfig = {
  key: TrackMatcherLaneGroupKey;
  title: string;
  subtitle: string;
  columns: string;
};

export const TRACK_MATCHER_LANE_SECTION_CONFIGS: TrackMatcherLaneSectionConfig[] = [
  {
    key: "primaryLanes",
    title: "Primary Comparison Lanes",
    subtitle: "Original vs Suno",
    columns: "md:grid-cols-2",
  },
  {
    key: "stemLanes",
    title: "Stem Separation Lanes",
    subtitle: "Remix + Hybrid Sources",
    columns: "md:grid-cols-3",
  },
  {
    key: "analysisLanes",
    title: "Analysis Lanes",
    subtitle: "Melody · Harmony · Comparison",
    columns: "md:grid-cols-2",
  },
  {
    key: "hybridLanes",
    title: "Hybrid Construction",
    subtitle: "Multi-Song Combination",
    columns: "",
  },
];

export function getTrackMatcherLaneSectionConfigs() {
  return TRACK_MATCHER_LANE_SECTION_CONFIGS;
}