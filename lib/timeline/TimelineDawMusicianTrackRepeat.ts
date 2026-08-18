import { resolveTimelineDawMusicianTrackCopyPosition } from "./TimelineDawMusicianTrackCopy";

export function resolveTimelineDawMusicianTrackRepeatPositions(input: {
  originalStartSeconds: number;
  sourceInSeconds: number;
  sourceOutSeconds: number;
  stretchRatio: number;
  transformBypassed: boolean;
  repeatCount: number;
}) {
  if (input.repeatCount !== 2 && input.repeatCount !== 4) {
    throw new Error("Choose two or four repeats.");
  }
  const firstStart = resolveTimelineDawMusicianTrackCopyPosition(input);
  const audibleDuration = firstStart - input.originalStartSeconds;
  return Array.from({ length: input.repeatCount }, (_, index) => {
    const position = Math.round((firstStart + audibleDuration * index) * 1_000) / 1_000;
    if (!Number.isFinite(position) || position < 0 || position > 86_400) {
      throw new Error("The repeats would extend beyond the safe song timeline.");
    }
    return position;
  });
}
