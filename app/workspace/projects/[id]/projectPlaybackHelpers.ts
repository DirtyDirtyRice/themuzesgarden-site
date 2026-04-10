import type { PlaybackTrackLike } from "./projectDetailsTypes";
import { projectSupabase } from "./projectSupabase";

const SUPABASE_BUCKET = "audio"; // 🔴 change if your bucket name is different

export function getTrackById<T extends PlaybackTrackLike>(
  tracks: T[],
  tid: string
): T | null {
  return tracks.find((t) => String(t.id) === String(tid)) ?? null;
}

function normalizePlayableCandidate(candidate: unknown): string {
  const clean = String(candidate ?? "").trim();
  if (!clean) return "";

  if (
    clean.startsWith("http://") ||
    clean.startsWith("https://") ||
    clean.startsWith("blob:")
  ) {
    return clean;
  }

  if (
    clean.startsWith("/") ||
    clean.startsWith("./") ||
    clean.startsWith("../")
  ) {
    return clean;
  }

  const lower = clean.toLowerCase();
  const looksLikeAudioFile =
    lower.endsWith(".mp3") ||
    lower.endsWith(".wav") ||
    lower.endsWith(".m4a") ||
    lower.endsWith(".aac") ||
    lower.endsWith(".ogg") ||
    lower.endsWith(".flac");

  if (looksLikeAudioFile) {
    return clean;
  }

  return "";
}

function buildSupabaseUrl(path: string): string {
  const clean = String(path ?? "").trim();
  if (!clean) return "";

  try {
    const { data } = projectSupabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(clean);

    return String(data?.publicUrl ?? "");
  } catch {
    return "";
  }
}

export function getPlayableTrackUrl(track: PlaybackTrackLike | null | undefined) {
  if (!track) return "";

  // 🔴 STEP 1: direct URLs (already correct)
  const directCandidates = [
    track.url,
    track.publicUrl,
    track.public_url,
    track.signedUrl,
    track.signed_url,
    track.src,
  ];

  for (const candidate of directCandidates) {
    const normalized = normalizePlayableCandidate(candidate);
    if (normalized) return normalized;
  }

  // 🔴 STEP 2: Supabase paths → convert to public URL
  const pathCandidates = [
    (track as any).mp3,
    (track as any).path,
    (track as any).storage_path,
    (track as any).file_path,
  ];

  for (const candidate of pathCandidates) {
    const clean = String(candidate ?? "").trim();
    if (!clean) continue;

    const url = buildSupabaseUrl(clean);
    if (url) return url;
  }

  return "";
}

export function hasPlayableTrackUrl(track: PlaybackTrackLike | null | undefined) {
  return !!getPlayableTrackUrl(track);
}

export function getTrackDisplayTitle(track: PlaybackTrackLike | null | undefined) {
  return String(track?.title ?? "").trim() || "Untitled";
}

export function getTrackDisplayArtist(track: PlaybackTrackLike | null | undefined) {
  return String(track?.artist ?? "").trim() || "Supabase";
}