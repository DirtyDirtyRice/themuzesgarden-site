import type { MultiTrackTransientWorkspace } from "./MultiTrackTransientTypes";

export const multiTrackTransientSeed: MultiTrackTransientWorkspace = {
  title: "Transient Workspace",

  description:
    "Read-only transient planning workspace for future onset, cue, marker, and detection systems.",

  readinessLabel:
    "Workspace ready / transient detection not connected yet",

  lanes: [
    {
      laneId: "track-a",
      title: "Track A",

      kickDetectionReady: false,
      snareDetectionReady: false,
      vocalOnsetReady: false,

      cueGenerationReady: false,
      markerGenerationReady: false,

      checkpoints: [
        {
          label: "Kick Detection",
          status: "future",
          detail: "Future transient engine ownership.",
        },
        {
          label: "Snare Detection",
          status: "future",
          detail: "Future transient engine ownership.",
        },
        {
          label: "Vocal Onset Detection",
          status: "future",
          detail: "Future analysis ownership.",
        },
        {
          label: "Cue Generation",
          status: "future",
          detail: "Future cue ownership.",
        },
        {
          label: "Marker Generation",
          status: "future",
          detail: "Future marker ownership.",
        },
      ],
    },

    {
      laneId: "track-b",
      title: "Track B",

      kickDetectionReady: false,
      snareDetectionReady: false,
      vocalOnsetReady: false,

      cueGenerationReady: false,
      markerGenerationReady: false,

      checkpoints: [
        {
          label: "Kick Detection",
          status: "future",
          detail: "Future transient engine ownership.",
        },
        {
          label: "Snare Detection",
          status: "future",
          detail: "Future transient engine ownership.",
        },
        {
          label: "Vocal Onset Detection",
          status: "future",
          detail: "Future analysis ownership.",
        },
        {
          label: "Cue Generation",
          status: "future",
          detail: "Future cue ownership.",
        },
        {
          label: "Marker Generation",
          status: "future",
          detail: "Future marker ownership.",
        },
      ],
    },
  ],

  ownershipNotes: [
    "Transient workspace remains read-only.",
    "No DSP processing exists here.",
    "No duplicate engine state exists here.",
    "Future onset ownership attaches later.",
    "Future cue ownership attaches later.",
    "Future marker ownership attaches later.",
    "Future analysis ownership attaches later.",
  ],
};