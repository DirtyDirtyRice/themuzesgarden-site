
import type {
  MultiTrackVersionAlignmentAnchor,
  MultiTrackVersionAlignmentCorrection,
  MultiTrackVersionAlignmentEngineState,
  MultiTrackVersionAlignmentGroup,
  MultiTrackVersionAlignmentPlan,
  MultiTrackVersionAlignmentTrack,
} from "./MultiTrackVersionAlignmentEngineTypes";

function makePoint(seconds: number) {
  return {
    seconds,
    label: `${seconds.toFixed(1)}s`,
  };
}

function makeAnchor(
  id: string,
  label: string,
  kind: MultiTrackVersionAlignmentAnchor["kind"],
  trackId: string,
  trackLabel: string,
  referenceSeconds: number,
  candidateSeconds: number,
  confidencePercent: number,
  detail: string,
): MultiTrackVersionAlignmentAnchor {
  const offsetSeconds = Number((candidateSeconds - referenceSeconds).toFixed(2));

  return {
    id,
    label,
    kind,
    trackId,
    trackLabel,
    source: "manual",
    referenceTime: makePoint(referenceSeconds),
    candidateTime: makePoint(candidateSeconds),
    offsetSeconds,
    confidencePercent,
    detail,
  };
}

function makeCorrection(
  id: string,
  label: string,
  kind: MultiTrackVersionAlignmentCorrection["kind"],
  trackId: string,
  trackLabel: string,
  amountLabel: string,
  amountValue: number,
  ready: boolean,
  detail: string,
): MultiTrackVersionAlignmentCorrection {
  return {
    id,
    label,
    kind,
    trackId,
    trackLabel,
    amountLabel,
    amountValue,
    ready,
    detail,
  };
}

function makeTrack(
  index: number,
  originalKey: string,
  originalBpm: number,
  startOffsetSeconds: number,
  driftSeconds: number,
  confidencePercent: number,
): MultiTrackVersionAlignmentTrack {
  const trackId = `suno-version-${String(index).padStart(2, "0")}`;
  const trackLabel = `Track ${String(index).padStart(2, "0")}`;
  const isReference = index === 1;
  const isAligned = Math.abs(startOffsetSeconds) <= 0.15 && Math.abs(driftSeconds) <= 0.15;

  return {
    id: trackId,
    label: trackLabel,
    versionLabel: `Suno Version ${String(index).padStart(2, "0")}`,
    role: isReference ? "reference" : "candidate",
    readiness: confidencePercent >= 85 ? "ready" : "needs-review",
    status: isReference ? "aligned" : isAligned ? "aligned" : confidencePercent >= 80 ? "close" : "drifting",
    originalKey,
    targetKey: "C minor",
    originalBpm,
    targetBpm: 96,
    startOffsetSeconds,
    driftSeconds,
    confidencePercent,
    anchors: [
      makeAnchor(
        `${trackId}-song-start`,
        "Song Start Anchor",
        "song-start",
        trackId,
        trackLabel,
        0,
        startOffsetSeconds,
        confidencePercent,
        "Manual seed anchor for aligning this version to the reference track start.",
      ),
      makeAnchor(
        `${trackId}-hook-entry`,
        "Hook Entry Anchor",
        "hook-entry",
        trackId,
        trackLabel,
        42.1,
        Number((42.1 + startOffsetSeconds + driftSeconds).toFixed(2)),
        Math.max(50, confidencePercent - 4),
        "Hook entry anchor for checking whether the main riff family lands in the same musical window.",
      ),
    ],
    corrections: [
      makeCorrection(
        `${trackId}-start-offset`,
        "Apply Start Offset",
        "start-offset",
        trackId,
        trackLabel,
        `${startOffsetSeconds >= 0 ? "-" : "+"}${Math.abs(startOffsetSeconds).toFixed(2)}s`,
        Number((-startOffsetSeconds).toFixed(2)),
        !isReference,
        "Move the track start so the reference start and candidate start line up.",
      ),
      makeCorrection(
        `${trackId}-bpm-normalize`,
        "Normalize BPM",
        "bpm-normalize",
        trackId,
        trackLabel,
        `${originalBpm} → 96 BPM`,
        96 - originalBpm,
        originalBpm !== 96,
        "Normalize tempo before serious riff-family comparison.",
      ),
      makeCorrection(
        `${trackId}-key-normalize`,
        "Normalize Key",
        "key-normalize",
        trackId,
        trackLabel,
        `${originalKey} → C minor`,
        originalKey === "C minor" ? 0 : 1,
        originalKey !== "C minor",
        "Normalize key before pitch-contour and note-family comparison.",
      ),
    ],
    notes: isReference
      ? "Reference track. Other Suno versions align to this timing and key/BPM target."
      : "Candidate version. Needs offset, BPM, key, and hook-entry alignment before riff matching.",
  };
}

