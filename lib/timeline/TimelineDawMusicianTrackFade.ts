export function resolveTimelineDawMusicianTrackFade(input: {
  timelineStartSeconds: number;
  sourceInSeconds: number;
  sourceOutSeconds: number;
  stretchRatio: number;
  transformBypassed: boolean;
  playPositionSeconds: number;
  edge: "in" | "out";
  currentFadeInSeconds: number;
  currentFadeOutSeconds: number;
}): { inSeconds: number; outSeconds: number } {
  const stretch = input.transformBypassed ? 1 : input.stretchRatio;
  const duration = (input.sourceOutSeconds - input.sourceInSeconds) * stretch;
  const local = input.playPositionSeconds - input.timelineStartSeconds;
  if (!Number.isFinite(local) || local <= 0 || local >= duration) {
    throw new Error("Place the play position inside this track before creating a fade.");
  }
  const inSeconds = input.edge === "in" ? local : input.currentFadeInSeconds;
  const outSeconds = input.edge === "out" ? duration - local : input.currentFadeOutSeconds;
  if (inSeconds + outSeconds > duration) {
    throw new Error("This fade would overlap the fade at the other end of the track.");
  }
  return {
    inSeconds: Math.round(inSeconds * 1000) / 1000,
    outSeconds: Math.round(outSeconds * 1000) / 1000,
  };
}
