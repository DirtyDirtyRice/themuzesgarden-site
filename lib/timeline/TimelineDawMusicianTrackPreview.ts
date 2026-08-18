export function createTimelineDawMusicianTrackPreview(input: {
  sourceInSeconds: number;
  sourceOutSeconds: number;
  stretchRatio: number;
  transformBypassed: boolean;
  playbackRate: number;
}) {
  const sourceDurationSeconds = input.sourceOutSeconds - input.sourceInSeconds;
  if (!Number.isFinite(sourceDurationSeconds) || sourceDurationSeconds <= 0) throw new Error("Track has no audio to preview.");
  if (!Number.isFinite(input.playbackRate) || input.playbackRate <= 0) throw new Error("Track playback speed is invalid.");
  const durationSeconds = sourceDurationSeconds * (input.transformBypassed ? 1 : input.stretchRatio);
  return {
    sourceStartSeconds: input.sourceInSeconds,
    playbackRate: input.playbackRate,
    durationSeconds,
    stopAfterMilliseconds: Math.max(1, Math.ceil(durationSeconds * 1000)),
  };
}
