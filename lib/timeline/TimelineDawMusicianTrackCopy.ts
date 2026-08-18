export function resolveTimelineDawMusicianTrackCopyPosition(input: {
  originalStartSeconds: number;
  sourceInSeconds: number;
  sourceOutSeconds: number;
  playPositionSeconds?: number;
}): number {
  const requested = input.playPositionSeconds
    ?? input.originalStartSeconds + input.sourceOutSeconds - input.sourceInSeconds;
  if (!Number.isFinite(requested)) throw new Error("Copy position must be a real time.");
  if (requested < 0 || requested > 86_400) throw new Error("Copy position must be inside the song timeline.");
  return Math.round(requested * 1000) / 1000;
}
