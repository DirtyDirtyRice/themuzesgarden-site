import type { Track } from "../types/track";

const KEY = "TMZ_UPLOADED_TRACKS_V1";

function safeParse(json: string | null): Track[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return [];
    return arr.filter(Boolean) as Track[];
  } catch {
    return [];
  }
}

function notify() {
  // same-tab updates
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("tmz_tracks_updated"));
  }
}

export function getUploadedTracks(): Track[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(KEY));
}

export function setUploadedTracks(tracks: Track[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(tracks));
  notify();
}

export function addUploadedTrack(track: Track) {
  const existing = getUploadedTracks();
  const next = [track, ...existing.filter((t) => t.id !== track.id)];
  setUploadedTracks(next);
}

export function removeUploadedTrack(id: string) {
  const existing = getUploadedTracks();
  const next = existing.filter((t) => t.id !== id);
  setUploadedTracks(next);
}