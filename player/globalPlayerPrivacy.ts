import type { AnyTrack } from "./playerTypes";

export function getGlobalPlayerTrackKeys(track: AnyTrack): string[] {
  const keys = new Set<string>();
  const id = String(track?.id ?? "").trim();
  const path = String(track?.path ?? "").trim();
  const bucket = String(track?.bucket ?? "audio").trim() || "audio";

  if (id) keys.add(id);
  if (path) {
    keys.add(path);
    keys.add(`sb:${bucket}:${path}`);
    keys.add(`sb:audio:${path}`);
  }
  return [...keys];
}

export function isGlobalPlayerPublicTrack(track: AnyTrack, publicProjectTrackIds: ReadonlySet<string>): boolean {
  const visibility = String(track?.visibility ?? "").trim().toLowerCase();
  if (visibility === "public") return true;
  return getGlobalPlayerTrackKeys(track).some((key) => publicProjectTrackIds.has(key));
}

export function filterGlobalPlayerPublicTracks(tracks: AnyTrack[], publicProjectTrackIds: ReadonlySet<string>): AnyTrack[] {
  return tracks.filter((track) => isGlobalPlayerPublicTrack(track, publicProjectTrackIds));
}
