import type { AnyTrack } from "./playerTypes";
import {
  MUZES_SEARCH_TAG_EVENT,
  MUZES_PLAYBACK_TARGET_EVENT,
} from "./playerEvents";

export {
  MUZES_SEARCH_TAG_EVENT,
  MUZES_PLAYBACK_TARGET_EVENT,
} from "./playerEvents";

export {
  buildDiscoveryIndex,
  getAllDiscoveryTags,
  getDiscoveryTagBreakdown,
  getSectionDescriptions,
  getSectionLabel,
  getSectionTags,
  getTagSourceSummary,
  getTrackSections,
  getTrackTags,
  hasSectionTag,
  hasTrackTag,
  normalizeSectionText,
  normalizeStartTime,
  type DiscoveryIndex,
} from "./playerTrackMetadata";

export {
  buildIndexedMoment,
  buildTrackMomentIndex,
  buildAllMomentsIndex,
  getIndexedMomentSearchBlob,
  type IndexedMoment,
} from "./playerMomentIndex";

export {
  searchIndexedMoments,
  scoreIndexedMoment,
  type MomentSearchFilters,
  type MomentSearchResult,
} from "./playerMomentSearch";

export {
  buildMomentEngineSnapshot,
  searchMomentEngine,
  findTopMomentMatches,
  getMomentEngineTrackIds,
  type MomentEngineSnapshot,
} from "./playerMomentEngine";

export {
  dedupeMoments,
  findMatchedMoments,
  getMatchedMomentStats,
  getMatchSummary,
  getMomentHitSummary,
  getMomentReasonLabel,
  scoreTrack,
  type MatchedMoment,
} from "./playerSearchScoring";

export function looksLikeUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(v ?? "")
  );
}

export function pickUrl(t: AnyTrack): string {
  const safe = (t ?? {}) as any;

  const u = String(safe?.url ?? "").trim();
  if (u) return u;

  const p = String(safe?.path ?? "").trim();
  if (p.startsWith("http")) return p;

  return "";
}

export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;

  const tag = (el.tagName || "").toLowerCase();

  if (tag === "input" || tag === "textarea" || tag === "select") return true;

  if ((el as { isContentEditable?: boolean }).isContentEditable) return true;

  return false;
}

export function emitTagSearch(tag: string): string {
  const clean = String(tag ?? "").trim();
  if (!clean) return "";

  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(MUZES_SEARCH_TAG_EVENT, {
          detail: { tag: clean },
        })
      );
    }
  } catch {}

  return clean;
}

export function formatMomentTime(sec: number | null | undefined): string {
  const safe = Number(sec);
  const total = Number.isFinite(safe) ? Math.max(0, Math.floor(safe)) : 0;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function debugMomentPlayback(payload: {
  trackId?: string | null;
  sectionId?: string | null;
  startTime?: number | null;
  source?: string | null;
}) {
  try {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV === "production") return;

    const safe = (payload ?? {}) as any;

    const trackId = String(safe.trackId ?? "").trim() || "(none)";
    const sectionId = String(safe.sectionId ?? "").trim() || "(none)";
    const source = String(safe.source ?? "").trim() || "unknown";
    const startTime =
      typeof safe.startTime === "number" && Number.isFinite(safe.startTime)
        ? safe.startTime
        : null;

    console.log("[MomentPlayback]", {
      source,
      trackId,
      sectionId,
      startTime,
      startLabel:
        startTime === null ? "(none)" : formatMomentTime(startTime),
    });
  } catch {}
}
