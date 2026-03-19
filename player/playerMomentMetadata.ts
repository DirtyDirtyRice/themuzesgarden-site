import type { TrackMomentMeta, TrackSection } from "./playerTypes";

function uniqStrings(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
    )
  );
}

function clampNonNegative(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function clampUnitRange(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function normalizeOptionalText(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function normalizeStringList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return uniqStrings(values.map((value) => String(value ?? "").trim()));
}

export function getSectionMeta(section: TrackSection): TrackMomentMeta {
  return section.meta ?? {};
}

export function getSectionDuration(section: TrackSection): number {
  const metaDuration = Number(section.meta?.duration);
  if (Number.isFinite(metaDuration) && metaDuration >= 0) return metaDuration;

  const start = clampNonNegative(section.start);
  const end = clampNonNegative(section.end);

  if (end >= start) return end - start;
  return 0;
}

export function getSectionConfidence(section: TrackSection): number | null {
  const fromMeta = clampUnitRange(section.meta?.confidence);
  if (fromMeta !== null) return fromMeta;

  const fromRoot = clampUnitRange(section.confidence);
  if (fromRoot !== null) return fromRoot;

  return null;
}

export function getSectionLabelText(section: TrackSection): string {
  const fromMeta = normalizeOptionalText(section.meta?.label);
  if (fromMeta) return fromMeta;

  const fromRoot = normalizeOptionalText(section.label);
  if (fromRoot) return fromRoot;

  const fromDescription = normalizeOptionalText(section.description);
  if (fromDescription) return fromDescription;

  const firstTag = normalizeStringList(section.tags)[0];
  if (firstTag) return firstTag;

  return String(section.id ?? "Moment");
}

export function getSectionNotes(section: TrackSection): string | null {
  return (
    normalizeOptionalText(section.meta?.notes) ??
    normalizeOptionalText(section.notes) ??
    null
  );
}

export function getSectionSource(section: TrackSection): string | null {
  return (
    normalizeOptionalText(section.meta?.source) ??
    normalizeOptionalText(section.source) ??
    null
  );
}

export function getSectionInstruments(section: TrackSection): string[] {
  return normalizeStringList(section.meta?.instruments);
}

export function getSectionMoods(section: TrackSection): string[] {
  return normalizeStringList(section.meta?.moods);
}

export function getSectionTextures(section: TrackSection): string[] {
  return normalizeStringList(section.meta?.textures);
}

export function getSectionEnergy(section: TrackSection): number | null {
  return clampUnitRange(section.meta?.energy);
}

export function getSectionIntensity(section: TrackSection): number | null {
  return clampUnitRange(section.meta?.intensity);
}

export function getSectionSearchableText(section: TrackSection): string {
  const parts = [
    normalizeOptionalText(section.description),
    normalizeOptionalText(section.label),
    normalizeOptionalText(section.notes),
    normalizeOptionalText(section.meta?.searchableText),
    normalizeOptionalText(section.meta?.label),
    normalizeOptionalText(section.meta?.notes),
    ...normalizeStringList(section.tags),
    ...getSectionInstruments(section),
    ...getSectionMoods(section),
    ...getSectionTextures(section),
  ];

  return uniqStrings(parts.filter(Boolean) as string[]).join(" ").trim();
}

export function getSectionBooleanFlags(section: TrackSection): {
  isLoop: boolean;
  isTransition: boolean;
  isImpact: boolean;
} {
  return {
    isLoop: Boolean(section.meta?.isLoop),
    isTransition: Boolean(section.meta?.isTransition),
    isImpact: Boolean(section.meta?.isImpact),
  };
}

export function getSectionTimingProfile(section: TrackSection): {
  start: number;
  end: number;
  duration: number;
} {
  const start = clampNonNegative(section.start);
  const end = clampNonNegative(section.end);
  const duration = getSectionDuration(section);

  return {
    start,
    end: end >= start ? end : start + duration,
    duration,
  };
}