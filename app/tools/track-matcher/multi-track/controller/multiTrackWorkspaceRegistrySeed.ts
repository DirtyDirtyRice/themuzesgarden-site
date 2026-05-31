import type {
  MultiTrackWorkspaceRegistryItem,
} from "./multiTrackWorkspaceRegistryTypes";

export const MULTI_TRACK_WORKSPACE_REGISTRY: MultiTrackWorkspaceRegistryItem[] =
  [
    {
      id: "track-load-routing",
      label: "Track Load Routing",
      view: "tracks",
      status: "foundation",
      detail: "Finder, Library, Upload, Project routing.",
    },
    {
      id: "track-slot-hierarchy",
      label: "Track Slot Hierarchy",
      view: "tracks",
      status: "foundation",
      detail: "Track A and Track B ownership.",
    },
    {
      id: "comparison-scoring",
      label: "Comparison Scoring",
      view: "comparison",
      status: "foundation",
      detail: "Scoring and confidence system.",
    },
    {
      id: "metadata-readiness",
      label: "Metadata Readiness",
      view: "metadata",
      status: "foundation",
      detail: "Metadata graph preparation.",
    },
    {
      id: "timeline-lanes",
      label: "Timeline Lanes",
      view: "timeline",
      status: "foundation",
      detail: "Markers, lanes, stems, routing.",
    },
    {
      id: "save-record-shape",
      label: "Save Record Shape",
      view: "save",
      status: "foundation",
      detail: "Saved analysis records.",
    },
    {
      id: "ai-routing",
      label: "AI Routing",
      view: "ai",
      status: "planned",
      detail: "Future AI integration.",
    },
  ];