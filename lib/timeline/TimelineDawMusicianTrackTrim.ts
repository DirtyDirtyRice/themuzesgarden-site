export type TimelineDawMusicianTrackTrim = {
  timelineStartSeconds: number;
  sourceInSeconds: number;
  sourceOutSeconds: number;
};

export function resolveTimelineDawMusicianTrackTrim(input: {
  edge: "beginning" | "end";
  playPositionSeconds: number;
  timelineStartSeconds: number;
  sourceInSeconds: number;
  sourceOutSeconds: number;
  sampleRate: number;
  stretchRatio: number;
  transformBypassed: boolean;
}): TimelineDawMusicianTrackTrim {
  const rate = input.transformBypassed ? 1 : input.stretchRatio;
  if (!Number.isFinite(rate) || rate <= 0) throw new Error("Track stretch must be valid before trimming.");
  const sourcePosition = input.sourceInSeconds + (input.playPositionSeconds - input.timelineStartSeconds) / rate;
  const minimumDuration = 1 / input.sampleRate;
  if (sourcePosition <= input.sourceInSeconds || sourcePosition >= input.sourceOutSeconds) {
    throw new Error("Put the play position inside this track before trimming it.");
  }
  if (input.edge === "beginning") {
    if (input.sourceOutSeconds - sourcePosition < minimumDuration) throw new Error("A trim must leave some recorded audio.");
    return {
      timelineStartSeconds: input.playPositionSeconds,
      sourceInSeconds: sourcePosition,
      sourceOutSeconds: input.sourceOutSeconds,
    };
  }
  if (sourcePosition - input.sourceInSeconds < minimumDuration) throw new Error("A trim must leave some recorded audio.");
  return {
    timelineStartSeconds: input.timelineStartSeconds,
    sourceInSeconds: input.sourceInSeconds,
    sourceOutSeconds: sourcePosition,
  };
}
