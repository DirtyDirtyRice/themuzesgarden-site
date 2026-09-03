export type TimelineDawSoloMode = "additive" | "exclusive";

export type TimelineDawSoloTrack = {
  id: string;
  soloed: boolean;
  locked?: boolean;
};

export function planTimelineDawTrackSolo(
  tracks: TimelineDawSoloTrack[],
  requestedTrackId: string,
  mode: TimelineDawSoloMode,
) {
  const id = requestedTrackId.trim();
  const target = tracks.find((track) => track.id === id);
  if (!target) throw new Error("The requested Solo track was not found.");
  if (target.locked) throw new Error("Unlock this track before changing Solo.");

  if (target.soloed) return [{ id, soloed: false }];
  if (mode === "additive") return [{ id, soloed: true }];

  const changes = tracks
    .filter((track) => track.soloed && track.id !== id)
    .map((track) => {
      if (track.locked) throw new Error("Unlock the other Solo track before using Exclusive Solo.");
      return { id: track.id, soloed: false };
    });
  return [...changes, { id, soloed: true }];
}
