import { getSupabaseTracks } from "../getSupabaseTracks";
import { getUploadedTracks } from "../uploadedTracks";
import { mergeTrackLists } from "../../app/library/libraryUtils";

export async function resolveProjectTracks(
  projectTrackIds: string[]
) {
  const supabaseTracks = await getSupabaseTracks();
  const uploadedTracks = getUploadedTracks();

  const library = mergeTrackLists(
    (Array.isArray(supabaseTracks) ? supabaseTracks : []).map((track: any) => ({
      ...track,
      artist: track.artist ?? "",
    })),
    (Array.isArray(uploadedTracks) ? uploadedTracks : []).map((track: any) => ({
      ...track,
      artist: track.artist ?? "",
    }))
  );

  const lookup = new Map<string, any>();

  for (const track of library) {
    lookup.set(String(track.id), track);
  }

  return projectTrackIds
    .map((id) => lookup.get(String(id)))
    .filter(Boolean);
}