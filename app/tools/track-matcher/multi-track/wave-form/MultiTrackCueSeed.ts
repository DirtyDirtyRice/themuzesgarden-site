import type { MultiTrackCueWorkspace } from "./MultiTrackCueTypes";

export const multiTrackCueSeed: MultiTrackCueWorkspace = {
  title: "Cue Workspace",

  description:
    "Read-only cue planning workspace for intro, verse, chorus, bridge, outro, loop, timeline, marker, and waveform ownership.",

  readinessLabel: "Workspace ready / real cue detection not connected yet",

  lanes: [
    {
      laneId: "track-a",
      title: "Track A",

      introCueReady: false,
      verseCueReady: false,
      chorusCueReady: false,
      bridgeCueReady: false,
      outroCueReady: false,
      loopCueReady: false,

      cuePoints: [
        {
          label: "Intro Cue",
          status: "future",
          detail: "Future cue detection can identify the beginning section.",
        },
        {
          label: "Verse Cue",
          status: "future",
          detail: "Future timeline analysis can identify verse entry points.",
        },
        {
          label: "Chorus Cue",
          status: "future",
          detail: "Future structure analysis can identify chorus entry points.",
        },
        {
          label: "Bridge Cue",
          status: "future",
          detail: "Future structure detection can identify bridge changes.",
        },
        {
          label: "Outro Cue",
          status: "future",
          detail: "Future ending detection can identify outro regions.",
        },
        {
          label: "Loop Cue",
          status: "future",
          detail: "Future loop ownership can identify usable repeat regions.",
        },
      ],
    },
    {
      laneId: "track-b",
      title: "Track B",

      introCueReady: false,
      verseCueReady: false,
      chorusCueReady: false,
      bridgeCueReady: false,
      outroCueReady: false,
      loopCueReady: false,

      cuePoints: [
        {
          label: "Intro Cue",
          status: "future",
          detail: "Future cue detection can identify the beginning section.",
        },
        {
          label: "Verse Cue",
          status: "future",
          detail: "Future timeline analysis can identify verse entry points.",
        },
        {
          label: "Chorus Cue",
          status: "future",
          detail: "Future structure analysis can identify chorus entry points.",
        },
        {
          label: "Bridge Cue",
          status: "future",
          detail: "Future structure detection can identify bridge changes.",
        },
        {
          label: "Outro Cue",
          status: "future",
          detail: "Future ending detection can identify outro regions.",
        },
        {
          label: "Loop Cue",
          status: "future",
          detail: "Future loop ownership can identify usable repeat regions.",
        },
      ],
    },
  ],

  ownershipNotes: [
    "Cue workspace remains read-only.",
    "Cue data does not mutate engine state.",
    "Future timeline ownership can attach later.",
    "Future marker ownership can attach later.",
    "Future waveform ownership can attach later.",
    "Future loop ownership can attach later.",
  ],
};