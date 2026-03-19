import type { AnyTrack } from "./playerTypes";
import type { DiscoveryMoment } from "./playerDiscoveryTypes";

export function normalizeText(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export function uniqStrings(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
    )
  );
}

export function sortMomentsByTime(moments: DiscoveryMoment[]): DiscoveryMoment[] {
  return [...moments].sort((a, b) => {
    if (a.startTime !== b.startTime) return a.startTime - b.startTime;

    const byTrack = String(a.trackId ?? "").localeCompare(
      String(b.trackId ?? ""),
      undefined,
      {
        sensitivity: "base",
      }
    );
    if (byTrack !== 0) return byTrack;

    return String(a.sectionId ?? "").localeCompare(
      String(b.sectionId ?? ""),
      undefined,
      {
        sensitivity: "base",
      }
    );
  });
}

export function buildMomentKey(moment: DiscoveryMoment): string {
  const trackId = String(moment.trackId ?? "").trim();
  const sectionId = String(moment.sectionId ?? "").trim();
  const startTime = Number.isFinite(moment.startTime) ? Number(moment.startTime) : 0;
  const label = String(moment.label ?? "").trim().toLowerCase();

  return `${trackId}::${sectionId}::${startTime}::${label}`;
}

export function dedupeMoments(moments: DiscoveryMoment[]): DiscoveryMoment[] {
  const seen = new Set<string>();
  const out: DiscoveryMoment[] = [];

  for (const moment of sortMomentsByTime(moments)) {
    const key = buildMomentKey(moment);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(moment);
  }

  return out;
}

export function buildTrackSignature(track: AnyTrack): string {
  const id = String(track?.id ?? "").trim();
  const title = String(track?.title ?? "").trim();
  const artist = String(track?.artist ?? "").trim();
  const url = String(track?.url ?? "").trim();
  const path = String(track?.path ?? "").trim();

  const trackTags = Array.isArray(track?.tags)
    ? uniqStrings(track.tags.map((tag) => String(tag ?? ""))).join("|")
    : "";

  const sections = Array.isArray(track?.sections)
    ? track.sections
        .map((section) => {
          const sectionId = String(section?.id ?? "").trim();
          const start = Number(section?.start);
          const end = Number(section?.end);
          const description = String(section?.description ?? "").trim();
          const label = String(section?.label ?? "").trim();
          const notes = String(section?.notes ?? "").trim();
          const tags = Array.isArray(section?.tags)
            ? uniqStrings(section.tags.map((tag) => String(tag ?? ""))).join("|")
            : "";

          return [
            sectionId,
            Number.isFinite(start) ? String(start) : "",
            Number.isFinite(end) ? String(end) : "",
            description,
            label,
            notes,
            tags,
          ].join("~");
        })
        .join("||")
    : "";

  return [id, title, artist, url, path, trackTags, sections].join("::");
}

export function buildRuntimeSignature(tracks: AnyTrack[]): string {
  return tracks
    .map((track) => buildTrackSignature(track))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .join("###");
}