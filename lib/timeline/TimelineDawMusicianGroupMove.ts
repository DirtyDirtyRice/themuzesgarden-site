export type TimelineDawMusicianGroupMoveMode =
  | "hundredth-second-earlier"
  | "hundredth-second-later"
  | "tenth-second-earlier"
  | "tenth-second-later"
  | "one-second-earlier"
  | "one-second-later"
  | "play-position";

export function resolveTimelineDawMusicianGroupMove(input: {
  tracks: { id: string; timelineStartSeconds: number }[];
  mode: TimelineDawMusicianGroupMoveMode;
  playPositionSeconds?: number;
}) {
  const distinctTracks = new Map(input.tracks.map((track) => [track.id, track]));
  const tracks = [...distinctTracks.values()];
  if (tracks.length < 2) throw new Error("Select at least two tracks to move together.");
  if (tracks.some((track) => !Number.isFinite(track.timelineStartSeconds))) {
    throw new Error("A selected track has an invalid song position.");
  }

  const earliestStart = Math.min(...tracks.map((track) => track.timelineStartSeconds));
  const deltaSeconds = input.mode === "hundredth-second-earlier"
    ? -0.01
    : input.mode === "hundredth-second-later"
      ? 0.01
      : input.mode === "tenth-second-earlier"
        ? -0.1
    : input.mode === "tenth-second-later"
      ? 0.1
      : input.mode === "one-second-earlier"
        ? -1
        : input.mode === "one-second-later"
          ? 1
          : Number(input.playPositionSeconds) - earliestStart;
  const roundedDelta = Math.round(deltaSeconds * 1_000) / 1_000;

  if (!Number.isFinite(roundedDelta)) {
    throw new Error("The play position is not available.");
  }
  if (roundedDelta === 0) {
    throw new Error("The selected tracks already begin at that position.");
  }
  if (tracks.some((track) => {
    const next = track.timelineStartSeconds + roundedDelta;
    return next < 0 || next > 86_400;
  })) {
    throw new Error("That move would place a selected track outside the song.");
  }

  return roundedDelta;
}
