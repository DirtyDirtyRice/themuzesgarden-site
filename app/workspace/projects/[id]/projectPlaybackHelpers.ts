import type { PlaybackTrackLike } from "./projectDetailsTypes";

export function getTrackById<T extends PlaybackTrackLike>(
  tracks: T[],
  tid: string
): T | null {
  return tracks.find((t) => String(t.id) === String(tid)) ?? null;
}

export function getPlayableTrackUrl(track: PlaybackTrackLike | null | undefined) {
  if (!track) return "";

  const directCandidates = [
    track.url,
    track.publicUrl,
    track.public_url,
    track.signedUrl,
    track.signed_url,
    track.src,
    track.mp3,
  ];

  for (const candidate of directCandidates) {
    const clean = String(candidate ?? "").trim();
    if (!clean) continue;

    if (
      clean.startsWith("http://") ||
      clean.startsWith("https://") ||
      clean.startsWith("blob:")
    ) {
      return clean;
    }
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