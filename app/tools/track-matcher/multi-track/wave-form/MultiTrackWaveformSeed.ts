import type { MultiTrackWaveformWorkspaceState } from "./MultiTrackWaveformTypes";

export const multiTrackWaveformSeed: MultiTrackWaveformWorkspaceState = {
  title: "Waveform Workspace",
  summary:
    "Read-only waveform planning layer for Track A, Track B, duration views, transient readiness, DSP ownership, waveform ownership, and future stem ownership.",
  readiness: "partial",
  readinessLabel: "Workspace foundation ready / live waveform rendering future",
  lanes: [
    {
      laneId: "track-a",
      title: "Track A waveform lane",
      sourceLabel: "Track A source",
      durationLabel: "--:--",
      durationSeconds: 0,
      waveformReady: false,
      transientReady: false,
      analysisReady: false,
      dspOwner: "Future DSP engine",
      waveformOwner: "Future waveform renderer",
      stemOwner: "Future stem system",
      checkpoints: [
        {
          label: "Waveform container",
          status: "ready",
          detail: "Lane shell is available for future waveform drawing.",
        },
        {
          label: "Duration visualization",
          status: "waiting",
          detail: "Waiting for real loaded audio duration from engine source state.",
        },
        {
          label: "Transient markers",
          status: "future",
          detail: "Future onset and cue marker ownership will attach here.",
        },
        {
          label: "Analysis bridge",
          status: "future",
          detail: "Future waveform analysis can connect without mutating engine state.",
        },
      ],
    },
    {
      laneId: "track-b",
      title: "Track B waveform lane",
      sourceLabel: "Track B source",
      durationLabel: "--:--",
      durationSeconds: 0,
      waveformReady: false,
      transientReady: false,
      analysisReady: false,
      dspOwner: "Future DSP engine",
      waveformOwner: "Future waveform renderer",
      stemOwner: "Future stem system",
      checkpoints: [
        {
          label: "Waveform container",
          status: "ready",
          detail: "Lane shell is available for future waveform drawing.",
        },
        {
          label: "Duration visualization",
          status: "waiting",
          detail: "Waiting for real loaded audio duration from engine source state.",
        },
        {
          label: "Transient markers",
          status: "future",
          detail: "Future onset and cue marker ownership will attach here.",
        },
        {
          label: "Analysis bridge",
          status: "future",
          detail: "Future waveform analysis can connect without mutating engine state.",
        },
      ],
    },
  ],
  futureOwnershipNotes: [
    "DSP ownership stays separate from the visual waveform workspace.",
    "Waveform rendering can become its own renderer layer later.",
    "Stem ownership should attach after real stem extraction exists.",
    "This panel is read-only and does not create duplicate engine state.",
  ],
};