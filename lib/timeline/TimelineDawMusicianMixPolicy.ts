export type TimelineDawMusicianMixPreset = "clean" | "vocal" | "punch" | "warm";
export type TimelineDawMusicianEffect = "gain" | "filter" | "compressor" | "gate";

export type TimelineDawMusicianPresetInsert = {
  slot: number;
  effect: TimelineDawMusicianEffect;
  bypassed: boolean;
  parameters: Record<string, number>;
};

export function createTimelineDawMusicianPreset(preset: TimelineDawMusicianMixPreset): TimelineDawMusicianPresetInsert[] {
  if (preset === "clean") return [];
  if (preset === "vocal") return [
    { slot: 1, effect: "filter", bypassed: false, parameters: { frequency: 14000, q: 0.7 } },
    { slot: 2, effect: "compressor", bypassed: false, parameters: { threshold: -18, ratio: 3 } },
  ];
  if (preset === "punch") return [
    { slot: 2, effect: "compressor", bypassed: false, parameters: { threshold: -24, ratio: 5 } },
    { slot: 3, effect: "gate", bypassed: false, parameters: { threshold: -42, ratio: 2 } },
  ];
  return [
    { slot: 0, effect: "gain", bypassed: false, parameters: { gain: 0.92 } },
    { slot: 1, effect: "filter", bypassed: false, parameters: { frequency: 10500, q: 0.55 } },
  ];
}

export function summarizeTimelineDawMusicianMixHealth(input: {
  peakDbfs: number;
  clipped: boolean;
  activeInsertCount: number;
  latencySamples: number;
  sampleRate: number;
}) {
  const latencyMs = input.sampleRate > 0 ? input.latencySamples / input.sampleRate * 1000 : 0;
  const status = input.clipped ? "clip" : input.peakDbfs > -3 ? "hot" : "safe";
  const processingLoad = input.activeInsertCount >= 8 ? "high" : input.activeInsertCount >= 4 ? "medium" : "light";
  return {
    status,
    latencyMs,
    processingLoad,
    recommendation: input.clipped
      ? "Lower channel or master gain before rendering."
      : latencyMs > 25
        ? "Bypass look-ahead effects while recording."
        : "Signal path is ready for audition.",
  } as const;
}
