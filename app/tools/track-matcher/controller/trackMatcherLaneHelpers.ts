import type {
  TrackMatcherDeckId,
  TrackMatcherLaneId,
  TrackMatcherLaneMetadata,
  TrackMatcherLaneRelationship,
  TrackMatcherLaneRelationshipKind,
  TrackMatcherLaneRole,
  TrackMatcherLaneSourceKind,
} from "./trackMatcherControllerTypes";

export const TRACK_MATCHER_LANE_ROLE_LABELS: Record<
  TrackMatcherLaneRole,
  string
> = {
  "original-idea": "Original Idea",
  "suno-result": "Suno Result",
  "reference-song": "Reference Song",
  vocal: "Vocal",
  melody: "Melody",
  harmony: "Harmony",
  drums: "Drums",
  bass: "Bass",
  instrument: "Instrument",
  stem: "Stem",
  hybrid: "Hybrid",
  analysis: "Analysis",
};

export const TRACK_MATCHER_LANE_SOURCE_LABELS: Record<
  TrackMatcherLaneSourceKind,
  string
> = {
  "user-recording": "User Recording",
  "suno-render": "Suno Render",
  "uploaded-song": "Uploaded Song",
  "separated-stem": "Separated Stem",
  "generated-hybrid": "Generated Hybrid",
  "analysis-output": "Analysis Output",
};

export const TRACK_MATCHER_LANE_RELATIONSHIP_LABELS: Record<
  TrackMatcherLaneRelationshipKind,
  string
> = {
  "original-to-suno": "Original to Suno",
  "stem-from-song": "Stem from Song",
  "riff-match": "Riff Match",
  "melody-to-chord": "Melody to Chord",
  "tempo-match": "Tempo Match",
  "key-match": "Key Match",
  "hybrid-source": "Hybrid Source",
};

export function getTrackMatcherLaneRoleLabel(role: TrackMatcherLaneRole) {
  return TRACK_MATCHER_LANE_ROLE_LABELS[role];
}

export function getTrackMatcherLaneSourceLabel(
  sourceKind: TrackMatcherLaneSourceKind,
) {
  return TRACK_MATCHER_LANE_SOURCE_LABELS[sourceKind];
}

export function getTrackMatcherLaneRelationshipLabel(
  kind: TrackMatcherLaneRelationshipKind,
) {
  return TRACK_MATCHER_LANE_RELATIONSHIP_LABELS[kind];
}

export function getTrackMatcherLaneToneClasses(role: TrackMatcherLaneRole) {
  if (role === "original-idea") {
    return "border-sky-300/30 bg-sky-300/10 text-sky-100";
  }

  if (role === "suno-result") {
    return "border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-100";
  }

  if (role === "hybrid") {
    return "border-emerald-300/30 bg-emerald-300/10 text-emerald-100";
  }

  if (role === "drums") {
    return "border-orange-300/30 bg-orange-300/10 text-orange-100";
  }

  if (role === "bass") {
    return "border-violet-300/30 bg-violet-300/10 text-violet-100";
  }

  if (role === "vocal") {
    return "border-rose-300/30 bg-rose-300/10 text-rose-100";
  }

  if (role === "melody" || role === "harmony") {
    return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  }

  return "border-white/10 bg-white/[0.03] text-white/70";
}

export function isTrackMatcherStemLane(role: TrackMatcherLaneRole) {
  return role === "stem" || role === "vocal" || role === "drums" || role === "bass";
}

export function isTrackMatcherAnalysisLane(role: TrackMatcherLaneRole) {
  return (
    role === "analysis" ||
    role === "melody" ||
    role === "harmony" ||
    role === "reference-song"
  );
}

export function isTrackMatcherHybridLane(role: TrackMatcherLaneRole) {
  return role === "hybrid";
}

export function canTrackMatcherLaneBeHybridSource(
  lane: TrackMatcherLaneMetadata,
) {
  return lane.isStemLane || lane.role === "original-idea" || lane.role === "suno-result";
}

export function canTrackMatcherLaneBePrimaryComparison(
  lane: TrackMatcherLaneMetadata,
) {
  return lane.role === "original-idea" || lane.role === "suno-result";
}

export function formatTrackMatcherConfidence(confidence: number) {
  if (!Number.isFinite(confidence)) return "0%";

  const safeConfidence = Math.max(0, Math.min(1, confidence));

  return `${Math.round(safeConfidence * 100)}%`;
}

export function createTrackMatcherLaneId(parts: {
  role: TrackMatcherLaneRole;
  deckId?: TrackMatcherDeckId;
  index?: number;
}) {
  const deckPart = parts.deckId ? `-${parts.deckId.toLowerCase()}` : "";
  const indexPart = typeof parts.index === "number" ? `-${parts.index}` : "";

  return `${parts.role}${deckPart}${indexPart}`;
}

export function createTrackMatcherLaneMetadata({
  deckId,
  index,
  parentLaneId,
  relationshipKind,
  role,
  sourceKind,
  sourceTrackName,
  title,
}: {
  deckId?: TrackMatcherDeckId;
  index?: number;
  parentLaneId?: TrackMatcherLaneId;
  relationshipKind?: TrackMatcherLaneRelationshipKind;
  role: TrackMatcherLaneRole;
  sourceKind: TrackMatcherLaneSourceKind;
  sourceTrackName: string;
  title?: string;
}): TrackMatcherLaneMetadata {
  const laneId = createTrackMatcherLaneId({
    deckId,
    index,
    role,
  });
  const isStemLane = isTrackMatcherStemLane(role);
  const isHybridCandidate =
    role === "hybrid" ||
    role === "original-idea" ||
    role === "suno-result" ||
    isStemLane;

  return {
    laneId,
    deckId,
    title: title || getTrackMatcherLaneRoleLabel(role),
    role,
    sourceKind,
    sourceTrackName,
    parentLaneId,
    relationshipKind,
    isPrimaryComparisonLane:
      role === "original-idea" || role === "suno-result",
    isStemLane,
    isHybridCandidate,
  };
}

export function createTrackMatcherLaneRelationship({
  confidence,
  fromLaneId,
  kind,
  label,
  toLaneId,
}: {
  confidence?: number;
  fromLaneId: TrackMatcherLaneId;
  kind: TrackMatcherLaneRelationshipKind;
  label?: string;
  toLaneId: TrackMatcherLaneId;
}): TrackMatcherLaneRelationship {
  const safeConfidence = Number.isFinite(confidence)
    ? Math.max(0, Math.min(1, Number(confidence)))
    : 0;

  return {
    fromLaneId,
    toLaneId,
    kind,
    label: label || getTrackMatcherLaneRelationshipLabel(kind),
    confidence: safeConfidence,
  };
}

export function getTrackMatcherLaneSummary(lane: TrackMatcherLaneMetadata) {
  const roleLabel = getTrackMatcherLaneRoleLabel(lane.role);
  const sourceLabel = getTrackMatcherLaneSourceLabel(lane.sourceKind);

  if (lane.deckId) {
    return `${roleLabel} · Deck ${lane.deckId} · ${sourceLabel}`;
  }

  return `${roleLabel} · ${sourceLabel}`;
}

export function getTrackMatcherRelationshipSummary(
  relationship: TrackMatcherLaneRelationship,
) {
  return `${relationship.label} · ${formatTrackMatcherConfidence(
    relationship.confidence,
  )}`;
}