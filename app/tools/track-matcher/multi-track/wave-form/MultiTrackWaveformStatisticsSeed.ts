import type { MultiTrackWaveformStatisticsWorkspace } from "./MultiTrackWaveformStatisticsTypes";

export const multiTrackWaveformStatisticsSeed: MultiTrackWaveformStatisticsWorkspace =
  {
    title: "Waveform Statistics Workspace",

    description:
      "Future waveform analysis statistics ownership layer. Read-only planning workspace.",

    readinessLabel:
      "Workspace ready / real analysis values not connected yet",

    lanes: [
      {
        laneId: "track-a",
        title: "Track A",

        peakLevel: "-- dB",
        rmsLevel: "-- dB",
        dynamicRange: "-- dB",

        estimatedBpm: "--",
        estimatedKey: "--",

        sampleRate: "--",
        bitDepth: "--",
        channelMode: "--",

        status: "waiting",
      },

      {
        laneId: "track-b",
        title: "Track B",

        peakLevel: "-- dB",
        rmsLevel: "-- dB",
        dynamicRange: "-- dB",

        estimatedBpm: "--",
        estimatedKey: "--",

        sampleRate: "--",
        bitDepth: "--",
        channelMode: "--",

        status: "waiting",
      },
    ],

    futureCapabilities: [
      "Peak detection",
      "RMS detection",
      "Dynamic range analysis",
      "Tempo estimation",
      "Key estimation",
      "Stereo analysis",
      "DSP ownership integration",
      "Stem ownership integration",
    ],
  };