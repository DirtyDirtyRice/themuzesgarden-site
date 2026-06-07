import type { MultiTrackStemOwnershipWorkspace } from "./MultiTrackStemOwnershipTypes";

export const multiTrackStemOwnershipSeed: MultiTrackStemOwnershipWorkspace = {
  title: "Stem Ownership Workspace",

  description:
    "Read-only stem ownership planning workspace for vocal, drums, bass, guitar, keys, melody, harmony, instrument, hybrid, reference, waveform, detection, comparison, timeline, and future DSP ownership.",

  readinessLabel:
    "Workspace ready / real stem detection and separation not connected yet",

  lanes: [
    {
      laneId: "track-a",
      title: "Track A Stem Ownership Lane",
      sourceLabel: "Track A source stem planning",
      stemDetectionReady: false,
      stemRoutingReady: false,
      stemComparisonReady: false,
      stemDspReady: false,
      stems: [
        {
          stemId: "track-a-vocal-stem",
          label: "Vocal Stem",
          kind: "vocal",
          owner: "future",
          status: "future",
          readinessLabel: "Future",
          routingLabel: "No route yet",
          detail:
            "Future vocal stem ownership can support lyric comparison, melody tracing, phrasing, and vocal onset analysis.",
        },
        {
          stemId: "track-a-drums-stem",
          label: "Drums Stem",
          kind: "drums",
          owner: "detection",
          status: "future",
          readinessLabel: "Future",
          routingLabel: "No route yet",
          detail:
            "Future drums stem ownership can support transient detection, downbeat mapping, groove comparison, and sync decisions.",
        },
        {
          stemId: "track-a-bass-stem",
          label: "Bass Stem",
          kind: "bass",
          owner: "analysis",
          status: "future",
          readinessLabel: "Future",
          routingLabel: "No route yet",
          detail:
            "Future bass stem ownership can support root movement, groove lock, harmonic gravity, and low-end comparison.",
        },
        {
          stemId: "track-a-harmony-stem",
          label: "Harmony Stem",
          kind: "harmony",
          owner: "analysis",
          status: "future",
          readinessLabel: "Future",
          routingLabel: "No route yet",
          detail:
            "Future harmony stem ownership can support chord movement, key confidence, arrangement comparison, and progression mapping.",
        },
        {
          stemId: "track-a-melody-stem",
          label: "Melody Stem",
          kind: "melody",
          owner: "comparison",
          status: "future",
          readinessLabel: "Future",
          routingLabel: "No route yet",
          detail:
            "Future melody stem ownership can compare original melody ideas against generated or arranged material.",
        },
        {
          stemId: "track-a-hybrid-stem",
          label: "Hybrid Stem",
          kind: "hybrid",
          owner: "timeline",
          status: "future",
          readinessLabel: "Future",
          routingLabel: "No route yet",
          detail:
            "Future hybrid ownership can support combining useful pieces from multiple songs into one compatible workstation plan.",
        },
      ],
    },
    {
      laneId: "track-b",
      title: "Track B Stem Ownership Lane",
      sourceLabel: "Track B source stem planning",
      stemDetectionReady: false,
      stemRoutingReady: false,
      stemComparisonReady: false,
      stemDspReady: false,
      stems: [
        {
          stemId: "track-b-vocal-stem",
          label: "Vocal Stem",
          kind: "vocal",
          owner: "future",
          status: "future",
          readinessLabel: "Future",
          routingLabel: "No route yet",
          detail:
            "Future vocal stem ownership can support lyric comparison, melody tracing, phrasing, and vocal onset analysis.",
        },
        {
          stemId: "track-b-drums-stem",
          label: "Drums Stem",
          kind: "drums",
          owner: "detection",
          status: "future",
          readinessLabel: "Future",
          routingLabel: "No route yet",
          detail:
            "Future drums stem ownership can support transient detection, downbeat mapping, groove comparison, and sync decisions.",
        },
        {
          stemId: "track-b-bass-stem",
          label: "Bass Stem",
          kind: "bass",
          owner: "analysis",
          status: "future",
          readinessLabel: "Future",
          routingLabel: "No route yet",
          detail:
            "Future bass stem ownership can support root movement, groove lock, harmonic gravity, and low-end comparison.",
        },
        {
          stemId: "track-b-harmony-stem",
          label: "Harmony Stem",
          kind: "harmony",
          owner: "analysis",
          status: "future",
          readinessLabel: "Future",
          routingLabel: "No route yet",
          detail:
            "Future harmony stem ownership can support chord movement, key confidence, arrangement comparison, and progression mapping.",
        },
        {
          stemId: "track-b-melody-stem",
          label: "Melody Stem",
          kind: "melody",
          owner: "comparison",
          status: "future",
          readinessLabel: "Future",
          routingLabel: "No route yet",
          detail:
            "Future melody stem ownership can compare original melody ideas against generated or arranged material.",
        },
        {
          stemId: "track-b-reference-stem",
          label: "Reference Stem",
          kind: "reference",
          owner: "timeline",
          status: "future",
          readinessLabel: "Future",
          routingLabel: "No route yet",
          detail:
            "Future reference ownership can support matching a generated track against a user’s original guide recording.",
        },
      ],
    },
  ],

  ownershipRules: [
    "Stem ownership workspace is read-only.",
    "Stem ownership does not separate audio yet.",
    "Stem ownership does not run DSP.",
    "Stem ownership does not mutate engine state.",
    "Stem ownership does not create duplicate Track A or Track B state.",
    "Future stems should route through derived adapters.",
    "Stem comparison should stay separate from source loading.",
    "Stem DSP should stay separate from visual waveform ownership.",
    "Future hybrid creation should require confidence and user confirmation.",
  ],

  futureConnections: [
    "Source Workspace",
    "Waveform Workspace",
    "Waveform Statistics",
    "Detection Workspace",
    "Transient Workspace",
    "Cue Workspace",
    "Marker Workspace",
    "Timeline Workspace",
    "Comparison Matrix",
    "Decision Center",
    "Future Stem Engine",
    "Future DSP Engine",
  ],
};