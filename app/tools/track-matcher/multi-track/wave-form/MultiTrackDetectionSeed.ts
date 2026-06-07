import type { MultiTrackDetectionWorkspace } from "./MultiTrackDetectionTypes";

export const multiTrackDetectionSeed: MultiTrackDetectionWorkspace = {
  title: "Detection Workspace",

  description:
    "Read-only detection planning workspace for future tempo, key, transient, downbeat, section, loop, stem, sync, energy, silence, waveform, DSP, and analysis ownership.",

  readinessLabel:
    "Workspace ready / real detection engine not connected yet",

  lanes: [
    {
      laneId: "track-a",
      title: "Track A Detection Lane",
      sourceLabel: "Track A detection planning",
      readinessLabel: "Detection planning ready / live analysis future",

      tempoDetectionReady: false,
      keyDetectionReady: false,
      transientDetectionReady: false,
      downbeatDetectionReady: false,
      sectionDetectionReady: false,
      loopDetectionReady: false,
      stemDetectionReady: false,
      syncDetectionReady: false,

      detections: [
        {
          detectionId: "track-a-tempo-detection",
          label: "Tempo Detection",
          kind: "tempo",
          owner: "statistics",
          status: "future",
          confidence: "none",
          valueLabel: "-- BPM",
          timeLabel: "Whole track",
          detail:
            "Future tempo detector can estimate BPM from waveform peaks, transient spacing, and downbeat candidates.",
        },
        {
          detectionId: "track-a-key-detection",
          label: "Key Detection",
          kind: "key",
          owner: "analysis",
          status: "future",
          confidence: "none",
          valueLabel: "--",
          timeLabel: "Whole track",
          detail:
            "Future key detector can estimate tonal center, mode, chord gravity, and compare against Track B.",
        },
        {
          detectionId: "track-a-transient-detection",
          label: "Transient Detection",
          kind: "transient",
          owner: "transient",
          status: "future",
          confidence: "none",
          valueLabel: "0 detected",
          timeLabel: "--:--",
          detail:
            "Future transient detector can identify attacks, drum hits, vocal starts, and cue-worthy events.",
        },
        {
          detectionId: "track-a-downbeat-detection",
          label: "Downbeat Detection",
          kind: "downbeat",
          owner: "timeline",
          status: "future",
          confidence: "none",
          valueLabel: "0 candidates",
          timeLabel: "--:--",
          detail:
            "Future downbeat detector can anchor timeline grids and prepare Track A / Track B sync decisions.",
        },
        {
          detectionId: "track-a-section-detection",
          label: "Section Detection",
          kind: "section",
          owner: "cue",
          status: "future",
          confidence: "none",
          valueLabel: "No sections",
          timeLabel: "--:--",
          detail:
            "Future structure detector can identify intro, verse, chorus, bridge, breakdown, drop, and outro regions.",
        },
        {
          detectionId: "track-a-loop-detection",
          label: "Loop Detection",
          kind: "loop",
          owner: "marker",
          status: "future",
          confidence: "none",
          valueLabel: "No loops",
          timeLabel: "--:--",
          detail:
            "Future loop detector can find repeatable regions for comparison, practice, remixing, and hybrid creation.",
        },
        {
          detectionId: "track-a-stem-detection",
          label: "Stem Detection",
          kind: "stem",
          owner: "future",
          status: "future",
          confidence: "none",
          valueLabel: "No stems",
          timeLabel: "Whole track",
          detail:
            "Future stem detector can classify vocal, drums, bass, harmony, melody, instrument, and hybrid material.",
        },
        {
          detectionId: "track-a-sync-detection",
          label: "Sync Detection",
          kind: "sync",
          owner: "timeline",
          status: "future",
          confidence: "none",
          valueLabel: "Not synced",
          timeLabel: "--:--",
          detail:
            "Future sync detector can compare Track A to Track B using downbeats, cues, tempo, and structure.",
        },
      ],
    },

    {
      laneId: "track-b",
      title: "Track B Detection Lane",
      sourceLabel: "Track B detection planning",
      readinessLabel: "Detection planning ready / live analysis future",

      tempoDetectionReady: false,
      keyDetectionReady: false,
      transientDetectionReady: false,
      downbeatDetectionReady: false,
      sectionDetectionReady: false,
      loopDetectionReady: false,
      stemDetectionReady: false,
      syncDetectionReady: false,

      detections: [
        {
          detectionId: "track-b-tempo-detection",
          label: "Tempo Detection",
          kind: "tempo",
          owner: "statistics",
          status: "future",
          confidence: "none",
          valueLabel: "-- BPM",
          timeLabel: "Whole track",
          detail:
            "Future tempo detector can estimate BPM from waveform peaks, transient spacing, and downbeat candidates.",
        },
        {
          detectionId: "track-b-key-detection",
          label: "Key Detection",
          kind: "key",
          owner: "analysis",
          status: "future",
          confidence: "none",
          valueLabel: "--",
          timeLabel: "Whole track",
          detail:
            "Future key detector can estimate tonal center, mode, chord gravity, and compare against Track A.",
        },
        {
          detectionId: "track-b-transient-detection",
          label: "Transient Detection",
          kind: "transient",
          owner: "transient",
          status: "future",
          confidence: "none",
          valueLabel: "0 detected",
          timeLabel: "--:--",
          detail:
            "Future transient detector can identify attacks, drum hits, vocal starts, and cue-worthy events.",
        },
        {
          detectionId: "track-b-downbeat-detection",
          label: "Downbeat Detection",
          kind: "downbeat",
          owner: "timeline",
          status: "future",
          confidence: "none",
          valueLabel: "0 candidates",
          timeLabel: "--:--",
          detail:
            "Future downbeat detector can anchor timeline grids and prepare Track B / Track A sync decisions.",
        },
        {
          detectionId: "track-b-section-detection",
          label: "Section Detection",
          kind: "section",
          owner: "cue",
          status: "future",
          confidence: "none",
          valueLabel: "No sections",
          timeLabel: "--:--",
          detail:
            "Future structure detector can identify intro, verse, chorus, bridge, breakdown, drop, and outro regions.",
        },
        {
          detectionId: "track-b-loop-detection",
          label: "Loop Detection",
          kind: "loop",
          owner: "marker",
          status: "future",
          confidence: "none",
          valueLabel: "No loops",
          timeLabel: "--:--",
          detail:
            "Future loop detector can find repeatable regions for comparison, practice, remixing, and hybrid creation.",
        },
        {
          detectionId: "track-b-stem-detection",
          label: "Stem Detection",
          kind: "stem",
          owner: "future",
          status: "future",
          confidence: "none",
          valueLabel: "No stems",
          timeLabel: "Whole track",
          detail:
            "Future stem detector can classify vocal, drums, bass, harmony, melody, instrument, and hybrid material.",
        },
        {
          detectionId: "track-b-sync-detection",
          label: "Sync Detection",
          kind: "sync",
          owner: "timeline",
          status: "future",
          confidence: "none",
          valueLabel: "Not synced",
          timeLabel: "--:--",
          detail:
            "Future sync detector can compare Track B to Track A using downbeats, cues, tempo, and structure.",
        },
      ],
    },
  ],

  safetyRules: [
    "Detection workspace is read-only.",
    "Detection workspace does not own audio runtime.",
    "Detection workspace does not mutate engine state.",
    "Detection workspace does not create duplicate Track A or Track B state.",
    "Detection workspace does not run DSP.",
    "Detection workspace does not decode audio.",
    "Detection workspace only displays planned ownership and future analysis paths.",
    "Future live detection should attach through a derived adapter, not by replacing this foundation.",
  ],

  futureConnections: [
    "Waveform Workspace",
    "Waveform Statistics",
    "Transient Workspace",
    "Cue Workspace",
    "Marker Workspace",
    "Timeline Workspace",
    "Comparison Matrix",
    "Decision Center",
    "Insight V2",
    "Future DSP Engine",
    "Future Stem Engine",
    "Future Detection Engine",
  ],
};