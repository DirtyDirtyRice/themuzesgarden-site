export function resolveTimelineDawMusicianTrackTiming(input: {
  timelineStartSeconds: number;
  sourceInSeconds: number;
  sourceOutSeconds: number;
  stretchRatio: number;
  transformBypassed: boolean;
}) {
  const sourceDurationSeconds = input.sourceOutSeconds - input.sourceInSeconds;
  const speedFactor = input.transformBypassed ? 1 : input.stretchRatio;
  const audibleDurationSeconds = sourceDurationSeconds * speedFactor;
  const audibleEndSeconds = input.timelineStartSeconds + audibleDurationSeconds;
  if (![input.timelineStartSeconds, sourceDurationSeconds, speedFactor, audibleDurationSeconds, audibleEndSeconds].every(Number.isFinite)
    || input.timelineStartSeconds < 0 || sourceDurationSeconds <= 0 || speedFactor <= 0 || audibleEndSeconds > 86_400) {
    throw new Error("Track timing is outside the safe song timeline.");
  }
  return {
    sourceDurationSeconds: Math.round(sourceDurationSeconds * 1_000) / 1_000,
    audibleDurationSeconds: Math.round(audibleDurationSeconds * 1_000) / 1_000,
    audibleEndSeconds: Math.round(audibleEndSeconds * 1_000) / 1_000,
  };
}
