"use client";

export type TrackMatcherLaneRelationshipGroupId =
  | "active-comparison"
  | "future-analysis"
  | "future-generation";

export type TrackMatcherLaneRelationshipGroup = {
  id: TrackMatcherLaneRelationshipGroupId;
  title: string;
  description: string;
  relationshipIds: string[];
};

export const TRACK_MATCHER_LANE_RELATIONSHIP_GROUPS: TrackMatcherLaneRelationshipGroup[] = [
  {
    id: "active-comparison",
    title: "Active Comparison",
    description: "Relationships that describe the current two-lane comparison workflow.",
    relationshipIds: ["original-to-suno", "tempo-fit", "key-fit"],
  },
  {
    id: "future-analysis",
    title: "Future Analysis",
    description: "Relationships reserved for melody, harmony, stems, and lineage analysis.",
    relationshipIds: ["melody-lineage", "stem-source", "reference-match"],
  },
  {
    id: "future-generation",
    title: "Future Generation",
    description: "Relationships reserved for generated candidates and regeneration review.",
    relationshipIds: ["prompt-to-output", "candidate-to-reference", "accepted-output"],
  },
];

export function getTrackMatcherLaneRelationshipGroups() {
  return TRACK_MATCHER_LANE_RELATIONSHIP_GROUPS;
}

export function getTrackMatcherLaneRelationshipGroupById(
  id: TrackMatcherLaneRelationshipGroupId,
) {
  return TRACK_MATCHER_LANE_RELATIONSHIP_GROUPS.find((group) => group.id === id) ?? null;
}

export function getTrackMatcherLaneRelationshipGroupTitles() {
  return TRACK_MATCHER_LANE_RELATIONSHIP_GROUPS.map((group) => group.title);
}