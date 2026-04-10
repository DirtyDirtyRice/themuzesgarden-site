import type { TagCategory } from "../../lib/tagSystem";
import { supabase } from "../../lib/supabaseClient";
import type { TrackLike } from "./libraryTypes";
import { normalizeTrack } from "./libraryUtils";

export const LS_KEY = "muzes.library.trackTags.v1";

export const CATEGORY_ORDER: TagCategory[] = [
  "genre",
  "mood",
  "instrument",
  "production",
  "energy",
  "era",
  "use",
  "reference",
];

export const CATEGORY_LABEL: Record<TagCategory, string> = {
  genre: "Genre",
  mood: "Mood",
  instrument: "Instrument",
  production: "Production",
  energy: "Energy",
  era: "Era",
  use: "Use",
  reference: "Sounds Like",
};

export async function loadSupabaseTracksFromCandidates(): Promise<{
  supabaseTracks: TrackLike[];
  supabaseErr: string | null;
}> {
  const tableCandidates = ["tracks", "library_tracks", "uploaded_tracks"];

  let loadedRows: any[] = [];
  let lastErr: string | null = null;

  for (const tableName of tableCandidates) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        lastErr = error.message;
        continue;
      }

      if (Array.isArray(data) && data.length > 0) {
        loadedRows = data;
        break;
      }

      if (Array.isArray(data) && data.length === 0) {
        loadedRows = [];
        break;
      }
    } catch (err: any) {
      lastErr = err?.message ?? "Failed to load Supabase tracks.";
    }
  }

  const supabaseTracks = loadedRows
    .map((row) => normalizeTrack(row))
    .filter(Boolean) as TrackLike[];

  return {
    supabaseTracks,
    supabaseErr: !loadedRows.length && lastErr ? lastErr : null,
  };
}