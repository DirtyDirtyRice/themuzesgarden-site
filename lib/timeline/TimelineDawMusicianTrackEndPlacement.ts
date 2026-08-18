export function resolveTimelineDawMusicianTrackEndPlacement(input: {
  playPositionSeconds: number;
  sourceInSeconds: number;
  sourceOutSeconds: number;
  stretchRatio: number;
  transformBypassed: boolean;
}) {
  const sourceDuration = input.sourceOutSeconds - input.sourceInSeconds;
  const audibleDuration = sourceDuration * (input.transformBypassed ? 1 : input.stretchRatio);
  const destination = input.playPositionSeconds - audibleDuration;
  const rounded = Math.round(destination * 1_000) / 1_000;
  if (!Number.isFinite(input.playPositionSeconds) || !Number.isFinite(audibleDuration) || audibleDuration <= 0) {
    throw new Error("The track does not have a safe audible length.");
  }
  if (rounded < 0) throw new Error("The play position is earlier than this track's audible length.");
  if (rounded > 86_400) throw new Error("The track would begin outside the safe song timeline.");
  return rounded;
}
