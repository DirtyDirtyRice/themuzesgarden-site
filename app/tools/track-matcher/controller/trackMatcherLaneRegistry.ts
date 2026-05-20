"use client";

export type TrackMatcherLaneRole =
  | "primary"
  | "comparison"
  | "reference"
  | "stem"
  | "generated";

export type TrackMatcherLaneStatus =
  | "ready"
  | "planned"
  | "disabled";

export type TrackMatcherLaneCapability =
  | "audio"
  | "bpm"
  | "key"
  | "melody"
  | "harmony"
  | "stems"
  | "lineage"
  | "generation";

export type TrackMatcherLaneRegistryItem = {
  id: string;
  title: string;
  eyebrow: string;
  role: TrackMatcherLaneRole;
  status: TrackMatcherLaneStatus;
  description: string;
  capabilities: TrackMatcherLaneCapability[];
  futureUse: string;
};

export const TRACK_MATCHER_LANE_REGISTRY: TrackMatcherLaneRegistryItem[] = [
  {
    id: "deck-a",
    title: "Deck A",
    eyebrow: "Primary lane",
    role: "primary",
    status: "ready",
    description:
      "The current first audio lane. This stays compatible with the original Track A workflow while the app moves toward multi-lane analysis.",
    capabilities: ["audio", "bpm", "key", "melody", "harmony"],
    futureUse:
      "Main source lane for song comparison, riff extraction, stem routing, and AI-assisted music intelligence.",
  },
  {
    id: "deck-b",
    title: "Deck B",
    eyebrow: "Comparison lane",
    role: "comparison",
    status: "ready",
    description:
      "The current second audio lane. This keeps the existing Track B workflow stable while the lane system becomes dynamic.",
    capabilities: ["audio", "bpm", "key", "melody", "harmony"],
    futureUse:
      "Comparison lane for transitions, harmonic fit, tempo fit, melody lineage, and multi-song relationship checks.",
  },
  {
    id: "reference-song",
    title: "Reference Song",
    eyebrow: "Reference lane",
    role: "reference",
    status: "planned",
    description:
      "A future lane for comparing an uploaded song against a target reference, influence track, or training example.",
    capabilities: ["audio", "bpm", "key", "melody", "harmony", "lineage"],
    futureUse:
      "Supports Suno riff analysis, style matching, melody inheritance, and song-to-song similarity review.",
  },
  {
    id: "stem-bus",
    title: "Stem Bus",
    eyebrow: "Stem lane",
    role: "stem",
    status: "planned",
    description:
      "A future lane group for vocals, drums, bass, harmony, melody, and texture stems after separation is connected.",
    capabilities: ["audio", "bpm", "key", "melody", "harmony", "stems"],
    futureUse:
      "Supports stem separation workflows, hybrid song construction, and track-layer diagnosis.",
  },
  {
    id: "generated-candidate",
    title: "Generated Candidate",
    eyebrow: "AI output lane",
    role: "generated",
    status: "planned",
    description:
      "A future lane for comparing generated audio against source material, references, prompts, and accepted outputs.",
    capabilities: [
      "audio",
      "bpm",
      "key",
      "melody",
      "harmony",
      "lineage",
      "generation",
    ],
    futureUse:
      "Supports AI music quality control, regeneration decisions, pronunciation review, and melody-to-chord comparison.",
  },
];

export function getTrackMatcherLaneRegistry() {
  return TRACK_MATCHER_LANE_REGISTRY;
}

export function getTrackMatcherReadyLanes() {
  return TRACK_MATCHER_LANE_REGISTRY.filter((lane) => lane.status === "ready");
}

export function getTrackMatcherPlannedLanes() {
  return TRACK_MATCHER_LANE_REGISTRY.filter((lane) => lane.status === "planned");
}

export function getTrackMatcherDisabledLanes() {
  return TRACK_MATCHER_LANE_REGISTRY.filter((lane) => lane.status === "disabled");
}

export function getTrackMatcherLaneById(id: string) {
  return TRACK_MATCHER_LANE_REGISTRY.find((lane) => lane.id === id) ?? null;
}

export function getTrackMatcherLaneCapabilityLabel(
  capability: TrackMatcherLaneCapability,
) {
  switch (capability) {
    case "audio":
      return "Audio";
    case "bpm":
      return "BPM";
    case "key":
      return "Key";
    case "melody":
      return "Melody";
    case "harmony":
      return "Harmony";
    case "stems":
      return "Stems";
    case "lineage":
      return "Lineage";
    case "generation":
      return "Generation";
    default:
      return "Unknown";
  }
}

export function getTrackMatcherLaneStatusLabel(status: TrackMatcherLaneStatus) {
  switch (status) {
    case "ready":
      return "Ready";
    case "planned":
      return "Planned";
    case "disabled":
      return "Disabled";
    default:
      return "Unknown";
  }
}