import type {
  MultiTrackControllerPanelSummary,
  MultiTrackControllerSnapshot,
  MultiTrackControllerTrackSlot,
  MultiTrackControllerView,
} from "./multiTrackControllerTypes";

export const MULTI_TRACK_CONTROLLER_VIEWS: MultiTrackControllerView[] = [
  "overview",
  "tracks",
  "comparison",
  "metadata",
  "timeline",
  "save",
  "ai",
];

export const DEFAULT_MULTI_TRACK_CONTROLLER_TRACK_SLOTS: MultiTrackControllerTrackSlot[] = [
  {
    id: "track-a",
    label: "Track A",
    sourceLabel: "Waiting for Finder, Library, Project, or Upload",
    loadedTitle: "No Track A loaded",
    readiness: "foundation",
  },
  {
    id: "track-b",
    label: "Track B",
    sourceLabel: "Waiting for Finder, Library, Project, or Upload",
    loadedTitle: "No Track B loaded",
    readiness: "foundation",
  },
];

export const DEFAULT_MULTI_TRACK_CONTROLLER_PANEL_SUMMARIES: MultiTrackControllerPanelSummary[] = [
  {
    id: "track-load-routing",
    label: "Track Load Routing",
    view: "tracks",
    status: "foundation",
    detail: "Prepared load routes without touching Track Matcher runtime.",
  },
  {
    id: "track-slot-hierarchy",
    label: "Track Slot Hierarchy",
    view: "tracks",
    status: "foundation",
    detail: "Keeps Track A and Track B source-aware before deeper wiring.",
  },
  {
    id: "comparison-scoring",
    label: "Comparison Scoring",
    view: "comparison",
    status: "foundation",
    detail: "Keeps score and confidence structure visible before detected data.",
  },
  {
    id: "metadata-readiness",
    label: "Metadata Readiness",
    view: "metadata",
    status: "foundation",
    detail: "Prepares Library, Finder, relationship, and graph destinations.",
  },
  {
    id: "timeline-lanes",
    label: "Timeline Lanes",
    view: "timeline",
    status: "foundation",
    detail: "Prepares marker lanes without audio-runtime ownership.",
  },
  {
    id: "save-record-shape",
    label: "Save Record Shape",
    view: "save",
    status: "foundation",
    detail: "Documents what a saved Multi-Track analysis will eventually contain.",
  },
  {
    id: "ai-routing",
    label: "AI Routing",
    view: "ai",
    status: "planned",
    detail: "Keeps future AI helpers separate from the current runtime.",
  },
];

export const DEFAULT_MULTI_TRACK_CONTROLLER_SNAPSHOT: MultiTrackControllerSnapshot = {
  activeView: "overview",
  activeTrackSlot: "track-a",
  trackSlots: DEFAULT_MULTI_TRACK_CONTROLLER_TRACK_SLOTS,
  panelSummaries: DEFAULT_MULTI_TRACK_CONTROLLER_PANEL_SUMMARIES,
};