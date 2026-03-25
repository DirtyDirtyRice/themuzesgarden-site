import type { AnyTrack, TrackSection } from "./playerTypes";
import { formatMomentTime } from "./playerUtils";

export function includesQuery(value: string, query: string): boolean {
  if (!query) return true;
  return String(value ?? "").toLowerCase().includes(String(query ?? "").toLowerCase());
}

export function countValues(values: string[]): Array<{ value: string; count: number }> {
  const counts = new Map<string, number>();

  for (const raw of Array.isArray(values) ? values : []) {
    const value = String(raw ?? "").trim();
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.value.localeCompare(b.value, undefined, { sensitivity: "base" });
    });
}

export function getHealthTone(score: number): {
  label: string;
  chipClass: string;
} {
  const safeScore = Number.isFinite(score) ? score : 0;

  if (safeScore >= 85) {
    return {
      label: "Strong",
      chipClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (safeScore >= 60) {
    return {
      label: "Okay",
      chipClass: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Needs Work",
    chipClass: "border-red-200 bg-red-50 text-red-700",
  };
}

export function normalizeStart(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function getSectionTagsSafe(section: TrackSection): string[] {
  const safeSection = (section ?? {}) as any;
  return Array.isArray(safeSection.tags)
    ? safeSection.tags.map((tag: unknown) => String(tag ?? "").trim()).filter(Boolean)
    : [];
}

export function getSectionDescriptionSafe(section: TrackSection): string {
  const safeSection = (section ?? {}) as any;
  return String(safeSection.description ?? "").trim();
}

export function getSectionSearchBlob(section: TrackSection): string {
  const safeSection = (section ?? {}) as any;
  const id = String(safeSection.id ?? "").trim().toLowerCase();
  const description = getSectionDescriptionSafe(section).toLowerCase();
  const tags = getSectionTagsSafe(section).join(" ").toLowerCase();
  const start = normalizeStart(safeSection.start);
  const timeLabel = start === null ? "" : String(formatMomentTime(start) ?? "").toLowerCase();

  return `${id} ${description} ${tags} ${timeLabel}`.trim();
}

export function getSectionQuality(section: TrackSection): {
  hasTags: boolean;
  hasDescription: boolean;
  hasStart: boolean;
} {
  const safeSection = (section ?? {}) as any;
  const tags = getSectionTagsSafe(section);
  const description = getSectionDescriptionSafe(section);
  const start = normalizeStart(safeSection.start);

  return {
    hasTags: tags.length > 0,
    hasDescription: Boolean(description),
    hasStart: start !== null,
  };
}

export function getSectionQualityLabel(section: TrackSection): {
  label: string;
  chipClass: string;
} {
  const quality = getSectionQuality(section);

  if (quality.hasTags && quality.hasDescription && quality.hasStart) {
    return {
      label: "Complete",
      chipClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (
    (quality.hasTags && quality.hasDescription) ||
    (quality.hasTags && quality.hasStart) ||
    (quality.hasDescription && quality.hasStart)
  ) {
    return {
      label: "Partial",
      chipClass: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Sparse",
    chipClass: "border-red-200 bg-red-50 text-red-700",
  };
}

export function pctLabel(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `${Math.round(safe * 100)}%`;
}

export function barWidth(value: number): string {
  const safe = Number.isFinite(value)
    ? Math.max(0, Math.min(100, Math.round(value * 100)))
    : 0;

  return `${safe}%`;
}

export function getTrackSortLabel(track: AnyTrack): string {
  const safeTrack = (track ?? {}) as any;
  const title = String(safeTrack?.title ?? "").trim() || "Untitled";
  const artist = String(safeTrack?.artist ?? "").trim() || "Unknown Artist";
  return `${title} — ${artist}`;
}

export function getTrackDisplayPath(track: AnyTrack | null): string {
  const safeTrack = (track ?? null) as any;
  if (!safeTrack) return "(none)";
  return String(safeTrack.path ?? "").trim() || "(none)";
}
