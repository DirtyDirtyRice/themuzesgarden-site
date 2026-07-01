import { getSupabaseTracks } from "../getSupabaseTracks";
import { getUploadedTracks } from "../uploadedTracks";
import { mergeTrackLists } from "../../app/library/libraryUtils";

let cachedTracks: any[] | null = null;

export async function getUnifiedTrackLibrary(
  forceRefresh = false
): Promise<any[]> {
  if (!forceRefresh && cachedTracks) {
    return cachedTracks;
  }

  const supabaseTracks = await getSupabaseTracks();
  const uploadedTracks = getUploadedTracks();

  cachedTracks = mergeTrackLists(
    (Array.isArray(supabaseTracks) ? supabaseTracks : []).map((track: any) => ({
      ...track,
      artist: track.artist ?? "",
    })),
    (Array.isArray(uploadedTracks) ? uploadedTracks : []).map((track: any) => ({
      ...track,
      artist: track.artist ?? "",
    }))
  );

  return cachedTracks;
}

export function clearUnifiedTrackLibraryCache(): void {
  cachedTracks = null;
}