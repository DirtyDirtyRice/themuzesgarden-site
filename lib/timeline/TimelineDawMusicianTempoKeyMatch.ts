import type { TimelineDawMusicianSpeedPitchTransform } from "./TimelineDawMusicianSpeedPitch";

const KEY_PITCH: Record<string, number> = {
  C: 0, "B#": 0, "C#": 1, DB: 1, D: 2, "D#": 3, EB: 3,
  E: 4, FB: 4, "E#": 5, F: 5, "F#": 6, GB: 6, G: 7,
  "G#": 8, AB: 8, A: 9, "A#": 10, BB: 10, B: 11, CB: 11,
};

function bpm(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 20 || value > 400) throw new Error(`${label} must be between 20 and 400 BPM.`);
  return value;
}

function keyPitch(value: string, label: string): number {
  const normalized = value.trim().toUpperCase().replace(/♯/g, "#").replace(/♭/g, "B");
  const pitch = KEY_PITCH[normalized];
  if (pitch === undefined) throw new Error(`${label} must be a musical key such as C, F#, or Bb.`);
  return pitch;
}

export function createTimelineDawMusicianTempoKeyMatch(input: {
  current: TimelineDawMusicianSpeedPitchTransform;
  sourceBpm: number;
  targetBpm: number;
  sourceKey: string;
  targetKey: string;
}): TimelineDawMusicianSpeedPitchTransform {
  const sourceBpm = bpm(input.sourceBpm, "Current BPM"), targetBpm = bpm(input.targetBpm, "Desired BPM");
  const stretchRatio = sourceBpm / targetBpm;
  if (stretchRatio < 0.25 || stretchRatio > 4) throw new Error("That BPM change is outside the safe 0.25× to 4× range.");
  let pitchSemitones = keyPitch(input.targetKey, "Desired key") - keyPitch(input.sourceKey, "Current key");
  if (pitchSemitones > 6) pitchSemitones -= 12;
  if (pitchSemitones < -6) pitchSemitones += 12;
  return { ...input.current, stretchRatio: Math.round(stretchRatio * 10_000) / 10_000, pitchSemitones, algorithm: "preserve-pitch", quality: "high", bypassed: false };
}
