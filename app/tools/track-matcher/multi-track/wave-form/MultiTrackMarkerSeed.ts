import type { MultiTrackMarkerWorkspace } from "./MultiTrackMarkerTypes";

export const multiTrackMarkerSeed: MultiTrackMarkerWorkspace = {
  title: "Marker Workspace",

  description:
    "Read-only marker planning workspace for waveform markers, cue markers, timeline markers, transient markers, loop markers, and future analysis-owned marker generation.",

  readinessLabel:
    "Workspace ready / real marker generation not connected yet",

  lanes: [
    {
      laneId: "track-a",
      title: "Track A Marker Lane",
      sourceLabel: "Track A source marker planning",
      markerCountLabel: "0 live markers",
      activeMarkerLabel: "No active marker selected",
      markerGenerationReady: false,
      timelineOwnershipReady: false,
      cueOwnershipReady: false,
      transientOwnershipReady: false,
      markers: [
        {
          markerId: "track-a-intro-marker",
          label: "Intro Marker",
          kind: "intro",
          status: "future",
          confidence: "none",
          timeLabel: "--:--",
          timeSeconds: 0,
          owner: "cue",
          detail:
            "Future cue system can place an intro marker once structure detection exists.",
        },
        {
          markerId: "track-a-verse-marker",
          label: "Verse Marker",
          kind: "verse",
          status: "future",
          confidence: "none",
          timeLabel: "--:--",
          timeSeconds: 0,
          owner: "timeline",
          detail:
            "Future timeline analysis can place verse entry markers without changing engine state.",
        },
        {
          markerId: "track-a-chorus-marker",
          label: "Chorus Marker",
          kind: "chorus",
          status: "future",
          confidence: "none",
          timeLabel: "--:--",
          timeSeconds: 0,
          owner: "analysis",
          detail:
            "Future structure analysis can mark chorus arrival points and compare them against Track B.",
        },
        {
          markerId: "track-a-loop-marker",
          label: "Loop Marker",
          kind: "loop",
          status: "future",
          confidence: "none",
          timeLabel: "--:--",
          timeSeconds: 0,
          owner: "waveform",
          detail:
            "Future waveform ownership can show loop-ready regions inside the waveform lane.",
        },
      ],
    },

    {
      laneId: "track-b",
      title: "Track B Marker Lane",
      sourceLabel: "Track B source marker planning",
      markerCountLabel: "0 live markers",
      activeMarkerLabel: "No active marker selected",
      markerGenerationReady: false,
      timelineOwnershipReady: false,
      cueOwnershipReady: false,
      transientOwnershipReady: false,
      markers: [
        {
          markerId: "track-b-intro-marker",
          label: "Intro Marker",
          kind: "intro",
          status: "future",
          confidence: "none",
          timeLabel: "--:--",
          timeSeconds: 0,
          owner: "cue",
          detail:
            "Future cue system can place an intro marker once structure detection exists.",
        },
        {
          markerId: "track-b-verse-marker",
          label: "Verse Marker",
          kind: "verse",
          status: "future",
          confidence: "none",
          timeLabel: "--:--",
          timeSeconds: 0,
          owner: "timeline",
          detail:
            "Future timeline analysis can place verse entry markers without changing engine state.",
        },
        {
          markerId: "track-b-chorus-marker",
          label: "Chorus Marker",
          kind: "chorus",
          status: "future",
          confidence: "none",
          timeLabel: "--:--",
          timeSeconds: 0,
          owner: "analysis",
          detail:
            "Future structure analysis can mark chorus arrival points and compare them against Track A.",
        },
        {
          markerId: "track-b-loop-marker",
          label: "Loop Marker",
          kind: "loop",
          status: "future",
          confidence: "none",
          timeLabel: "--:--",
          timeSeconds: 0,
          owner: "waveform",
          detail:
            "Future waveform ownership can show loop-ready regions inside the waveform lane.",
        },
      ],
    },
  ],

  markerRules: [
    "Marker workspace stays read-only.",
    "Markers do not mutate engine state.",
    "Markers do not create audio processing.",
    "Markers do not own DSP state.",
    "Markers can later reference waveform, cue, transient, timeline, and analysis layers.",
    "Track A and Track B marker lanes stay separate until comparison ownership exists.",
    "Future generated markers should include confidence before they affect decisions.",
    "Manual marker editing can be added later without changing this read-only foundation.",
  ],

  futureConnections: [
    "Waveform Workspace",
    "Waveform Statistics",
    "Transient Workspace",
    "Cue Workspace",
    "Timeline Workspace",
    "Comparison Matrix",
    "Decision Center",
    "Future Detection Engine",
  ],
};