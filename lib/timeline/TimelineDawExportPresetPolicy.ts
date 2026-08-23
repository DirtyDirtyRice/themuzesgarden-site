import type { TimelineRenderFormat, TimelineRenderTarget } from "./TimelineOfflineRenderAndExportEngine";

export type TimelineDawExportPresetId =
  | "streaming" | "podcast" | "cd" | "master-archive" | "stems";

export type TimelineDawExportPreset = {
  id: TimelineDawExportPresetId;
  name: string;
  description: string;
  target: TimelineRenderTarget;
  format: TimelineRenderFormat;
  sampleRate: 44100 | 48000 | 96000;
  bitDepth: 16 | 24 | 32;
  channels: 2;
  targetLufs: number;
  truePeakDbtp: number;
  dither: boolean;
};

export const timelineDawExportPresets: TimelineDawExportPreset[] = [
  { id: "streaming", name: "Streaming Master", description: "Balanced delivery for major music platforms.", target: "mix", format: "wav", sampleRate: 48000, bitDepth: 24, channels: 2, targetLufs: -14, truePeakDbtp: -1, dither: false },
  { id: "podcast", name: "Spoken Word / Podcast", description: "Consistent stereo spoken-word delivery.", target: "mix", format: "wav", sampleRate: 48000, bitDepth: 24, channels: 2, targetLufs: -16, truePeakDbtp: -1, dither: false },
  { id: "cd", name: "CD Master", description: "16-bit, 44.1 kHz master with output dither.", target: "mix", format: "wav", sampleRate: 44100, bitDepth: 16, channels: 2, targetLufs: -9, truePeakDbtp: -0.3, dither: true },
  { id: "master-archive", name: "Dynamic Master Archive", description: "High-resolution archival master with preserved dynamics.", target: "mix", format: "wav", sampleRate: 96000, bitDepth: 24, channels: 2, targetLufs: -18, truePeakDbtp: -1, dither: false },
  { id: "stems", name: "Mix Stems Delivery", description: "Matched 24-bit stems with conservative headroom.", target: "stem", format: "wav", sampleRate: 48000, bitDepth: 24, channels: 2, targetLufs: -18, truePeakDbtp: -3, dither: false },
];

export function getTimelineDawExportPreset(value: unknown): TimelineDawExportPreset {
  return timelineDawExportPresets.find((preset) => preset.id === value)
    ?? timelineDawExportPresets[0];
}

export function validateTimelineDawLoudnessTarget(targetLufs: number, truePeakDbtp: number) {
  if (!Number.isFinite(targetLufs) || targetLufs < -36 || targetLufs > -5) {
    throw new Error("Loudness target must be from -36 to -5 LUFS.");
  }
  if (!Number.isFinite(truePeakDbtp) || truePeakDbtp < -12 || truePeakDbtp > 0) {
    throw new Error("True-peak ceiling must be from -12 to 0 dBTP.");
  }
  return { targetLufs, truePeakDbtp };
}
