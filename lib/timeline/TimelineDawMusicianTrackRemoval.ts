export function createTimelineDawMusicianTrackRemovalMessage(trackName: string): {
  confirmation: string;
  success: string;
} {
  const name = trackName.trim() || "this track";
  return {
    confirmation: `Remove ${name} from this song? The private recording will be preserved, and Undo Last Track Edit can bring the track back.`,
    success: `${name} was removed from this song. The private recording is preserved, and Undo Last Track Edit can bring the track back.`,
  };
}
