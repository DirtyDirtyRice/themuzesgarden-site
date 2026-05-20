"use client";

export type TrackMatcherDynamicLaneRenderMode =
  | "standard"
  | "compact"
  | "focus"
  | "hidden";

export type TrackMatcherDynamicLaneCategory =
  | "comparison"
  | "analysis"
  | "generation"
  | "stem"
  | "reference";

export type TrackMatcherDynamicLaneHealth =
  | "healthy"
  | "warning"
  | "offline";

export type TrackMatcherDynamicLaneDefinition = {
  id: string;
  title: string;
  category: TrackMatcherDynamicLaneCategory;
  renderMode: TrackMatcherDynamicLaneRenderMode;
  health: TrackMatcherDynamicLaneHealth;
  order: number;
  visible: boolean;
  supportsPlayback: boolean;
  supportsAnalysis: boolean;
  supportsGeneration: boolean;
  description: string;
  futureUse: string;
};

export function getTrackMatcherDynamicLaneCategoryLabel(
  category: TrackMatcherDynamicLaneCategory,
) {
  switch (category) {
    case "comparison":
      return "Comparison";
    case "analysis":
      return "Analysis";
    case "generation":
      return "Generation";
    case "stem":
      return "Stem";
    case "reference":
      return "Reference";
    default:
      return "Unknown";
  }
}

export function getTrackMatcherDynamicLaneRenderModeLabel(
  mode: TrackMatcherDynamicLaneRenderMode,
) {
  switch (mode) {
    case "standard":
      return "Standard";
    case "compact":
      return "Compact";
    case "focus":
      return "Focus";
    case "hidden":
      return "Hidden";
    default:
      return "Unknown";
  }
}

export function getTrackMatcherDynamicLaneHealthLabel(
  health: TrackMatcherDynamicLaneHealth,
) {
  switch (health) {
    case "healthy":
      return "Healthy";
    case "warning":
      return "Warning";
    case "offline":
      return "Offline";
    default:
      return "Unknown";
  }
}