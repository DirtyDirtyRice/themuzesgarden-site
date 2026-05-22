import { findTag } from "../../lib/tagSystem";
import type { TrackLike } from "./libraryTypes";

export function ensureUnique(arr: string[]) {
  return Array.from(new Set(arr));
}

export function safeParseJSON<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export function displayTagLabel(tagId: string) {
  const tag = findTag(tagId);
  if (!tag) return tagId;
  if (tag.category === "reference") return `Sounds Like: ${tag.label}`;
  return tag.label;
}

function cleanOptionalString(value: unknown) {
  return String(value ?? "").trim() || undefined;
}

function normalizeAudioAssetFields(row: any): Record<string, string | undefined> {
  const wav =
    cleanOptionalString(row.wav) ??
    cleanOptionalString(row.wav_url) ??
    cleanOptionalString(row.wavUrl) ??
    cleanOptionalString(row.master_wav) ??
    cleanOptionalString(row.masterWav);

  const mp3 =
    cleanOptionalString(row.mp3) ??
    cleanOptionalString(row.mp3_url) ??
    cleanOptionalString(row.mp3Url) ??
    cleanOptionalString(row.preview_mp3) ??
    cleanOptionalString(row.previewMp3);

  const flac =
    cleanOptionalString(row.flac) ??
    cleanOptionalString(row.flac_url) ??
    cleanOptionalString(row.flacUrl);

  const aiff =
    cleanOptionalString(row.aiff) ??
    cleanOptionalString(row.aif) ??
    cleanOptionalString(row.aiff_url) ??
    cleanOptionalString(row.aif_url) ??
    cleanOptionalString(row.aiffUrl) ??
    cleanOptionalString(row.aifUrl);

  const original =
    cleanOptionalString(row.original) ??
    cleanOptionalString(row.original_url) ??
    cleanOptionalString(row.originalUrl) ??
    cleanOptionalString(row.original_upload) ??
    cleanOptionalString(row.originalUpload);

  const url =
    wav ??
    cleanOptionalString(row.url) ??
    cleanOptionalString(row.publicUrl) ??
    cleanOptionalString(row.public_url) ??
    cleanOptionalString(row.signedUrl) ??
    cleanOptionalString(row.signed_url) ??
    mp3 ??
    flac ??
    aiff ??
    original;

  return {
    wav,
    mp3,
    flac,
    aiff,
    original,
    originalUpload: original,
    masterAudio: wav ?? original ?? flac ?? aiff ?? mp3,
    previewAudio: mp3 ?? wav ?? original ?? flac ?? aiff,
    preferredDownloadFormat: "wav",
    url,
  };
}

export function normalizeTrack(row: any): TrackLike | null {
  if (!row) return null;

  const id = String(row.id ?? row.track_id ?? row.uuid ?? row.slug ?? "").trim();

  if (!id) return null;

  const title =
    String(
      row.title ??
        row.name ??
        row.track_title ??
        row.filename ??
        row.file_name ??
        "Untitled"
    ).trim() || "Untitled";

  const artist =
    String(
      row.artist ??
        row.created_by_name ??
        row.owner_name ??
        row.uploader_name ??
        "Supabase"
    ).trim() || "Supabase";

  const tags = Array.isArray(row.tags)
    ? ensureUnique(
        row.tags.map((x: any) => String(x ?? "").trim()).filter(Boolean)
      )
    : [];

  return {
    id,
    title,
    artist,
    ...normalizeAudioAssetFields(row),
    path: cleanOptionalString(row.path),
    storage_path: cleanOptionalString(row.storage_path),
    file_path: cleanOptionalString(row.file_path),
    tags,
    createdAt: cleanOptionalString(row.created_at ?? row.createdAt),
    sourceProjectTitle:
      cleanOptionalString(
        row.source_project_title ?? row.project_title ?? row.project_name
      ) || undefined,
    sourceProjectId:
      cleanOptionalString(row.source_project_id ?? row.project_id) || undefined,
    visibility:
      cleanOptionalString(row.visibility ?? row.access_mode) || undefined,
    ownerUserId:
      cleanOptionalString(row.owner_user_id ?? row.user_id) || undefined,
  };
}

export function mergeTrackLists(...lists: TrackLike[][]): TrackLike[] {
  const byId = new Map<string, TrackLike>();

  for (const list of lists) {
    for (const track of list) {
      if (!track?.id) continue;

      const prev = byId.get(track.id);
      if (!prev) {
        byId.set(track.id, track);
        continue;
      }

      byId.set(track.id, {
        ...prev,
        ...track,
        tags: ensureUnique([...(prev.tags ?? []), ...(track.tags ?? [])]),
      });
    }
  }

  return Array.from(byId.values()).sort((a, b) => {
    const aTitle = String(a.title ?? "");
    const bTitle = String(b.title ?? "");
    const byTitle = aTitle.localeCompare(bTitle, undefined, {
      sensitivity: "base",
    });
    if (byTitle !== 0) return byTitle;

    return String(a.id ?? "").localeCompare(String(b.id ?? ""), undefined, {
      sensitivity: "base",
    });
  });
}