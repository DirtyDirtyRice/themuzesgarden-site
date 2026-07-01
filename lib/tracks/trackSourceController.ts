import { getSupabaseTracks } from "../getSupabaseTracks";
import { getUploadedTracks } from "../uploadedTracks";
import { getUnifiedTrackLibrary } from "./unifiedTrackLibrary";

export async function loadTrackSources() {
  const supabaseTracks = await getSupabaseTracks();
  const uploadedTracks = getUploadedTracks();
  const unifiedTracks = await getUnifiedTrackLibrary();

  return {
    supabaseTracks: Array.isArray(supabaseTracks) ? supabaseTracks : [],
    uploadedTracks: Array.isArray(uploadedTracks) ? uploadedTracks : [],
    unifiedTracks,
  };
}