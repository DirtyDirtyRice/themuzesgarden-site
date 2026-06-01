import type { MultiTrackEngineSyncState } from "./multiTrackEngineSyncTypes";

export const DEFAULT_MULTI_TRACK_ENGINE_SYNC_STATE: MultiTrackEngineSyncState = {
  readiness: "draft",
  status: "waiting",
  summary: "Sync intelligence is waiting for Track A and Track B timing data.",
  bestCandidateLabel: "No sync candidate yet",
  averageConfidence: 0,
  suggestedOffsetSeconds: 0,
  anchors: [
    {
      id: "sync-anchor-track-a-start",
      kind: "start",
      label: "Track A start",
      trackSlotId: "track-a",
      seconds: 0,
      confidence: 0.2,
      confidenceLevel: "low",
      locked: true,
      note: "Placeholder start anchor for Track A.",
    },
    {
      id: "sync-anchor-track-b-start",
      kind: "start",
      label: "Track B start",
      trackSlotId: "track-b",
      seconds: 0,
      confidence: 0.2,
      confidenceLevel: "low",
      locked: true,
      note: "Placeholder start anchor for Track B.",
    },
  ],
  candidates: [
    {
      id: "sync-candidate-start-to-start",
      label: "Start to start",
      trackASeconds: 0,
      trackBSeconds: 0,
      offsetSeconds: 0,
      confidence: 0.2,
      confidenceLevel: "low",
      detail: "Initial placeholder candidate aligns both tracks at zero seconds.",
      ready: false,
    },
  ],
  transitionSuggestions: [
    {
      id: "sync-transition-placeholder",
      label: "Future transition suggestion",
      fromTrackSlotId: "track-a",
      toTrackSlotId: "track-b",
      startSeconds: 0,
      endSeconds: 8,
      confidence: 0.1,
      detail: "Future sync analysis can suggest handoffs, overlaps, and transition windows here.",
    },
  ],
};