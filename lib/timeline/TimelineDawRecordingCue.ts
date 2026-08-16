export type TimelineDawRecordingCueSettings = {
  enabled: boolean;
  volume: number;
  accentEnabled: boolean;
};

export function parseTimelineDawRecordingCueSettings(value: unknown): TimelineDawRecordingCueSettings {
  const row = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const numericVolume = Number(row.volume);
  return {
    enabled: row.enabled === true,
    volume: Number.isFinite(numericVolume) ? Math.max(0.05, Math.min(0.5, numericVolume)) : 0.2,
    accentEnabled: row.accentEnabled !== false,
  };
}

export function getTimelineDawRecordingCueBeat(input: {
  beatIndex: number;
  beatsPerBar: number;
  bpm: number;
  settings: TimelineDawRecordingCueSettings;
}): { beat: number; accent: boolean; frequencyHz: number; gain: number; intervalMs: number } {
  const beat = input.beatIndex % input.beatsPerBar + 1;
  const accent = input.settings.accentEnabled && beat === 1;
  return { beat, accent, frequencyHz: accent ? 1320 : 880, gain: input.settings.volume, intervalMs: 60_000 / input.bpm };
}
