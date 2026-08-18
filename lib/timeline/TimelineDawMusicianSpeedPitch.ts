export type TimelineDawMusicianSpeedPitchAction =
  | "slower"
  | "faster"
  | "lower"
  | "raise"
  | "reset";

export type TimelineDawMusicianSpeedPitchTransform = {
  stretchRatio: number;
  pitchSemitones: number;
  algorithm: "preserve-pitch" | "resample";
  quality: "draft" | "balanced" | "high";
  bypassed: boolean;
};

export function adjustTimelineDawMusicianSpeedPitch(
  current: TimelineDawMusicianSpeedPitchTransform,
  action: TimelineDawMusicianSpeedPitchAction,
): TimelineDawMusicianSpeedPitchTransform {
  if (action === "reset") {
    return { ...current, stretchRatio: 1, pitchSemitones: 0, algorithm: "preserve-pitch", bypassed: false };
  }

  const stretchRatio = action === "slower"
    ? Math.min(4, Math.round(current.stretchRatio * 1.1 * 100) / 100)
    : action === "faster"
      ? Math.max(0.25, Math.round((current.stretchRatio / 1.1) * 100) / 100)
      : current.stretchRatio;
  const pitchSemitones = action === "lower"
    ? Math.max(-24, Math.round((current.pitchSemitones - 1) * 10) / 10)
    : action === "raise"
      ? Math.min(24, Math.round((current.pitchSemitones + 1) * 10) / 10)
      : current.pitchSemitones;

  return {
    ...current,
    stretchRatio,
    pitchSemitones,
    algorithm: "preserve-pitch",
    bypassed: false,
  };
}
