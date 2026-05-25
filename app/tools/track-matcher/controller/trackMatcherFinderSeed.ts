import type {
  TrackMatcherFinderDestination,
  TrackMatcherFinderSource,
} from "./trackMatcherFinderTypes";

export const TRACK_MATCHER_FINDER_DESTINATIONS: Array<{
  id: TrackMatcherFinderDestination;
  label: string;
  detail: string;
}> = [
  { id: "track-a", label: "Load To Track A", detail: "Primary comparison deck." },
  { id: "track-b", label: "Load To Track B", detail: "Secondary comparison deck." },
  { id: "melody", label: "Load To Melody Lane", detail: "Melody or hook material." },
  { id: "drums", label: "Load To Drum Lane", detail: "Drum stem or rhythm material." },
  { id: "bass", label: "Load To Bass Lane", detail: "Bass stem or low-end material." },
  { id: "vocal", label: "Load To Vocal Lane", detail: "Vocal stem or sung idea." },
  { id: "hybrid", label: "Load To Hybrid Lane", detail: "Blend or candidate mix." },
  { id: "reference-song", label: "Load To Reference Lane", detail: "Reference track." },
  { id: "analysis", label: "Load To Analysis Lane", detail: "Analysis-only item." },
];

export const TRACK_MATCHER_FINDER_SOURCES: Array<{
  id: TrackMatcherFinderSource;
  label: string;
}> = [
  { id: "library", label: "Library" },
  { id: "project", label: "Project" },
  { id: "upload", label: "Upload" },
  { id: "supabase", label: "Supabase" },
  { id: "seed", label: "Seed" },
  { id: "unknown", label: "Unknown" },
];

export const TRACK_MATCHER_FINDER_QUICK_SEARCHES = [
  "rock",
  "funk",
  "keeper",
  "instrumental",
  "stem",
  "bass",
  "drums",
  "vocal",
  "melody",
  "harmony",
  "suno",
  "reference",
  "hybrid",
];