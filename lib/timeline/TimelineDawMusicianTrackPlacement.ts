export type TimelineDawMusicianTrackPlacementMode = "same-start" | "after-track";

type PlacementTrack = {
  id: string;
  timelineStartSeconds: number;
  sourceInSeconds: number;
  sourceOutSeconds: number;
  stretchRatio: number;
  transformBypassed: boolean;
};

export function resolveTimelineDawMusicianTrackPlacement(input: {
  movingTrackId: string;
  targetTrack: PlacementTrack;
  mode: TimelineDawMusicianTrackPlacementMode;
}) {
  if (!input.targetTrack.id || input.targetTrack.id === input.movingTrackId) {
    throw new Error("Choose a different track as the placement guide.");
  }
  const sourceDuration = input.targetTrack.sourceOutSeconds - input.targetTrack.sourceInSeconds;
  const audibleDuration = sourceDuration * (input.targetTrack.transformBypassed ? 1 : input.targetTrack.stretchRatio);
  const destination = input.mode === "same-start"
    ? input.targetTrack.timelineStartSeconds
    : input.targetTrack.timelineStartSeconds + audibleDuration;
  const rounded = Math.round(destination * 1_000) / 1_000;

  if (!Number.isFinite(rounded) || sourceDuration <= 0 || audibleDuration <= 0 || rounded < 0 || rounded > 86_400) {
    throw new Error("The chosen track does not have a safe song position.");
  }
  return rounded;
}
