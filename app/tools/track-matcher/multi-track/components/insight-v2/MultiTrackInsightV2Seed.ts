import type { MultiTrackInsightV2Card } from "./MultiTrackInsightV2Types";

export const MULTI_TRACK_INSIGHT_V2_EMPTY_STATE_CARD: MultiTrackInsightV2Card = {
  id: "insight-v2-empty-tracks",
  category: "track",
  severity: "info",
  title: "Both track lanes are empty",
  detail: "Track A and Track B are waiting for source material.",
  recommendation: "Load both lanes before trusting comparison, sync, or export decisions.",
  actionLabel: "Load tracks",
};

export const MULTI_TRACK_INSIGHT_V2_SAFE_FOUNDATION_CARD: MultiTrackInsightV2Card = {
  id: "insight-v2-safe-foundation",
  category: "workflow",
  severity: "good",
  title: "Insight V2 is display-only",
  detail: "This system reads the recovered engine state without owning duplicate state.",
  recommendation: "Keep Insight V2 as an observer until the workstation foundation stays green.",
  actionLabel: "Preserve green",
};