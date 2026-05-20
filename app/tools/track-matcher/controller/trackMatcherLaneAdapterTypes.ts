"use client";

export type TrackMatcherLaneAdapterStatus =
  | "available"
  | "planned"
  | "blocked";

export type TrackMatcherLaneAdapterKind =
  | "audio-input"
  | "reference-input"
  | "stem-input"
  | "generated-input";

export type TrackMatcherLaneAdapter = {
  laneId: string;
  kind: TrackMatcherLaneAdapterKind;
  status: TrackMatcherLaneAdapterStatus;
  label: string;
  description: string;
};

export function getTrackMatcherLaneAdapterStatusLabel(
  status: TrackMatcherLaneAdapterStatus,
) {
  switch (status) {
    case "available":
      return "Available";
    case "planned":
      return "Planned";
    case "blocked":
      return "Blocked";
    default:
      return "Unknown";
  }
}

export function getTrackMatcherLaneAdapterKindLabel(
  kind: TrackMatcherLaneAdapterKind,
) {
  switch (kind) {
    case "audio-input":
      return "Audio Input";
    case "reference-input":
      return "Reference Input";
    case "stem-input":
      return "Stem Input";
    case "generated-input":
      return "Generated Input";
    default:
      return "Unknown";
  }
}