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
    ? ensureUnique(row.tags.map((x: any) => String(x ?? "").trim()).filter(Boolean))
    : [];

  return {
    id,
    title,
    artist,
    url:
      String(
        row.url ??
          row.publicUrl ??
          row.public_url ??
          row.signedUrl ??
          row.signed_url ??
          ""
      ).trim() || undefined,
    mp3: String(row.mp3 ?? "").trim() || undefined,
    path: String(row.path ?? "").trim() || undefined,
    storage_path: String(row.storage_path ?? "").trim() || undefined,
    file_path: String(row.file_path ?? "").trim() || undefined,
    tags,
    createdAt: String(row.created_at ?? row.createdAt ?? "").trim() || undefined,
    sourceProjectTitle:
      String(
        row.source_project_title ??
          row.project_title ??
          row.project_name ??
          ""
      ).trim() || undefined,
    sourceProjectId:
      String(
        row.source_project_id ??
          row.project_id ??
          ""
      ).trim() || undefined,
    visibility: String(row.visibility ?? row.access_mode ?? "").trim() || undefined,
    ownerUserId: String(row.owner_user_id ?? row.user_id ?? "").trim() || undefined,
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