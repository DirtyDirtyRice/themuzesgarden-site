import type { AnyTrack, TrackSection } from "./playerTypes";
import { isTypingTarget } from "./playerUtils";

export function fmtTime(sec: number): string {
  const s = Number.isFinite(sec) ? Math.max(0, Math.floor(sec)) : 0;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function clampNonNegative(n: number): number {
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function getEditableHost(node: EventTarget | null): HTMLElement | null {
  if (!(node instanceof HTMLElement)) return null;

  if (isTypingTarget(node)) return node;

  const editableAncestor = node.closest(
    'input, textarea, [contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"], [role="textbox"], [role="searchbox"], [role="combobox"]'
  );

  return editableAncestor instanceof HTMLElement ? editableAncestor : null;
}

function getSectionDisplayLabel(section: TrackSection | null): string {
  if (!section) return "";

  const description = String(section.description ?? "").trim();
  if (description) return description;

  const tags = Array.isArray(section.tags)
    ? section.tags.map((x) => String(x ?? "").trim()).filter(Boolean)
    : [];

  if (tags.length > 0) return tags[0]!;
  return String(section.id ?? "").trim();
}

export function buildNowLabel(
  track: AnyTrack,
  section: TrackSection | null,
  startTime?: number
): string {
  const labelBase = `${track.title ?? "Untitled"} — ${track.artist ?? "Supabase"}`;

  if (section) {
    const sectionLabel = getSectionDisplayLabel(section);
    if (sectionLabel) return `${labelBase} • ${sectionLabel}`;
  }

  if (typeof startTime === "number" && Number.isFinite(startTime) && startTime > 0) {
    return `${labelBase} • @ ${fmtTime(startTime)}`;
  }

  return labelBase;
}