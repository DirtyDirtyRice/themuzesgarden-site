import type { MetadataLink } from "./metadataTypes";

const now = new Date().toISOString();

export const METADATA_LINKS: MetadataLink[] = [
  // =========================
  // CORE THEORY LINKS
  // =========================
  {
    id: "link-harmony-contained-by-music-theory",
    sourceId: "tag-music-theory",
    targetId: "tag-harmony",
    relationship: "contains",
    createdAt: now,
  },

  {
    id: "link-instruments-contained-by-root",
    sourceId: "tag-instruments",
    targetId: "instrument-piano-reference",
    relationship: "contains",
    createdAt: now,
  },

  {
    id: "link-harmony-example-cmaj7",
    sourceId: "chord-cmaj7-reference",
    targetId: "tag-harmony",
    relationship: "example",
    createdAt: now,
  },

  {
    id: "link-piano-example-instruments",
    sourceId: "instrument-piano-reference",
    targetId: "tag-instruments",
    relationship: "example",
    createdAt: now,
  },

  {
    id: "link-cmaj7-uses-piano",
    sourceId: "chord-cmaj7-reference",
    targetId: "instrument-piano-reference",
    relationship: "uses",
    createdAt: now,
  },

  {
    id: "link-piano-references-harmony",
    sourceId: "instrument-piano-analysis",
    targetId: "tag-harmony",
    relationship: "references",
    createdAt: now,
  },

  {
    id: "link-cmaj7-references-music-theory",
    sourceId: "chord-cmaj7-analysis",
    targetId: "tag-music-theory",
    relationship: "references",
    createdAt: now,
  },

  // =========================
  // ROCKER KEEPER LINKS
  // =========================
  {
    id: "link-track-related-harmony",
    sourceId: "track-rocker-keeper-analysis",
    targetId: "tag-harmony",
    relationship: "related",
    createdAt: now,
  },

  {
    id: "link-track-related-piano",
    sourceId: "track-rocker-keeper-analysis",
    targetId: "instrument-piano-reference",
    relationship: "related",
    createdAt: now,
  },

  {
    id: "link-track-structure-derived-analysis",
    sourceId: "track-rocker-keeper-structure",
    targetId: "track-rocker-keeper-analysis",
    relationship: "derived-from",
    createdAt: now,
  },

  // =========================
  // BREAK DA HOLD LINKS (NEW 🔥)
  // =========================
  {
    id: "link-break-da-hold-related-harmony",
    sourceId: "track-break-da-hold-analysis",
    targetId: "tag-harmony",
    relationship: "related",
    createdAt: now,
  },

  {
    id: "link-break-da-hold-related-piano",
    sourceId: "track-break-da-hold-analysis",
    targetId: "instrument-piano-reference",
    relationship: "related",
    createdAt: now,
  },

  {
    id: "link-break-da-hold-structure-derived-analysis",
    sourceId: "track-break-da-hold-structure",
    targetId: "track-break-da-hold-analysis",
    relationship: "derived-from",
    createdAt: now,
  },
];