const tracks: MultiTrackVersionAlignmentTrack[] = [
  makeTrack(1, "C minor", 96, 0, 0, 100),
  makeTrack(2, "C minor", 97, 0.28, 0.16, 91),
  makeTrack(3, "D minor", 95, -0.35, 0.42, 78),
  makeTrack(4, "C minor", 96, -0.18, -0.08, 96),
  makeTrack(5, "C minor", 98, 0.51, 0.33, 82),
  makeTrack(6, "C minor", 96, 0.05, 0.1, 94),
  makeTrack(7, "C minor", 94, 0.92, 0.58, 72),
  makeTrack(8, "C minor", 96, -0.12, -0.04, 95),
  makeTrack(9, "B minor", 96, 0.4, 0.22, 80),
  makeTrack(10, "C minor", 96, -0.3, -0.16, 88),
];

export const multiTrackVersionAlignmentGroups: MultiTrackVersionAlignmentGroup[] = [
  {
    id: "alignment-group-10-suno-versions",
    label: "10 Suno Version Alignment Group",
    referenceTrackId: "suno-version-01",
    targetKey: "C minor",
    targetBpm: 96,
    readiness: "needs-review",
    status: "close",
    tracks,
    detail:
      "Seed alignment group for lining up 10 Suno versions before riff-family detection, extraction, and keeper promotion.",
  },
];

export const multiTrackVersionAlignmentPlans: MultiTrackVersionAlignmentPlan[] = [
  {
    id: "alignment-plan-first-pass",
    label: "First Pass Alignment Plan",
    groupId: "alignment-group-10-suno-versions",
    readyTrackCount: tracks.filter((track) => track.readiness === "ready").length,
    reviewTrackCount: tracks.filter((track) => track.readiness === "needs-review").length,
    blockedTrackCount: tracks.filter((track) => track.readiness === "blocked").length,
    averageConfidencePercent: Math.round(
      tracks.reduce((sum, track) => sum + track.confidencePercent, 0) / tracks.length,
    ),
    maxDriftSeconds: Math.max(...tracks.map((track) => Math.abs(track.driftSeconds))),
    nextAction:
      "Normalize BPM/key, apply start offsets, then verify hook-entry anchors before riff color matching.",
  },
];

export const multiTrackVersionAlignmentEngineSeedState: MultiTrackVersionAlignmentEngineState = {
  id: "multi-track-version-alignment-engine",
  title: "Multi Track Version Alignment Engine",
  description:
    "Aligns 10 Suno versions to one reference timing, key, and BPM target so riff families can be compared, color-coded, extracted, and edited.",
  readiness: "needs-review",
  targetKey: "C minor",
  targetBpm: 96,
  microNudgeSeconds: 0.1,
  groups: multiTrackVersionAlignmentGroups,
  plans: multiTrackVersionAlignmentPlans,
  engineNotes: [
    "This engine is the first real step before phrase matching.",
    "It keeps timing, key, BPM, and hook-entry alignment separate from riff similarity.",
    "A riff cannot be judged fairly until the track versions are normalized.",
    "Future audio code should replace these seed anchors with waveform, transient, BPM, and key analysis.",
  ],
};