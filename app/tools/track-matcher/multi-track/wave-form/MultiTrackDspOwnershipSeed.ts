import type { MultiTrackDspOwnershipWorkspace } from "./MultiTrackDspOwnershipTypes";

export const multiTrackDspOwnershipSeed: MultiTrackDspOwnershipWorkspace = {
  title: "DSP Ownership Workspace",

  description:
    "Read-only DSP ownership planning workspace for browser playback, Web Audio, granular pitch, tempo, sync, gain, EQ, compression, limiting, stems, rendering, waveform ownership, and future analysis-owned DSP decisions.",

  readinessLabel:
    "Workspace ready / real DSP routing remains owned by the existing audio engine",

  lanes: [
    {
      laneId: "track-a",
      title: "Track A DSP Ownership Lane",
      sourceLabel: "Track A future DSP routing plan",

      browserPlaybackReady: true,
      proPitchReady: false,
      granularReady: false,
      stemDspReady: false,
      renderReady: false,

      processes: [
        {
          processId: "track-a-browser-playback",
          label: "Browser Playback",
          kind: "tempo",
          owner: "browser",
          status: "ready",
          readinessLabel: "Existing browser playback path",
          routeLabel: "HTMLAudioElement playbackRate",
          detail:
            "Browser playback exists already and can represent speed/pitch-linked playback without owning new engine state.",
        },
        {
          processId: "track-a-pro-pitch",
          label: "Pro Pitch DSP",
          kind: "pitch",
          owner: "web-audio",
          status: "future",
          readinessLabel: "Future attachment",
          routeLabel: "Web Audio pitch route",
          detail:
            "Future Track A pitch ownership can attach through derived routing without duplicating the engine runtime.",
        },
        {
          processId: "track-a-granular-stretch",
          label: "Granular Stretch",
          kind: "stretch",
          owner: "granular",
          status: "future",
          readinessLabel: "Future attachment",
          routeLabel: "Granular engine route",
          detail:
            "Future granular stretch ownership can support pitch shift with tempo preservation and waveform-safe display.",
        },
        {
          processId: "track-a-sync-dsp",
          label: "Sync DSP",
          kind: "sync",
          owner: "analysis",
          status: "future",
          readinessLabel: "Future attachment",
          routeLabel: "Sync decision route",
          detail:
            "Future sync DSP can respond to downbeat, tempo, cue, and transient analysis without mutating this workspace.",
        },
        {
          processId: "track-a-stem-dsp",
          label: "Stem DSP",
          kind: "stem",
          owner: "stem",
          status: "future",
          readinessLabel: "Future attachment",
          routeLabel: "Stem processing route",
          detail:
            "Future stem DSP can process vocal, drums, bass, harmony, melody, and hybrid lanes after stem ownership exists.",
        },
        {
          processId: "track-a-render-dsp",
          label: "Render DSP",
          kind: "render",
          owner: "future",
          status: "future",
          readinessLabel: "Future attachment",
          routeLabel: "Export/render route",
          detail:
            "Future render ownership can support WAV/MP3/export workflows after processing decisions are verified.",
        },
      ],
    },
    {
      laneId: "track-b",
      title: "Track B DSP Ownership Lane",
      sourceLabel: "Track B future DSP routing plan",

      browserPlaybackReady: true,
      proPitchReady: false,
      granularReady: false,
      stemDspReady: false,
      renderReady: false,

      processes: [
        {
          processId: "track-b-browser-playback",
          label: "Browser Playback",
          kind: "tempo",
          owner: "browser",
          status: "ready",
          readinessLabel: "Existing browser playback path",
          routeLabel: "HTMLAudioElement playbackRate",
          detail:
            "Browser playback exists already and can represent speed/pitch-linked playback without owning new engine state.",
        },
        {
          processId: "track-b-pro-pitch",
          label: "Pro Pitch DSP",
          kind: "pitch",
          owner: "web-audio",
          status: "future",
          readinessLabel: "Future attachment",
          routeLabel: "Web Audio pitch route",
          detail:
            "Future Track B pitch ownership can attach through derived routing without duplicating the engine runtime.",
        },
        {
          processId: "track-b-granular-stretch",
          label: "Granular Stretch",
          kind: "stretch",
          owner: "granular",
          status: "future",
          readinessLabel: "Future attachment",
          routeLabel: "Granular engine route",
          detail:
            "Future granular stretch ownership can support pitch shift with tempo preservation and waveform-safe display.",
        },
        {
          processId: "track-b-sync-dsp",
          label: "Sync DSP",
          kind: "sync",
          owner: "analysis",
          status: "future",
          readinessLabel: "Future attachment",
          routeLabel: "Sync decision route",
          detail:
            "Future sync DSP can respond to downbeat, tempo, cue, and transient analysis without mutating this workspace.",
        },
        {
          processId: "track-b-stem-dsp",
          label: "Stem DSP",
          kind: "stem",
          owner: "stem",
          status: "future",
          readinessLabel: "Future attachment",
          routeLabel: "Stem processing route",
          detail:
            "Future stem DSP can process vocal, drums, bass, harmony, melody, and hybrid lanes after stem ownership exists.",
        },
        {
          processId: "track-b-render-dsp",
          label: "Render DSP",
          kind: "render",
          owner: "future",
          status: "future",
          readinessLabel: "Future attachment",
          routeLabel: "Export/render route",
          detail:
            "Future render ownership can support WAV/MP3/export workflows after processing decisions are verified.",
        },
      ],
    },
  ],

  ownershipRules: [
    "DSP ownership workspace is read-only.",
    "This workspace does not create AudioContext.",
    "This workspace does not decode audio.",
    "This workspace does not schedule grains.",
    "This workspace does not mutate engine state.",
    "This workspace does not duplicate Track A or Track B runtime.",
    "Existing browser playback remains owned by the existing engine.",
    "Future Pro Pitch DSP should attach through derived adapters.",
    "Future granular pitch should remain separate from waveform drawing.",
    "Future render/export should require explicit user confirmation.",
  ],

  futureConnections: [
    "Track Matcher Audio Engine",
    "Pro Pitch DSP Runtime",
    "Granular Pitch Engine",
    "Waveform Workspace",
    "Detection Workspace",
    "Stem Ownership Workspace",
    "Timeline Workspace",
    "Comparison Matrix",
    "Decision Center",
    "Future Export Engine",
  ],
};