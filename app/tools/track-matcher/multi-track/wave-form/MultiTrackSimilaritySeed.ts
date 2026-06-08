import type {
  MultiTrackSimilarityCandidate,
  MultiTrackSimilarityFeatureScore,
  MultiTrackSimilarityScanPlan,
  MultiTrackSimilarityWorkspaceState,
} from "./MultiTrackSimilarityTypes";

function makeFeatureScore(
  id: string,
  label: string,
  feature: MultiTrackSimilarityFeatureScore["feature"],
  scorePercent: number,
  weight: number,
  detail: string,
): MultiTrackSimilarityFeatureScore {
  return {
    id,
    label,
    feature,
    scorePercent,
    weight,
    detail,
  };
}

function makeCandidate(
  id: string,
  riffGroupId: string,
  riffGroupLabel: string,
  color: "blue" | "purple",
  sourceInstanceId: string,
  candidateInstanceId: string,
  sourceTrackLabel: string,
  candidateTrackLabel: string,
  sourceStartSeconds: number,
  candidateStartSeconds: number,
  noteMatchPercent: number,
  rhythmMatchPercent: number,
  contourMatchPercent: number,
  energyMatchPercent: number,
  detail: string,
): MultiTrackSimilarityCandidate {
  const timingDriftSeconds = Number((candidateStartSeconds - sourceStartSeconds).toFixed(2));
  const totalSimilarityPercent = Math.round(
    noteMatchPercent * 0.32 +
      rhythmMatchPercent * 0.28 +
      contourMatchPercent * 0.3 +
      energyMatchPercent * 0.1,
  );

  const confidencePercent = Math.round(
    totalSimilarityPercent - Math.min(Math.abs(timingDriftSeconds) * 4, 12),
  );

  return {
    id,
    label: `${sourceTrackLabel} → ${candidateTrackLabel}`,
    comparisonKind: "riff-to-riff",
    source: "manual",
    status:
      totalSimilarityPercent >= 93
        ? "match"
        : totalSimilarityPercent >= 90
          ? "strong"
          : totalSimilarityPercent >= 85
            ? "review"
            : "weak",
    decision:
      totalSimilarityPercent >= 90
        ? "same-family"
        : totalSimilarityPercent >= 85
          ? "needs-listening"
          : "different-family",
    riffGroupId,
    riffGroupLabel,
    color,
    sourceInstanceId,
    candidateInstanceId,
    sourceTrackLabel,
    candidateTrackLabel,
    sourceStartSeconds,
    candidateStartSeconds,
    timingDriftSeconds,
    noteMatchPercent,
    rhythmMatchPercent,
    contourMatchPercent,
    energyMatchPercent,
    totalSimilarityPercent,
    confidencePercent,
    featureScores: [
      makeFeatureScore(
        `${id}-notes`,
        "Note Set",
        "note-set",
        noteMatchPercent,
        0.32,
        "How many important pitch targets appear to belong to the same riff idea.",
      ),
      makeFeatureScore(
        `${id}-rhythm`,
        "Rhythm Shape",
        "rhythm-shape",
        rhythmMatchPercent,
        0.28,
        "How closely the phrase timing and pulse shape match.",
      ),
      makeFeatureScore(
        `${id}-contour`,
        "Melodic Contour",
        "melodic-contour",
        contourMatchPercent,
        0.3,
        "Whether the riff rises, falls, and turns in the same remembered shape.",
      ),
      makeFeatureScore(
        `${id}-energy`,
        "Energy Shape",
        "energy-shape",
        energyMatchPercent,
        0.1,
        "How similar the phrase intensity and performance push feel.",
      ),
    ],
    matchReasons: [
      "same-hook-memory",
      "same-melodic-shape",
      "same-rhythm-shape",
      "manual-family",
    ],
    risks:
      totalSimilarityPercent >= 90
        ? ["timing-drift", "needs-listening"]
        : ["note-difference", "timing-drift", "needs-listening"],
    detail,
  };
}

