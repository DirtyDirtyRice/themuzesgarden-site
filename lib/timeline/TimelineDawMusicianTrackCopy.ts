export function resolveTimelineDawMusicianTrackCopyPosition(input: {
  originalStartSeconds: number;
  sourceInSeconds: number;
  sourceOutSeconds: number;
  stretchRatio?: number;
  transformBypassed?: boolean;
  playPositionSeconds?: number;
}): number {
  const sourceDuration = input.sourceOutSeconds - input.sourceInSeconds;
  const stretchRatio = input.transformBypassed ? 1 : (input.stretchRatio ?? 1);
  if (!Number.isFinite(sourceDuration) || sourceDuration <= 0 || !Number.isFinite(stretchRatio) || stretchRatio <= 0) {
    throw new Error("The track does not have a safe repeat length.");
  }
  const requested = input.playPositionSeconds
    ?? input.originalStartSeconds + sourceDuration * stretchRatio;
  if (!Number.isFinite(requested)) throw new Error("Copy position must be a real time.");
  if (requested < 0 || requested > 86_400) throw new Error("Copy position must be inside the song timeline.");
  return Math.round(requested * 1000) / 1000;
}
