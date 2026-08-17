export function resolveTimelineDawMusicianTrackMove(input: {
  currentStartSeconds: number;
  destinationSeconds?: number;
  changeSeconds?: number;
}): number {
  const requested = input.destinationSeconds ?? input.currentStartSeconds + (input.changeSeconds ?? 0);
  if (!Number.isFinite(requested)) throw new Error("Track position must be a real time.");
  return Math.round(Math.max(0, Math.min(86_400, requested)) * 1000) / 1000;
}