export const MULTI_TRACK_SIMILARITY_SCAN_PLANS: MultiTrackSimilarityScanPlan[] = [
  {
    id: "scan-blue-hook-family",
    label: "Scan Blue Hook Family",
    status: "manual",
    source: "manual",
    targetTrackCount: 10,
    scannedTrackCount: 4,
    candidateCount: 4,
    acceptedCount: 3,
    reviewCount: 1,
    rejectedCount: 0,
    detail:
      "Manual seed scan for the main hook family. Later this becomes waveform, transient, pitch contour, rhythm, and AI-assisted detection.",
  },
  {
    id: "scan-purple-response-family",
    label: "Scan Purple Response Family",
    status: "manual",
    source: "manual",
    targetTrackCount: 10,
    scannedTrackCount: 3,
    candidateCount: 3,
    acceptedCount: 2,
    reviewCount: 1,
    rejectedCount: 0,
    detail:
      "Manual seed scan for the answer phrase family after the main hook.",
  },
  {
    id: "scan-future-auto-riff-discovery",
    label: "Future Auto Riff Discovery",
    status: "future",
    source: "future-ai",
    targetTrackCount: 10,
    scannedTrackCount: 0,
    candidateCount: 0,
    acceptedCount: 0,
    reviewCount: 0,
    rejectedCount: 0,
    detail:
      "Future scan will search all tracks for same-family riffs without manual marker placement.",
  },
];

export const MULTI_TRACK_SIMILARITY_CANDIDATES: MultiTrackSimilarityCandidate[] = [
  makeCandidate(
    "similarity-blue-01-to-02",
    "riff-group-blue-hook",
    "Blue Hook Riff Family",
    "blue",
    "blue-hook-track-01",
    "blue-hook-track-02",
    "Track 01",
    "Track 02",
    42.1,
    42.4,
    90,
    88,
    93,
    89,
    "Same hook memory, slightly late, rhythm bends near the end.",
  ),
  makeCandidate(
    "similarity-blue-01-to-04",
    "riff-group-blue-hook",
    "Blue Hook Riff Family",
    "blue",
    "blue-hook-track-01",
    "blue-hook-track-04",
    "Track 01",
    "Track 04",
    42.1,
    41.9,
    94,
    93,
    96,
    92,
    "Strongest blue hook match. This is the clean keeper candidate.",
  ),
  makeCandidate(
    "similarity-blue-01-to-07",
    "riff-group-blue-hook",
    "Blue Hook Riff Family",
    "blue",
    "blue-hook-track-01",
    "blue-hook-track-07",
    "Track 01",
    "Track 07",
    42.1,
    43,
    86,
    90,
    89,
    85,
    "Borderline blue hook. Same memory, but note difference and timing drift need listening.",
  ),
  makeCandidate(
    "similarity-purple-03-to-05",
    "riff-group-purple-response",
    "Purple Response Riff Family",
    "purple",
    "purple-response-track-03",
    "purple-response-track-05",
    "Track 03",
    "Track 05",
    58.2,
    58.7,
    84,
    90,
    88,
    86,
    "Close rhythm, weaker note match, should stay review until listened to.",
  ),
  makeCandidate(
    "similarity-purple-03-to-10",
    "riff-group-purple-response",
    "Purple Response Riff Family",
    "purple",
    "purple-response-track-03",
    "purple-response-track-10",
    "Track 03",
    "Track 10",
    58.2,
    57.9,
    90,
    91,
    92,
    89,
    "Clean response phrase match and useful extraction candidate.",
  ),
];

export const DEFAULT_MULTI_TRACK_SIMILARITY_WORKSPACE_STATE: MultiTrackSimilarityWorkspaceState = {
  id: "multi-track-similarity-workspace",
  label: "Multi Track Similarity Engine",
  summary:
    "Similarity foundation for deciding whether riffs from different Suno versions belong to the same color-coded musical idea.",
  targetKey: "C minor",
  targetBpm: 96,
  thresholds: {
    monsterMatchPercent: 95,
    sameFamilyPercent: 90,
    reviewPercent: 85,
    weakPercent: 70,
    maxTimingDriftSeconds: 1,
    maxPitchDriftSemitones: 1,
    minimumNoteMatchPercent: 85,
    minimumRhythmMatchPercent: 85,
  },
  scanPlans: MULTI_TRACK_SIMILARITY_SCAN_PLANS,
  candidates: MULTI_TRACK_SIMILARITY_CANDIDATES,
};